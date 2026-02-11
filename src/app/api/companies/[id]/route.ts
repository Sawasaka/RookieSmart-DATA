import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();

    const { data, error } = await supabase
      .from('companies')
      .select(
        `
        *,
        industry:industries(id, name, category),
        company_tags(
          tag:service_tags(id, name)
        )
      `
      )
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { success: false, error: '企業が見つかりません' },
          { status: 404 }
        );
      }
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 }
      );
    }

    const company = {
      ...data,
      tags: data.company_tags?.map((ct: { tag: { id: string; name: string } }) => ct.tag) || [],
    };
    delete (company as Record<string, unknown>).company_tags;

    return NextResponse.json({ success: true, data: company });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
