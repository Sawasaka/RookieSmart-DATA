'use client';

import { useState, useRef, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Database,
  Terminal,
  Info,
  X,
} from 'lucide-react';

interface ImportResult {
  total_rows: number;
  inserted: number;
  skipped: number;
  errors?: string[];
}

export default function DataPage() {
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.name.endsWith('.csv')) {
      setError('CSVファイルのみ対応しています');
      return;
    }
    setFile(f);
    setResult(null);
    setError(null);
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleImport = async () => {
    if (!file) return;

    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch('/api/import', {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();

      if (json.success) {
        setResult(json.data);
        setFile(null);
      } else {
        setError(json.error || '取り込みに失敗しました');
      }
    } catch {
      setError('取り込み処理中にエラーが発生しました');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">データ管理</h1>
        <p className="text-muted-foreground mt-1">
          法人番号DBの取り込み・管理
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Upload Section */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Upload className="h-5 w-5" />
                CSVファイル取り込み
              </CardTitle>
              <CardDescription>
                国税庁法人番号公表サイトからダウンロードしたCSVファイルをアップロードして企業データを取り込みます
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Drop Zone */}
              <div
                className={`relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                  dragOver
                    ? 'border-primary bg-primary/5'
                    : 'border-muted-foreground/25 hover:border-primary/50'
                }`}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (f) handleFile(f);
                  }}
                />
                <FileSpreadsheet className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                <p className="font-medium">
                  CSVファイルをドラッグ&ドロップ
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  または、クリックしてファイルを選択
                </p>
              </div>

              {/* Selected File */}
              {file && (
                <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="h-5 w-5 text-primary" />
                    <div>
                      <p className="text-sm font-medium">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024).toFixed(1)} KB
                      </p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => {
                      e.stopPropagation();
                      setFile(null);
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}

              {/* Import Button */}
              <Button
                onClick={handleImport}
                disabled={!file || importing}
                className="w-full"
                size="lg"
              >
                {importing ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    取り込み中...
                  </>
                ) : (
                  <>
                    <Database className="h-4 w-4 mr-2" />
                    取り込み実行
                  </>
                )}
              </Button>

              {/* Result */}
              {result && (
                <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
                  <div className="flex items-center gap-2 mb-3">
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                    <span className="font-medium text-emerald-700 dark:text-emerald-400">
                      取り込み完了
                    </span>
                  </div>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">総行数</p>
                      <p className="text-lg font-semibold">{result.total_rows.toLocaleString()}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">取込成功</p>
                      <p className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
                        {result.inserted.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">スキップ</p>
                      <p className="text-lg font-semibold">{result.skipped.toLocaleString()}</p>
                    </div>
                  </div>
                  {result.errors && result.errors.length > 0 && (
                    <div className="mt-3 text-xs text-amber-600 dark:text-amber-400">
                      {result.errors.map((err, i) => (
                        <p key={i}>{err}</p>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Error */}
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                    <span className="text-red-700 dark:text-red-400">{error}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Guide Sidebar */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Info className="h-4 w-4" />
                取り込みガイド
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="space-y-2">
                <p className="font-medium">1. CSVファイルの取得</p>
                <p className="text-muted-foreground">
                  <a
                    href="https://www.houjin-bangou.nta.go.jp/download/"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    国税庁法人番号公表サイト
                  </a>
                  から対象のCSVをダウンロードしてください。
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="font-medium">2. ファイルのアップロード</p>
                <p className="text-muted-foreground">
                  ダウンロードしたCSVファイルを左のエリアにドラッグ&ドロップするか、クリックして選択してください。
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="font-medium">3. 取り込み実行</p>
                <p className="text-muted-foreground">
                  「取り込み実行」ボタンをクリックすると、CSVのデータがデータベースに登録されます。
                </p>
              </div>
              <Separator />
              <div className="space-y-2">
                <p className="font-medium flex items-center gap-1.5">
                  対応カラム
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {['法人番号', '商号又は名称', 'フリガナ', '都道府県', '市区町村', '丁目番地等'].map(
                    (col) => (
                      <Badge key={col} variant="secondary" className="text-xs">
                        {col}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Terminal className="h-4 w-4" />
                CLIからの取り込み
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-3">
              <p className="text-muted-foreground">
                大量のデータを取り込む場合は、CLIスクリプトを使用できます。
              </p>
              <div className="bg-muted p-3 rounded-md font-mono text-xs">
                <p className="text-muted-foreground"># CSVファイルを data/houjin/ に配置</p>
                <p className="mt-1">npx tsx scripts/import-houjin.ts data/houjin/tokyo.csv</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
