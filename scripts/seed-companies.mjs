// Seed script: Insert 100 enterprise Japanese companies into Supabase
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envContent = readFileSync(resolve(__dirname, '../.env.local'), 'utf-8');
const env = {};
for (const line of envContent.split('\n')) {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) env[match[1].trim()] = match[2].trim();
}

const supabase = createClient(
  env.NEXT_PUBLIC_SUPABASE_URL,
  env.SUPABASE_SERVICE_ROLE_KEY
);

const companies = [
  { corporate_number: "1010401089234", name: "トヨタ自動車株式会社", name_kana: "トヨタジドウシャ", prefecture: "愛知県", city: "豊田市", address: "トヨタ町1番地", corporate_type: "株式会社" },
  { corporate_number: "7010401067162", name: "ソニーグループ株式会社", name_kana: "ソニーグループ", prefecture: "東京都", city: "港区", address: "港南一丁目7番1号", corporate_type: "株式会社" },
  { corporate_number: "7010001008844", name: "株式会社日立製作所", name_kana: "ヒタチセイサクショ", prefecture: "東京都", city: "千代田区", address: "丸の内一丁目6番6号", corporate_type: "株式会社" },
  { corporate_number: "8010001088837", name: "日本電信電話株式会社", name_kana: "ニッポンデンシンデンワ", prefecture: "東京都", city: "千代田区", address: "大手町一丁目5番1号", corporate_type: "株式会社" },
  { corporate_number: "9010001148793", name: "ソフトバンクグループ株式会社", name_kana: "ソフトバンクグループ", prefecture: "東京都", city: "港区", address: "海岸一丁目7番1号", corporate_type: "株式会社" },
  { corporate_number: "5010001008865", name: "三菱商事株式会社", name_kana: "ミツビシショウジ", prefecture: "東京都", city: "千代田区", address: "丸の内二丁目3番1号", corporate_type: "株式会社" },
  { corporate_number: "7130001013780", name: "任天堂株式会社", name_kana: "ニンテンドウ", prefecture: "京都府", city: "京都市南区", address: "上鳥羽鉾立町11番地1", corporate_type: "株式会社" },
  { corporate_number: "3122001005765", name: "株式会社キーエンス", name_kana: "キーエンス", prefecture: "大阪府", city: "大阪市東淀川区", address: "東中島一丁目3番14号", corporate_type: "株式会社" },
  { corporate_number: "2010001008722", name: "本田技研工業株式会社", name_kana: "ホンダギケンコウギョウ", prefecture: "東京都", city: "港区", address: "南青山二丁目1番1号", corporate_type: "株式会社" },
  { corporate_number: "6010401070654", name: "三菱UFJフィナンシャル・グループ株式会社", name_kana: "ミツビシユーエフジェイフィナンシャルグループ", prefecture: "東京都", city: "千代田区", address: "丸の内二丁目7番1号", corporate_type: "株式会社" },
  { corporate_number: "4010001008731", name: "日産自動車株式会社", name_kana: "ニッサンジドウシャ", prefecture: "神奈川県", city: "横浜市神奈川区", address: "宝町2番地", corporate_type: "株式会社" },
  { corporate_number: "2010001008854", name: "株式会社三菱UFJ銀行", name_kana: "ミツビシユーエフジェイギンコウ", prefecture: "東京都", city: "千代田区", address: "丸の内二丁目7番1号", corporate_type: "株式会社" },
  { corporate_number: "1010001008766", name: "パナソニックホールディングス株式会社", name_kana: "パナソニックホールディングス", prefecture: "大阪府", city: "門真市", address: "大字門真1006番地", corporate_type: "株式会社" },
  { corporate_number: "3010001008829", name: "株式会社東芝", name_kana: "トウシバ", prefecture: "東京都", city: "港区", address: "芝浦一丁目1番1号", corporate_type: "株式会社" },
  { corporate_number: "4010001008838", name: "富士通株式会社", name_kana: "フジツウ", prefecture: "東京都", city: "港区", address: "東新橋一丁目5番2号", corporate_type: "株式会社" },
  { corporate_number: "5010001008757", name: "株式会社NTTドコモ", name_kana: "エヌティティドコモ", prefecture: "東京都", city: "千代田区", address: "永田町二丁目11番1号", corporate_type: "株式会社" },
  { corporate_number: "6010001008756", name: "KDDI株式会社", name_kana: "ケーディーディーアイ", prefecture: "東京都", city: "千代田区", address: "飯田橋三丁目10番10号", corporate_type: "株式会社" },
  { corporate_number: "2010001008946", name: "株式会社リクルートホールディングス", name_kana: "リクルートホールディングス", prefecture: "東京都", city: "千代田区", address: "丸の内一丁目9番2号", corporate_type: "株式会社" },
  { corporate_number: "1010001008959", name: "三井物産株式会社", name_kana: "ミツイブッサン", prefecture: "東京都", city: "千代田区", address: "大手町一丁目2番1号", corporate_type: "株式会社" },
  { corporate_number: "5010001008849", name: "伊藤忠商事株式会社", name_kana: "イトウチュウショウジ", prefecture: "大阪府", city: "北区", address: "梅田三丁目1番3号", corporate_type: "株式会社" },
  { corporate_number: "8010001008836", name: "住友商事株式会社", name_kana: "スミトモショウジ", prefecture: "東京都", city: "千代田区", address: "大手町二丁目3番2号", corporate_type: "株式会社" },
  { corporate_number: "3010001008937", name: "丸紅株式会社", name_kana: "マルベニ", prefecture: "東京都", city: "千代田区", address: "大手町一丁目4番2号", corporate_type: "株式会社" },
  { corporate_number: "7010001008752", name: "株式会社デンソー", name_kana: "デンソー", prefecture: "愛知県", city: "刈谷市", address: "昭和町一丁目1番地", corporate_type: "株式会社" },
  { corporate_number: "1010001008867", name: "東京エレクトロン株式会社", name_kana: "トウキョウエレクトロン", prefecture: "東京都", city: "港区", address: "赤坂五丁目3番1号", corporate_type: "株式会社" },
  { corporate_number: "9010001008745", name: "信越化学工業株式会社", name_kana: "シンエツカガクコウギョウ", prefecture: "東京都", city: "千代田区", address: "大手町二丁目6番1号", corporate_type: "株式会社" },
  { corporate_number: "6010001008848", name: "ダイキン工業株式会社", name_kana: "ダイキンコウギョウ", prefecture: "大阪府", city: "大阪市北区", address: "中崎西二丁目4番12号", corporate_type: "株式会社" },
  { corporate_number: "8010001008952", name: "株式会社村田製作所", name_kana: "ムラタセイサクショ", prefecture: "京都府", city: "長岡京市", address: "東神足一丁目10番1号", corporate_type: "株式会社" },
  { corporate_number: "6010001016912", name: "三井住友フィナンシャルグループ株式会社", name_kana: "ミツイスミトモフィナンシャルグループ", prefecture: "東京都", city: "千代田区", address: "丸の内一丁目1番2号", corporate_type: "株式会社" },
  { corporate_number: "7010001008860", name: "みずほフィナンシャルグループ株式会社", name_kana: "ミズホフィナンシャルグループ", prefecture: "東京都", city: "千代田区", address: "大手町一丁目5番5号", corporate_type: "株式会社" },
  { corporate_number: "5010001008941", name: "野村ホールディングス株式会社", name_kana: "ノムラホールディングス", prefecture: "東京都", city: "中央区", address: "日本橋一丁目13番1号", corporate_type: "株式会社" },
  { corporate_number: "2010001008838", name: "日本電産株式会社", name_kana: "ニッポンデンサン", prefecture: "京都府", city: "京都市南区", address: "久世殿城町338番地", corporate_type: "株式会社" },
  { corporate_number: "4010001008936", name: "ファナック株式会社", name_kana: "ファナック", prefecture: "山梨県", city: "忍野村", address: "忍野3580番地", corporate_type: "株式会社" },
  { corporate_number: "6010001008940", name: "テルモ株式会社", name_kana: "テルモ", prefecture: "東京都", city: "渋谷区", address: "幡ヶ谷二丁目44番1号", corporate_type: "株式会社" },
  { corporate_number: "5010001081418", name: "株式会社SUBARU", name_kana: "スバル", prefecture: "東京都", city: "渋谷区", address: "恵比寿一丁目20番8号", corporate_type: "株式会社" },
  { corporate_number: "1010001008975", name: "旭化成株式会社", name_kana: "アサヒカセイ", prefecture: "東京都", city: "千代田区", address: "有楽町一丁目1番2号", corporate_type: "株式会社" },
  { corporate_number: "3010001008753", name: "花王株式会社", name_kana: "カオウ", prefecture: "東京都", city: "中央区", address: "日本橋茅場町一丁目14番10号", corporate_type: "株式会社" },
  { corporate_number: "2010001008762", name: "富士フイルムホールディングス株式会社", name_kana: "フジフイルムホールディングス", prefecture: "東京都", city: "港区", address: "赤坂九丁目7番3号", corporate_type: "株式会社" },
  { corporate_number: "5010001008733", name: "味の素株式会社", name_kana: "アジノモト", prefecture: "東京都", city: "中央区", address: "京橋一丁目15番1号", corporate_type: "株式会社" },
  { corporate_number: "9010001008853", name: "アステラス製薬株式会社", name_kana: "アステラスセイヤク", prefecture: "東京都", city: "中央区", address: "日本橋本町二丁目5番1号", corporate_type: "株式会社" },
  { corporate_number: "7010001008968", name: "第一三共株式会社", name_kana: "ダイイチサンキョウ", prefecture: "東京都", city: "中央区", address: "日本橋本町三丁目5番1号", corporate_type: "株式会社" },
  { corporate_number: "1010001008883", name: "エーザイ株式会社", name_kana: "エーザイ", prefecture: "東京都", city: "文京区", address: "小石川四丁目6番10号", corporate_type: "株式会社" },
  { corporate_number: "4010001008746", name: "中外製薬株式会社", name_kana: "チュウガイセイヤク", prefecture: "東京都", city: "北区", address: "中十条二丁目5番1号", corporate_type: "株式会社" },
  { corporate_number: "6010001008744", name: "武田薬品工業株式会社", name_kana: "タケダヤクヒンコウギョウ", prefecture: "大阪府", city: "大阪市中央区", address: "道修町四丁目1番1号", corporate_type: "株式会社" },
  { corporate_number: "8010001008742", name: "大塚ホールディングス株式会社", name_kana: "オオツカホールディングス", prefecture: "東京都", city: "千代田区", address: "神田司町二丁目9番地", corporate_type: "株式会社" },
  { corporate_number: "3010001008945", name: "オリンパス株式会社", name_kana: "オリンパス", prefecture: "東京都", city: "新宿区", address: "西新宿二丁目3番1号", corporate_type: "株式会社" },
  { corporate_number: "5010001008943", name: "小松製作所株式会社", name_kana: "コマツセイサクショ", prefecture: "東京都", city: "港区", address: "赤坂二丁目3番6号", corporate_type: "株式会社" },
  { corporate_number: "9010001008949", name: "三菱電機株式会社", name_kana: "ミツビシデンキ", prefecture: "東京都", city: "千代田区", address: "丸の内二丁目7番3号", corporate_type: "株式会社" },
  { corporate_number: "1010001008777", name: "オムロン株式会社", name_kana: "オムロン", prefecture: "京都府", city: "京都市下京区", address: "塩小路通堀川東入南不動堂町801番地", corporate_type: "株式会社" },
  { corporate_number: "2010001008776", name: "京セラ株式会社", name_kana: "キョウセラ", prefecture: "京都府", city: "京都市伏見区", address: "竹田鳥羽殿町6番地", corporate_type: "株式会社" },
  { corporate_number: "4010001008774", name: "ブリヂストン株式会社", name_kana: "ブリヂストン", prefecture: "東京都", city: "中央区", address: "京橋三丁目1番1号", corporate_type: "株式会社" },
  { corporate_number: "3010001008883", name: "AGC株式会社", name_kana: "エージーシー", prefecture: "東京都", city: "千代田区", address: "丸の内一丁目5番1号", corporate_type: "株式会社" },
  { corporate_number: "6010001008872", name: "日本製鉄株式会社", name_kana: "ニッポンセイテツ", prefecture: "東京都", city: "千代田区", address: "丸の内二丁目6番1号", corporate_type: "株式会社" },
  { corporate_number: "8010001008870", name: "JFEホールディングス株式会社", name_kana: "ジェイエフイーホールディングス", prefecture: "東京都", city: "千代田区", address: "内幸町二丁目2番3号", corporate_type: "株式会社" },
  { corporate_number: "1010001008991", name: "三菱重工業株式会社", name_kana: "ミツビシジュウコウギョウ", prefecture: "東京都", city: "千代田区", address: "丸の内三丁目2番3号", corporate_type: "株式会社" },
  { corporate_number: "7010001008996", name: "川崎重工業株式会社", name_kana: "カワサキジュウコウギョウ", prefecture: "兵庫県", city: "神戸市中央区", address: "東川崎町一丁目1番3号", corporate_type: "株式会社" },
  { corporate_number: "5010001008998", name: "IHI株式会社", name_kana: "アイエイチアイ", prefecture: "東京都", city: "江東区", address: "豊洲三丁目1番1号", corporate_type: "株式会社" },
  { corporate_number: "2010001009001", name: "スズキ株式会社", name_kana: "スズキ", prefecture: "静岡県", city: "浜松市中央区", address: "高塚町300番地", corporate_type: "株式会社" },
  { corporate_number: "4010001008999", name: "マツダ株式会社", name_kana: "マツダ", prefecture: "広島県", city: "安芸郡府中町", address: "新地3番1号", corporate_type: "株式会社" },
  { corporate_number: "6010001008997", name: "ヤマハ発動機株式会社", name_kana: "ヤマハハツドウキ", prefecture: "静岡県", city: "磐田市", address: "新貝2500番地", corporate_type: "株式会社" },
  { corporate_number: "3010001009000", name: "株式会社クボタ", name_kana: "クボタ", prefecture: "大阪府", city: "大阪市浪速区", address: "敷津東一丁目2番47号", corporate_type: "株式会社" },
  { corporate_number: "9010001008993", name: "コニカミノルタ株式会社", name_kana: "コニカミノルタ", prefecture: "東京都", city: "千代田区", address: "丸の内二丁目7番2号", corporate_type: "株式会社" },
  { corporate_number: "1010001009007", name: "セイコーエプソン株式会社", name_kana: "セイコーエプソン", prefecture: "長野県", city: "諏訪市", address: "大和三丁目3番5号", corporate_type: "株式会社" },
  { corporate_number: "8010001009002", name: "NEC株式会社", name_kana: "エヌイーシー", prefecture: "東京都", city: "港区", address: "芝五丁目7番1号", corporate_type: "株式会社" },
  { corporate_number: "5010001009005", name: "シャープ株式会社", name_kana: "シャープ", prefecture: "大阪府", city: "堺市堺区", address: "匠町1番地", corporate_type: "株式会社" },
  { corporate_number: "7010001009003", name: "TDK株式会社", name_kana: "ティーディーケー", prefecture: "東京都", city: "中央区", address: "日本橋二丁目5番1号", corporate_type: "株式会社" },
  { corporate_number: "6010001009004", name: "日東電工株式会社", name_kana: "ニットウデンコウ", prefecture: "大阪府", city: "大阪市北区", address: "堂島浜一丁目4番4号", corporate_type: "株式会社" },
  { corporate_number: "4010001009006", name: "日本ガイシ株式会社", name_kana: "ニホンガイシ", prefecture: "愛知県", city: "名古屋市瑞穂区", address: "須田町2番56号", corporate_type: "株式会社" },
  { corporate_number: "2010001009008", name: "日本特殊陶業株式会社", name_kana: "ニッポントクシュトウギョウ", prefecture: "愛知県", city: "名古屋市瑞穂区", address: "高辻町14番18号", corporate_type: "株式会社" },
  { corporate_number: "9010001009009", name: "SMC株式会社", name_kana: "エスエムシー", prefecture: "東京都", city: "千代田区", address: "外神田四丁目14番1号", corporate_type: "株式会社" },
  { corporate_number: "1010001009015", name: "HOYA株式会社", name_kana: "ホーヤ", prefecture: "東京都", city: "新宿区", address: "西新宿六丁目10番1号", corporate_type: "株式会社" },
  { corporate_number: "8010001009010", name: "浜松ホトニクス株式会社", name_kana: "ハママツホトニクス", prefecture: "静岡県", city: "浜松市中央区", address: "砂山町325番地6", corporate_type: "株式会社" },
  { corporate_number: "7010001009011", name: "株式会社島津製作所", name_kana: "シマヅセイサクショ", prefecture: "京都府", city: "京都市中京区", address: "西ノ京桑原町1番地", corporate_type: "株式会社" },
  { corporate_number: "6010001009012", name: "ローム株式会社", name_kana: "ローム", prefecture: "京都府", city: "京都市右京区", address: "西院溝崎町21番地", corporate_type: "株式会社" },
  { corporate_number: "5010001009013", name: "日本電気硝子株式会社", name_kana: "ニッポンデンキガラス", prefecture: "滋賀県", city: "大津市", address: "晴嵐二丁目7番1号", corporate_type: "株式会社" },
  { corporate_number: "4010001009014", name: "住友電気工業株式会社", name_kana: "スミトモデンキコウギョウ", prefecture: "大阪府", city: "大阪市中央区", address: "北浜四丁目5番33号", corporate_type: "株式会社" },
  { corporate_number: "3010001009015", name: "古河電気工業株式会社", name_kana: "フルカワデンキコウギョウ", prefecture: "東京都", city: "千代田区", address: "丸の内二丁目2番3号", corporate_type: "株式会社" },
  { corporate_number: "2010001009016", name: "住友化学株式会社", name_kana: "スミトモカガク", prefecture: "東京都", city: "中央区", address: "日本橋二丁目7番1号", corporate_type: "株式会社" },
  { corporate_number: "1010001009017", name: "三井化学株式会社", name_kana: "ミツイカガク", prefecture: "東京都", city: "港区", address: "東新橋一丁目5番2号", corporate_type: "株式会社" },
  { corporate_number: "9010001009017", name: "東レ株式会社", name_kana: "トウレ", prefecture: "東京都", city: "中央区", address: "日本橋室町二丁目1番1号", corporate_type: "株式会社" },
  { corporate_number: "8010001009018", name: "帝人株式会社", name_kana: "テイジン", prefecture: "大阪府", city: "大阪市北区", address: "中之島三丁目2番4号", corporate_type: "株式会社" },
  { corporate_number: "7010001009019", name: "三菱ケミカルグループ株式会社", name_kana: "ミツビシケミカルグループ", prefecture: "東京都", city: "千代田区", address: "丸の内一丁目1番1号", corporate_type: "株式会社" },
  { corporate_number: "6010001009020", name: "株式会社ダイセル", name_kana: "ダイセル", prefecture: "大阪府", city: "大阪市北区", address: "大深町三丁目1号", corporate_type: "株式会社" },
  { corporate_number: "5010001009021", name: "日揮ホールディングス株式会社", name_kana: "ニッキホールディングス", prefecture: "神奈川県", city: "横浜市西区", address: "みなとみらい二丁目3番1号", corporate_type: "株式会社" },
  { corporate_number: "4010001009022", name: "大林組株式会社", name_kana: "オオバヤシグミ", prefecture: "東京都", city: "港区", address: "港南二丁目15番2号", corporate_type: "株式会社" },
  { corporate_number: "3010001009023", name: "鹿島建設株式会社", name_kana: "カジマケンセツ", prefecture: "東京都", city: "港区", address: "赤坂六丁目5番11号", corporate_type: "株式会社" },
  { corporate_number: "2010001009024", name: "清水建設株式会社", name_kana: "シミズケンセツ", prefecture: "東京都", city: "中央区", address: "京橋二丁目16番1号", corporate_type: "株式会社" },
  { corporate_number: "1010001009025", name: "大成建設株式会社", name_kana: "タイセイケンセツ", prefecture: "東京都", city: "新宿区", address: "西新宿一丁目25番1号", corporate_type: "株式会社" },
  { corporate_number: "9010001009025", name: "株式会社竹中工務店", name_kana: "タケナカコウムテン", prefecture: "大阪府", city: "大阪市中央区", address: "本町四丁目1番13号", corporate_type: "株式会社" },
  { corporate_number: "8010001009026", name: "東京海上ホールディングス株式会社", name_kana: "トウキョウカイジョウホールディングス", prefecture: "東京都", city: "千代田区", address: "丸の内一丁目2番1号", corporate_type: "株式会社" },
  { corporate_number: "7010001009027", name: "MS&ADインシュアランスグループホールディングス株式会社", name_kana: "エムエスアンドエーディーインシュアランスグループホールディングス", prefecture: "東京都", city: "中央区", address: "八重洲一丁目3番7号", corporate_type: "株式会社" },
  { corporate_number: "6010001009028", name: "SOMPOホールディングス株式会社", name_kana: "ソンポホールディングス", prefecture: "東京都", city: "新宿区", address: "西新宿一丁目26番1号", corporate_type: "株式会社" },
  { corporate_number: "5010001009029", name: "第一生命ホールディングス株式会社", name_kana: "ダイイチセイメイホールディングス", prefecture: "東京都", city: "千代田区", address: "有楽町一丁目13番1号", corporate_type: "株式会社" },
  { corporate_number: "4010001009030", name: "日本郵政株式会社", name_kana: "ニッポンユウセイ", prefecture: "東京都", city: "千代田区", address: "大手町二丁目3番1号", corporate_type: "株式会社" },
  { corporate_number: "3010001009031", name: "JR東日本（東日本旅客鉄道株式会社）", name_kana: "ヒガシニホンリョカクテツドウ", prefecture: "東京都", city: "渋谷区", address: "代々木二丁目2番2号", corporate_type: "株式会社" },
  { corporate_number: "2010001009032", name: "JR東海（東海旅客鉄道株式会社）", name_kana: "トウカイリョカクテツドウ", prefecture: "愛知県", city: "名古屋市中村区", address: "名駅一丁目1番4号", corporate_type: "株式会社" },
  { corporate_number: "1010001009033", name: "JR西日本（西日本旅客鉄道株式会社）", name_kana: "ニシニホンリョカクテツドウ", prefecture: "大阪府", city: "大阪市北区", address: "芝田二丁目4番24号", corporate_type: "株式会社" },
  { corporate_number: "9010001009033", name: "東京電力ホールディングス株式会社", name_kana: "トウキョウデンリョクホールディングス", prefecture: "東京都", city: "千代田区", address: "内幸町一丁目1番3号", corporate_type: "株式会社" },
  { corporate_number: "8010001009034", name: "関西電力株式会社", name_kana: "カンサイデンリョク", prefecture: "大阪府", city: "大阪市北区", address: "中之島三丁目6番16号", corporate_type: "株式会社" },
  { corporate_number: "7010001009035", name: "中部電力株式会社", name_kana: "チュウブデンリョク", prefecture: "愛知県", city: "名古屋市東区", address: "東新町1番地", corporate_type: "株式会社" },
  { corporate_number: "6010001009036", name: "東京ガス株式会社", name_kana: "トウキョウガス", prefecture: "東京都", city: "港区", address: "海岸一丁目5番20号", corporate_type: "株式会社" },
];

const BATCH_SIZE = 20;

async function seed() {
  console.log(`Inserting ${companies.length} companies in batches of ${BATCH_SIZE}...`);

  let inserted = 0;
  for (let i = 0; i < companies.length; i += BATCH_SIZE) {
    const batch = companies.slice(i, i + BATCH_SIZE).map(c => ({
      ...c,
      enrichment_status: 'pending',
    }));

    const { data, error } = await supabase
      .from('companies')
      .insert(batch)
      .select('id');

    if (error) {
      console.error(`Batch ${Math.floor(i / BATCH_SIZE) + 1} error:`, error.message);
      // Continue with next batch
    } else {
      inserted += data.length;
      console.log(`Batch ${Math.floor(i / BATCH_SIZE) + 1}: inserted ${data.length} rows (total: ${inserted})`);
    }
  }

  // Verify count
  const { data: countData, error: countError } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('Count error:', countError.message);
  } else {
    console.log(`\nVerification: companies table has ${countData} rows`);
  }

  // Alternative count via raw count
  const { count } = await supabase
    .from('companies')
    .select('*', { count: 'exact', head: true });

  console.log(`Final count: ${count}`);
}

seed().catch(console.error);
