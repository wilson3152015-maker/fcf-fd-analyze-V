/**
 * 欄位語意自動辨識與對應
 * 結合「欄位名稱模糊匹配」與「欄位內容型別統計」兩層邏輯進行辨識。
 */

export interface ColumnSuggestion {
  sourceColumn: string;
  targetField: string; // 'year' | 'month' | 'date' | 'platform' | 'amount' | 'transactionId' | 'transactionStatus' | 'campaign' | 'ignore'
  confidence: number;  // 0-100
  reason: string;
}

// 欄位名稱對應字典
const SYNONYMS: Record<string, string[]> = {
  year: ['年度', '年份', '年', 'year', 'yyyy', '民國年'],
  month: ['月份', '月', 'month', '統計月份', '捐款月份'],
  date: ['日期', '捐款日期', '付款日期', '交易日期', '訂單日期', '建立日期', '完成日期', '時間', 'date', '交易時間'],
  platform: ['平台', '捐款平台', '付款平台', '通路', '來源', '渠道', '付款方式', '金流', 'platform'],
  amount: ['金額', '捐款金額', '實收金額', '付款金額', '交易金額', '收入', 'amount', 'total', '實付', '應付', '金額(元)', '實付金額'],
  transactionId: ['交易編號', '訂單編號', '捐款編號', '序號', '流水號', '帳單', 'id', 'transaction', 'order', '交易序號'],
  transactionStatus: ['狀態', '付款狀態', '交易狀態', '訂單狀態', '捐款狀態', '退款狀態', '結果', 'status', '訂單結果'],
  campaign: ['專案', '活動', '募款專案', '捐款用途', '方案', '用途', '活動名稱', 'campaign', 'project']
};

/**
 * 偵測單一欄位的內容型別與語意特徵
 */
