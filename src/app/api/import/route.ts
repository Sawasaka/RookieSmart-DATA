import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import Papa from 'papaparse';

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
    if (mapped) {
      mapping[mapped] = index;
    }
  });
  return mapping;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'CSVファイルが必要です' },
        { status: 400 }
      );
    }

    const text = await file.text();
    const parsed = Papa.parse(text, {
      header: false,
      skipEmptyLines: true,
    });

    if (parsed.errors.length > 0) {
      return NextResponse.json(
        { success: false, error: `CSV解析エラー: ${parsed.errors[0].message}` },
        { status: 400 }
      );
    }

    const rows = parsed.data as string[][];
    if (rows.length < 2) {
      return NextResponse.json(
        { success: false, error: 'CSVファイルにデータがありません' },
        { status: 400 }
      );
    }

    // Map column headers
    const headers = rows[0];
    const columnMap = mapColumns(headers);

    // Validate required columns
    if (!columnMap.corporate_number || !columnMap.name) {
      return NextResponse.json(
        {
          success: false,
          error: '必須カラム（法人番号、商号又は名称）が見つかりません。国税庁法人番号公表サイトからダウンロードしたCSVファイルを使用してください。',
        },
        { status: 400 }
      );
    }

    const supabase = createServerSupabaseClient();
    const dataRows = rows.slice(1);

    // Process in batches of 100
    const batchSize = 100;
    let inserted = 0;
    let skipped = 0;
    let errors: string[] = [];

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

      if (companies.length === 0) continue;

      const { data, error } = await supabase
        .from('companies')
        .upsert(companies as Record<string, unknown>[], {
          onConflict: 'corporate_number',
          ignoreDuplicates: false,
        })
        .select('id');

      if (error) {
        errors.push(`バッチ ${Math.floor(i / batchSize) + 1}: ${error.message}`);
      } else {
        inserted += data?.length || 0;
      }
      skipped += batch.length - (companies as Record<string, unknown>[]).length;
    }

    return NextResponse.json({
      success: true,
      data: {
        total_rows: dataRows.length,
        inserted,
        skipped,
        errors: errors.length > 0 ? errors : undefined,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
