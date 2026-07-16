/**
 * 標題列自動偵測工具
 * 比對前 15 列，依據欄位名稱與資料用途關鍵字，選取分數最高的一列做為欄位標題列。
 */

// 常用關鍵字庫
const HEADER_KEYWORDS = [
  '年度', '年份', '年', 'year', 'yyyy', '民國年',
  '月份', '月', 'month', '統計月份', '捐款月份',
  '日期', '捐款日期', '付款日期', '交易日期', '訂單日期', '建立日期', '完成日期', '時間', 'date',
  '平台', '捐款平台', '付款平台', '通路', '來源', '渠道', '付款方式', '金流', 'platform',
  '金額', '捐款金額', '實收金額', '付款金額', '交易金額', '收入', 'amount', 'total', '應付', '實付',
  '交易編號', '訂單編號', '捐款編號', '序號', '流水號', '帳單', 'id', 'transaction', 'order',
  '狀態', '付款狀態', '交易狀態', '訂單狀態', '捐款狀態', '退款狀態', '結果', 'status',
  '專案', '活動', '募款專案', '捐款用途', '方案', '用途', '活動名稱', 'campaign', 'project'
];

export const detectHeaderRow = (matrix: any[][]): { headerRowIndex: number; confidence: number } => {
  if (!matrix || matrix.length === 0) {
    return { headerRowIndex: 0, confidence: 0 };
  }

  const scanLimit = Math.min(15, matrix.length);
  let bestRowIndex = 0;
  let highestScore = 0;
  let matchesCount = 0;

  for (let rIdx = 0; rIdx < scanLimit; rIdx++) {
    const row = matrix[rIdx];
    if (!row || row.length === 0) continue;

    let score = 0;
    let localMatches = 0;

    row.forEach(cell => {
      if (cell === undefined || cell === null) return;
      const valStr = String(cell).trim().toLowerCase();
      if (!valStr) return;

      // 精準與模糊匹配
      const hasKeyword = HEADER_KEYWORDS.some(kw => valStr.includes(kw));
      if (hasKeyword) {
        score += 10;
        localMatches++;
      }

      // 如果是中文字數適中的一般名詞，稍微加分 (可能是自訂欄位)
      if (valStr.length >= 2 && valStr.length <= 10 && !/^\d+$/.test(valStr)) {
        score += 1;
      }
    });

    // 獎勵包含「金額」與「日期/月份」同時出現的行，這通常代表真正的表格頭
    const rowText = row.map(v => String(v).toLowerCase()).join(' ');
    const hasAmount = rowText.includes('金額') || rowText.includes('amount') || rowText.includes('元') || rowText.includes('實付') || rowText.includes('應付');
    const hasDateOrMonth = rowText.includes('日期') || rowText.includes('date') || rowText.includes('月份') || rowText.includes('month') || rowText.includes('年');
    const hasPlatform = rowText.includes('平台') || rowText.includes('platform') || rowText.includes('管道') || rowText.includes('通路');
    
    if (hasAmount && (hasDateOrMonth || hasPlatform)) {
      score += 25; // 額外加權
    }

    if (score > highestScore) {
      highestScore = score;
      bestRowIndex = rIdx;
      matchesCount = localMatches;
    }
  }

  // 計算信心度 (0 - 100)
  const confidence = Math.min(100, Math.round((highestScore / 50) * 100));

  return {
    headerRowIndex: bestRowIndex,
    confidence: matchesCount > 0 ? confidence : 0
  };
};
