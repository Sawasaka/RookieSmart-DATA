'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Building2,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
  ExternalLink,
} from 'lucide-react';
import { PREFECTURES, CORPORATE_TYPES, ENRICHMENT_STATUS_LABELS, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import type { Company, PaginatedResponse, EnrichmentStatus } from '@/types';

const STATUS_STYLES: Record<EnrichmentStatus, string> = {
  pending: 'status-pending',
  in_progress: 'status-in-progress',
  completed: 'status-completed',
  failed: 'status-failed',
};

type SortField = 'name' | 'prefecture' | 'corporate_type' | 'created_at';

export default function CompaniesPage() {
  const [data, setData] = useState<PaginatedResponse<Company> | null>(null);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [corporateType, setCorporateType] = useState('');
  const [enrichmentStatus, setEnrichmentStatus] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Sorting
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('per_page', String(perPage));
    params.set('sort_by', sortBy);
    params.set('sort_order', sortOrder);
    if (search) params.set('search', search);
    if (prefecture) params.set('prefecture', prefecture);
    if (corporateType) params.set('corporate_type', corporateType);
    if (enrichmentStatus) params.set('enrichment_status', enrichmentStatus);

    try {
      const res = await fetch(`/api/companies?${params}`);
      const json = await res.json();
      if (json.success) {
        setData(json.data);
      }
    } catch (err) {
      console.error('Failed to fetch companies:', err);
    } finally {
      setLoading(false);
    }
  }, [page, perPage, sortBy, sortOrder, search, prefecture, corporateType, enrichmentStatus]);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setPrefecture('');
    setCorporateType('');
    setEnrichmentStatus('');
    setPage(1);
  };

  const hasFilters = search || prefecture || corporateType || enrichmentStatus;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-primary" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-primary" />
    );
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">企業一覧</h1>
        <p className="text-muted-foreground mt-1">
          登録企業の検索・フィルタリング
        </p>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col gap-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="企業名で検索..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="pl-9"
              />
            </div>

            {/* Filter Row */}
            <div className="flex flex-wrap items-center gap-3">
              <Select value={prefecture} onValueChange={(v) => { setPrefecture(v === '__all__' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="都道府県" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">すべて</SelectItem>
                  {PREFECTURES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={corporateType} onValueChange={(v) => { setCorporateType(v === '__all__' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="法人種別" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">すべて</SelectItem>
                  {CORPORATE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>{t}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={enrichmentStatus} onValueChange={(v) => { setEnrichmentStatus(v === '__all__' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="ステータス" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">すべて</SelectItem>
                  {Object.entries(ENRICHMENT_STATUS_LABELS).map(([key, label]) => (
                    <SelectItem key={key} value={key}>{label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {hasFilters && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="h-9">
                  <X className="h-4 w-4 mr-1" />
                  リセット
                </Button>
              )}

              <div className="ml-auto text-sm text-muted-foreground">
                {data ? `${data.total.toLocaleString()} 件` : '-'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium flex items-center gap-2">
            <Building2 className="h-4 w-4" />
            企業データ
          </CardTitle>
        </CardHeader>
        <CardContent className="px-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[40%] pl-6">
                  <button
                    onClick={() => handleSort('name')}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    法人名
                    <SortIcon field="name" />
                  </button>
                </TableHead>
                <TableHead className="w-[15%]">
                  <button
                    onClick={() => handleSort('prefecture')}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    都道府県
                    <SortIcon field="prefecture" />
                  </button>
                </TableHead>
                <TableHead className="w-[15%]">
                  <button
                    onClick={() => handleSort('corporate_type')}
                    className="flex items-center gap-1.5 hover:text-foreground transition-colors"
                  >
                    法人種別
                    <SortIcon field="corporate_type" />
                  </button>
                </TableHead>
                <TableHead className="w-[15%]">ステータス</TableHead>
                <TableHead className="w-[15%] pr-6 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: perPage > 10 ? 10 : perPage }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-20" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-14" /></TableCell>
                    <TableCell className="pr-6"><Skeleton className="h-5 w-12 ml-auto" /></TableCell>
                  </TableRow>
                ))
              ) : data && data.data.length > 0 ? (
                data.data.map((company) => (
                  <TableRow key={company.id} className="group">
                    <TableCell className="pl-6">
                      <div>
                        <Link
                          href={`/companies/${company.id}`}
                          className="font-medium hover:text-primary hover:underline transition-colors"
                        >
                          {company.name}
                        </Link>
                        {company.name_kana && (
                          <div className="text-xs text-muted-foreground mt-0.5">
                            {company.name_kana}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-muted-foreground">{company.prefecture}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="font-normal">
                        {company.corporate_type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline" className={STATUS_STYLES[company.enrichment_status]}>
                        {ENRICHMENT_STATUS_LABELS[company.enrichment_status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="pr-6 text-right">
                      <Link href={`/companies/${company.id}`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <ExternalLink className="h-3.5 w-3.5 mr-1" />
                          詳細
                        </Button>
                      </Link>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                    {hasFilters
                      ? '条件に一致する企業が見つかりません'
                      : 'まだ企業データがありません。データ管理から取り込んでください。'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {data && data.total_pages > 0 && (
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>表示件数:</span>
            <Select value={String(perPage)} onValueChange={(v) => { setPerPage(Number(v)); setPage(1); }}>
              <SelectTrigger className="w-[80px] h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PAGE_SIZE_OPTIONS.map((size) => (
                  <SelectItem key={size} value={String(size)}>{size}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(1)}
              disabled={page <= 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(page - 1)}
              disabled={page <= 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            <div className="flex items-center gap-1 mx-2">
              {generatePageNumbers(page, data.total_pages).map((p, i) =>
                p === '...' ? (
                  <span key={`ellipsis-${i}`} className="px-1 text-muted-foreground">...</span>
                ) : (
                  <Button
                    key={p}
                    variant={page === p ? 'default' : 'outline'}
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => setPage(p as number)}
                  >
                    {p}
                  </Button>
                )
              )}
            </div>

            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(page + 1)}
              disabled={page >= data.total_pages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8"
              onClick={() => setPage(data.total_pages)}
              disabled={page >= data.total_pages}
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>

          <div className="text-sm text-muted-foreground">
            {((page - 1) * perPage + 1).toLocaleString()} - {Math.min(page * perPage, data.total).toLocaleString()} / {data.total.toLocaleString()} 件
          </div>
        </div>
      )}
    </div>
  );
}

function generatePageNumbers(current: number, total: number): (number | string)[] {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages: (number | string)[] = [];

  if (current <= 4) {
    for (let i = 1; i <= 5; i++) pages.push(i);
    pages.push('...');
    pages.push(total);
  } else if (current >= total - 3) {
    pages.push(1);
    pages.push('...');
    for (let i = total - 4; i <= total; i++) pages.push(i);
  } else {
    pages.push(1);
    pages.push('...');
    for (let i = current - 1; i <= current + 1; i++) pages.push(i);
    pages.push('...');
    pages.push(total);
  }

  return pages;
}
