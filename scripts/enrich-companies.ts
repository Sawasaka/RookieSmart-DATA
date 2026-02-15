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

// ── Types ──
interface Company {
  id: string;
  name: string;
  prefecture: string;
  city: string | null;
  address: string | null;
}

interface Industry {
  id: string;
  name: string;
  category: string;
}

interface EnrichResult {
  website_url: string;
  service_summary: string;
  company_features: string;
  employee_count: string;
  revenue: string;
  industry_name: string;
  prefecture?: string;
  city?: string;
  address?: string;
}

// ── Serper search ──
async function searchWebsite(companyName: string): Promise<string | null> {
  try {
    const res = await fetch("https://google.serper.dev/search", {
      method: "POST",
      headers: {
        "X-API-KEY": SERPER_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        q: `${companyName} 公式サイト`,
        gl: "jp",
        hl: "ja",
        num: 5,
      }),
    });
    if (!res.ok) throw new Error(`Serper ${res.status}`);
    const data = await res.json();
    const organic = data.organic as { link: string; title: string }[];
    if (!organic?.length) return null;

    // Prefer the result whose domain looks official (skip wikipedia, news, etc)
    const skip = [
      "wikipedia.org",
      "youtube.com",
      "facebook.com",
      "twitter.com",
      "x.com",
      "linkedin.com",
      "nikkei.com",
      "bloomberg.co.jp",
      "kabutan.jp",
      "minkabu.jp",
    ];
    for (const r of organic) {
      const domain = new URL(r.link).hostname;
      if (!skip.some((s) => domain.includes(s))) return r.link;
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
  // Truncate to ~6000 chars to keep Claude prompt small
  return text.slice(0, 6000);
}

// ── Try to find about/company page ──
async function fetchCompanyInfo(
  baseUrl: string,
  companyName: string
): Promise<string> {
  // First try about / company page
  const base = baseUrl.replace(/\/$/, "");
  const aboutPaths = [
    "/company",
    "/about",
    "/corporate",
    "/about-us",
    "/corporate/profile",
    "/company/outline",
    "/ja/company",
  ];

  let content = "";

  // Try top page first
  try {
    content = await fetchPageContent(baseUrl);
  } catch {
    content = "";
  }

  // Try about pages
  for (const p of aboutPaths) {
    try {
      const aboutContent = await fetchPageContent(base + p);
      if (
        aboutContent.length > 200 &&
        (aboutContent.includes("従業員") ||
          aboutContent.includes("設立") ||
          aboutContent.includes("事業") ||
          aboutContent.includes("売上") ||
          aboutContent.includes(companyName))
      ) {
        content += "\n\n--- 会社概要ページ ---\n\n" + aboutContent;
        break;
      }
    } catch {
      continue;
    }
    await sleep(500);
  }

  if (!content) throw new Error("No content fetched");
  return content.slice(0, 10000);
}

// ── Claude extraction ──
async function extractWithClaude(
  companyName: string,
  websiteUrl: string,
  pageContent: string,
  industries: Industry[]
): Promise<EnrichResult> {
  const industryList = industries
    .map((i) => `- ${i.name}（${i.category}）`)
    .join("\n");

  const res = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 800,
    messages: [
      {
        role: "user",
        content: `以下は「${companyName}」（${websiteUrl}）の公式サイトから取得したテキストです。

このテキストから以下の情報をJSON形式で抽出してください。
情報が見つからない場合は推定で記入してください（大手上場企業なので一般知識でも可）。

必須フィールド:
- website_url: 公式サイトのトップページURL（"${websiteUrl}"を使用）
- service_summary: 主要サービス・事業内容を100字以内で
- company_features: 企業の特徴・強みを200字以内で
- employee_count: 従業員数（例: "約50,000名"、"連結: 約300,000名"）
- revenue: 売上高・営業収益（例: "約3兆円"、"約5,000億円"）
- industry_name: 以下の業種リストから最も適切なものを1つ選択
- prefecture: 本社所在地の都道府県（例: "東京都"）
- city: 本社所在地の市区町村（例: "港区"）
- address: 本社所在地の番地以降（例: "六本木一丁目6番1号"）

業種リスト:
${industryList}

テキスト:
${pageContent}

JSONのみを出力してください。他のテキストは不要です。`,
      },
    ],
  });

  const text =
    res.content[0].type === "text" ? res.content[0].text : "";
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("No JSON in Claude response");
  return JSON.parse(jsonMatch[0]);
}

