import { parseDateValue } from './dateParser';

export interface CrossTableInfo {
  isCrossTable: boolean;
  type: 'months_horizontal' | 'platforms_horizontal' | 'none';
  pivotColumnName: string; // the name of the vertical axis (e.g., '平台' or '月份')
  dynamicHeaderFields: string[]; // the horizontal keys (e.g., ['1月', '2月'] or ['LINE Pay', '7-ELEVEN'])
}

/**
 * 判斷一個字串是否是總計/小計/合計等加總性欄位
 */
export const isTotalString = (str: string): boolean => {
  const s = String(str).trim().toLowerCase();
  if (!s) return false;
  const totalKeywords = [
    '總計', '合計', '小計', '總額', '累計', '結算', '彙總', '合併', '總金額', '年終', '年度', '全年',
    'total', 'subtotal', 'grand', 'sum', 'all', 'ytd', 'year-to-date', 'year to date'
  ];
  return totalKeywords.some(kw => s.includes(kw));
};

// 判斷字串是否代表月份
const isMonthValue = (val: string): boolean => {
  const s = val.trim().toLowerCase();
  if (isTotalString(s)) return false;
  if (s.includes('月') && !s.includes('月增')) {
    return true;
  }
  // check pure number 1 to 12
  const n = parseInt(s, 10);
  if (!isNaN(n) && n >= 1 && n <= 12 && String(n) === s) {
    return true;
  }
  // English months
  const engMonths = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
  if (engMonths.some(m => s.startsWith(m))) {
    return true;
  }
  return false;
};

// 判斷是否為平台名稱 (這裡放入常見平台特徵，非百分之百，做為輔助)
const PLATFORM_KEYWORDS = ['pay', '7-11', '7-eleven', '街口', 'npo', 'igiving', 'taaze', '捐款', '通路', '機台', 'app', '匯款', '郵政'];

export const detectCrossTable = (headers: string[], dataRows: any[][]): CrossTableInfo => {
  if (headers.length < 3 || dataRows.length === 0) {
    return { isCrossTable: false, type: 'none', pivotColumnName: '', dynamicHeaderFields: [] };
  }

  // 1. 檢查行首 (Headers) 是否包含多個月份
  // 如果 Headers 中除了第一兩個欄位以外，其餘大部分欄位都是「1月」、「2月」或 1~12 數字
  const nonAxisHeaders = headers.slice(1);
  const monthHeadersCount = nonAxisHeaders.filter(h => isMonthValue(h)).length;
  const isMonthsHorizontal = monthHeadersCount >= 2 && monthHeadersCount >= nonAxisHeaders.length * 0.5;

  if (isMonthsHorizontal) {
    // 例如：平台 | 1月 | 2月 | 3月 | 總計
    // 橫向是月份，縱向是平台
    const dynamicHeaders = headers.filter((h, idx) => idx > 0 && isMonthValue(h) && !isTotalString(h));
    return {
      isCrossTable: true,
      type: 'months_horizontal',
      pivotColumnName: headers[0],
      dynamicHeaderFields: dynamicHeaders
    };
  }

  // 2. 檢查 Headers 中是否包含多個已知平台，且第一欄名稱為「月份」、「月」或「日期」
  const firstHeader = headers[0].toLowerCase();
  const isFirstHeaderMonthAxis = firstHeader.includes('月') || firstHeader.includes('month') || firstHeader.includes('日期') || firstHeader.includes('date');
  
  // 檢查其餘 columns 是否包含平台關鍵字
  const platformHeadersCount = nonAxisHeaders.filter(h => {
    const s = h.toLowerCase();
    return !isTotalString(h) && (PLATFORM_KEYWORDS.some(kw => s.includes(kw)) || (!isMonthValue(h) && h.trim() !== ''));
  }).length;

  const isPlatformsHorizontal = isFirstHeaderMonthAxis && platformHeadersCount >= 2 && platformHeadersCount >= nonAxisHeaders.length * 0.5;

  if (isPlatformsHorizontal) {
    // 例如：月份 | LINE Pay | 7-11 | 街口 | 總計
    // 橫向是平台，縱向是月份
    // 排除含有總計、合計、Total 等欄位
    const dynamicHeaders = headers.filter((h, idx) => {
      if (idx === 0) return false;
      return !isTotalString(h);
    });

    return {
      isCrossTable: true,
      type: 'platforms_horizontal',
      pivotColumnName: headers[0],
      dynamicHeaderFields: dynamicHeaders
    };
  }

  return {
    isCrossTable: false,
    type: 'none',
    pivotColumnName: '',
    dynamicHeaderFields: []
  };
};

/**
 * 將交叉表平坦化為長格式 (Unpivot)
 * 輸出為：[ { pivotKey: "LINE Pay", headerKey: "1月", value: 10000 }, ... ]
 */
export const unpivotCrossTable = (
  info: CrossTableInfo,
  headers: string[],
  dataRows: any[][]
): { pivotAxisVal: string; headerAxisVal: string; value: any; sourceRowIdx: number }[] => {
  const result: { pivotAxisVal: string; headerAxisVal: string; value: any; sourceRowIdx: number }[] = [];
  const pivotColIdx = headers.indexOf(info.pivotColumnName);
  if (pivotColIdx === -1) return [];

  dataRows.forEach((row, rIdx) => {
    const pivotAxisVal = String(row[pivotColIdx] || '').trim();
    if (!pivotAxisVal) return; // 略過空白列
    
    // 略過任何含有加總/合計關鍵字的列
    if (isTotalString(pivotAxisVal)) {
      return;
    }

    info.dynamicHeaderFields.forEach(headerVal => {
      const colIdx = headers.indexOf(headerVal);
      if (colIdx !== -1) {
        const value = row[colIdx];
        result.push({
          pivotAxisVal,
          headerAxisVal: headerVal,
          value,
          sourceRowIdx: rIdx
        });
      }
    });
  });

  return result;
};
