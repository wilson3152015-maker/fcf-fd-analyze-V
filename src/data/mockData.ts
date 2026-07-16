import { DonationMonthlyRecord, PlatformMapping, DonationTransaction } from '../types/donation';

// 初始平台對照表
export const initialPlatformMappings: PlatformMapping[] = [
  { original: 'line pay愛心平台', standard: 'LINE Pay愛心捐款平台', channelGroup: '電支' },
  { original: 'Line Pay愛心捐款平台', standard: 'LINE Pay愛心捐款平台', channelGroup: '電支' },
  { original: 'LINE Pay', standard: 'LINE Pay愛心捐款平台', channelGroup: '電支' },
  { original: '7-11 ibon', standard: '7-ELEVEN機台', channelGroup: '超商' },
  { original: '7-11統一超商-機台', standard: '7-ELEVEN機台', channelGroup: '超商' },
  { original: '7-11手機APP', standard: '7-ELEVEN APP', channelGroup: '超商' },
  { original: '7-11統一超商-APP', standard: '7-ELEVEN APP', channelGroup: '超商' },
  { original: 'NpoChannel', standard: 'NPO Channel', channelGroup: '網頁' },
  { original: 'Npo Channel', standard: 'NPO Channel', channelGroup: '網頁' },
  { original: 'igiving', standard: 'iGiving', channelGroup: '網頁' },
  { original: 'IGIVING', standard: 'iGiving', channelGroup: '網頁' },
  { original: 'taaze', standard: 'TAAZE', channelGroup: '網頁' },
  { original: 'TAAZE二手書公益捐款', standard: 'TAAZE', channelGroup: '網頁' },
  { original: '官網捐款', standard: '自家官網線上捐款', channelGroup: '自有網頁' }
];

