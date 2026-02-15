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
  offices?: Office[];
  departments?: Department[];
  intent?: CompanyIntent;
  intent_signals?: IntentSignal[];
}

export type EnrichmentStatus = 'pending' | 'in_progress' | 'completed' | 'failed';

// Office types (支社・拠点)
export type OfficeType = 'headquarters' | 'branch' | 'sales_office' | 'factory' | 'lab' | 'other';

export const OFFICE_TYPE_LABELS: Record<OfficeType, string> = {
  headquarters: '本社',
  branch: '支社・支店',
  sales_office: '営業所',
  factory: '工場',
  lab: '研究所',
  other: 'その他',
};

export interface Office {
  id: string;
  company_id: string;
  name: string;
  office_type: OfficeType;
  prefecture: string | null;
  city: string | null;
  address: string | null;
  phone: string | null;
  website_url: string | null;
  is_primary: boolean;
  created_at: string;
  updated_at: string;
  departments?: Department[];
}

// Department types (部門)
export type DepartmentType =
  | 'sales' | 'marketing' | 'engineering' | 'it' | 'hr'
  | 'finance' | 'legal' | 'operations' | 'management' | 'rd' | 'cs' | 'other';

export const DEPARTMENT_TYPE_LABELS: Record<DepartmentType, string> = {
  sales: '営業',
  marketing: 'マーケティング',
  engineering: 'エンジニアリング',
  it: '情報システム',
  hr: '人事',
  finance: '経理・財務',
  legal: '法務',
  operations: '事業運営',
  management: '経営企画',
  rd: '研究開発',
  cs: 'カスタマーサポート',
  other: 'その他',
};

export interface Department {
  id: string;
  company_id: string;
  office_id: string | null;
  name: string;
  department_type: DepartmentType | null;
  parent_department_id: string | null;
  headcount: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
  children?: Department[];
}

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
}

// Intent types
export type IntentLevel = 'hot' | 'middle' | 'low' | 'none';

export interface IntentSignal {
  id: string;
  company_id: string;
  department_type: string;
  signal_type: string;
  title: string;
  source_url: string;
  source_name: string;
  posted_date: string | null;
  discovered_at: string;
  raw_data: Record<string, unknown> | null;
  created_at: string;
}

export interface CompanyIntent {
  id: string;
  company_id: string;
  department_type: string;
  intent_level: IntentLevel;
  signal_count: number;
  latest_signal_date: string | null;
  updated_at: string;
}

export const INTENT_LEVEL_LABELS: Record<IntentLevel, string> = {
  hot: 'ホット',
  middle: 'ミドル',
  low: 'ロー',
  none: 'なし',
};

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}
