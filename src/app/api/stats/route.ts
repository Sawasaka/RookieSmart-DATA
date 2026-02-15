import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET() {
  try {
    const supabase = createServerSupabaseClient();

    // Total companies
    const { count: total } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true });

    // Enriched companies
    const { count: enriched } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .eq('enrichment_status', 'completed');

    // Pending companies
    const { count: pending } = await supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })
      .eq('enrichment_status', 'pending');

    // By prefecture (top 10)
    const { data: allCompanies } = await supabase
      .from('companies')
      .select('prefecture');

    const prefectureCounts: Record<string, number> = {};
    allCompanies?.forEach((c) => {
      prefectureCounts[c.prefecture] = (prefectureCounts[c.prefecture] || 0) + 1;
    });
    const by_prefecture = Object.entries(prefectureCounts)
      .map(([prefecture, count]) => ({ prefecture, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Recent companies
    const { data: recent } = await supabase
      .from('companies')
      .select('id, name, prefecture, enrichment_status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    // Intent statistics
    const { data: intentData } = await supabase
      .from('company_intents')
      .select('intent_level')
      .eq('department_type', 'it');

    const intentCounts = { hot: 0, middle: 0, low: 0, none: 0 };
    if (intentData) {
      for (const row of intentData) {
        const level = row.intent_level as keyof typeof intentCounts;
        if (level in intentCounts) intentCounts[level]++;
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total_companies: total || 0,
        enriched_companies: enriched || 0,
        pending_companies: pending || 0,
        by_prefecture,
        recent_companies: recent || [],
        intent_stats: intentCounts,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
