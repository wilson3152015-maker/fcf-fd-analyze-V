import { NormalizedDonationRecord, PlatformMapping } from '../../types/donation';
import { parseAmount } from './amountParser';
import { parseDateValue } from './dateParser';
import { resolvePlatform, inferPlatformFromContext } from './platformResolver';
import { CrossTableInfo, unpivotCrossTable, isTotalString } from './crossTableDetector';

export interface NormalizationResult {
  records: NormalizedDonationRecord[];
  unmappedPlatforms: string[];
  calculatedTotal: number;
  originalReportTotal: number | null;
  discrepancy: number | null;
  discrepancyRate: number | null;
  recordsCount: number;
}

/**
 * 從文字（如檔案名稱或工作表名稱）中提取可能的年度 (西元)
 */
const extractYearFromText = (text: string): number => {
  const matchRoc = text.match(/11[3456789]年/);
  if (matchRoc) {
    const roc = parseInt(matchRoc[0].replace('年', ''), 10);
    return roc + 1911;
  }
  const matchWest = text.match(/202[456789]/);
  if (matchWest) {
    return parseInt(matchWest[0], 10);
  }
  const matchRocNumber = text.match(/\b(11[3456789])\b/);
  if (matchRocNumber) {
    return parseInt(matchRocNumber[1], 10) + 1911;
  }
  return new Date().getFullYear(); // 預設今年
};

/**
 * 將各種格式的原始數據轉換為統一內部的 NormalizedDonationRecord
 */
