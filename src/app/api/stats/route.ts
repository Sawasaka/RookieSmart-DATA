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

    // By corporate type
    const { data: typeData } = await supabase
      .from('companies')
      .select('corporate_type');

    const typeCounts: Record<string, number> = {};
    typeData?.forEach((c) => {
      typeCounts[c.corporate_type] = (typeCounts[c.corporate_type] || 0) + 1;
    });
    const by_corporate_type = Object.entries(typeCounts)
      .map(([corporate_type, count]) => ({ corporate_type, count }))
      .sort((a, b) => b.count - a.count);

    // Recent companies
    const { data: recent } = await supabase
      .from('companies')
      .select('id, name, prefecture, corporate_type, enrichment_status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);

    return NextResponse.json({
      success: true,
      data: {
        total_companies: total || 0,
        enriched_companies: enriched || 0,
        pending_companies: pending || 0,
        by_prefecture,
        by_corporate_type,
        recent_companies: recent || [],
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
