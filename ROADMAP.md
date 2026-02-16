# RookieSmart DATA - 開発ロードマップ

## サービス概要
ABM（Account-Based Marketing）ツール。企業データベースを構築し、インテントデータ（求人情報ベース）で営業ターゲティングを支援する。

## 技術スタック
- Frontend: Next.js (App Router) + React + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Supabase (PostgreSQL)
- Enrichment: Serper API + Jina Reader + Claude API (Haiku 3.5)
- Intent: 求人サイト直接クロール（Playwright）※ API費用ゼロ
- Design: 白背景 × オレンジアクセント（ダークモードなし）

## 重要方針
- **エンリッチメント**: Serper API を使用（$50/月 Developer プラン）
- **インテント**: 求人サイト直接クロールのみ（Serper不使用、費用ゼロ）
- **オンデマンドエンリッチ**: 未エンリッチ企業は詳細ページ閲覧時に自動実行

---

## 現在の状態（2026/02/15 時点）

| 項目 | 数値 |
|---|---|
| 総企業数 | 3,794社（プライム1,622 + スタンダード1,564 + グロース608） |
| エンリッチメント完了 | 298社（残り3,496社） |
| インテントデータ | 918社（Serper経由、今後はクロールに切替） |
| サービスタグ | 199社に1,220タグ |
| 拠点データ | 260社、1,583拠点 |
| 最新コミット | 746f64f |

---

## Phase 1: 全上場企業エンリッチメント完了（今月）
**状態: 進行中 - Serper $50プランアップグレード後に再開**

### 完了済み
- [x] UI構築（ダッシュボード、企業一覧、企業詳細、フィルター）
- [x] Supabaseスキーマ（companies, industries, service_tags, company_tags, offices, departments, intent_signals, company_intents）
- [x] テスト企業100社投入＋エンリッチメント完了
- [x] サービスタグ自動付与（199社、1,220タグ）
- [x] 拠点データエンリッチメント（260社、1,583拠点）
- [x] プライム上場企業1,522社追加
- [x] スタンダード上場企業1,564社追加
- [x] グロース上場企業608社追加
- [x] 企業一覧フィルター（業界、従業員数、売上、サービスタグ、インテントレベル）
- [x] 白背景×オレンジアクセントデザイン
- [x] ダークモード削除
- [x] サイドバーからデータ管理（CSV）削除
- [x] Git push完了

### 残タスク（Serper $50プランアップグレード後）
- [ ] 残り3,496社のエンリッチメント
- [ ] エンリッチメント完了企業のサービスタグ付与
- [ ] エンリッチメント完了企業の拠点データ取得

### 実行コマンド
```bash
npx tsx scripts/reset-failed-enrichments.ts
npx tsx scripts/enrich-companies.ts
npx tsx scripts/assign-tags.ts
npx tsx scripts/enrich-offices.ts
```

### コスト
- Serper API: $50/月（Developer プラン、50,000回）※エンリッチメントのみに使用
- Claude API (Haiku): 約$5〜10

---

## Phase 1.5: 求人サイト直接クロールでインテント取得（Phase 1と並行）
**状態: 未着手 - 最優先で実装**

### 概要
- Serper APIは使わない。求人サイトを直接クロールして費用ゼロでインテント取得
- Playwright（ヘッドレスブラウザ）で求人サイトをクロール
- 1日1回のバッチ処理で全企業のインテントを更新

### クロール対象サイト
- Indeed Japan（https://jp.indeed.com）
- リクナビNEXT
- マイナビ転職
- doda

### クロール方法
1. 各求人サイトの検索機能を使い「情報システム」「社内SE」等で検索
2. 検索結果一覧から企業名・求人タイトル・掲載日を抽出
3. 企業名でcompaniesテーブルとマッチング
4. intent_signalsテーブルに登録
5. company_intentsテーブルを更新（UPSERT）

### インテントレベル基準
- hot: 今日〜1週間以内の求人
- middle: 1週間〜1ヶ月以内
- low: 1ヶ月〜3ヶ月以内
- none: 3ヶ月以上 or 求人なし

### 対象部門（段階的に拡大）
1. 情報システム部門（最初に実装）
2. 人事部門
3. 営業部門
4. マーケティング部門

### コスト: 0円（ローカル実行）/ VPS $10〜20/月（自動化時）

---

## Phase 2: 国税庁CSVから180万社の基本データ一括投入
**状態: 未着手**

### 概要
- 国税庁の法人番号CSV（無料ダウンロード）から株式会社180万社を一括投入
- 取得データ: 法人番号、社名、住所、法人種別
- Serper不要、数時間で完了
- enrichment_status: "pending" で投入

### データソース
- 国税庁法人番号公表サイト: https://www.houjin-bangou.nta.go.jp/download/
- CSV形式でダウンロード可能（都道府県別 or 全件一括）

### コスト: 0円

---

## Phase 3: 大企業エンリッチメント（来月〜3ヶ月目）
**状態: 未着手**

### 概要
- 上場企業以外の大企業（従業員300名以上）約12,000社をエンリッチ
- Serper Developer/Production プランで対応

### コスト: Serper $50〜130/月 + Claude API $10〜20

---

## Phase 5: オンデマンドエンリッチメント（随時）
**状態: 未着手**

### 概要
- 残り170万社の小規模企業はオンデマンドでエンリッチ
- ユーザーが企業詳細ページを開いた時に自動エンリッチメントを実行
- バックグラウンドでSerper + Jina + Claude APIを呼び出し
- 結果をDBに保存して次回以降はキャッシュ表示

### 実装方針
- 企業詳細ページの読み込み時に enrichment_status をチェック
- "pending" の場合、APIルート経由でエンリッチメントを非同期実行
- UI上は「データ取得中...」のスケルトン表示
- 完了後にリアルタイムで更新表示

### コスト: 従量課金（Serper + Claude API、1社あたり約$0.01）

---

## コスト概算まとめ

| Phase | 内容 | 期間 | コスト |
|---|---|---|---|
| 1 | 全上場企業3,800社エンリッチ | 今月 | Serper $50 + Claude $10 |
| 1.5 | インテント（求人クロール） | 今月〜 | 0円（ローカル）|
| 2 | 180万社基本データ投入 | 今月 | 0円 |
| 3 | 大企業12,000社エンリッチ | 1〜3ヶ月 | Serper $50〜130/月 |
| 5 | オンデマンドエンリッチ | 随時 | 従量 $0.01/社 |
| **月額ランニングコスト（定常時）** | | | **約$10〜20/月（VPSのみ）** |

---

## API キー管理
- Supabase: .env.local に保存
- Serper API: .env.local に保存（エンリッチメント専用）
- Anthropic API: .env.local に保存
- 本番環境ではVercel等の環境変数で管理

---

## 既存スクリプト一覧
| スクリプト | 用途 |
|---|---|
| scripts/enrich-companies.ts | 企業エンリッチメント（Serper + Jina + Claude） |
| scripts/assign-tags.ts | サービスタグ自動付与（Claude API） |
| scripts/enrich-offices.ts | 拠点データ取得（Serper + Jina + Claude） |
| scripts/fetch-intents.ts | インテント取得（Serper経由 → 今後クロールに置換） |
| scripts/import-prime-companies.ts | プライム上場企業インポート |
| scripts/import-standard-growth-companies.ts | スタンダード・グロース企業インポート |
| scripts/fix-errored-intents.ts | エラーインテント修正 |
| scripts/reset-failed-enrichments.ts | 失敗エンリッチメントリセット |
| scripts/check-intent-stats.ts | インテント統計確認 |
