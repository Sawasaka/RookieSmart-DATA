import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Lazy-initialized client-side Supabase client
let _supabase: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY must be set');
    }
    _supabase = createClient(url, key);
  }
  return _supabase;
}

// Server-side Supabase client (for API routes)
export function createServerSupabaseClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error('Supabase environment variables are not configured');
  }
  return createClient(url, key);
}

// Database types for Supabase
export type Database = {
  public: {
    Tables: {
      companies: {
        Row: {
          id: string;
          corporate_number: string;
          name: string;
          name_kana: string | null;
          prefecture: string;
          city: string | null;
          address: string | null;
          corporate_type: string;
          website_url: string | null;
          industry_id: string | null;
          service_summary: string | null;
          company_features: string | null;
          employee_count: string | null;
          revenue: string | null;
          office_locations: string[] | null;
          enrichment_status: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['companies']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['companies']['Insert']>;
      };
      industries: {
        Row: {
          id: string;
          name: string;
          category: string | null;
        };
        Insert: Omit<Database['public']['Tables']['industries']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['industries']['Insert']>;
      };
      service_tags: {
        Row: {
          id: string;
          name: string;
        };
        Insert: Omit<Database['public']['Tables']['service_tags']['Row'], 'id'>;
        Update: Partial<Database['public']['Tables']['service_tags']['Insert']>;
      };
      company_tags: {
        Row: {
          company_id: string;
          tag_id: string;
        };
        Insert: Database['public']['Tables']['company_tags']['Row'];
        Update: Partial<Database['public']['Tables']['company_tags']['Insert']>;
      };
      offices: {
        Row: {
          id: string;
          company_id: string;
          name: string;
          office_type: string;
          prefecture: string | null;
          city: string | null;
          address: string | null;
          phone: string | null;
          website_url: string | null;
          is_primary: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['offices']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['offices']['Insert']>;
      };
      departments: {
        Row: {
          id: string;
          company_id: string;
          office_id: string | null;
          name: string;
          department_type: string | null;
          parent_department_id: string | null;
          headcount: string | null;
          description: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['departments']['Row'], 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Database['public']['Tables']['departments']['Insert']>;
      };
    };
  };
};
