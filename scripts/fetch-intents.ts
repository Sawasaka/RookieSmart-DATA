import { createClient } from "@supabase/supabase-js";
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
const SERPER_KEY = env.SERPER_API_KEY;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const DEPARTMENT_TYPE = "it";

const SEARCH_QUERIES = [
  (name: string) => `${name} 情報システム部 求人`,
  (name: string) => `${name} 社内SE 採用`,
];

// Job-related domains to detect
const JOB_DOMAINS = [
  "doda.jp", "rikunabi.com", "mynavi.jp", "en-japan.com",
  "recruit.co.jp", "green-japan.com", "type.jp", "indeed.com",
  "wantedly.com", "linkedin.com", "jac-recruitment.jp",
  "careerindex.jp", "job.mynavi.jp", "employment.en-japan.com",
  "tenshoku.mynavi.jp", "mid-tenshoku.com", "openwork.jp",
  "career.levtech.jp", "bizreach.jp",
];

interface SearchResult {
  title: string;
  link: string;
  snippet?: string;
  date?: string;
  source?: string;
}

interface Company {
  id: string;
  name: string;
}

// ── Serper search ──
async function searchJobs(query: string): Promise<SearchResult[]> {
  const res = await fetch("https://google.serper.dev/search", {
    method: "POST",
    headers: {
      "X-API-KEY": SERPER_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      q: query,
      gl: "jp",
      hl: "ja",
      num: 10,
    }),
  });
  if (!res.ok) throw new Error(`Serper ${res.status}`);
  const data = await res.json();
  const organic = data.organic as SearchResult[] | undefined;
  return organic || [];
}

// ── Filter job-related results ──
function isJobResult(result: SearchResult): boolean {
  const url = result.link.toLowerCase();
  const title = result.title.toLowerCase();

  // Check if it's from a job site
  if (JOB_DOMAINS.some((d) => url.includes(d))) return true;

  // Check title keywords
  const jobKeywords = [
    "求人", "採用", "募集", "転職", "キャリア", "仕事",
    "応募", "中途", "新卒", "job", "career", "recruit",
    "社内se", "情報システム", "エンジニア",
  ];
  if (jobKeywords.some((k) => title.includes(k))) return true;

  return false;
}

// ── Parse posted date from search result ──
function parsePostedDate(result: SearchResult): Date | null {
  // Serper sometimes returns date in the result
  if (result.date) {
    const d = new Date(result.date);
    if (!isNaN(d.getTime())) return d;
  }

  // Try to extract date from snippet
  const snippet = result.snippet || "";
  const title = result.title || "";
  const text = snippet + " " + title;

  // Patterns like "2026年1月15日", "2026/01/15"
  const datePatterns = [
    /(\d{4})年(\d{1,2})月(\d{1,2})日/,
    /(\d{4})\/(\d{1,2})\/(\d{1,2})/,
    /(\d{4})-(\d{1,2})-(\d{1,2})/,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const d = new Date(
        parseInt(match[1]),
        parseInt(match[2]) - 1,
        parseInt(match[3])
      );
      if (!isNaN(d.getTime())) return d;
    }
  }

  // Relative date patterns
  const now = new Date();
  if (text.includes("本日") || text.includes("今日")) return now;
  const daysAgoMatch = text.match(/(\d+)日前/);
  if (daysAgoMatch) {
    const d = new Date(now);
    d.setDate(d.getDate() - parseInt(daysAgoMatch[1]));
    return d;
  }
  const weeksAgoMatch = text.match(/(\d+)週間前/);
  if (weeksAgoMatch) {
    const d = new Date(now);
    d.setDate(d.getDate() - parseInt(weeksAgoMatch[1]) * 7);
    return d;
  }
  const monthsAgoMatch = text.match(/(\d+)(?:か|ヶ|ケ|カ)月前/);
  if (monthsAgoMatch) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - parseInt(monthsAgoMatch[1]));
    return d;
  }

  return null;
}

// ── Determine intent level based on date ──
function determineIntentLevel(
  postedDate: Date | null
): "hot" | "middle" | "low" | "none" {
  if (!postedDate) return "low"; // Found a job posting but no date → assume recent

  const now = new Date();
  const diffMs = now.getTime() - postedDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 7) return "hot";
  if (diffDays <= 30) return "middle";
  if (diffDays <= 90) return "low";
  return "none";
}

// ── Extract source name from URL ──
function getSourceName(url: string): string {
  try {
    const hostname = new URL(url).hostname.replace("www.", "");
    const sourceMap: Record<string, string> = {
      "doda.jp": "doda",
      "rikunabi.com": "リクナビ",
      "mynavi.jp": "マイナビ",
      "tenshoku.mynavi.jp": "マイナビ転職",
      "en-japan.com": "エン転職",
      "employment.en-japan.com": "エン転職",
      "green-japan.com": "Green",
      "type.jp": "type",
      "indeed.com": "Indeed",
      "jp.indeed.com": "Indeed",
      "wantedly.com": "Wantedly",
      "linkedin.com": "LinkedIn",
      "bizreach.jp": "ビズリーチ",
      "openwork.jp": "OpenWork",
      "careerindex.jp": "キャリアインデックス",
    };
    return sourceMap[hostname] || hostname;
  } catch {
    return "不明";
  }
}