// ── Main ──
async function main() {
  console.log("=== エンリッチメント開始 ===\n");

  // Load industries
  const { data: industries, error: indErr } = await supabase
    .from("industries")
    .select("id, name, category");
  if (indErr || !industries) {
    console.error("Failed to load industries:", indErr?.message);
    process.exit(1);
  }
  console.log(`業種マスタ: ${industries.length}件ロード済み`);

  // Load pending companies (paginate to bypass 1000 row limit)
  let allCompanies: Company[] = [];
  let from = 0;
  const PAGE = 500;
  while (true) {
    const { data: batch, error: batchErr } = await supabase
      .from("companies")
      .select("id, name, prefecture, city, address")
      .eq("enrichment_status", "pending")
      .order("created_at", { ascending: true })
      .range(from, from + PAGE - 1);
    if (batchErr) {
      console.error("Failed to load companies:", batchErr.message);
      process.exit(1);
    }
    if (!batch || batch.length === 0) break;
    allCompanies = allCompanies.concat(batch as Company[]);
    if (batch.length < PAGE) break;
    from += PAGE;
  }
  const companies = allCompanies;
  const compErr = null;

  if (compErr || !companies) {
    console.error("Failed to load companies:", compErr?.message);
    process.exit(1);
  }
  console.log(`対象企業: ${companies.length}社\n`);

  let completed = 0;
  let failed = 0;
  const startTime = Date.now();

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i] as Company;
    const progress = `[${i + 1}/${companies.length}]`;
    console.log(`${progress} ${company.name} ...`);

    try {
      // Step 1: Search for website
      const searchUrl = await searchWebsite(company.name);
      if (!searchUrl) throw new Error("Website not found via search");
      console.log(`  URL: ${searchUrl}`);
      await sleep(500);

      // Step 2: Fetch page content
      let pageContent: string;
      try {
        pageContent = await fetchCompanyInfo(searchUrl, company.name);
      } catch {
        // Fallback: just use top page
        pageContent = `企業名: ${company.name}\nURL: ${searchUrl}\n所在地: ${company.prefecture} ${company.city || ""}`;
      }
      console.log(`  Content: ${pageContent.length} chars`);
      await sleep(500);

      // Step 3: Extract with Claude
      const result = await extractWithClaude(
        company.name,
        searchUrl,
        pageContent,
        industries
      );
      console.log(`  Industry: ${result.industry_name}`);
      console.log(`  Employees: ${result.employee_count}`);
      console.log(`  Revenue: ${result.revenue}`);

      // Truncate fields to avoid varchar overflow
      if (result.employee_count && result.employee_count.length > 100) {
        result.employee_count = result.employee_count.slice(0, 100);
      }
      if (result.revenue && result.revenue.length > 100) {
        result.revenue = result.revenue.slice(0, 100);
      }
      if (result.prefecture && result.prefecture.length > 10) {
        result.prefecture = result.prefecture.slice(0, 10);
      }

      // Match industry_id
      const matchedIndustry = industries.find(
        (ind: Industry) =>
          ind.name === result.industry_name ||
          ind.name.includes(result.industry_name) ||
          result.industry_name.includes(ind.name)
      );
      const industryId = matchedIndustry?.id || null;

      // Step 4: Update companies table
      const updateData: Record<string, unknown> = {
        website_url: result.website_url || searchUrl,
        industry_id: industryId,
        service_summary: result.service_summary,
        company_features: result.company_features,
        employee_count: result.employee_count,
        revenue: result.revenue,
        enrichment_status: "completed",
      };
      // Update address if currently unknown
      if (company.prefecture === "不明" || !company.prefecture) {
        if (result.prefecture) updateData.prefecture = result.prefecture;
        if (result.city) updateData.city = result.city;
        if (result.address) updateData.address = result.address;
      }

      const { error: updateErr } = await supabase
        .from("companies")
        .update(updateData)
        .eq("id", company.id);

      if (updateErr) throw new Error(`Update failed: ${updateErr.message}`);

      // Step 5: Insert office (headquarters)
      const officePref = result.prefecture || company.prefecture;
      const officeCity = result.city || company.city;
      const officeAddr = result.address || company.address;
      const { error: officeErr } = await supabase.from("offices").insert({
        company_id: company.id,
        name: "本社",
        office_type: "headquarters",
        prefecture: officePref !== "不明" ? officePref : null,
        city: officeCity,
        address: officeAddr,
        website_url: result.website_url || searchUrl,
        is_primary: true,
      });

      if (officeErr) {
        console.log(`  Office insert warning: ${officeErr.message}`);
      }

      completed++;
      console.log(`  ✓ 完了 (${completed}社完了 / ${failed}社失敗)\n`);
    } catch (err) {
      failed++;
      const msg = (err as Error).message;
      console.error(`  ✗ 失敗: ${msg}`);
      console.log(`  (${completed}社完了 / ${failed}社失敗)\n`);

      // Mark as failed
      await supabase
        .from("companies")
        .update({ enrichment_status: "failed" })
        .eq("id", company.id);
    }

    // Rate limit wait
    await sleep(1000);

    // Progress report every 50 companies
    if ((i + 1) % 50 === 0) {
      const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
      console.log(`\n--- 中間レポート [${i + 1}/${companies.length}社] ---`);
      console.log(`  成功: ${completed}社 / 失敗: ${failed}社 / 経過: ${elapsed}分`);
      console.log(`---\n`);
    }
  }

  const totalMinutes = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
  console.log("\n=== エンリッチメント完了 ===");
  console.log(`成功: ${completed}社`);
  console.log(`失敗: ${failed}社`);
  console.log(`合計: ${companies.length}社`);
  console.log(`処理時間: ${totalMinutes}分`);

  // Final count verification
  const { count: completedCount } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true })
    .eq("enrichment_status", "completed");
  const { count: failedCount } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true })
    .eq("enrichment_status", "failed");
  const { count: pendingCount } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true })
    .eq("enrichment_status", "pending");

  console.log(
    `\nDB確認 — completed: ${completedCount}, failed: ${failedCount}, pending: ${pendingCount}`
  );
}

main().catch(console.error);
