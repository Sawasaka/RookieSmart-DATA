# RookieSmart DATA - Claude Code ルール

このファイルはClaude Codeが自動的に読み込むプロジェクトルールです。
必ず従ってください。

## プロジェクト概要
ABMツール「RookieSmart DATA」。企業データベース＋インテントデータで営業ターゲティングを支援。

## 絶対に守るべきルール

### インテントデータの取得方法
**インテントデータの取得には Serper API を絶対に使わないでください。**

- インテント取得 → 求人サイト直接クロール（Playwright）のみ。API費用ゼロ。
- `scripts/fetch-intents.ts` は非推奨（Serper版）。使用禁止。
- `scripts/crawl-intents.ts` を使用すること。

### エンリッチメントの方法
- エンリッチメント → Serper API + Jina Reader + Claude API (Haiku 3.5)
- Serper APIはエンリッチメント専用。インテントには使わない。

### オンデマンドエンリッチメント
- 未エンリッチ企業（enrichment_status="pending"）は、企業詳細ページ閲覧時に自動でエンリッチメントを実行する。

## 技術スタック
- Frontend: Next.js (App Router) + React + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Supabase (PostgreSQL)
- エンリッチメント: Serper API + Jina Reader + Claude API (Haiku 3.5)
- インテント: Playwright による求人サイト直接クロール
- デザイン: 白背景 × オレンジアクセント（#F97316）、ダークモードなし

## DBスキーマ
- companies: 企業基本情報 + エンリッチメントデータ
- industries: 業種マスタ（25件）
- service_tags: サービスタグマスタ
- company_tags: 企業×タグ中間テーブル
- offices: 拠点情報（本社・支社・工場等）
- departments: 部門情報（営業・IT・人事等、ツリー構造対応）
- intent_signals: 個別求人シグナル
- company_intents: 企業×部門ごとのインテント集約

## インテントレベル基準
- hot: 今日〜1週間以内の求人
- middle: 1週間〜1ヶ月以内
- low: 1ヶ月〜3ヶ月以内
- none: 3ヶ月以上 or 求人なし

## 対象部門（段階的に拡大）
1. 情報システム部門（最初）
2. 人事部門
3. 営業部門
4. マーケティング部門

## Supabase接続情報
- Project Ref: lijvouffgfbmdvfvqywt
- 環境変数は .env.local に設定済み

## コーディングルール
- 対象は株式会社のみ（法人種別の表示・フィルターは不要）
- UIは日本語
- API費用を最小限に（Claude Haiku 3.5使用）
- スクリプトは再実行可能に（未処理分のみ対象）
- .env.local にAPIキーを保存（Gitにコミットしない）

## スクリプト一覧
| スクリプト | 用途 | 状態 |
|---|---|---|
| scripts/crawl-intents.ts | インテント取得（クロール版） | 使用推奨 |
| scripts/enrich-companies.ts | 企業エンリッチメント | 使用推奨 |
| scripts/assign-tags.ts | サービスタグ自動付与 | 使用推奨 |
| scripts/enrich-offices.ts | 拠点データ取得 | 使用推奨 |
| scripts/fetch-intents.ts | インテント取得（Serper版） | **非推奨・使用禁止** |

## 開発ロードマップ
詳細は ROADMAP.md を参照。