// 建立 114 年 (2025) 全年度及 115 年 (2026) 1-4 月的模擬數據
export const mockDonationRecords: DonationMonthlyRecord[] = [
  // ================= 114年 (2025) 數據 =================
  // 1月 (總額：2,100,000)
  { rocYear: 114, year: 2025, month: 1, period: "2025-01", platformOriginal: "7-11統一超商-機台", platformStandard: "7-ELEVEN機台", channelGroup: "超商", amount: 850000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 1, period: "2025-01", platformOriginal: "LINE Pay愛心捐款平台", platformStandard: "LINE Pay愛心捐款平台", channelGroup: "電支", amount: 620000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 1, period: "2025-01", platformOriginal: "7-11手機APP", platformStandard: "7-ELEVEN APP", channelGroup: "超商", amount: 250000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 1, period: "2025-01", platformOriginal: "NpoChannel", platformStandard: "NPO Channel", channelGroup: "網頁", amount: 150000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 1, period: "2025-01", platformOriginal: "igiving", platformStandard: "iGiving", channelGroup: "網頁", amount: 80000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 1, period: "2025-01", platformOriginal: "TAAZE二手書公益捐款", platformStandard: "TAAZE", channelGroup: "網頁", amount: 50000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 1, period: "2025-01", platformOriginal: "官網捐款", platformStandard: "自家官網線上捐款", channelGroup: "自有網頁", amount: 100000, isComplete: true, sourceFile: "2025_all.xlsx" },

  // 2月 (總額：1,850,000 - 逢過年，超商稍微降低)
  { rocYear: 114, year: 2025, month: 2, period: "2025-02", platformOriginal: "7-11統一超商-機台", platformStandard: "7-ELEVEN機台", channelGroup: "超商", amount: 720000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 2, period: "2025-02", platformOriginal: "LINE Pay", platformStandard: "LINE Pay愛心捐款平台", channelGroup: "電支", amount: 550000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 2, period: "2025-02", platformOriginal: "7-11手機APP", platformStandard: "7-ELEVEN APP", channelGroup: "超商", amount: 200000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 2, period: "2025-02", platformOriginal: "NpoChannel", platformStandard: "NPO Channel", channelGroup: "網頁", amount: 130000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 2, period: "2025-02", platformOriginal: "igiving", platformStandard: "iGiving", channelGroup: "網頁", amount: 90000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 2, period: "2025-02", platformOriginal: "taaze", platformStandard: "TAAZE", channelGroup: "網頁", amount: 60000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 2, period: "2025-02", platformOriginal: "官網捐款", platformStandard: "自家官網線上捐款", channelGroup: "自有網頁", amount: 100000, isComplete: true, sourceFile: "2025_all.xlsx" },

  // 3月 (總額：2,250,000)
  { rocYear: 114, year: 2025, month: 3, period: "2025-03", platformOriginal: "7-11統一超商-機台", platformStandard: "7-ELEVEN機台", channelGroup: "超商", amount: 900000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 3, period: "2025-03", platformOriginal: "LINE Pay愛心捐款平台", platformStandard: "LINE Pay愛心捐款平台", channelGroup: "電支", amount: 650000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 3, period: "2025-03", platformOriginal: "7-11手機APP", platformStandard: "7-ELEVEN APP", channelGroup: "超商", amount: 280000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 3, period: "2025-03", platformOriginal: "NpoChannel", platformStandard: "NPO Channel", channelGroup: "網頁", amount: 160000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 3, period: "2025-03", platformOriginal: "igiving", platformStandard: "iGiving", channelGroup: "網頁", amount: 100000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 3, period: "2025-03", platformOriginal: "taaze", platformStandard: "TAAZE", channelGroup: "網頁", amount: 60000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 3, period: "2025-03", platformOriginal: "官網捐款", platformStandard: "自家官網線上捐款", channelGroup: "自有網頁", amount: 100000, isComplete: true, sourceFile: "2025_all.xlsx" },

  // 4月 (總額：2,400,000 - 開始有母親節專案推廣)
  { rocYear: 114, year: 2025, month: 4, period: "2025-04", platformOriginal: "7-11統一超商-機台", platformStandard: "7-ELEVEN機台", channelGroup: "超商", amount: 920000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 4, period: "2025-04", platformOriginal: "LINE Pay愛心捐款平台", platformStandard: "LINE Pay愛心捐款平台", channelGroup: "電支", amount: 700000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 4, period: "2025-04", platformOriginal: "7-11手機APP", platformStandard: "7-ELEVEN APP", channelGroup: "超商", amount: 320000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 4, period: "2025-04", platformOriginal: "NpoChannel", platformStandard: "NPO Channel", channelGroup: "網頁", amount: 180000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 4, period: "2025-04", platformOriginal: "igiving", platformStandard: "iGiving", channelGroup: "網頁", amount: 120000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 4, period: "2025-04", platformOriginal: "taaze", platformStandard: "TAAZE", channelGroup: "網頁", amount: 40000, isComplete: true, sourceFile: "2025_all.xlsx" },
  { rocYear: 114, year: 2025, month: 4, period: "2025-04", platformOriginal: "官網捐款", platformStandard: "自家官網線上捐款", channelGroup: "自有網頁", amount: 120000, isComplete: true, sourceFile: "2025_all.xlsx" },

  // 5月到12月 快速產生 確保 YTD 有完整的去年對比
  ...generateRemaining2025Data(),

  // ================= 115年 (2026) 數據 =================
  // 1月 (總額：2,350,000 - 與去年同期比 +11.9%)
  { rocYear: 115, year: 2026, month: 1, period: "2026-01", platformOriginal: "7-11統一超商-機台", platformStandard: "7-ELEVEN機台", channelGroup: "超商", amount: 900000, isComplete: true, sourceFile: "2026_q1_raw.xlsx" },
  { rocYear: 115, year: 2026, month: 1, period: "2026-01", platformOriginal: "LINE Pay愛心捐款平台", platformStandard: "LINE Pay愛心捐款平台", channelGroup: "電支", amount: 750000, isComplete: true, sourceFile: "2026_q1_raw.xlsx" },
  { rocYear: 115, year: 2026, month: 1, period: "2026-01", platformOriginal: "7-11手機APP", platformStandard: "7-ELEVEN APP", channelGroup: "超商", amount: 280000, isComplete: true, sourceFile: "2026_q1_raw.xlsx" },
  { rocYear: 115, year: 2026, month: 1, period: "2026-01", platformOriginal: "NpoChannel", platformStandard: "NPO Channel", channelGroup: "網頁", amount: 140000, isComplete: true, sourceFile: "2026_q1_raw.xlsx" },
  { rocYear: 115, year: 2026, month: 1, period: "2026-01", platformOriginal: "igiving", platformStandard: "iGiving", channelGroup: "網頁", amount: 100000, isComplete: true, sourceFile: "2026_q1_raw.xlsx" },
  { rocYear: 115, year: 2026, month: 1, period: "2026-01", platformOriginal: "taaze", platformStandard: "TAAZE", channelGroup: "網頁", amount: 60000, isComplete: true, sourceFile: "2026_q1_raw.xlsx" },
  { rocYear: 115, year: 2026, month: 1, period: "2026-01", platformOriginal: "官網捐款", platformStandard: "自家官網線上捐款", channelGroup: "自有網頁", amount: 120000, isComplete: true, sourceFile: "2026_q1_raw.xlsx" },

  // 2月 (總額：2,110,000 - 與去年同期比 +14.0%)
  { rocYear: 115, year: 2026, month: 2, period: "2026-02", platformOriginal: "7-11統一超商-機台", platformStandard: "7-ELEVEN機台", channelGroup: "超商", amount: 760000, isComplete: true, sourceFile: "2026_q1_raw.xlsx" },
  { rocYear: 115, year: 2026, month: 2, period: "2026-02", platformOriginal: "LINE Pay愛心捐款平台", platformStandard: "LINE Pay愛心捐款平台", channelGroup: "電支", amount: 680000, isComplete: true, sourceFile: "2026_q1_raw.xlsx" },
  { rocYear: 115, year: 2026, month: 2, period: "2026-02", platformOriginal: "7-11手機APP", platformStandard: "7-ELEVEN APP", channelGroup: "超商", amount: 240000, isComplete: true, sourceFile: "2026_q1_raw.xlsx" },
  { rocYear: 115, year: 2026, month: 2, period: "2026-02", platformOriginal: "NpoChannel", platformStandard: "NPO Channel", channelGroup: "網頁", amount: 150000, isComplete: true, sourceFile: "2026_q1_raw.xlsx" },
  { rocYear: 115, year: 2026, month: 2, period: "2026-02", platformOriginal: "igiving", platformStandard: "iGiving", channelGroup: "網頁", amount: 100000, isComplete: true, sourceFile: "2026_q1_raw.xlsx" },
  { rocYear: 115, year: 2026, month: 2, period: "2026-02", platformOriginal: "taaze", platformStandard: "TAAZE", channelGroup: "網頁", amount: 50000, isComplete: true, sourceFile: "2026_q1_raw.xlsx" },
  { rocYear: 115, year: 2026, month: 2, period: "2026-02", platformOriginal: "官網捐款", platformStandard: "自家官網線上捐款", channelGroup: "自有網頁", amount: 130000, isComplete: true, sourceFile: "2026_q1_raw.xlsx" },

  // 3月 (總額：2,510,000 - 與去年同期比 +11.5%)
  { rocYear: 115, year: 2026, month: 3, period: "2026-03", platformOriginal: "7-11統一超商-機台", platformStandard: "7-ELEVEN機台", channelGroup: "超商", amount: 930000, isComplete: true, sourceFile: "2026_q1_raw.xlsx" },
  { rocYear: 115, year: 2026, month: 3, period: "2026-03", platformOriginal: "LINE Pay愛心捐款平台", platformStandard: "LINE Pay愛心捐款平台", channelGroup: "電支", amount: 820000, isComplete: true, sourceFile: "2026_q1_raw.xlsx" },
  { rocYear: 115, year: 2026, month: 3, period: "2026-03", platformOriginal: "7-11手機APP", platformStandard: "7-ELEVEN APP", channelGroup: "超商", amount: 300000, isComplete: true, sourceFile: "2026_q1_raw.xlsx" },
  { rocYear: 115, year: 2026, month: 3, period: "2026-03", platformOriginal: "NpoChannel", platformStandard: "NPO Channel", channelGroup: "網頁", amount: 180000, isComplete: true, sourceFile: "2026_q1_raw.xlsx" },
  { rocYear: 115, year: 2026, month: 3, period: "2026-03", platformOriginal: "igiving", platformStandard: "iGiving", channelGroup: "網頁", amount: 110000, isComplete: true, sourceFile: "2026_q1_raw.xlsx" },
  { rocYear: 115, year: 2026, month: 3, period: "2026-03", platformOriginal: "taaze", platformStandard: "TAAZE", channelGroup: "網頁", amount: 50000, isComplete: true, sourceFile: "2026_q1_raw.xlsx" },
  { rocYear: 115, year: 2026, month: 3, period: "2026-03", platformOriginal: "官網捐款", platformStandard: "自家官網線上捐款", channelGroup: "自有網頁", amount: 120000, isComplete: true, sourceFile: "2026_q1_raw.xlsx" },

  // 4月 (總額：2,810,000 - 與去年同期比 +17.1%) - 最新完整月份
  // LINE Pay 從 70 萬暴增到 105 萬（受惠於 LINE Pay TCF 電子捐款特別活動）
  { rocYear: 115, year: 2026, month: 4, period: "2026-04", platformOriginal: "7-11統一超商-機台", platformStandard: "7-ELEVEN機台", channelGroup: "超商", amount: 950000, isComplete: true, sourceFile: "2026_04_tcf_report.xlsx" },
  { rocYear: 115, year: 2026, month: 4, period: "2026-04", platformOriginal: "line pay愛心平台", platformStandard: "LINE Pay愛心捐款平台", channelGroup: "電支", amount: 1050000, isComplete: true, sourceFile: "2026_04_tcf_report.xlsx" },
  { rocYear: 115, year: 2026, month: 4, period: "2026-04", platformOriginal: "7-11手機APP", platformStandard: "7-ELEVEN APP", channelGroup: "超商", amount: 330000, isComplete: true, sourceFile: "2026_04_tcf_report.xlsx" },
  { rocYear: 115, year: 2026, month: 4, period: "2026-04", platformOriginal: "NpoChannel", platformStandard: "NPO Channel", channelGroup: "網頁", amount: 190000, isComplete: true, sourceFile: "2026_04_tcf_report.xlsx" },
  { rocYear: 115, year: 2026, month: 4, period: "2026-04", platformOriginal: "igiving", platformStandard: "iGiving", channelGroup: "網頁", amount: 110000, isComplete: true, sourceFile: "2026_04_tcf_report.xlsx" },
  { rocYear: 115, year: 2026, month: 4, period: "2026-04", platformOriginal: "TAAZE二手書公益捐款", platformStandard: "TAAZE", channelGroup: "網頁", amount: 30000, isComplete: true, sourceFile: "2026_04_tcf_report.xlsx" },
  { rocYear: 115, year: 2026, month: 4, period: "2026-04", platformOriginal: "官網捐款", platformStandard: "自家官網線上捐款", channelGroup: "自有網頁", amount: 150000, isComplete: true, sourceFile: "2026_04_tcf_report.xlsx" },

  // 5月 (總額：3,020,000 - 與去年同期比 +16.2%)
  { rocYear: 115, year: 2026, month: 5, period: "2026-05", platformOriginal: "7-11統一超商-機台", platformStandard: "7-ELEVEN機台", channelGroup: "超商", amount: 980000, isComplete: true, sourceFile: "2026_05_tcf_report.xlsx" },
  { rocYear: 115, year: 2026, month: 5, period: "2026-05", platformOriginal: "line pay愛心平台", platformStandard: "LINE Pay愛心捐款平台", channelGroup: "電支", amount: 1150000, isComplete: true, sourceFile: "2026_05_tcf_report.xlsx" },
  { rocYear: 115, year: 2026, month: 5, period: "2026-05", platformOriginal: "7-11手機APP", platformStandard: "7-ELEVEN APP", channelGroup: "超商", amount: 350000, isComplete: true, sourceFile: "2026_05_tcf_report.xlsx" },
  { rocYear: 115, year: 2026, month: 5, period: "2026-05", platformOriginal: "NpoChannel", platformStandard: "NPO Channel", channelGroup: "網頁", amount: 200000, isComplete: true, sourceFile: "2026_05_tcf_report.xlsx" },
  { rocYear: 115, year: 2026, month: 5, period: "2026-05", platformOriginal: "igiving", platformStandard: "iGiving", channelGroup: "網頁", amount: 120000, isComplete: true, sourceFile: "2026_05_tcf_report.xlsx" },
  { rocYear: 115, year: 2026, month: 5, period: "2026-05", platformOriginal: "TAAZE二手書公益捐款", platformStandard: "TAAZE", channelGroup: "網頁", amount: 40000, isComplete: true, sourceFile: "2026_05_tcf_report.xlsx" },
  { rocYear: 115, year: 2026, month: 5, period: "2026-05", platformOriginal: "官網捐款", platformStandard: "自家官網線上捐款", channelGroup: "自有網頁", amount: 180000, isComplete: true, sourceFile: "2026_05_tcf_report.xlsx" }
];

