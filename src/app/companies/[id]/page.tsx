'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  ArrowLeft,
  MapPin,
  Hash,
  Globe,
  Briefcase,
  Users,
  TrendingUp,
  Tag,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Landmark,
  Network,
  Phone,
  Flame,
  ExternalLink,
} from 'lucide-react';
import { ENRICHMENT_STATUS_LABELS } from '@/lib/constants';
import type { Company, EnrichmentStatus, Office, Department, IntentLevel } from '@/types';
import { OFFICE_TYPE_LABELS, DEPARTMENT_TYPE_LABELS, INTENT_LEVEL_LABELS } from '@/types';

const STATUS_ICON: Record<EnrichmentStatus, React.ReactNode> = {
  pending: <Clock className="h-4 w-4 text-amber-500" />,
  in_progress: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
  completed: <CheckCircle2 className="h-4 w-4 text-emerald-500" />,
  failed: <AlertCircle className="h-4 w-4 text-red-500" />,
};

const STATUS_STYLES: Record<EnrichmentStatus, string> = {
  pending: 'status-pending',
  in_progress: 'status-in-progress',
  completed: 'status-completed',
  failed: 'status-failed',
};

export default function CompanyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [company, setCompany] = useState<Company | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchCompany() {
      try {
        const res = await fetch(`/api/companies/${params.id}`);
        const json = await res.json();
        if (json.success) {
          setCompany(json.data);
        } else {
          setError(json.error || '企業情報の取得に失敗しました');
        }
      } catch {
        setError('企業情報の取得に失敗しました');
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchCompany();
  }, [params.id]);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-8 w-8" />
          <Skeleton className="h-8 w-64" />
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="lg:col-span-2 space-y-6">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-48 w-full" />
          </div>
          <Skeleton className="h-80 w-full" />
        </div>
      </div>
    );
  }

  if (error || !company) {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">企業が見つかりません</h2>
        <p className="text-muted-foreground mb-4">{error}</p>
        <Button variant="outline" onClick={() => router.push('/companies')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          企業一覧に戻る
        </Button>
      </div>
    );
  }

  const fullAddress = [company.prefecture, company.city, company.address]
    .filter(Boolean)
    .join(' ');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-4">
          <Link href="/companies">
            <Button variant="ghost" size="icon" className="h-9 w-9">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight">{company.name}</h1>
              <Badge variant="outline" className={STATUS_STYLES[company.enrichment_status]}>
                {STATUS_ICON[company.enrichment_status]}
                <span className="ml-1">
                  {ENRICHMENT_STATUS_LABELS[company.enrichment_status]}
                </span>
              </Badge>
            </div>
            {company.name_kana && (
              <p className="text-muted-foreground mt-0.5">{company.name_kana}</p>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                基本情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <InfoRow
                icon={<Hash className="h-4 w-4" />}
                label="法人番号"
                value={company.corporate_number}
              />
              <Separator />
              <InfoRow
                icon={<MapPin className="h-4 w-4" />}
                label="所在地"
                value={fullAddress || '未登録'}
              />
              {company.website_url && (
                <>
                  <Separator />
                  <InfoRow
                    icon={<Globe className="h-4 w-4" />}
                    label="Webサイト"
                    value={
                      <a
                        href={company.website_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        {company.website_url}
                      </a>
                    }
                  />
                </>
              )}
            </CardContent>
          </Card>

          {/* Enriched Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Briefcase className="h-4 w-4" />
                詳細情報
                {company.enrichment_status !== 'completed' && (
                  <Badge variant="secondary" className="text-xs ml-2">Phase 1で取得予定</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company.enrichment_status === 'completed' ? (
                <div className="space-y-4">
                  {company.industry && (
                    <>
                      <InfoRow
                        icon={<Briefcase className="h-4 w-4" />}
                        label="業界"
                        value={
                          <Badge variant="outline">
                            {company.industry.name}
                            {company.industry.category && (
                              <span className="text-muted-foreground ml-1">
                                ({company.industry.category})
                              </span>
                            )}
                          </Badge>
                        }
                      />
                      <Separator />
                    </>
                  )}
                  {company.service_summary && (
                    <>
                      <InfoRow
                        icon={<Briefcase className="h-4 w-4" />}
                        label="サービス概要"
                        value={company.service_summary}
                      />
                      <Separator />
                    </>
                  )}
                  {company.employee_count && (
                    <>
                      <InfoRow
                        icon={<Users className="h-4 w-4" />}
                        label="従業員数"
                        value={company.employee_count}
                      />
                      <Separator />
                    </>
                  )}
                  {company.revenue && (
                    <InfoRow
                      icon={<TrendingUp className="h-4 w-4" />}
                      label="売上"
                      value={company.revenue}
                    />
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Clock className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">
                    詳細情報はPhase 1（データ充実化）で取得されます
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Intent Data */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Flame className="h-4 w-4" />
                インテントデータ（情報システム部門）
                {company.intent && (
                  <IntentLevelBadge level={company.intent.intent_level as IntentLevel} />
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company.intent ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <div className="text-2xl font-bold">{company.intent.signal_count}</div>
                      <div className="text-xs text-muted-foreground mt-1">シグナル数</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <div className="text-sm font-semibold">
                        {INTENT_LEVEL_LABELS[company.intent.intent_level as IntentLevel]}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">レベル</div>
                    </div>
                    <div className="text-center p-3 rounded-lg bg-muted/50">
                      <div className="text-sm font-semibold">
                        {company.intent.latest_signal_date
                          ? new Date(company.intent.latest_signal_date).toLocaleDateString('ja-JP')
                          : '—'}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">最新日</div>
                    </div>
                  </div>

                  {company.intent_signals && company.intent_signals.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                        検出された求人情報
                      </p>
                      {company.intent_signals.map((signal) => (
                        <div key={signal.id} className="flex items-start gap-3 p-3 rounded-lg border text-sm">
                          <div className="min-w-0 flex-1">
                            <div className="font-medium truncate">{signal.title}</div>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <span>{signal.source_name}</span>
                              {signal.posted_date && (
                                <>
                                  <span>|</span>
                                  <span>{new Date(signal.posted_date).toLocaleDateString('ja-JP')}</span>
                                </>
                              )}
                            </div>
                          </div>
                          <a
                            href={signal.source_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-primary hover:text-primary/80"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Flame className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">
                    インテントデータは未取得です
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Organization Structure - Offices & Departments */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Landmark className="h-4 w-4" />
                組織構造（拠点・部門）
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company.offices && company.offices.length > 0 ? (
                <div className="space-y-4">
                  {company.offices.map((office: Office) => (
                    <div key={office.id} className="rounded-lg border p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium">{office.name}</span>
                          <Badge variant={office.is_primary ? 'default' : 'outline'} className="text-xs">
                            {OFFICE_TYPE_LABELS[office.office_type] || office.office_type}
                          </Badge>
                          {office.is_primary && (
                            <Badge variant="secondary" className="text-xs">主要拠点</Badge>
                          )}
                        </div>
                      </div>
                      <div className="ml-6 space-y-1 text-sm text-muted-foreground">
                        {(office.prefecture || office.city || office.address) && (
                          <div className="flex items-center gap-1.5">
                            <MapPin className="h-3.5 w-3.5 shrink-0" />
                            <span>{[office.prefecture, office.city, office.address].filter(Boolean).join(' ')}</span>
                          </div>
                        )}
                        {office.phone && (
                          <div className="flex items-center gap-1.5">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            <span>{office.phone}</span>
                          </div>
                        )}
                        {office.website_url && (
                          <div className="flex items-center gap-1.5">
                            <Globe className="h-3.5 w-3.5 shrink-0" />
                            <a href={office.website_url} target="_blank" rel="noopener noreferrer"
                              className="text-primary hover:underline truncate">
                              {office.website_url}
                            </a>
                          </div>
                        )}
                      </div>
                      {/* Departments under this office */}
                      {office.departments && office.departments.length > 0 && (
                        <div className="ml-6 mt-3 space-y-2">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground uppercase tracking-wider">
                            <Network className="h-3 w-3" />
                            部門
                          </div>
                          <DepartmentTree departments={office.departments} depth={0} />
                        </div>
                      )}
                    </div>
                  ))}

                  {/* Departments not assigned to any office */}
                  {company.departments && company.departments.length > 0 && (
                    <div className="rounded-lg border border-dashed p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Network className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium text-muted-foreground">拠点未割当の部門</span>
                      </div>
                      <DepartmentTree departments={company.departments} depth={0} />
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <Landmark className="h-10 w-10 text-muted-foreground/40 mb-3" />
                  <p className="text-muted-foreground text-sm">
                    組織情報はエンリッチメントで取得されます
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tags */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Tag className="h-4 w-4" />
                サービスタグ
              </CardTitle>
            </CardHeader>
            <CardContent>
              {company.tags && company.tags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {company.tags.map((tag) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  タグ未設定
                </p>
              )}
            </CardContent>
          </Card>

          {/* Meta */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                メタ情報
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">登録日</span>
                <span>{new Date(company.created_at).toLocaleDateString('ja-JP')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">更新日</span>
                <span>{new Date(company.updated_at).toLocaleDateString('ja-JP')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">データ充実</span>
                <Badge variant="outline" className={STATUS_STYLES[company.enrichment_status]}>
                  {ENRICHMENT_STATUS_LABELS[company.enrichment_status]}
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted text-muted-foreground shrink-0">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground mb-0.5">{label}</p>
        <div className="text-sm font-medium break-all">{value}</div>
      </div>
    </div>
  );
}

const INTENT_COLORS: Record<IntentLevel, string> = {
  hot: 'bg-red-100 text-red-700 border-red-200',
  middle: 'bg-orange-100 text-orange-700 border-orange-200',
  low: 'bg-gray-100 text-gray-600 border-gray-200',
  none: 'bg-gray-50 text-gray-400 border-gray-100',
};

function IntentLevelBadge({ level }: { level: IntentLevel }) {
  return (
    <Badge variant="outline" className={INTENT_COLORS[level]}>
      {INTENT_LEVEL_LABELS[level]}
    </Badge>
  );
}

function DepartmentTree({ departments, depth }: { departments: Department[]; depth: number }) {
  return (
    <div className={depth > 0 ? 'ml-4 border-l pl-3' : ''}>
      {departments.map((dept) => (
        <div key={dept.id} className="py-1.5">
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-1.5 rounded-full bg-muted-foreground/40 shrink-0" />
            <span className="text-sm font-medium">{dept.name}</span>
            {dept.department_type && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                {DEPARTMENT_TYPE_LABELS[dept.department_type] || dept.department_type}
              </Badge>
            )}
            {dept.headcount && (
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                <Users className="h-3 w-3" />
                {dept.headcount}
              </span>
            )}
          </div>
          {dept.description && (
            <p className="text-xs text-muted-foreground ml-3.5 mt-0.5">{dept.description}</p>
          )}
          {dept.children && dept.children.length > 0 && (
            <DepartmentTree departments={dept.children} depth={depth + 1} />
          )}
        </div>
      ))}
    </div>
  );
}
