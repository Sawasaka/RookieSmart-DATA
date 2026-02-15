-- ABM Tool Database Schema
-- Run this SQL in Supabase SQL Editor to create the necessary tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Industries table (Master data)
CREATE TABLE IF NOT EXISTS industries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  category VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name)
);

-- Service tags table (Master data)
CREATE TABLE IF NOT EXISTS service_tags (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(name)
);

-- Companies table (Main table)
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  corporate_number VARCHAR(13) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  name_kana VARCHAR(255),
  prefecture VARCHAR(10) NOT NULL,
  city VARCHAR(50),
  address TEXT,
  corporate_type VARCHAR(50) NOT NULL,
  
  -- Phase 2以降で紐付け
  website_url TEXT,
  industry_id UUID REFERENCES industries(id),
  service_summary TEXT,
  company_features TEXT,
  employee_count VARCHAR(50),
  revenue VARCHAR(50),
  office_locations JSONB DEFAULT '[]'::jsonb,
  
  -- メタ情報
  enrichment_status VARCHAR(20) DEFAULT 'pending' CHECK (enrichment_status IN ('pending', 'in_progress', 'completed', 'failed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Company tags junction table (Many-to-many)
CREATE TABLE IF NOT EXISTS company_tags (
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES service_tags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (company_id, tag_id)
);

-- Indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_companies_prefecture ON companies(prefecture);
CREATE INDEX IF NOT EXISTS idx_companies_corporate_type ON companies(corporate_type);
CREATE INDEX IF NOT EXISTS idx_companies_enrichment_status ON companies(enrichment_status);
CREATE INDEX IF NOT EXISTS idx_companies_industry_id ON companies(industry_id);
CREATE INDEX IF NOT EXISTS idx_companies_name ON companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_created_at ON companies(created_at DESC);

-- Full text search index for company names
CREATE INDEX IF NOT EXISTS idx_companies_name_search ON companies USING gin(to_tsvector('simple', name));

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
DROP TRIGGER IF EXISTS update_companies_updated_at ON companies;
CREATE TRIGGER update_companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default industries
INSERT INTO industries (name, category) VALUES
  ('ソフトウェア・SaaS', 'IT・通信'),
  ('システムインテグレーション', 'IT・通信'),
  ('Web制作・マーケティング', 'IT・通信'),
  ('データ分析・AI', 'IT・通信'),
  ('経営コンサルティング', 'コンサルティング'),
  ('ITコンサルティング', 'コンサルティング'),
  ('人事・組織コンサルティング', 'コンサルティング'),
  ('営業コンサルティング', 'コンサルティング'),
  ('製造業', '製造'),
  ('小売業', '小売・卸売'),
  ('卸売業', '小売・卸売'),
  ('金融業', '金融・保険'),
  ('保険業', '金融・保険'),
  ('不動産業', '不動産'),
  ('建設業', '建設'),
  ('運輸業', '運輸・物流'),
  ('物流業', '運輸・物流'),
  ('医療・ヘルスケア', '医療・福祉'),
  ('福祉・介護', '医療・福祉'),
  ('教育・研修', '教育'),
  ('飲食業', '飲食・サービス'),
  ('サービス業', '飲食・サービス'),
  ('広告・PR', 'メディア・広告'),
  ('メディア・出版', 'メディア・広告'),
  ('その他', 'その他')
ON CONFLICT (name) DO NOTHING;

-- Insert default service tags
INSERT INTO service_tags (name) VALUES
  ('IT'),
  ('SaaS'),
  ('DX支援'),
  ('経営コンサル'),
  ('営業コンサル'),
  ('営業代行'),
  ('マーケティング'),
  ('ウェビナー'),
  ('人材紹介'),
  ('研修・教育'),
  ('システム開発'),
  ('Web制作'),
  ('EC支援'),
  ('データ分析'),
  ('AI・機械学習'),
  ('クラウド'),
  ('セキュリティ'),
  ('BPO'),
  ('カスタマーサクセス'),
  ('インサイドセールス')
ON CONFLICT (name) DO NOTHING;

-- Offices table (支社・拠点)
CREATE TABLE IF NOT EXISTS offices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  office_type VARCHAR(50) NOT NULL DEFAULT 'branch'
    CHECK (office_type IN ('headquarters', 'branch', 'sales_office', 'factory', 'lab', 'other')),
  prefecture VARCHAR(10),
  city VARCHAR(50),
  address TEXT,
  phone VARCHAR(30),
  website_url TEXT,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Departments table (部門)
CREATE TABLE IF NOT EXISTS departments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  office_id UUID REFERENCES offices(id) ON DELETE SET NULL,
  name VARCHAR(255) NOT NULL,
  department_type VARCHAR(50)
    CHECK (department_type IN ('sales', 'marketing', 'engineering', 'it', 'hr', 'finance', 'legal', 'operations', 'management', 'rd', 'cs', 'other')),
  parent_department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
  headcount VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for offices
CREATE INDEX IF NOT EXISTS idx_offices_company_id ON offices(company_id);
CREATE INDEX IF NOT EXISTS idx_offices_office_type ON offices(office_type);
CREATE INDEX IF NOT EXISTS idx_offices_prefecture ON offices(prefecture);

-- Indexes for departments
CREATE INDEX IF NOT EXISTS idx_departments_company_id ON departments(company_id);
CREATE INDEX IF NOT EXISTS idx_departments_office_id ON departments(office_id);
CREATE INDEX IF NOT EXISTS idx_departments_department_type ON departments(department_type);
CREATE INDEX IF NOT EXISTS idx_departments_parent ON departments(parent_department_id);

-- Trigger for updated_at on offices
DROP TRIGGER IF EXISTS update_offices_updated_at ON offices;
CREATE TRIGGER update_offices_updated_at
  BEFORE UPDATE ON offices
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger for updated_at on departments
DROP TRIGGER IF EXISTS update_departments_updated_at ON departments;
CREATE TRIGGER update_departments_updated_at
  BEFORE UPDATE ON departments
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) - Optional, enable if needed
-- ALTER TABLE companies ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE industries ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE service_tags ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE company_tags ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access (if RLS is enabled)
-- CREATE POLICY "Allow public read access" ON companies FOR SELECT USING (true);
-- CREATE POLICY "Allow public read access" ON industries FOR SELECT USING (true);
-- CREATE POLICY "Allow public read access" ON service_tags FOR SELECT USING (true);
-- CREATE POLICY "Allow public read access" ON company_tags FOR SELECT USING (true);