export const suggestColumnMapping = (
  colName: string,
  samples: any[]
): ColumnSuggestion => {
  const name = colName.trim().toLowerCase();
  
  // 1. 先用欄位名稱進行精準/模糊匹配
  for (const [field, keywords] of Object.entries(SYNONYMS)) {
    if (keywords.some(kw => name === kw.toLowerCase())) {
      return {
        sourceColumn: colName,
        targetField: field,
        confidence: 95,
        reason: `欄位標頭「${colName}」與標準欄位名稱完全符合。`
      };
    }
  }

  for (const [field, keywords] of Object.entries(SYNONYMS)) {
    if (keywords.some(kw => name.includes(kw.toLowerCase()))) {
      return {
        sourceColumn: colName,
        targetField: field,
        confidence: 85,
        reason: `欄位標頭「${colName}」包含關鍵字「${field}」。`
      };
    }
  }

  // 1.5 優先檢測已知平台名稱（主要針對交叉表，例如 Line Pay, 7-ELEVEN, 街口支付 等）
  const knownPlatformKeywords = [
    'pay', 'line', 'qrcode', '7-11', '7-eleven', 'npo', 'igiving', 'taaze', '街口', 'pi', '全支付', '台灣pay', 'yahoo', '公益', 'ibon', '自家', '官網'
  ];
  const isPlatformKeyword = knownPlatformKeywords.some(kw => name.includes(kw));
  const isIgnoreCol = name.includes('編號') || name.includes('序號') || name.includes('備註') || name.includes('說明') || name.includes('流水號') || name.includes('總計') || name.includes('合計') || name.includes('total') || name.includes('subtotal') || name.includes('項次') || name.includes('欄位') || name.includes('狀態') || name.includes('結果');

  if (isPlatformKeyword && !isIgnoreCol) {
    // 檢查樣本中是否至少有一些非空的數值資料
    const nonBlank = samples.filter(s => s !== undefined && s !== null && String(s).trim() !== '');
    const numCount = nonBlank.filter(val => {
      const s = String(val).trim();
      return !isNaN(parseFloat(s.replace(/,/g, '').replace(/NT\$/g, '').replace(/\$/g, '')));
    }).length;

    if (numCount > 0) {
      return {
        sourceColumn: colName,
        targetField: 'amount',
        confidence: 90,
        reason: `自動識別為平台金額欄位「${colName}」：標頭含已知平台名稱且內容為數值。`
      };
    }
  }

  // 2. 欄位名稱無特徵，檢查內容值 (Heuristic analysis)
  const nonEmptySamples = samples.filter(s => s !== undefined && s !== null && String(s).trim() !== '');
  if (nonEmptySamples.length === 0) {
    return {
      sourceColumn: colName,
      targetField: 'ignore',
      confidence: 10,
      reason: '此欄位樣本全數為空。'
    };
  }

  // A. 統計樣本屬性
  let numericCount = 0;
  let dateLikeCount = 0;
  let statusLikeCount = 0;
  let monthLikeCount = 0;

  nonEmptySamples.forEach(val => {
    const s = String(val).trim();
    
    // 是否是純數字或貨幣格式
    const isNum = !isNaN(parseFloat(s.replace(/,/g, '').replace(/NT\$/g, '').replace(/\$/g, '')));
    if (isNum) numericCount++;

    // 是否是日期
    if (s.includes('/') || s.includes('-') || s.includes('年') || (isNum && parseFloat(s) > 30000 && parseFloat(s) < 60000)) {
      dateLikeCount++;
    }

    // 是否是月份 (1~12 或是 1月~12月)
    if (s.endsWith('月') || (isNum && parseInt(s, 10) >= 1 && parseInt(s, 10) <= 12)) {
      monthLikeCount++;
    }

    // 是否是狀態 (成功、失敗、退款等)
    if (s.includes('成功') || s.includes('失敗') || s.includes('退款') || s.includes('完成') || s.toLowerCase() === 'succeeded' || s.toLowerCase() === 'failed') {
      statusLikeCount++;
    }
  });

  const sampleCount = nonEmptySamples.length;

  if (dateLikeCount / sampleCount >= 0.7) {
    return {
      sourceColumn: colName,
      targetField: 'date',
      confidence: 75,
      reason: `內容分析：大於 70% 的樣本符合日期或時間格式。`
    };
  }

  if (statusLikeCount / sampleCount >= 0.7) {
    return {
      sourceColumn: colName,
      targetField: 'transactionStatus',
      confidence: 75,
      reason: `內容分析：大於 70% 的樣本符合交易狀態關鍵字。`
    };
  }

  if (monthLikeCount / sampleCount >= 0.7 && !colName.includes('金額')) {
    return {
      sourceColumn: colName,
      targetField: 'month',
      confidence: 70,
      reason: `內容分析：大於 70% 的樣本為 1-12 數字或月份。`
    };
  }

  if (numericCount / sampleCount >= 0.7) {
    // 判斷是 year 還是 amount
    // 如果數字大部分大於 3000 且不是 date-like，很可能是 amount
    const avg = nonEmptySamples.reduce((sum, v) => sum + (parseFloat(String(v).replace(/,/g, '')) || 0), 0) / sampleCount;
    if (avg > 2100) {
      return {
        sourceColumn: colName,
        targetField: 'amount',
        confidence: 70,
        reason: `內容分析：大於 70% 為數值，且平均值 (${Math.round(avg)}) 大於 2100。`
      };
    } else if (avg >= 1911 && avg <= 2100) {
      return {
        sourceColumn: colName,
        targetField: 'year',
        confidence: 80,
        reason: `內容分析：大於 70% 為數值，且數值範圍符合西元年分。`
      };
    } else if (avg >= 1 && avg <= 120) {
      return {
        sourceColumn: colName,
        targetField: 'rocYear',
        confidence: 65,
        reason: `內容分析：大於 70% 為數值，且平均值在民國年範圍內。`
      };
    }
  }

  // 3. 預設為忽略
  return {
    sourceColumn: colName,
    targetField: 'ignore',
    confidence: 30,
    reason: `特徵與內容皆無顯著規律。已暫定忽略。`
  };
};

/**
 * 為整個表格的欄位產生一組對應建議
 */
export const suggestSchemaMapping = (
  headers: string[],
  matrix: any[][],
  headerRowIdx: number
): Record<string, string> => {
  const mapping: Record<string, string> = {};
  const dataStartRow = headerRowIdx + 1;

  headers.forEach((h, colIdx) => {
    // 擷取前 20 筆資料作為樣本
    const samples: any[] = [];
    for (let r = dataStartRow; r < Math.min(dataStartRow + 20, matrix.length); r++) {
      if (matrix[r]) {
        samples.push(matrix[r][colIdx]);
      }
    }

    const suggestion = suggestColumnMapping(h, samples);
    mapping[h] = suggestion.targetField;
  });

  return mapping;
};
