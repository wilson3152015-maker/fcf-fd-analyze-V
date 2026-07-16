import { detectHeaderRow } from './headerDetector';
import { suggestSchemaMapping } from './columnMapper';
import { detectCrossTable, CrossTableInfo } from './crossTableDetector';

export interface InferredSchema {
  dataType: 'monthly_summary' | 'transaction_detail';
  headerRow: number;
  dataStartRow: number;
  confidence: number;
  platform: {
    source: 'filename' | 'sheetname' | 'column' | 'manual';
    value: string;
    confidence: number;
  };
  columns: {
    sourceColumn: string;
    targetField: string;
    confidence: number;
    reason: string;
  }[];
  crossTableInfo?: CrossTableInfo;
  excludedRows: string[];
  warnings: string[];
}

/**
 * 程式規則 (第一層)
 * 使用純 TypeScript 演算法快速判定表格結構
 */
export const runHeuristicInference = (
  fileName: string,
  sheetName: string,
  matrix: any[][]
): InferredSchema => {
  const warnings: string[] = [];
  
  // 1. 偵測標頭列
  const { headerRowIndex, confidence: headerConfidence } = detectHeaderRow(matrix);
  const headers = matrix[headerRowIndex] ? matrix[headerRowIndex].map(h => String(h).trim()) : [];
  
  // 2. 欄位自動對應
  const columnMapping = suggestSchemaMapping(headers, matrix, headerRowIndex);
  
  // 3. 判斷資料類型 (monthly_summary 還是 transaction_detail)
  // 如果包含了交易序號、日期（包含日）、或大於12的月份，或者是大量明細，視為交易明細
  let dataType: 'monthly_summary' | 'transaction_detail' = 'monthly_summary';
  const mappingFields = Object.values(columnMapping);
  
  const hasTxId = mappingFields.includes('transactionId');
  const hasTxStatus = mappingFields.includes('transactionStatus');
  const hasDate = mappingFields.includes('date');
  
  if (hasTxId || hasTxStatus || (hasDate && matrix.length > 50)) {
    dataType = 'transaction_detail';
  }

  // 4. 偵測交叉表
  const dataStartRow = headerRowIndex + 1;
  const dataRows = matrix.slice(dataStartRow).filter(row => {
    // 過濾全空列
    return row.some(cell => cell !== undefined && cell !== null && String(cell).trim() !== '');
  });
  
  const crossTableInfo = detectCrossTable(headers, dataRows);
  if (crossTableInfo.isCrossTable) {
    dataType = 'monthly_summary'; // 交叉表均視為月度彙總
  }

  // 5. 判斷平台來源
  let platformVal = '未知平台';
  let platformSource: 'filename' | 'sheetname' | 'column' | 'manual' = 'manual';
  let platformConf = 50;

  // A. 是否有平台欄位
  if (mappingFields.includes('platform')) {
    platformVal = '由資料欄位動態解析';
    platformSource = 'column';
    platformConf = 95;
  } else {
    // B. 從檔案或工作表名稱推估
    const combined = `${fileName} ${sheetName}`.toLowerCase();
    if (combined.includes('line pay') || combined.includes('linepay')) {
      platformVal = 'LINE Pay愛心捐款平台';
      platformSource = 'filename';
      platformConf = 90;
    } else if (combined.includes('7-11') || combined.includes('7-eleven') || combined.includes('ibon')) {
      if (combined.includes('app')) {
        platformVal = '7-ELEVEN APP';
      } else {
        platformVal = '7-ELEVEN機台';
      }
      platformSource = 'filename';
      platformConf = 90;
    } else if (combined.includes('npo')) {
      platformVal = 'NPO Channel';
      platformSource = 'filename';
      platformConf = 90;
    } else if (combined.includes('igiving')) {
      platformVal = 'iGiving';
      platformSource = 'filename';
      platformConf = 90;
    } else if (combined.includes('taaze')) {
      platformVal = 'TAAZE';
      platformSource = 'filename';
      platformConf = 90;
    } else if (combined.includes('街口')) {
      platformVal = '街口支付';
      platformSource = 'filename';
      platformConf = 90;
    }
  }

  // 6. 整理欄位對應陣列
  const columns = headers.map(h => {
    const target = columnMapping[h] || 'ignore';
    let reason = '依據關鍵字同義詞對照';
    if (target === 'ignore') reason = '無顯著特徵，暫定忽略';
    
    return {
      sourceColumn: h,
      targetField: target,
      confidence: target === 'ignore' ? 30 : 85,
      reason
    };
  });

  // 7. 檢查警告資訊
  if (!mappingFields.includes('amount')) {
    warnings.push('未偵測到金額欄位，請手動指定。');
  }
  if (!mappingFields.includes('year') && !mappingFields.includes('date')) {
    warnings.push('未偵測到年份或交易日期，轉換時將無法鎖定統計年度。');
  }
  if (!mappingFields.includes('month') && !mappingFields.includes('date')) {
    warnings.push('未偵測到月份或交易日期，轉換時將無法鎖定統計月份。');
  }

  return {
    dataType,
    headerRow: headerRowIndex,
    dataStartRow,
    confidence: Math.min(1, Math.max(0, (headerConfidence + (mappingFields.includes('amount') ? 30 : 0) + (mappingFields.includes('platform') ? 20 : 10)) / 100)),
    platform: {
      source: platformSource,
      value: platformVal,
      confidence: platformConf
    },
    columns,
    crossTableInfo,
    excludedRows: ['總計', '合計', 'Total', 'Subtotal', 'Grand Total'],
    warnings
  };
};

