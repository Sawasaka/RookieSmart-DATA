import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = createServerSupabaseClient();

    // Fetch company with relations
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

    // Fetch offices for this company
    const { data: offices } = await supabase
      .from('offices')
      .select('*')
      .eq('company_id', id)
      .order('is_primary', { ascending: false })
      .order('office_type', { ascending: true });

    // Fetch departments for this company
    const { data: departments } = await supabase
      .from('departments')
      .select('*')
      .eq('company_id', id)
      .order('department_type', { ascending: true });

    // Build nested department tree (parent -> children)
    const departmentMap = new Map<string, typeof departments extends (infer T)[] | null ? T & { children: T[] } : never>();
    const rootDepartments: (typeof departmentMap extends Map<string, infer V> ? V : never)[] = [];
    
    if (departments) {
      for (const dept of departments) {
        departmentMap.set(dept.id, { ...dept, children: [] });
      }
      for (const dept of departments) {
        const node = departmentMap.get(dept.id)!;
        if (dept.parent_department_id && departmentMap.has(dept.parent_department_id)) {
          departmentMap.get(dept.parent_department_id)!.children.push(node);
        } else {
          rootDepartments.push(node);
        }
      }
    }

    // Attach departments to their offices
    const officesWithDepts = (offices || []).map((office) => ({
      ...office,
      departments: rootDepartments.filter((d) => d.office_id === office.id),
    }));

    // Departments not assigned to any office
    const unassignedDepartments = rootDepartments.filter((d) => !d.office_id);

    // Fetch intent data
    const { data: intentData } = await supabase
      .from('company_intents')
      .select('*')
      .eq('company_id', id)
      .eq('department_type', 'it')
      .maybeSingle();

    // Fetch intent signals
    const { data: intentSignals } = await supabase
      .from('intent_signals')
      .select('*')
      .eq('company_id', id)
      .eq('department_type', 'it')
      .order('posted_date', { ascending: false, nullsFirst: false })
      .limit(20);

    const company = {
      ...data,
      tags: data.company_tags?.map((ct: { tag: { id: string; name: string } }) => ct.tag) || [],
      offices: officesWithDepts,
      departments: unassignedDepartments,
      intent: intentData || null,
      intent_signals: intentSignals || [],
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