function generateRemaining2025Data(): DonationMonthlyRecord[] {
  const records: DonationMonthlyRecord[] = [];
  const platforms = [
    { name: "7-ELEVEN機台", grp: "超商", amt: 880000 },
    { name: "LINE Pay愛心捐款平台", grp: "電支", amt: 600000 },
    { name: "7-ELEVEN APP", grp: "超商", amt: 280000 },
    { name: "NPO Channel", grp: "網頁", amt: 150000 },
    { name: "iGiving", grp: "網頁", amt: 100000 },
    { name: "TAAZE", grp: "網頁", amt: 50000 },
    { name: "自家官網線上捐款", grp: "自有網頁", amt: 110000 }
  ];

  // 產生 2025 年 5月到 12月
  for (let m = 5; m <= 12; m++) {
    const seasonalFactor = m === 5 ? 1.2 : m === 12 ? 1.3 : m === 8 ? 0.9 : 1.0;
    platforms.forEach(p => {
      records.push({
        rocYear: 114,
        year: 2025,
        month: m,
        period: `2025-${String(m).padStart(2, '0')}`,
        platformOriginal: p.name,
        platformStandard: p.name,
        channelGroup: p.grp,
        amount: Math.round(p.amt * seasonalFactor),
        isComplete: true,
        sourceFile: "2025_all.xlsx"
      });
    });
  }
  return records;
}

