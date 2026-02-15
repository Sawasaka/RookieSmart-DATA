-- Migration: Add offices and departments tables for organizational structure
-- Run this SQL in Supabase SQL Editor

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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_offices_company_id ON offices(company_id);
CREATE INDEX IF NOT EXISTS idx_offices_office_type ON offices(office_type);
CREATE INDEX IF NOT EXISTS idx_offices_prefecture ON offices(prefecture);
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