export const normalizeData = (
  matrix: any[][],
  headerRow: number,
  columnMapping: Record<string, string>, // original headers -> standard fields
  dataType: 'monthly_summary' | 'transaction_detail',
  platformMappings: PlatformMapping[],
  fileName: string,
  sheetName: string,
  manualPlatform?: string, // 供缺平台欄位時指定
  crossTableInfo?: CrossTableInfo
): NormalizationResult => {
  const records: NormalizedDonationRecord[] = [];
  const unmappedPlatformsSet = new Set<string>();
  const headers = matrix[headerRow]?.map(h => String(h).trim()) ?? [];
  const dataStartRow = headerRow + 1;
  const batchId = `batch_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`;
  const seenKeys = new Set<string>(); // 用於同批次唯一鍵去重

  // 1. 偵測檔案/工作表代表的年度作為備用
  const contextYear = extractYearFromText(`${fileName} ${sheetName}`);

  // 2. 擷取原始報告總計列的金額，作為對帳勾稽
  let originalReportTotal: number | null = null;
  matrix.slice(dataStartRow).forEach(row => {
    const rowText = row.map(v => String(v)).join(' ');
    const isTotalRow = isTotalString(rowText);
    
    if (isTotalRow) {
      // 尋找此行中的最大數字，通常就是總計值
      row.forEach(cell => {
        const parsed = parseAmount(cell);
        if (parsed !== null && parsed > 0) {
          if (originalReportTotal === null || parsed > originalReportTotal) {
            originalReportTotal = parsed;
          }
        }
      });
    }
  });

  // 3. 排除總計、合計等特定列的字串過濾規則
  const shouldExcludeRow = (row: any[]): boolean => {
    if (row.length === 0) return true;
    const firstCell = String(row[0] || '').trim();
    if (!firstCell) {
      // 如果整列大部分是空的，也要排除
      const nonEmptyCells = row.filter(c => c !== undefined && c !== null && String(c).trim() !== '');
      if (nonEmptyCells.length <= 1) return true;
    }
    
    const rowText = row.map(v => String(v)).join(' ');
    if (isTotalString(rowText)) {
      return true;
    }
    if (isTotalString(firstCell)) {
      return true;
    }
    return false;
  };

  // 4. 開始解析
  if (crossTableInfo && crossTableInfo.isCrossTable) {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // A. 交叉表轉換：寬格式轉長格式
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const rawDataRows = matrix.slice(dataStartRow).filter(row => !shouldExcludeRow(row));
    const unpivoted = unpivotCrossTable(crossTableInfo, headers, rawDataRows);

    unpivoted.forEach((item, idx) => {
      let recPlatform = '未知平台';
      let recMonthVal = 1;

      if (crossTableInfo.type === 'months_horizontal') {
        // 平台縱向，月份橫向
        recPlatform = item.pivotAxisVal;
        // 提取月份數字
        const parsedDate = parseDateValue(item.headerAxisVal);
        recMonthVal = parsedDate ? parsedDate.month : 1;
      } else {
        // 月份縱向，平台橫向
        recPlatform = item.headerAxisVal;
        const parsedDate = parseDateValue(item.pivotAxisVal);
        recMonthVal = parsedDate ? parsedDate.month : 1;
      }

      const amountVal = parseAmount(item.value);
      if (amountVal === null) return; // 忽略空白金額格

      // 解析平台標準名稱與群組
      const platformRes = resolvePlatform(recPlatform, platformMappings);
      if (platformRes.group === '待確認群組' && platformRes.original) {
        unmappedPlatformsSet.add(platformRes.original);
      }

      const westernYear = contextYear;
      const rocYear = westernYear - 1911;

      // 唯一鍵：年 + 月 + 平台標準名稱 + 資料層級 + 來源工作表
      const uniqueKey = `${westernYear}_${recMonthVal}_${platformRes.standard}_monthly_summary_${sheetName}`;
      if (seenKeys.has(uniqueKey)) {
        return; // 重複則跳過，防加總重複
      }
      seenKeys.add(uniqueKey);

      records.push({
        date: `${westernYear}-${String(recMonthVal).padStart(2, '0')}-01`,
        year: westernYear,
        rocYear,
        month: recMonthVal,
        period: `${westernYear}-${String(recMonthVal).padStart(2, '0')}`,
        platformOriginal: recPlatform,
        platformStandard: platformRes.standard,
        channelGroup: platformRes.group,
        amount: amountVal,
        isComplete: true,
        transactionId: null,
        transactionStatus: '成功', // 彙總資料預設成功
        donationType: '單次',
        campaign: null,
        sourceFile: fileName,
        sourceSheet: sheetName,
        sourceRow: dataStartRow + item.sourceRowIdx,
        importBatchId: batchId,
        dataLevel: 'monthly_summary',
        notes: `由交叉表 (${crossTableInfo.type}) 標準化生成`
      });
    });

  } else {
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    // B. 長格式：標準逐列轉換
    // ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    const yearColIdx = headers.findIndex(h => columnMapping[h] === 'year');
    const rocYearColIdx = headers.findIndex(h => columnMapping[h] === 'rocYear');
    const monthColIdx = headers.findIndex(h => columnMapping[h] === 'month');
    const dateColIdx = headers.findIndex(h => columnMapping[h] === 'date');
    const platformColIdx = headers.findIndex(h => columnMapping[h] === 'platform');
    const amountColIdx = headers.findIndex(h => columnMapping[h] === 'amount');
    const txIdColIdx = headers.findIndex(h => columnMapping[h] === 'transactionId');
    const txStatusColIdx = headers.findIndex(h => columnMapping[h] === 'transactionStatus');
    const campaignColIdx = headers.findIndex(h => columnMapping[h] === 'campaign');

    matrix.slice(dataStartRow).forEach((row, rIdx) => {
      if (shouldExcludeRow(row)) return; // 跳過合計/空白列

      // 1. 金額解析
      const rawAmt = amountColIdx !== -1 ? row[amountColIdx] : null;
      const amount = parseAmount(rawAmt);
      if (amount === null) return; // 沒有金額者不匯入

      // 2. 日期與期間解析
      let year = contextYear;
      let month = 1;
      let dateStr: string | null = null;

      if (dateColIdx !== -1 && row[dateColIdx]) {
        const parsedDate = parseDateValue(row[dateColIdx]);
        if (parsedDate) {
          year = parsedDate.year;
          month = parsedDate.month;
          dateStr = parsedDate.dateStr;
        }
      } else {
        // 如果沒有 Date 欄位，檢查 Year / Month 欄位
        if (yearColIdx !== -1 && row[yearColIdx]) {
          const parsedYear = parseInt(String(row[yearColIdx]).trim(), 10);
          if (!isNaN(parsedYear)) {
            year = parsedYear < 1911 ? parsedYear + 1911 : parsedYear;
          }
        } else if (rocYearColIdx !== -1 && row[rocYearColIdx]) {
          const parsedRoc = parseInt(String(row[rocYearColIdx]).trim(), 10);
          if (!isNaN(parsedRoc)) {
            year = parsedRoc + 1911;
          }
        }

        if (monthColIdx !== -1 && row[monthColIdx]) {
          const parsedDate = parseDateValue(row[monthColIdx]);
          if (parsedDate) {
            month = parsedDate.month;
          }
        }
        dateStr = `${year}-${String(month).padStart(2, '0')}-01`;
      }

      const rocYear = year - 1911;

      // 3. 平台解析
      let rawPlatform = '';
      if (platformColIdx !== -1 && row[platformColIdx]) {
        rawPlatform = String(row[platformColIdx]).trim();
      } else if (manualPlatform) {
        rawPlatform = manualPlatform;
      } else {
        // 嘗試 context
        const inferred = inferPlatformFromContext(fileName, sheetName);
        rawPlatform = inferred ? inferred.standard : '未知平台';
      }

      const platformRes = resolvePlatform(rawPlatform, platformMappings);
      if (platformRes.group === '待確認群組' && platformRes.original && platformRes.original !== '未知平台') {
        unmappedPlatformsSet.add(platformRes.original);
      }

      // 唯一鍵：年 + 月 + 平台標準名稱 + 資料層級 + 來源工作表 + rowIdx / txId
      const transactionId = txIdColIdx !== -1 && row[txIdColIdx] ? String(row[txIdColIdx]).trim() : null;
      const subId = transactionId || `row_${rIdx + 1}`;
      const uniqueKey = `${year}_${month}_${platformRes.standard}_${dataType}_${sheetName}_${subId}`;
      if (seenKeys.has(uniqueKey)) {
        return; // 重複則跳過，防加總重複
      }
      seenKeys.add(uniqueKey);

      // 4. 其他欄位
      const rawStatus = txStatusColIdx !== -1 && row[txStatusColIdx] ? String(row[txStatusColIdx]).trim() : null;
      let transactionStatus = '成功';
      if (rawStatus) {
        if (rawStatus.includes('失敗') || rawStatus.includes('退款') || rawStatus.toLowerCase().startsWith('fail') || rawStatus.toLowerCase().startsWith('refund')) {
          transactionStatus = '失敗';
        }
      }
      const campaign = campaignColIdx !== -1 && row[campaignColIdx] ? String(row[campaignColIdx]).trim() : null;

      records.push({
        date: dateStr,
        year,
        rocYear,
        month,
        period: `${year}-${String(month).padStart(2, '0')}`,
        platformOriginal: rawPlatform,
        platformStandard: platformRes.standard,
        channelGroup: platformRes.group,
        amount,
        isComplete: true,
        transactionId,
        transactionStatus,
        donationType: '單次',
        campaign,
        sourceFile: fileName,
        sourceSheet: sheetName,
        sourceRow: dataStartRow + rIdx + 1,
        importBatchId: batchId,
        dataLevel: dataType,
        notes: `從長格式表格解析，層級：${dataType}`
      });
    });
  }

  // 5. 計算重新汇总的金額與對帳
  const calculatedTotal = records.reduce((sum, r) => sum + r.amount, 0);
  let discrepancy: number | null = null;
  let discrepancyRate: number | null = null;

  if (originalReportTotal !== null) {
    discrepancy = calculatedTotal - originalReportTotal;
    discrepancyRate = originalReportTotal === 0 ? 0 : discrepancy / originalReportTotal;
  }

  return {
    records,
    unmappedPlatforms: Array.from(unmappedPlatformsSet),
    calculatedTotal,
    originalReportTotal,
    discrepancy,
    discrepancyRate,
    recordsCount: records.length
  };
};
