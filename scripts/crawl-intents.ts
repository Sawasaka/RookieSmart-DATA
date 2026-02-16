import { chromium, type Page } from "playwright";
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

const DEPARTMENT_TYPE = "it";
const MAX_PAGES = 10;
const KYUJINBOX_BASE = "https://xn--pckua2a7gp15o89zb.com";

const SEARCH_KEYWORDS = ["社内SE", "情報システム 求人", "情シス 求人"];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const randomDelay = () => sleep(3000 + Math.random() * 4000);

interface JobResult {
  title: string;
  company: string;
  location: string;
  url: string;
  postedDate: Date | null;
  sourceName: string;
}

interface CompanyRow {
  id: string;
  name: string;
}

// ── Normalize company name for matching ──
function normalizeName(name: string): string {
  return name
    .replace(/株式会社/g, "")
    .replace(/有限会社/g, "")
    .replace(/合同会社/g, "")
    .replace(/\s+/g, "")
    .replace(/　/g, "")
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) =>
      String.fromCharCode(c.charCodeAt(0) - 0xfee0)
    )
    .trim()
    .toLowerCase();
}

// ── Parse relative date strings from 求人ボックス ──
function parseRelativeDate(text: string): Date | null {
  if (!text) return null;
  const cleaned = text.replace(/[+＋]/g, "").trim();
  const now = new Date();

  if (cleaned.includes("今日") || cleaned.includes("たった今") || cleaned === "新着") {
    return now;
  }

  const daysMatch = cleaned.match(/(\d+)\s*日前/);
  if (daysMatch) {
    const d = new Date(now);
    d.setDate(d.getDate() - parseInt(daysMatch[1]));
    return d;
  }

  const hoursMatch = cleaned.match(/(\d+)\s*時間前/);
  if (hoursMatch) return now;

  const weeksMatch = cleaned.match(/(\d+)\s*週間前/);
  if (weeksMatch) {
    const d = new Date(now);
    d.setDate(d.getDate() - parseInt(weeksMatch[1]) * 7);
    return d;
  }

  const monthsMatch = cleaned.match(/(\d+)\s*(?:か|ヶ|ケ|カ)月前/);
  if (monthsMatch) {
    const d = new Date(now);
    d.setMonth(d.getMonth() - parseInt(monthsMatch[1]));
    return d;
  }

  return null;
}

// ── Determine intent level ──
function determineIntentLevel(
  postedDate: Date | null
): "hot" | "middle" | "low" | "none" {
  if (!postedDate) return "low";
  const now = new Date();
  const diffMs = now.getTime() - postedDate.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 7) return "hot";
  if (diffDays <= 30) return "middle";
  if (diffDays <= 90) return "low";
  return "none";
}

// ── Extract jobs from 求人ボックス page ──
async function extractJobsFromPage(page: Page): Promise<JobResult[]> {
  return page.evaluate((base: string) => {
    const cards = document.querySelectorAll(
      '.p-result_card, [class*="p-result_card"]'
    );
    const jobs: {
      title: string;
      company: string;
      location: string;
      url: string;
      dateText: string;
      sourceName: string;
    }[] = [];

    cards.forEach((card) => {
      try {
        // Title
        const titleEl = card.querySelector(
          ".p-result_title_link, .p-result_title a"
        );
        const title = titleEl?.textContent?.trim() || "";

        // Company name
        const companyEl = card.querySelector(
          ".p-result_company, .p-result_company a"
        );
        const company = companyEl?.textContent?.trim() || "";

        // URL - from title link href
        const linkEl = card.querySelector("a.p-result_title_link, .p-result_title a");
        let url = "";
        if (linkEl) {
          const href = linkEl.getAttribute("href") || "";
          url = href.startsWith("http") ? href : `${base}${href}`;
        }

        // Location
        const locationEl = card.querySelector(
          ".p-result_info, .p-result_area"
        );
        const location = locationEl?.textContent?.trim()?.split("\n")[0] || "";

        // Date
        const dateEl = card.querySelector(
          ".p-result_updatedAt_hyphen, [class*='updatedAt']"
        );
        const dateText = dateEl?.textContent?.trim() || "";

        if (title && company) {
          jobs.push({
            title,
            company,
            location: location.slice(0, 100),
            url,
            dateText,
            sourceName: "求人ボックス",
          });
        }
      } catch {
        // skip
      }
    });

    return jobs;
  }, KYUJINBOX_BASE).then((rawJobs) =>
    rawJobs.map((j) => ({
      ...j,
      postedDate: parseRelativeDate(j.dateText),
    }))
  );
}

