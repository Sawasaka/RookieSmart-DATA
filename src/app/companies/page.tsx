'use client';

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
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
  Filter,
  Tag,
  ChevronDown,
} from 'lucide-react';
import { PREFECTURES, ENRICHMENT_STATUS_LABELS, PAGE_SIZE_OPTIONS } from '@/lib/constants';
import type { Company, PaginatedResponse, EnrichmentStatus, Industry, ServiceTag, IntentLevel } from '@/types';
import { INTENT_LEVEL_LABELS } from '@/types';

const STATUS_STYLES: Record<EnrichmentStatus, string> = {
  pending: 'status-pending',
  in_progress: 'status-in-progress',
  completed: 'status-completed',
  failed: 'status-failed',
};

const EMPLOYEE_RANGES = [
  { value: '0-50', label: '〜50名' },
  { value: '50-300', label: '50〜300名' },
  { value: '300-1000', label: '300〜1,000名' },
  { value: '1000-5000', label: '1,000〜5,000名' },
  { value: '5000-', label: '5,000名〜' },
];

const REVENUE_RANGES = [
  { value: '0-1000000000', label: '〜10億円' },
  { value: '1000000000-100000000000', label: '10〜1,000億円' },
  { value: '100000000000-1000000000000', label: '1,000億〜1兆円' },
  { value: '1000000000000-', label: '1兆円〜' },
];

const INTENT_LEVEL_OPTIONS: { value: IntentLevel; label: string; color: string }[] = [
  { value: 'hot', label: 'ホット', color: 'bg-red-100 text-red-700 border-red-200' },
  { value: 'middle', label: 'ミドル', color: 'bg-orange-100 text-orange-700 border-orange-200' },
  { value: 'low', label: 'ロー', color: 'bg-gray-100 text-gray-600 border-gray-200' },
  { value: 'none', label: 'なし', color: 'bg-gray-50 text-gray-400 border-gray-100' },
];

type SortField = 'name' | 'prefecture' | 'created_at';

