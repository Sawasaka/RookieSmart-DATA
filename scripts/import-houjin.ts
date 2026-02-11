/**
 * 法人番号DB取り込みスクリプト
 *
 * 使い方:
 *   npx tsx scripts/import-houjin.ts <CSVファイルパス>
 *
 * 例:
 *   npx tsx scripts/import-houjin.ts data/houjin/13_tokyo_all.csv
 *
 * CSVファイルは国税庁法人番号公表サイトからダウンロードしたものを使用してください。
 * https://www.houjin-bangou.nta.go.jp/download/
 */

import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import Papa from 'papaparse';

// Environment variables
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set.');
  console.error('Create a .env.local file with these values.');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

// Column name mappings for 国税庁法人番号公表サイト CSV
const COLUMN_MAP: Record<string, string> = {
  '法人番号': 'corporate_number',
  '商号又は名称': 'name',
  '法人名': 'name',
  '商号又は名称フリガナ': 'name_kana',
  'フリガナ': 'name_kana',
  '国内所在地(都道府県)': 'prefecture',
  '都道府県': 'prefecture',
  '都道府県名': 'prefecture',
  '国内所在地(市区町村)': 'city',
  '市区町村': 'city',
  '市区町村名': 'city',
  '国内所在地(丁目番地等)': 'street_address',
  '丁目番地等': 'street_address',
  '国内所在地(ビル名等)': 'building',
  'ビル名等': 'building',
};

function detectCorporateType(name: string): string {
  if (name.includes('株式会社')) return '株式会社';
  if (name.includes('有限会社')) return '有限会社';
  if (name.includes('合同会社')) return '合同会社';
  if (name.includes('合資会社')) return '合資会社';
  if (name.includes('合名会社')) return '合名会社';
  if (name.includes('一般社団法人')) return '一般社団法人';
  if (name.includes('一般財団法人')) return '一般財団法人';
  if (name.includes('公益社団法人')) return '公益社団法人';
  if (name.includes('公益財団法人')) return '公益財団法人';
  if (name.includes('NPO法人') || name.includes('特定非営利活動法人')) return 'NPO法人';
  return 'その他';
}

function mapColumns(headers: string[]): Record<string, number> {
  const mapping: Record<string, number> = {};
  headers.forEach((header, index) => {
    const trimmed = header.trim().replace(/\ufeff/, ''); // Remove BOM
    const mapped = COLUMN_MAP[trimmed];
    if (mapped && !(mapped in mapping)) {
      mapping[mapped] = index;
    }
  });
  return mapping;
}

async function importCSV(filePath: string) {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    console.error(`Error: File not found: ${absolutePath}`);
    process.exit(1);
  }

  console.log(`Reading: ${absolutePath}`);
  const content = fs.readFileSync(absolutePath, 'utf-8');

  console.log('Parsing CSV...');
  const parsed = Papa.parse(content, {
    header: false,
    skipEmptyLines: true,
  });

  if (parsed.errors.length > 0) {
    console.error('CSV parse errors:', parsed.errors.slice(0, 5));
  }

  const rows = parsed.data as string[][];
  if (rows.length < 2) {
    console.error('Error: CSV file has no data rows.');
    process.exit(1);
  }

  const headers = rows[0];
  const columnMap = mapColumns(headers);

  console.log('Detected columns:', columnMap);

  if (!columnMap.corporate_number || !columnMap.name) {
    console.error('Error: Required columns not found (法人番号, 商号又は名称)');
    console.error('Available headers:', headers.join(', '));
    process.exit(1);
  }

  const dataRows = rows.slice(1);
  console.log(`Total rows: ${dataRows.length}`);

  // Process in batches
  const batchSize = 200;
  let inserted = 0;
  let skipped = 0;
  let errorCount = 0;

  for (let i = 0; i < dataRows.length; i += batchSize) {
    const batch = dataRows.slice(i, i + batchSize);
    const companies = batch
      .map((row) => {
        const corporateNumber = row[columnMap.corporate_number]?.trim();
        const name = row[columnMap.name]?.trim();

        if (!corporateNumber || !name) return null;

        const street = columnMap.street_address ? row[columnMap.street_address]?.trim() : '';
        const building = columnMap.building ? row[columnMap.building]?.trim() : '';
        const address = [street, building].filter(Boolean).join(' ') || null;

        return {
          corporate_number: corporateNumber,
          name,
          name_kana: columnMap.name_kana ? row[columnMap.name_kana]?.trim() || null : null,
          prefecture: columnMap.prefecture ? row[columnMap.prefecture]?.trim() || '不明' : '不明',
          city: columnMap.city ? row[columnMap.city]?.trim() || null : null,
          address,
          corporate_type: detectCorporateType(name),
          enrichment_status: 'pending',
        };
      })
      .filter(Boolean);

    if (companies.length === 0) {
      skipped += batch.length;
      continue;
    }

    const { data, error } = await supabase
      .from('companies')
      .upsert(companies as Record<string, unknown>[], {
        onConflict: 'corporate_number',
        ignoreDuplicates: false,
      })
      .select('id');

    if (error) {
      console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, error.message);
      errorCount += companies.length;
    } else {
      inserted += data?.length || 0;
    }

    skipped += batch.length - companies.length;

    // Progress
    const progress = Math.min(100, Math.round(((i + batch.length) / dataRows.length) * 100));
    process.stdout.write(`\rProgress: ${progress}% (${inserted} inserted, ${skipped} skipped, ${errorCount} errors)`);
  }

  console.log('\n');
  console.log('=== Import Complete ===');
  console.log(`Total rows:  ${dataRows.length}`);
  console.log(`Inserted:    ${inserted}`);
  console.log(`Skipped:     ${skipped}`);
  console.log(`Errors:      ${errorCount}`);
}

// Main
const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: npx tsx scripts/import-houjin.ts <csv-file-path>');
  console.error('Example: npx tsx scripts/import-houjin.ts data/houjin/13_tokyo.csv');
  process.exit(1);
}

importCSV(csvPath).catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