// 模擬單筆明細數據
export const mockDonationTransactions: DonationTransaction[] = [
  { donationDate: "2026-04-01", transactionId: "TX9001", anonymizedDonorId: "D_8819", amount: 500, platformStandard: "LINE Pay愛心捐款平台", donationType: "單次", campaign: "愛心隨手捐", transactionStatus: "成功" },
  { donationDate: "2026-04-02", transactionId: "TX9002", anonymizedDonorId: "D_0219", amount: 1000, platformStandard: "7-ELEVEN機台", donationType: "單次", campaign: "點數折現捐", transactionStatus: "成功" },
  { donationDate: "2026-04-02", transactionId: "TX9003", anonymizedDonorId: "D_3291", amount: 2000, platformStandard: "LINE Pay愛心捐款平台", donationType: "定期", campaign: "母親節專案", transactionStatus: "成功" },
  { donationDate: "2026-04-03", transactionId: "TX9004", anonymizedDonorId: "D_5821", amount: 150, platformStandard: "7-ELEVEN APP", donationType: "單次", campaign: "點數折現捐", transactionStatus: "成功" },
  { donationDate: "2026-04-05", transactionId: "TX9005", anonymizedDonorId: "D_1029", amount: 3000, platformStandard: "自家官網線上捐款", donationType: "定期", campaign: "癌症預防篩檢計畫", transactionStatus: "成功" }
];