/**
 * 智慧資料辨識 (結合第一層與第二層)
 */
export const runSmartSchemaInference = async (
  fileName: string,
  sheetName: string,
  matrix: any[][],
  useAI: boolean = true
): Promise<InferredSchema> => {
  // 先產出第一層程式規則結果
  const localResult = runHeuristicInference(fileName, sheetName, matrix);

  if (!useAI) {
    return localResult;
  }

  try {
    // 擷取前 20 列的去識別化數據樣本
    const headers = matrix[localResult.headerRow] ? matrix[localResult.headerRow].map(h => String(h).trim()) : [];
    const deidentifiedSamples: any[][] = [];
    const dataStart = localResult.dataStartRow;
    
    for (let r = dataStart; r < Math.min(dataStart + 20, matrix.length); r++) {
      if (matrix[r]) {
        // 去識別化：只保留型別或特徵，或是金額與日期。若包含個人敏感資料，則在此進行截斷/遮蔽
        const rowSample = matrix[r].map((cell, cIdx) => {
          const colName = String(headers[cIdx] || '').toLowerCase();
          const cellStr = String(cell || '').trim();
          
          // 如果欄位名稱包含 姓名, 電話, 身份證, 身分證, 聯絡, email, 信箱, 地址，進行去識別化遮蔽
          if (
            colName.includes('姓名') || 
            colName.includes('名字') || 
            colName.includes('電話') || 
            colName.includes('手機') || 
            colName.includes('身分') || 
            colName.includes('地址') || 
            colName.includes('mail') || 
            colName.includes('信箱') ||
            colName.includes('聯絡')
          ) {
            if (cellStr.length > 0) {
              return `${cellStr.charAt(0)}**`;
            }
            return '';
          }
          return cellStr;
        });
        deidentifiedSamples.push(rowSample);
      }
    }

    // 發送請求至 backend Gemini 辨識端點
    const response = await fetch('/api/analyze/infer-schema', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        fileName,
        sheetName,
        headers,
        samples: deidentifiedSamples,
        localHeuristics: {
          dataType: localResult.dataType,
          headerRow: localResult.headerRow,
          platform: localResult.platform,
          crossTableInfo: localResult.crossTableInfo
        }
      }),
    });

    if (!response.ok) {
      throw new Error('Gemini API 呼叫失敗，將降級為本機程式辨識');
    }

    const aiResult = await response.json();
    if (aiResult && aiResult.success && aiResult.schema) {
      // 後端驗證與回寫防護：確保必備的欄位結構存在
      const schema: InferredSchema = aiResult.schema;
      
      // 合併/修正 local Heuristics 結果，確保有 crossTableInfo 等關鍵本地資訊
      return {
        ...schema,
        crossTableInfo: localResult.crossTableInfo, // 保留本地檢測的交叉表具體結構
        confidence: Math.min(1, Math.max(0, schema.confidence > 1 ? schema.confidence / 100 : schema.confidence))
      };
    }
  } catch (err) {
    console.warn('Gemini 語意辨識失敗/未設定，已啟用本機程式規則：', err);
  }

  // 失敗或無 Key 降級：回傳本機 heuristics 結果
  return localResult;
};
