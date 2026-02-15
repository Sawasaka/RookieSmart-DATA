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

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

interface ServiceTag {
  id: string;
  name: string;
}

interface Company {
  id: string;
  name: string;
  service_summary: string | null;
  company_features: string | null;
  industry: { name: string; category: string | null } | null;
}

// ── Claude tag matching ──
async function matchTags(
  company: Company,
  tags: ServiceTag[]
): Promise<string[]> {
  const tagList = tags.map((t) => t.name).join(", ");
  const companyInfo = [
    `企業名: ${company.name}`,
    company.service_summary ? `サービス概要: ${company.service_summary}` : "",
    company.company_features ? `企業特徴: ${company.company_features}` : "",
    company.industry ? `業界: ${company.industry.name}` : "",
  ]
    .filter(Boolean)
    .join("\n");

  const res = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: `以下の企業情報を分析し、該当するサービスタグをすべて選んでください。

${companyInfo}

利用可能なタグ:
${tagList}

この企業が「潜在顧客」として該当しそうなサービスカテゴリを選んでください。
例えば「DX支援」のタグは、DX支援サービスを提供している企業ではなく、DX支援サービスを必要としている（＝DXに取り組んでいる/取り組みたい）企業に付与します。

回答は該当するタグ名をカンマ区切りで出力してください（タグ名のみ、説明不要）。
該当なしの場合は「なし」と出力してください。`,
      },
    ],
  });

  const text = res.content[0].type === "text" ? res.content[0].text : "";

  if (text.trim() === "なし") return [];

  // Parse comma-separated tag names and match to actual tags
  const tagNames = text
    .split(/[,、]/)
    .map((t) => t.trim())
    .filter(Boolean);

  const matchedIds: string[] = [];
  for (const name of tagNames) {
    const tag = tags.find(
      (t) => t.name === name || t.name.includes(name) || name.includes(t.name)
    );
    if (tag) matchedIds.push(tag.id);
  }

  return [...new Set(matchedIds)];
}

// ── Main ──
async function main() {
  console.log("=== サービスタグ自動付与 開始 ===\n");

  // Load all service tags
  const { data: tags, error: tagErr } = await supabase
    .from("service_tags")
    .select("id, name");

  if (tagErr || !tags || tags.length === 0) {
    console.error("Failed to load service tags:", tagErr?.message);
    process.exit(1);
  }
  console.log(`サービスタグ: ${tags.length}件ロード済み`);
  console.log(`  ${tags.map((t: ServiceTag) => t.name).join(", ")}\n`);

  // Load enriched companies (with industry join)
  const { data: companies, error: compErr } = await supabase
    .from("companies")
    .select("id, name, service_summary, company_features, industry:industries(name, category)")
    .eq("enrichment_status", "completed")
    .order("name");

  if (compErr || !companies) {
    console.error("Failed to load companies:", compErr?.message);
    process.exit(1);
  }
  console.log(`対象企業: ${companies.length}社（エンリッチ済み）\n`);

  let processed = 0;
  let tagged = 0;
  let totalTags = 0;

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i] as unknown as Company;
    const progress = `[${i + 1}/${companies.length}]`;
    console.log(`${progress} ${company.name} ...`);

    try {
      // Check if already tagged
      const { count: existingCount } = await supabase
        .from("company_tags")
        .select("*", { count: "exact", head: true })
        .eq("company_id", company.id);

      if (existingCount && existingCount > 0) {
        console.log(`  → スキップ（${existingCount}件のタグ付与済み）`);
        processed++;
        continue;
      }

      // Use Claude to match tags
      const matchedTagIds = await matchTags(company, tags as ServiceTag[]);

      if (matchedTagIds.length === 0) {
        console.log("  → 該当タグなし");
        processed++;
        continue;
      }

      // Insert company_tags
      const inserts = matchedTagIds.map((tagId) => ({
        company_id: company.id,
        tag_id: tagId,
      }));

      const { error: insertErr } = await supabase
        .from("company_tags")
        .insert(inserts);

      if (insertErr) {
        console.error(`  ✗ Insert error: ${insertErr.message}`);
        continue;
      }

      const tagNames = matchedTagIds
        .map((id) => (tags as ServiceTag[]).find((t) => t.id === id)?.name)
        .filter(Boolean);

      console.log(`  ✓ ${tagNames.join(", ")} (${matchedTagIds.length}件)`);
      tagged++;
      totalTags += matchedTagIds.length;
      processed++;
    } catch (err) {
      console.error(`  ✗ Error: ${(err as Error).message}`);
    }

    // Rate limit
    await sleep(500);
  }

  console.log("\n=== サービスタグ自動付与 完了 ===");
  console.log(`処理: ${processed}社`);
  console.log(`タグ付与: ${tagged}社`);
  console.log(`付与タグ総数: ${totalTags}件`);
}

main().catch(console.error);