// ── Crawl 求人ボックス for a keyword ──
async function crawlKyujinBox(
  page: Page,
  keyword: string
): Promise<JobResult[]> {
  const allJobs: JobResult[] = [];
  const seenUrls = new Set<string>();

  for (let pageNum = 1; pageNum <= MAX_PAGES; pageNum++) {
    const pageParam = pageNum > 1 ? `&p=${pageNum}` : "";
    const url = `${KYUJINBOX_BASE}/${encodeURIComponent(keyword + "の仕事")}?${pageParam}`;

    console.log(`  Page ${pageNum}/${MAX_PAGES}: ${keyword}`);

    try {
      await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
      await page.waitForTimeout(2000 + Math.random() * 2000);

      const jobs = await extractJobsFromPage(page);

      if (jobs.length === 0) {
        console.log(`    -> 0件（結果なし、終了）`);
        break;
      }

      let newCount = 0;
      for (const job of jobs) {
        const key = `${job.company}|${job.title}`;
        if (!seenUrls.has(key)) {
          seenUrls.add(key);
          allJobs.push(job);
          newCount++;
        }
      }

      console.log(
        `    -> ${jobs.length}件取得 (新規${newCount}件, 累計${allJobs.length}件)`
      );

      await randomDelay();
    } catch (err) {
      console.error(`    -> エラー: ${(err as Error).message}`);
      await sleep(5000);
    }
  }

  return allJobs;
}

// ── Load all companies from DB (paginated) ──
async function loadCompanies(): Promise<CompanyRow[]> {
  let companies: CompanyRow[] = [];
  let from = 0;
  const PAGE = 500;
  while (true) {
    const { data: batch, error } = await supabase
      .from("companies")
      .select("id, name")
      .order("name")
      .range(from, from + PAGE - 1);
    if (error) {
      console.error("Failed to load companies:", error.message);
      process.exit(1);
    }
    if (!batch || batch.length === 0) break;
    companies = companies.concat(batch as CompanyRow[]);
    if (batch.length < PAGE) break;
    from += PAGE;
  }
  return companies;
}

// ── Match job company name to DB companies ──
function matchCompany(
  jobCompanyName: string,
  normalizedMap: Map<string, CompanyRow[]>
): CompanyRow | null {
  const jobNorm = normalizeName(jobCompanyName);
  if (!jobNorm || jobNorm.length < 2) return null;

  // Exact normalized match
  const exact = normalizedMap.get(jobNorm);
  if (exact && exact.length > 0) return exact[0];

  // Partial match: job name contains DB company name or vice versa
  for (const [norm, rows] of normalizedMap) {
    if (norm.length < 2) continue;
    if (jobNorm.includes(norm) || norm.includes(jobNorm)) {
      return rows[0];
    }
  }

  return null;
}

