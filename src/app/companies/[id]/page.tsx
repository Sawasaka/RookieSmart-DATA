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
} from 'lucide-react';
import { ENRICHMENT_STATUS_LABELS } from '@/lib/constants';
import type { Company, EnrichmentStatus } from '@/types';

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
                icon={<Briefcase className="h-4 w-4" />}
                label="法人種別"
                value={company.corporate_type}
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
