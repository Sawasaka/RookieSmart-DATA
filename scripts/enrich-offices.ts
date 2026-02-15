import { createClient } from "@supabase/supabase-js";
import Anthropic from "@anthropic-ai/sdk";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// ── env ──
const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, "../.env.local"), "utf-8");
const env: Record<string, string> = {};
for (const line of envContent.split("\n")) {
  const m = line.match(/^([^#=]+)=(.*)$/);
  if (m) env[m[1].trim()] = m[2].trim();
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);
const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY });
const SERPER_KEY = env.SERPER_API_KEY;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface Company {
  id: string;
  name: string;
  website_url: string | null;
}

interface OfficeData {
  name: string;
  office_type: "branch" | "sales_office" | "factory" | "lab" | "other";
  prefecture: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
}

// ── Serper search for office locations ──
async function searchOfficeInfo(companyName: string): Promise<string | null> {
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: `${companyName} 支店 営業所 拠点一覧`,
        gl: "jp",
        hl: "ja",
        num: 5,
      }),
    });
    if (!res.ok) throw new Error(`Serper ${res.status}`);
    const data = await res.json();
    const organic = data.organic as { link: string; title: string; snippet?: string }[];
    if (!organic?.length) return null;

    // Prefer official company site
    for (const r of organic) {
      if (
        r.title.includes("拠点") ||
        r.title.includes("支店") ||
        r.title.includes("営業所") ||
        r.title.includes("事業所") ||
        r.title.includes("ネットワーク") ||
        r.title.includes("アクセス") ||
        r.snippet?.includes("支店") ||
        r.snippet?.includes("営業所")
      ) {
        return r.link;
      }
    }
    return organic[0].link;
  } catch (e) {
    console.error(`  Search error: ${(e as Error).message}`);
    return null;
  }
}

// ── Jina Reader ──
async function fetchPageContent(url: string): Promise<string> {
  const jinaUrl = `https://r.jina.ai/${url}`;
  const res = await fetch(jinaUrl, {
    headers: { Accept: "text/markdown" },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`Jina ${res.status}`);
  const text = await res.text();
  return text.slice(0, 8000);
}

// ── Claude extraction ──
async function extractOffices(
  companyName: string,
  pageContent: string
): Promise<OfficeData[]> {
  const res = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 1500,
    messages: [
      {
        role: "user",
        content: `以下は「${companyName}」の拠点情報ページから取得したテキストです。

このテキストから支店・営業所・工場・研究所の情報を抽出してJSON配列で出力してください。
本社は除外してください（本社は既に登録済み）。
最大10拠点まで。

各拠点のフォーマット:
{
  "name": "拠点名（例: 大阪支店）",
  "office_type": "branch" | "sales_office" | "factory" | "lab" | "other",
  "prefecture": "都道府県（例: 大阪府）",
  "city": "市区町村（例: 大阪市北区）",
  "address": "番地以降（例: 梅田1-2-3）",
  "phone": "電話番号（あれば）"
}

office_type の選択基準:
- branch: 支社、支店
- sales_office: 営業所、出張所
- factory: 工場、製造所
- lab: 研究所、研究開発センター
- other: その他

テキスト:
${pageContent}

JSON配列のみを出力してください。拠点情報が見つからない場合は空配列 [] を出力してください。`,
      },
    ],
  });

  const text = res.content[0].type === "text" ? res.content[0].text : "";
  const jsonMatch = text.match(/\[[\s\S]*\]/);
  if (!jsonMatch) return [];

  try {
    const offices = JSON.parse(jsonMatch[0]) as OfficeData[];
    return offices.filter(
      (o) => o.name && o.office_type && o.name !== "本社"
    );
  } catch {
    return [];
  }
}

// ── Main ──
async function main() {
  console.log("=== 支店・拠点データ追加 開始 ===\n");

  // Load enriched companies (paginated)
  let allCompanies: unknown[] = [];
  let from = 0;
  const PAGE = 500;
  while (true) {
    const { data: batch, error: batchErr } = await supabase
      .from("companies")
      .select("id, name, website_url")
      .eq("enrichment_status", "completed")
      .order("name")
      .range(from, from + PAGE - 1);
    if (batchErr) {
      console.error("Failed to load companies:", batchErr.message);
      process.exit(1);
    }
    if (!batch || batch.length === 0) break;
    allCompanies = allCompanies.concat(batch);
    if (batch.length < PAGE) break;
    from += PAGE;
  }
  const companies = allCompanies;

  // Filter to companies that only have 1 office (headquarters)
  const companiesNeedingOffices: Company[] = [];
  for (const c of companies) {
    const { count } = await supabase
      .from("offices")
      .select("*", { count: "exact", head: true })
      .eq("company_id", c.id);
    if (count !== null && count <= 1) {
      companiesNeedingOffices.push(c as Company);
    }
  }

  console.log(
    `対象企業: ${companiesNeedingOffices.length}社（本社のみの企業）\n`
  );

  let processed = 0;
  let totalOffices = 0;

  for (let i = 0; i < companiesNeedingOffices.length; i++) {
    const company = companiesNeedingOffices[i];
    const progress = `[${i + 1}/${companiesNeedingOffices.length}]`;
    console.log(`${progress} ${company.name} ...`);

    try {
      // Step 1: Search for office page
      const officePageUrl = await searchOfficeInfo(company.name);
      if (!officePageUrl) {
        console.log("  → 拠点ページ見つからず");
        processed++;
        continue;
      }
      console.log(`  URL: ${officePageUrl}`);
      await sleep(500);

      // Step 2: Fetch page content
      let pageContent: string;
      try {
        pageContent = await fetchPageContent(officePageUrl);
      } catch {
        console.log("  → ページ取得失敗");
        processed++;
        continue;
      }
      console.log(`  Content: ${pageContent.length} chars`);
      await sleep(500);

      // Step 3: Extract offices with Claude
      const offices = await extractOffices(company.name, pageContent);

      if (offices.length === 0) {
        console.log("  → 拠点データなし");
        processed++;
        continue;
      }

      // Step 4: Insert offices
      const inserts = offices.map((o) => ({
        company_id: company.id,
        name: o.name,
        office_type: o.office_type,
        prefecture: o.prefecture,
        city: o.city,
        address: o.address,
        phone: o.phone,
        is_primary: false,
      }));

      const { error: insertErr } = await supabase
        .from("offices")
        .insert(inserts);

      if (insertErr) {
        console.error(`  ✗ Insert error: ${insertErr.message}`);
        continue;
      }

      console.log(
        `  ✓ ${offices.length}拠点追加: ${offices.map((o) => o.name).join(", ")}`
      );
      totalOffices += offices.length;
      processed++;
    } catch (err) {
      console.error(`  ✗ Error: ${(err as Error).message}`);
    }

    // Rate limit
    await sleep(1000);
  }

  console.log("\n=== 支店・拠点データ追加 完了 ===");
  console.log(`処理: ${processed}社`);
  console.log(`追加拠点数: ${totalOffices}件`);

  // Final stats
  const { count: officeCount } = await supabase
    .from("offices")
    .select("*", { count: "exact", head: true });
  console.log(`\nDB拠点総数: ${officeCount}件`);
}

main().catch(console.error);