// ── Main ──
async function main() {
  console.log("=== 求人サイトクロールによるインテント取得 開始 ===");
  console.log(`部門タイプ: ${DEPARTMENT_TYPE} (情報システム)`);
  console.log(`対象サイト: 求人ボックス (kyujinbox.com)`);
  console.log(`検索キーワード: ${SEARCH_KEYWORDS.join(", ")}`);
  console.log(`最大ページ数: ${MAX_PAGES}ページ/キーワード\n`);

  // Load companies
  console.log("1. 企業データベース読み込み中...");
  const companies = await loadCompanies();
  console.log(`   ${companies.length}社ロード完了\n`);

  // Build normalized name map
  const normalizedMap = new Map<string, CompanyRow[]>();
  for (const c of companies) {
    const norm = normalizeName(c.name);
    if (!normalizedMap.has(norm)) normalizedMap.set(norm, []);
    normalizedMap.get(norm)!.push(c);
  }

  // Launch browser
  console.log("2. ブラウザ起動中...");
  const browser = await chromium.launch({
    headless: true,
    args: ["--disable-blink-features=AutomationControlled"],
  });

  const context = await browser.newContext({
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    locale: "ja-JP",
    timezoneId: "Asia/Tokyo",
    viewport: { width: 1280, height: 720 },
  });

  await context.addInitScript(() => {
    Object.defineProperty(navigator, "webdriver", { get: () => false });
  });

  const page = await context.newPage();
  console.log("   ブラウザ起動完了\n");

  // Crawl for each keyword
  console.log("3. 求人ボックス クロール開始...\n");
  const allJobs: JobResult[] = [];
  const allSeenKeys = new Set<string>();

  for (const keyword of SEARCH_KEYWORDS) {
    console.log(`--- キーワード: 「${keyword}」 ---`);
    const jobs = await crawlKyujinBox(page, keyword);

    let newCount = 0;
    for (const job of jobs) {
      const key = `${job.company}|${job.title}`;
      if (!allSeenKeys.has(key)) {
        allSeenKeys.add(key);
        allJobs.push(job);
        newCount++;
      }
    }
    console.log(`   キーワード合計: ${jobs.length}件 (新規${newCount}件)\n`);

    await randomDelay();
  }

  await browser.close();
  console.log(`クロール完了: 全${allJobs.length}件の求人取得\n`);

  // Match with companies
  console.log("4. 企業マッチング中...\n");
  const matchedJobs = new Map<
    string,
    { company: CompanyRow; jobs: JobResult[] }
  >();
  let unmatchedCount = 0;

  for (const job of allJobs) {
    const matched = matchCompany(job.company, normalizedMap);
    if (matched) {
      if (!matchedJobs.has(matched.id)) {
        matchedJobs.set(matched.id, { company: matched, jobs: [] });
      }
      matchedJobs.get(matched.id)!.jobs.push(job);
    } else {
      unmatchedCount++;
    }
  }

  console.log(
    `   マッチ: ${matchedJobs.size}社（${allJobs.length - unmatchedCount}件の求人）`
  );
  console.log(`   未マッチ: ${unmatchedCount}件\n`);

  // Insert into DB
  console.log("5. データベース登録中...\n");
  let totalSignals = 0;
  let hotCount = 0;
  let middleCount = 0;
  let lowCount = 0;
  let noneCount = 0;

  for (const [companyId, { company, jobs }] of matchedJobs) {
    let insertedCount = 0;
    let bestLevel: "hot" | "middle" | "low" | "none" = "none";
    let latestDate: Date | null = null;
    const levelPriority = { hot: 3, middle: 2, low: 1, none: 0 };

    for (const job of jobs) {
      const level = determineIntentLevel(job.postedDate);
      if (levelPriority[level] > levelPriority[bestLevel]) {
        bestLevel = level;
      }
      if (job.postedDate && (!latestDate || job.postedDate > latestDate)) {
        latestDate = job.postedDate;
      }

      // Generate a stable URL for dedup (since kyujinbox uses redirect URLs)
      const stableUrl = `kyujinbox://${normalizeName(job.company)}/${normalizeName(job.title)}`;

      // Check duplicate by source_url
      const { count: existing } = await supabase
        .from("intent_signals")
        .select("*", { count: "exact", head: true })
        .eq("source_url", stableUrl);

      if (existing && existing > 0) continue;

      // Insert signal
      const { error: insertErr } = await supabase
        .from("intent_signals")
        .insert({
          company_id: companyId,
          department_type: DEPARTMENT_TYPE,
          signal_type: "job_posting",
          title: job.title,
          source_url: stableUrl,
          source_name: job.sourceName,
          posted_date: job.postedDate
            ? job.postedDate.toISOString().split("T")[0]
            : null,
          raw_data: {
            original_url: job.url,
            location: job.location,
            crawled_at: new Date().toISOString(),
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
          company_id: companyId,
          department_type: DEPARTMENT_TYPE,
          intent_level: bestLevel,
          signal_count: jobs.length,
          latest_signal_date: latestDate
            ? latestDate.toISOString().split("T")[0]
            : null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "company_id,department_type" }
      );

    if (upsertErr) {
      console.error(
        `  ✗ ${company.name}: Upsert error: ${upsertErr.message}`
      );
    }

    switch (bestLevel) {
      case "hot":
        hotCount++;
        break;
      case "middle":
        middleCount++;
        break;
      case "low":
        lowCount++;
        break;
      case "none":
        noneCount++;
        break;
    }

    const levelLabel = {
      hot: "HOT",
      middle: "MID",
      low: "LOW",
      none: "---",
    };
    console.log(
      `  [${levelLabel[bestLevel]}] ${company.name}: ${jobs.length}件 (新規${insertedCount}件)`
    );
  }

  console.log("\n=== 求人サイトクロールによるインテント取得 完了 ===");
  console.log(`クロール求人数: ${allJobs.length}件`);
  console.log(`マッチ企業数: ${matchedJobs.size}社`);
  console.log(`未マッチ求人: ${unmatchedCount}件`);
  console.log(`新規シグナル: ${totalSignals}件`);
  console.log(`\nインテントレベル分布:`);
  console.log(`  HOT:    ${hotCount}社`);
  console.log(`  MIDDLE: ${middleCount}社`);
  console.log(`  LOW:    ${lowCount}社`);
  console.log(`  NONE:   ${noneCount}社`);
}

main().catch(console.error);
