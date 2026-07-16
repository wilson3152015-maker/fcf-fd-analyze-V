export interface DonationMonthlyRecord {
  rocYear: number;           // 民國年度
  year: number;              // 西元年度
  month: number;             // 月份
  period: string;            // YYYY-MM
  platformOriginal: string;  // 平台原始名稱
  platformStandard: string;  // 平台標準名稱
  channelGroup: string;      // 平台群組 (如: 超商, 電支, 網頁, 自有)
  amount: number;            // 募款金額
  isComplete: boolean;       // 是否完整結算
  sourceFile: string;        // 來源檔案
  notes?: string;            // 備註
}

export interface NormalizedDonationRecord extends DonationMonthlyRecord {
  date: string | null;           // 交易日期 YYYY-MM-DD，可能為null
  transactionId: string | null;   // 交易編號，可能為null
  transactionStatus: string | null; // 交易狀態，可能為null
  donationType: string | null;   // 單次或定期定額，可能為null
  campaign: string | null;       // 募款專案，可能為null
  sourceSheet: string;           // 來源工作表名稱
  sourceRow: number;             // 來源列數
  importBatchId: string;         // 匯入批次編號
  dataLevel: 'monthly_summary' | 'transaction_detail';
}

export interface ImportTemplate {
  id: string;
  name: string;
  platform: string;
  sheetSelectionRule: string; // 'first' | 'name_match'
  headerRow: number;
  dataStartRow: number;
  columnMapping: Record<string, string>; // original column name -> target field name
  dateFormat?: string;
  amountField?: string;
  statusField?: string;
  rowsToExclude: string[]; // values in certain columns to exclude (e.g. ['總計', '合計'])
  fileNamePattern?: string;
}

export interface DonationTransaction {
  donationDate: string;      // 捐款日期 YYYY-MM-DD
  transactionId: string;     // 交易序號
  anonymizedDonorId: string; // 匿名捐款人ID
  amount: number;            // 捐款金額
  platformStandard: string;  // 平台標準名稱
  donationType: string;      // 捐款類型 (單次、定期)
  campaign: string;          // 專案名稱 (如：愛心隨手捐、母親節專案)
  transactionStatus: string; // 交易狀態 (成功、失敗)
}


export interface PlatformMapping {
  original: string;          // 原始名稱 (Key, 忽略大小寫/空格)
  standard: string;          // 標準名稱
  channelGroup: string;      // 平台群組
}

export interface QualityCheckResult {
  id: string;
  title: string;
  description: string;
  status: 'success' | 'warning' | 'error' | 'info';
  details: string;
}

export interface KPIMetrics {
  currentMonth: string;      // YYYY-MM
  currentMonthTotal: number;
  momAmount: number;         // 月增減額
  momRate: number;           // 月增率
  yoyAmount: number;         // 單月年增減額
  yoyRate: number;           // 單月年增率
  ytdTotal: number;          // 年度至今累計
  ytdYoyRate: number;        // YTD累計年增率
  platformShare: { name: string; amount: number; percentage: number; channelGroup: string }[];
  contributions: { name: string; contributionAmount: number; contributionRate: number }[];
  concentrationTop3: number; // 前3大平台集中度
  concentrationTop5: number; // 前5大平台集中度
  excludedPlatformGrowth: number; // 排除指定平台後的 YTD 年增率
}

export interface QueryPlan {
  metric: 'ytd_yoy' | 'mom' | 'yoy' | 'platform_share' | 'decline_ranking' | 'manager_summary';
  currentYear: number;
  comparisonYear: number;
  throughMonth: number;
  platforms: string[];
  excludePlatforms: string[];
}
