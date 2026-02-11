// Prefecture list (Japan)
export const PREFECTURES = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県',
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県',
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県',
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
] as const;

// Corporate types
export const CORPORATE_TYPES = [
  '株式会社',
  '有限会社',
  '合同会社',
  '合資会社',
  '合名会社',
  '一般社団法人',
  '一般財団法人',
  '公益社団法人',
  '公益財団法人',
  'NPO法人',
  'その他'
] as const;

// Industry categories
export const INDUSTRY_CATEGORIES = [
  'IT・通信',
  'コンサルティング',
  '製造',
  '小売・卸売',
  '金融・保険',
  '不動産',
  '建設',
  '運輸・物流',
  '医療・福祉',
  '教育',
  '飲食・サービス',
  'メディア・広告',
  'その他'
] as const;

// Service tags (for ABM targeting)
export const SERVICE_TAGS = [
  'IT',
  'SaaS',
  'DX支援',
  '経営コンサル',
  '営業コンサル',
  '営業代行',
  'マーケティング',
  'ウェビナー',
  '人材紹介',
  '研修・教育',
  'システム開発',
  'Web制作',
  'EC支援',
  'データ分析',
  'AI・機械学習'
] as const;

// Enrichment status labels
export const ENRICHMENT_STATUS_LABELS = {
  pending: '未取得',
  in_progress: '取得中',
  completed: '取得済',
  failed: '取得失敗'
} as const;

// Pagination defaults
export const DEFAULT_PAGE_SIZE = 20;
export const PAGE_SIZE_OPTIONS = [10, 20, 50, 100];

// App metadata
export const APP_NAME = 'RookieSmart DATA';
export const APP_DESCRIPTION = 'Account-Based Marketing企業データベースツール';