// ── Main ──
async function main() {
  console.log("=== インテントデータ取得 開始 ===\n");
  console.log(`部門タイプ: ${DEPARTMENT_TYPE} (情報システム)\n`);

  // Load all companies
  const { data: companies, error: compErr } = await supabase
    .from("companies")
    .select("id, name")
    .order("name");

  if (compErr || !companies) {
    console.error("Failed to load companies:", compErr?.message);
    process.exit(1);
  }
  console.log(`対象企業: ${companies.length}社\n`);

  let processed = 0;
  let totalSignals = 0;
  let hotCount = 0;
  let middleCount = 0;
  let lowCount = 0;
  let noneCount = 0;

  for (let i = 0; i < companies.length; i++) {
    const company = companies[i] as Company;
    const progress = `[${i + 1}/${companies.length}]`;
    console.log(`${progress} ${company.name} ...`);

    try {
      const allJobResults: SearchResult[] = [];

      // Search with multiple queries
      for (const queryFn of SEARCH_QUERIES) {
        const query = queryFn(company.name);
        const results = await searchJobs(query);
        const jobResults = results.filter(isJobResult);
        allJobResults.push(...jobResults);
        await sleep(1000);
      }

      // Deduplicate by URL
      const uniqueResults = new Map<string, SearchResult>();
      for (const r of allJobResults) {
        if (!uniqueResults.has(r.link)) {
          uniqueResults.set(r.link, r);
        }
      }

      const jobResults = Array.from(uniqueResults.values());
      console.log(`  求人結果: ${jobResults.length}件`);

      // Insert signals (skip duplicates by source_url)
      let insertedCount = 0;
      let bestLevel: "hot" | "middle" | "low" | "none" = "none";
      let latestDate: Date | null = null;

      for (const result of jobResults) {
        const postedDate = parsePostedDate(result);
        const level = determineIntentLevel(postedDate);

        // Track best intent level
        const levelPriority = { hot: 3, middle: 2, low: 1, none: 0 };
        if (levelPriority[level] > levelPriority[bestLevel]) {
          bestLevel = level;
        }

        // Track latest date
        if (postedDate && (!latestDate || postedDate > latestDate)) {
          latestDate = postedDate;
        }

        // Check for duplicate
        const { count: existing } = await supabase
          .from("intent_signals")
          .select("*", { count: "exact", head: true })
          .eq("source_url", result.link);

        if (existing && existing > 0) continue;

        // Insert signal
        const { error: insertErr } = await supabase
          .from("intent_signals")
          .insert({
            company_id: company.id,
            department_type: DEPARTMENT_TYPE,
            signal_type: "job_posting",
            title: result.title,
            source_url: result.link,
            source_name: getSourceName(result.link),
            posted_date: postedDate
              ? postedDate.toISOString().split("T")[0]
              : null,
            raw_data: {
              snippet: result.snippet,
              original_date: result.date,
            },
          });

        if (!insertErr) insertedCount++;
      }

      totalSignals += insertedCount;

      // Upsert company_intents
      const { error: upsertErr } = await supabase
        .from("company_intents")
        .upsert(
          {
            company_id: company.id,
            department_type: DEPARTMENT_TYPE,
            intent_level: bestLevel,
            signal_count: jobResults.length,
            latest_signal_date: latestDate
              ? latestDate.toISOString().split("T")[0]
              : null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "company_id,department_type" }
        );

      if (upsertErr) {
        console.error(`  ✗ Upsert error: ${upsertErr.message}`);
      }

      // Count by level
      switch (bestLevel) {
        case "hot": hotCount++; break;
        case "middle": middleCount++; break;
        case "low": lowCount++; break;
        case "none": noneCount++; break;
      }

      const levelLabel = {
        hot: "🔴 ホット",
        middle: "🟠 ミドル",
        low: "⚪ ロー",
        none: "— なし",
      };
      console.log(
        `  ${levelLabel[bestLevel]} | シグナル${insertedCount}件追加 (既存除く)`
      );

      processed++;
    } catch (err) {
      console.error(`  ✗ Error: ${(err as Error).message}`);
      noneCount++;

      // Insert none level for failed companies
      await supabase
        .from("company_intents")
        .upsert(
          {
            company_id: company.id,
            department_type: DEPARTMENT_TYPE,
            intent_level: "none",
            signal_count: 0,
            latest_signal_date: null,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "company_id,department_type" }
        );
      processed++;
    }

    // Rate limit
    await sleep(500);
  }

  console.log("\n=== インテントデータ取得 完了 ===");
  console.log(`処理: ${processed}/${companies.length}社`);
  console.log(`追加シグナル: ${totalSignals}件`);
  console.log(`\nインテントレベル分布:`);
  console.log(`  🔴 ホット:  ${hotCount}社`);
  console.log(`  🟠 ミドル:  ${middleCount}社`);
  console.log(`  ⚪ ロー:    ${lowCount}社`);
  console.log(`  — なし:    ${noneCount}社`);
}

main().catch(console.error);
