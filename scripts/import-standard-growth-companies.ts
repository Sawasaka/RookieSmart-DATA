import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";
import XLSX from "xlsx";

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

const XLS_PATH = "/tmp/jpx_data.xls";
const BATCH_SIZE = 20;

interface JpxRow {
  code: string;
  name: string;
  market: string;
  industry33: string;
  industry17: string;
}

// ── Parse company name to add 株式会社 if missing ──
function normalizeCompanyName(name: string): string {
  const trimmed = name.trim();
  if (trimmed.includes("株式会社")) return trimmed;
  return `株式会社${trimmed}`;
}

// ── Normalize name for comparison ──
function normalizeName(name: string): string {
  return name
    .replace(/株式会社/g, "")
    .replace(/\s+/g, "")
    .replace(/（/g, "(")
    .replace(/）/g, ")")
    .replace(/　/g, "")
    .trim()
    .toLowerCase();
}

async function main() {
  console.log("=== 東証スタンダード・グロース上場企業 一括インポート ===\n");

  // 1. Read XLS file
  console.log("1. JPX Excelファイルを読み込み中...");
  const wb = XLSX.readFile(XLS_PATH);
  const ws = wb.Sheets[wb.SheetNames[0]];
  const rows = XLSX.utils.sheet_to_json(ws, { header: 1 }) as unknown[][];

  // Filter standard and growth companies (内国株式 only)
  const standardCompanies: JpxRow[] = [];
  const growthCompanies: JpxRow[] = [];

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row[3]) continue;
    const market = String(row[3]);
    if (!market.includes("内国株式")) continue;

    const entry: JpxRow = {
      code: String(row[1]),
      name: String(row[2]),
      market,
      industry33: String(row[5] || ""),
      industry17: String(row[7] || ""),
    };

    if (market.includes("スタンダード")) {
      standardCompanies.push(entry);
    } else if (market.includes("グロース")) {
      growthCompanies.push(entry);
    }
  }
  console.log(`   スタンダード上場企業: ${standardCompanies.length}社`);
  console.log(`   グロース上場企業: ${growthCompanies.length}社`);
  console.log(`   合計: ${standardCompanies.length + growthCompanies.length}社\n`);

  const allNewCompanies = [...standardCompanies, ...growthCompanies];

  // 2. Load existing companies for dedup (paginated)
  console.log("2. 既存企業データを取得中...");
  let existing: { id: string; name: string; corporate_number: string }[] = [];
  let from = 0;
  const PAGE = 500;
  while (true) {
    const { data: batch, error: fetchErr } = await supabase
      .from("companies")
      .select("id, name, corporate_number")
      .range(from, from + PAGE - 1);
    if (fetchErr) {
      console.error("   既存データ取得エラー:", fetchErr.message);
      process.exit(1);
    }
    if (!batch || batch.length === 0) break;
    existing = existing.concat(batch);
    if (batch.length < PAGE) break;
    from += PAGE;
  }
  console.log(`   既存企業: ${existing.length}社\n`);

  // Build lookup sets for dedup
  const existingNames = new Set(existing.map((c) => normalizeName(c.name)));
  const existingCorpNumbers = new Set(existing.map((c) => c.corporate_number));

  // 3. Filter out duplicates
  console.log("3. 重複チェック中...");
  const newCompanies: { code: string; name: string; industry33: string }[] = [];
  let duplicateCount = 0;

  for (const pc of allNewCompanies) {
    const normalized = normalizeName(pc.name);
    const corpNum = `UNKNOWN_${pc.code}`;

    if (existingNames.has(normalized) || existingCorpNumbers.has(corpNum)) {
      duplicateCount++;
      continue;
    }

    newCompanies.push({
      code: pc.code,
      name: pc.name,
      industry33: pc.industry33,
    });

    // Add to sets to avoid intra-batch duplicates
    existingNames.add(normalized);
    existingCorpNumbers.add(corpNum);
  }
  console.log(`   重複: ${duplicateCount}社`);
  console.log(`   新規追加対象: ${newCompanies.length}社\n`);

  // 4. Batch insert
  console.log("4. Supabaseへバッチ挿入中...");
  let inserted = 0;
  let errors = 0;

  for (let i = 0; i < newCompanies.length; i += BATCH_SIZE) {
    const batch = newCompanies.slice(i, i + BATCH_SIZE);
    const records = batch.map((c) => ({
      corporate_number: `UNKNOWN_${c.code}`,
      name: normalizeCompanyName(c.name),
      name_kana: null,
      prefecture: "不明",
      city: null,
      address: null,
      corporate_type: "株式会社",
      enrichment_status: "pending",
    }));

    const { error: insertErr } = await supabase
      .from("companies")
      .insert(records);

    if (insertErr) {
      errors += batch.length;
      console.error(
        `   [${i + 1}-${i + batch.length}] エラー: ${insertErr.message}`
      );
    } else {
      inserted += batch.length;
      if ((i / BATCH_SIZE + 1) % 20 === 0 || i + BATCH_SIZE >= newCompanies.length) {
        console.log(
          `   [${i + 1}-${Math.min(i + BATCH_SIZE, newCompanies.length)}/${newCompanies.length}] 完了`
        );
      }
    }
  }

  // 5. Get final count
  const { count: finalCount } = await supabase
    .from("companies")
    .select("*", { count: "exact", head: true });

  // 6. Report
  console.log("\n=== インポート完了 ===");
  console.log(`スタンダード上場企業（JPX）: ${standardCompanies.length}社`);
  console.log(`グロース上場企業（JPX）: ${growthCompanies.length}社`);
  console.log(`既存企業との重複: ${duplicateCount}社`);
  console.log(`新規追加: ${inserted}社`);
  if (errors > 0) console.log(`エラー: ${errors}件`);
  console.log(`合計企業数: ${finalCount}社`);
}

main().catch(console.error);