export default function CompaniesPage() {
  const [data, setData] = useState<PaginatedResponse<Company> | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter options
  const [industries, setIndustries] = useState<Industry[]>([]);
  const [availableTags, setAvailableTags] = useState<ServiceTag[]>([]);

  // Filters
  const [search, setSearch] = useState('');
  const [prefecture, setPrefecture] = useState('');
  const [enrichmentStatus, setEnrichmentStatus] = useState('');
  const [industryId, setIndustryId] = useState('');
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [employeeRange, setEmployeeRange] = useState('');
  const [revenueRange, setRevenueRange] = useState('');
  const [intentLevel, setIntentLevel] = useState('');

  // Pagination
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);

  // Sorting
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Fetch filter options
  useEffect(() => {
    async function fetchOptions() {
      try {
        const [indRes, tagRes] = await Promise.all([
          fetch('/api/industries'),
          fetch('/api/tags'),
        ]);
        const indJson = await indRes.json();
        const tagJson = await tagRes.json();
        if (indJson.success) setIndustries(indJson.data);
        if (tagJson.success) setAvailableTags(tagJson.data);
      } catch {
        // ignore
      }
    }
    fetchOptions();
  }, []);

  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set('page', String(page));
    params.set('per_page', String(perPage));
    params.set('sort_by', sortBy);
    params.set('sort_order', sortOrder);
    if (search) params.set('search', search);
    if (prefecture) params.set('prefecture', prefecture);
    if (enrichmentStatus) params.set('enrichment_status', enrichmentStatus);
    if (industryId) params.set('industry_id', industryId);
    if (selectedTagIds.length > 0) params.set('tag_ids', selectedTagIds.join(','));
    if (employeeRange) params.set('employee_range', employeeRange);
    if (revenueRange) params.set('revenue_range', revenueRange);
    if (intentLevel) params.set('intent_level', intentLevel);

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
  }, [page, perPage, sortBy, sortOrder, search, prefecture, enrichmentStatus, industryId, selectedTagIds, employeeRange, revenueRange, intentLevel]);

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

  const toggleTag = (tagId: string) => {
    setSelectedTagIds((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
    setPage(1);
  };

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setPrefecture('');
    setEnrichmentStatus('');
    setIndustryId('');
    setSelectedTagIds([]);
    setEmployeeRange('');
    setRevenueRange('');
    setIntentLevel('');
    setPage(1);
  };

  const hasFilters = search || prefecture || enrichmentStatus || industryId || selectedTagIds.length > 0 || employeeRange || revenueRange || intentLevel;

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-muted-foreground/50" />;
    return sortOrder === 'asc' ? (
      <ArrowUp className="h-3.5 w-3.5 text-primary" />
    ) : (
      <ArrowDown className="h-3.5 w-3.5 text-primary" />
    );
  };

  const activeFilterCount = [prefecture, enrichmentStatus, industryId, employeeRange, revenueRange, intentLevel].filter(Boolean).length + (selectedTagIds.length > 0 ? 1 : 0);

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

            {/* Filter Row 1 */}
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 text-sm text-muted-foreground mr-1">
                <Filter className="h-3.5 w-3.5" />
                フィルター
                {activeFilterCount > 0 && (
                  <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-[10px]">
                    {activeFilterCount}
                  </Badge>
                )}
              </div>

              <Select value={prefecture} onValueChange={(v) => { setPrefecture(v === '__all__' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="都道府県" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">すべて</SelectItem>
                  {PREFECTURES.map((p) => (
                    <SelectItem key={p} value={p}>{p}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={industryId} onValueChange={(v) => { setIndustryId(v === '__all__' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="業界" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">すべて</SelectItem>
                  {industries.map((ind) => (
                    <SelectItem key={ind.id} value={ind.id}>{ind.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={enrichmentStatus} onValueChange={(v) => { setEnrichmentStatus(v === '__all__' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-[140px]">
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

            {/* Filter Row 2 */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Service Tags - Multi Select */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="h-9 gap-1.5">
                    <Tag className="h-3.5 w-3.5" />
                    サービスタグ
                    {selectedTagIds.length > 0 && (
                      <Badge variant="default" className="h-4 min-w-4 px-1 flex items-center justify-center text-[10px]">
                        {selectedTagIds.length}
                      </Badge>
                    )}
                    <ChevronDown className="h-3.5 w-3.5 opacity-50" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[280px] p-3" align="start">
                  <div className="space-y-1 max-h-[300px] overflow-y-auto">
                    {availableTags.map((tag) => (
                      <label
                        key={tag.id}
                        className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-muted cursor-pointer text-sm"
                      >
                        <Checkbox
                          checked={selectedTagIds.includes(tag.id)}
                          onCheckedChange={() => toggleTag(tag.id)}
                        />
                        {tag.name}
                      </label>
                    ))}
                  </div>
                  {selectedTagIds.length > 0 && (
                    <div className="border-t mt-2 pt-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="w-full h-7 text-xs"
                        onClick={() => { setSelectedTagIds([]); setPage(1); }}
                      >
                        タグをクリア
                      </Button>
                    </div>
                  )}
                </PopoverContent>
              </Popover>

              {/* Employee Count Range */}
              <Select value={employeeRange} onValueChange={(v) => { setEmployeeRange(v === '__all__' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="従業員数" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">すべて</SelectItem>
                  {EMPLOYEE_RANGES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Revenue Range */}
              <Select value={revenueRange} onValueChange={(v) => { setRevenueRange(v === '__all__' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="売上" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">すべて</SelectItem>
                  {REVENUE_RANGES.map((r) => (
                    <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Intent Level */}
              <Select value={intentLevel} onValueChange={(v) => { setIntentLevel(v === '__all__' ? '' : v); setPage(1); }}>
                <SelectTrigger className="w-[160px]">
                  <SelectValue placeholder="インテント" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">すべて</SelectItem>
                  {INTENT_LEVEL_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {/* Selected tag badges */}
              {selectedTagIds.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {selectedTagIds.map((tagId) => {
                    const tag = availableTags.find((t) => t.id === tagId);
                    return tag ? (
                      <Badge
                        key={tagId}
                        variant="secondary"
                        className="cursor-pointer hover:bg-destructive/10 hover:text-destructive transition-colors"
                        onClick={() => toggleTag(tagId)}
                      >
                        {tag.name}
                        <X className="h-3 w-3 ml-1" />
                      </Badge>
                    ) : null;
                  })}
                </div>
              )}
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
                <TableHead className="w-[12%]">インテント</TableHead>
                <TableHead className="w-[12%]">ステータス</TableHead>
                <TableHead className="w-[10%] pr-6 text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                Array.from({ length: perPage > 10 ? 10 : perPage }).map((_, i) => (
                  <TableRow key={i}>
                    <TableCell className="pl-6"><Skeleton className="h-5 w-48" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-16" /></TableCell>
                    <TableCell><Skeleton className="h-5 w-14" /></TableCell>
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
                      <IntentBadge level={company.intent?.intent_level} />
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

function IntentBadge({ level }: { level?: IntentLevel }) {
  if (!level) return <span className="text-xs text-muted-foreground">—</span>;
  const opt = INTENT_LEVEL_OPTIONS.find((o) => o.value === level);
  if (!opt) return <span className="text-xs text-muted-foreground">—</span>;
  return (
    <Badge variant="outline" className={opt.color}>
      {INTENT_LEVEL_LABELS[level]}
    </Badge>
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
