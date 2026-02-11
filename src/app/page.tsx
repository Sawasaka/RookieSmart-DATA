'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Building2,
  TrendingUp,
  Clock,
  CheckCircle2,
  ArrowRight,
  Database,
  Sparkles,
  Target,
} from 'lucide-react';
import Link from 'next/link';
import { ENRICHMENT_STATUS_LABELS } from '@/lib/constants';
import type { EnrichmentStatus } from '@/types';

interface StatsData {
  total_companies: number;
  enriched_companies: number;
  pending_companies: number;
  by_prefecture: { prefecture: string; count: number }[];
  by_corporate_type: { corporate_type: string; count: number }[];
  recent_companies: {
    id: string;
    name: string;
    prefecture: string;
    corporate_type: string;
    enrichment_status: EnrichmentStatus;
    created_at: string;
  }[];
}

const STATUS_STYLES: Record<EnrichmentStatus, string> = {
  pending: 'status-pending',
  in_progress: 'status-in-progress',
  completed: 'status-completed',
  failed: 'status-failed',
};

export default function DashboardPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats');
        const json = await res.json();
        if (json.success) {
          setStats(json.data);
        }
      } catch (err) {
        console.error('Failed to fetch stats:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const enrichmentRate =
    stats && stats.total_companies > 0
      ? Math.round((stats.enriched_companies / stats.total_companies) * 100)
      : 0;

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">ダッシュボード</h1>
        <p className="text-muted-foreground mt-1">
          RookieSmart DATA の概要と最新の統計情報
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              登録企業数
            </CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <>
                <div className="text-3xl font-bold">
                  {(stats?.total_companies || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  法人番号DB取込済み
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              データ充実済み
            </CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <>
                <div className="text-3xl font-bold">
                  {(stats?.enriched_companies || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  業界・サービス情報取得済み
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              未取得
            </CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <>
                <div className="text-3xl font-bold">
                  {(stats?.pending_companies || 0).toLocaleString()}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  詳細情報の取得待ち
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              充実率
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {loading ? (
              <Skeleton className="h-9 w-24" />
            ) : (
              <>
                <div className="text-3xl font-bold">{enrichmentRate}%</div>
                <div className="mt-2 h-2 w-full rounded-full bg-muted">
                  <div
                    className="h-2 rounded-full bg-primary transition-all"
                    style={{ width: `${enrichmentRate}%` }}
                  />
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Recent Activity */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>クイックアクション</CardTitle>
            <CardDescription>よく使う機能にすぐアクセス</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Link href="/companies">
              <Button variant="outline" className="w-full justify-between h-auto py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <Building2 className="h-5 w-5 text-primary" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">企業一覧を見る</div>
                    <div className="text-xs text-muted-foreground">
                      登録済み企業の検索・フィルタ
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Link href="/data">
              <Button variant="outline" className="w-full justify-between h-auto py-4">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
                    <Database className="h-5 w-5 text-emerald-500" />
                  </div>
                  <div className="text-left">
                    <div className="font-medium">データ管理</div>
                    <div className="text-xs text-muted-foreground">
                      法人番号DBの取り込み・管理
                    </div>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>

            <Button
              variant="outline"
              className="w-full justify-between h-auto py-4 opacity-50 cursor-not-allowed"
              disabled
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
                  <Sparkles className="h-5 w-5 text-violet-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium flex items-center gap-2">
                    データ充実化
                    <Badge variant="secondary" className="text-xs">Phase 1</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    AIによる業界・サービス情報の取得
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>

            <Button
              variant="outline"
              className="w-full justify-between h-auto py-4 opacity-50 cursor-not-allowed"
              disabled
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
                  <Target className="h-5 w-5 text-amber-500" />
                </div>
                <div className="text-left">
                  <div className="font-medium flex items-center gap-2">
                    ターゲット設定
                    <Badge variant="secondary" className="text-xs">Phase 2</Badge>
                  </div>
                  <div className="text-xs text-muted-foreground">
                    ABMターゲット企業の絞り込み
                  </div>
                </div>
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Recent Companies */}
        <Card>
          <CardHeader>
            <CardTitle>最近追加された企業</CardTitle>
            <CardDescription>直近で取り込まれた企業データ</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-lg" />
                      <div>
                        <Skeleton className="h-4 w-32 mb-1" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-5 w-14" />
                  </div>
                ))}
              </div>
            ) : stats && stats.recent_companies.length > 0 ? (
              <div className="space-y-4">
                {stats.recent_companies.map((company) => (
                  <Link
                    key={company.id}
                    href={`/companies/${company.id}`}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                        <Building2 className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <div className="font-medium">{company.name}</div>
                        <div className="text-xs text-muted-foreground">
                          {company.prefecture} &middot; {company.corporate_type}
                        </div>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={STATUS_STYLES[company.enrichment_status]}
                    >
                      {ENRICHMENT_STATUS_LABELS[company.enrichment_status]}
                    </Badge>
                  </Link>
                ))}
                <Link href="/companies">
                  <Button variant="ghost" className="w-full mt-2">
                    すべて表示
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Database className="h-12 w-12 text-muted-foreground/50 mb-4" />
                <p className="text-muted-foreground">
                  まだ企業データがありません
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  データ管理から法人番号DBを取り込んでください
                </p>
                <Link href="/data" className="mt-4">
                  <Button>データを取り込む</Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Getting Started Guide */}
      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
              ?
            </span>
            はじめに
          </CardTitle>
          <CardDescription>RookieSmart DATA の使い方ガイド</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                  1
                </span>
                <span className="font-medium">データ取り込み</span>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                法人番号DBから企業データを取り込みます。東京の株式会社約1,000社を対象としています。
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">
                  2
                </span>
                <span className="font-medium text-muted-foreground">データ充実化（Phase 1）</span>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                AIを使って業界分類、サービス特徴、会社サマリを自動取得します。
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-muted text-muted-foreground text-xs font-bold">
                  3
                </span>
                <span className="font-medium text-muted-foreground">ABMターゲティング（Phase 2）</span>
              </div>
              <p className="text-sm text-muted-foreground pl-8">
                自社サービスを登録し、マッチするターゲット企業を絞り込みます。
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
