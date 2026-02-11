// Company types
export interface Company {
  id: string;
  corporate_number: string;
  name: string;
  name_kana: string | null;
  prefecture: string;
  city: string | null;
  address: string | null;
  corporate_type: string;
  
  // Phase 2以降で紐付け
  website_url: string | null;
  industry_id: string | null;
  service_summary: string | null;
  company_features: string | null;
  employee_count: string | null;
  revenue: string | null;
  office_locations: string[] | null;
  
  // メタ情報
  enrichment_status: EnrichmentStatus;
  created_at: string;
  updated_at: string;
  
  // Relations
  industry?: Industry;
  tags?: ServiceTag[];
}

export type EnrichmentStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

export interface Industry {
  id: string;
  name: string;
  category: string | null;
}

export interface ServiceTag {
  id: string;
  name: string;
}

export interface CompanyTag {
  company_id: string;
  tag_id: string;
}

// Filter types
export interface CompanyFilters {
  prefecture?: string;
  city?: string;
  corporate_type?: string;
  industry_id?: string;
  enrichment_status?: EnrichmentStatus;
  search?: string;
}

// Pagination types
export interface PaginationParams {
  page: number;
  per_page: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  per_page: number;
  total_pages: number;
}

// Dashboard stats
export interface DashboardStats {
  total_companies: number;
  enriched_companies: number;
  pending_companies: number;
  by_prefecture: { prefecture: string; count: number }[];
  by_corporate_type: { corporate_type: string; count: number }[];
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
