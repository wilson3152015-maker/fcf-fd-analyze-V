/**
 * 日期解析工具
 * 支援以下格式：
 * - 2026/04/01, 2026-04-01, 2026.04.01
 * - 115/04/01, 115-04-01
 * - 115年4月1日
 * - 2026年4月
 * - 115年4月
 * - Excel日期序號 (如 46112)
 * - 含時間的日期格式 (如 2026-04-01 12:30:15)
 * 
 * 民國年轉換公式：西元年 = 民國年 + 1911
 */

interface ParsedDateResult {
  year: number;     // 西元
  rocYear: number;  // 民國
  month: number;    // 1-12
  dateStr: string | null; // YYYY-MM-DD 或 YYYY-MM
}

/**
 * 將 Excel 日期序號轉為 JS Date 物件
 */
export const excelSerialToDate = (serial: number): Date => {
  // Excel 日期計算起點通常是 1899-12-30
  const utcDays = Math.floor(serial - 25569);
  const utcValue = utcDays * 86400 * 1000;
  const dateInfo = new Date(utcValue);
  
  // 處理小數部分（時間）
  const fractionalDay = serial - Math.floor(serial);
  const totalSeconds = Math.floor(fractionalDay * 86400);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const hours = Math.floor(totalMinutes / 60);
  
  dateInfo.setUTCHours(hours, minutes, seconds);
  return dateInfo;
};

export const parseDateValue = (val: any): ParsedDateResult | null => {
  if (val === undefined || val === null) return null;

  let jsDate: Date | null = null;
  let year: number | null = null;
  let month: number | null = null;
  let day: number | null = null;

  // 1. 處理數字（可能是 Excel 序號，或是純年度如 2026, 115）
  if (typeof val === 'number') {
    if (val > 30000 && val < 60000) {
      // 很可能是 Excel 日期序號
      jsDate = excelSerialToDate(val);
      year = jsDate.getUTCFullYear();
      month = jsDate.getUTCMonth() + 1;
      day = jsDate.getUTCDate();
    } else if (val >= 1911 && val < 2100) {
      // 純西元年
      return { year: val, rocYear: val - 1911, month: 1, dateStr: `${val}-01-01` };
    } else if (val > 0 && val <= 200) {
      // 純民國年
      return { year: val + 1911, rocYear: val, month: 1, dateStr: `${val + 1911}-01-01` };
    } else {
      return null;
    }
  }

  // 2. 處理字串
  const str = String(val).trim();
  if (!str) return null;

  // 嘗試匹配常見正則
  
  // A. 民國年格式，例如：115年4月1日, 115年4月, 115/04/01, 115.4
  // 支援 2 碼或 3 碼民國年
  const rocYMDRegex = /^(\d{2,3})[年\/\-\. ](\d{1,2})[月\/\-\. ]?(\d{1,2})?[日]?/;
  const rocMatch = str.match(rocYMDRegex);
  if (rocMatch) {
    const rawRocY = parseInt(rocMatch[1], 10);
    // 民國年通常在 1~190 之間。如果是 > 1900 則不是民國年，交由西元年正則處理
    if (rawRocY < 1900) {
      year = rawRocY + 1911;
      month = parseInt(rocMatch[2], 10);
      day = rocMatch[3] ? parseInt(rocMatch[3], 10) : null;
    }
  }

  // B. 西元年格式，例如：2026-04-01, 2026/4/1 12:30, 2026年4月
  if (year === null) {
    const westYMDRegex = /^(\d{4})[年\/\-\. ](\d{1,2})[月\/\-\. ]?(\d{1,2})?[日]?/;
    const westMatch = str.match(westYMDRegex);
    if (westMatch) {
      year = parseInt(westMatch[1], 10);
      month = parseInt(westMatch[2], 10);
      day = westMatch[3] ? parseInt(westMatch[3], 10) : null;
    }
  }

  // C. 標準 JS Date.parse
  if (year === null) {
    const parsedTime = Date.parse(str);
    if (!isNaN(parsedTime)) {
      jsDate = new Date(parsedTime);
      year = jsDate.getFullYear();
      month = jsDate.getMonth() + 1;
      day = jsDate.getDate();
    }
  }

  // D. 匹配純月份，如 "1月", "2月"
  if (year === null) {
    const pureMonthRegex = /^(\d{1,2})\s*月$/;
    const pmMatch = str.match(pureMonthRegex);
    if (pmMatch) {
      const currentYear = new Date().getFullYear();
      return {
        year: currentYear,
        rocYear: currentYear - 1911,
        month: parseInt(pmMatch[1], 10),
        dateStr: null
      };
    }
  }

  // E. 匹配 1-12 的數字
  if (year === null) {
    const num = parseInt(str, 10);
    if (!isNaN(num) && num >= 1 && num <= 12 && str.length <= 2) {
      const currentYear = new Date().getFullYear();
      return {
        year: currentYear,
        rocYear: currentYear - 1911,
        month: num,
        dateStr: null
      };
    }
  }

  // 組裝結果
  if (year !== null && month !== null && !isNaN(year) && !isNaN(month)) {
    // 確保月份在 1-12 內
    if (month < 1 || month > 12) return null;
    
    const rocYear = year - 1911;
    let dateStr: string | null = null;
    
    if (day !== null && !isNaN(day) && day >= 1 && day <= 31) {
      dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    } else {
      dateStr = `${year}-${String(month).padStart(2, '0')}-01`; // 預設第一天
    }

    return {
      year,
      rocYear,
      month,
      dateStr
    };
  }

  return null;
};
