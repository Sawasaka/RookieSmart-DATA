import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { DEFAULT_PAGE_SIZE } from '@/lib/constants';

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = request.nextUrl;

    const page = parseInt(searchParams.get('page') || '1');
    const per_page = parseInt(searchParams.get('per_page') || String(DEFAULT_PAGE_SIZE));
    const prefecture = searchParams.get('prefecture');
    const corporate_type = searchParams.get('corporate_type');
    const enrichment_status = searchParams.get('enrichment_status');
    const search = searchParams.get('search');
    const sort_by = searchParams.get('sort_by') || 'created_at';
    const sort_order = searchParams.get('sort_order') || 'desc';

    let query = supabase.from('companies').select('*', { count: 'exact' });

    if (prefecture) query = query.eq('prefecture', prefecture);
    if (corporate_type) query = query.eq('corporate_type', corporate_type);
    if (enrichment_status) query = query.eq('enrichment_status', enrichment_status);
    if (search) query = query.ilike('name', `%${search}%`);

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

    return NextResponse.json({
      success: true,
      data: {
        data: data || [],
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
