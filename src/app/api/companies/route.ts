import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

// Parse Japanese number text to numeric value for comparison
function parseJapaneseNumber(text: string): number | null {
  if (!text) return null;
  // Remove non-essential chars
  const cleaned = text.replace(/[約,、 ]/g, '');
  // Try patterns like "3兆5000億円", "5,000億円", "300名", "50,000名"
  let value = 0;
  const cho = cleaned.match(/(\d+(?:\.\d+)?)兆/);
  const oku = cleaned.match(/(\d+(?:\.\d+)?)億/);
  const man = cleaned.match(/(\d+(?:\.\d+)?)万/);

  if (cho) value += parseFloat(cho[1]) * 1_0000_0000_0000;
  if (oku) value += parseFloat(oku[1]) * 1_0000_0000;
  if (man) value += parseFloat(man[1]) * 1_0000;

  if (value > 0) return value;

  // Plain numbers like "50000" or "50,000名"
  const plain = cleaned.replace(/[名人円件社連結グループ単体:：]/g, '').replace(/,/g, '');
  const num = parseFloat(plain);
  return isNaN(num) ? null : num;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = request.nextUrl;

    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || String(DEFAULT_PAGE_SIZE));
    const prefecture = searchParams.get('prefecture');
    const enrichment_status = searchParams.get('enrichment_status');
    const industry_id = searchParams.get('industry_id');
    const search = searchParams.get('search');
    const sort_by = searchParams.get('sort_by') || 'created_at';
    const sort_order = searchParams.get('sort_order') || 'desc';
    const tag_ids = searchParams.get('tag_ids'); // comma-separated
    const employee_range = searchParams.get('employee_range');
    const revenue_range = searchParams.get('revenue_range');
    const intent_level = searchParams.get('intent_level');

    // If tag filter is used, first get matching company IDs
    let tagFilterIds: string[] | null = null;
    if (tag_ids) {
      const tagIdList = tag_ids.split(',').filter(Boolean);
      if (tagIdList.length > 0) {
        const { data: tagMatches } = await supabase
          .from('company_tags')
          .select('company_id')
          .in('tag_id', tagIdList);

        if (tagMatches && tagMatches.length > 0) {
          tagFilterIds = [...new Set(tagMatches.map((t) => t.company_id))];
        } else {
          // No companies match the tag filter
          return NextResponse.json({
            success: true,
            data: { data: [], total: 0, page, per_page, total_pages: 0 },
          });
        }
      }
    }

    // If intent_level filter, get matching company IDs from company_intents
    let intentFilterIds: string[] | null = null;
    if (intent_level) {
      const { data: intentMatches } = await supabase
        .from('company_intents')
        .select('company_id')
        .eq('department_type', 'it')
        .eq('intent_level', intent_level);

      if (intentMatches && intentMatches.length > 0) {
        intentFilterIds = intentMatches.map((m) => m.company_id);
      } else {
        return NextResponse.json({
          success: true,
          data: { data: [], total: 0, page, per_page, total_pages: 0 },
        });
      }
    }

    // For employee_count and revenue range filtering, we need to fetch all matching
    // then filter in-memory since these are text fields
    const needsInMemoryFilter = employee_range || revenue_range;

    let query = supabase.from('companies').select('*', { count: needsInMemoryFilter ? undefined : 'exact' });

    if (prefecture) query = query.eq('prefecture', prefecture);
    if (enrichment_status) query = query.eq('enrichment_status', enrichment_status);
    if (industry_id) query = query.eq('industry_id', industry_id);
    if (search) query = query.ilike('name', `%${search}%`);
    if (tagFilterIds) query = query.in('id', tagFilterIds);
    if (intentFilterIds) query = query.in('id', intentFilterIds);

    if (needsInMemoryFilter) {
      // Fetch all matching records for in-memory filtering
      query = query.order(sort_by, { ascending: sort_order === 'asc' });
      const { data: allData, error } = await query;

      if (error) {
        return NextResponse.json(
          { success: false, error: error.message },
          { status: 500 }
        );
      }

      let filtered = allData || [];

      // Employee count range filter
      if (employee_range) {
        const [minStr, maxStr] = employee_range.split('-');
        const min = minStr ? parseInt(minStr) : 0;
        const max = maxStr ? parseInt(maxStr) : Infinity;

        filtered = filtered.filter((c) => {
          if (!c.employee_count) return false;
          const val = parseJapaneseNumber(c.employee_count);
          if (val === null) return false;
          return val >= min && val < max;
        });
      }

      // Revenue range filter
      if (revenue_range) {
        const [minStr, maxStr] = revenue_range.split('-');
        const min = minStr ? parseInt(minStr) : 0;
        const max = maxStr ? parseInt(maxStr) : Infinity;

        filtered = filtered.filter((c) => {
          if (!c.revenue) return false;
          const val = parseJapaneseNumber(c.revenue);
          if (val === null) return false;
          return val >= min && val < max;
        });
      }

      const total = filtered.length;
      const from = (page - 1) * per_page;
      const paged = filtered.slice(from, from + per_page);

      // Attach intent data
      const pagedWithIntent = await attachIntentData(supabase, paged);

      return NextResponse.json({
        success: true,
        data: {
          data: pagedWithIntent,
          total,
          page,
          per_page,
          total_pages: Math.ceil(total / per_page),
        },
      });
    }

    // Standard DB-level pagination
    const from = (page - 1) * per_page;
    const to = from + per_page - 1;

    query = query.order(sort_by, { ascending: sort_order === 'asc' }).range(from, to);

    const { data, error, count } = await query;

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    // Attach intent data
    const dataWithIntent = await attachIntentData(supabase, data || []);

    return NextResponse.json({
      success: true,
      data: {
        data: dataWithIntent,
        total: count || 0,
        page,
        per_page,
        total_pages: Math.ceil((count || 0) / per_page),
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function attachIntentData(supabase: any, companies: any[]) {
  if (companies.length === 0) return companies;
  const ids = companies.map((c) => c.id);
  const { data: intents } = await supabase
    .from('company_intents')
    .select('company_id, intent_level, signal_count, latest_signal_date')
    .eq('department_type', 'it')
    .in('company_id', ids);

  const intentMap = new Map<string, typeof intents extends (infer T)[] | null ? T : never>();
  if (intents) {
    for (const intent of intents) {
      intentMap.set(intent.company_id, intent);
    }
  }

  return companies.map((c) => ({
    ...c,
    intent: intentMap.get(c.id) || null,
  }));
}
