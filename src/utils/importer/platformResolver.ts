import { PlatformMapping } from '../../types/donation';

// 預設平台對照對應表（做為後備）
export const DEFAULT_PLATFORM_MAPPINGS: PlatformMapping[] = [
  { original: 'LINE Pay愛心捐款平台', standard: 'LINE Pay愛心捐款平台', channelGroup: '電支' },
  { original: 'LINE Pay', standard: 'LINE Pay愛心捐款平台', channelGroup: '電支' },
  { original: '7-ELEVEN機台', standard: '7-ELEVEN機台', channelGroup: '超商' },
  { original: '7-11', standard: '7-ELEVEN機台', channelGroup: '超商' },
  { original: '7-ELEVEN APP', standard: '7-ELEVEN APP', channelGroup: '超商' },
  { original: '7-11 app', standard: '7-ELEVEN APP', channelGroup: '超商' },
  { original: 'NPO Channel', standard: 'NPO Channel', channelGroup: '網頁' },
  { original: 'iGiving', standard: 'iGiving', channelGroup: '網頁' },
  { original: 'TAAZE', standard: 'TAAZE', channelGroup: '網頁' }
];

export const PLATFORM_SYMBOLS: Record<string, { standard: string; group: string }> = {
  'linepay': { standard: 'LINE Pay愛心捐款平台', group: '電支' },
  'line pay': { standard: 'LINE Pay愛心捐款平台', group: '電支' },
  '7-11': { standard: '7-ELEVEN機台', group: '超商' },
  '7-eleven': { standard: '7-ELEVEN機台', group: '超商' },
  'ibon': { standard: '7-ELEVEN機台', group: '超商' },
  '手機app': { standard: '7-ELEVEN APP', group: '超商' },
  'app': { standard: '7-ELEVEN APP', group: '超商' },
  'npo': { standard: 'NPO Channel', group: '網頁' },
  'igiving': { standard: 'iGiving', group: '網頁' },
  'taaze': { standard: 'TAAZE', group: '網頁' },
  '街口': { standard: '街口支付', group: '電支' },
  'jkopay': { standard: '街口支付', group: '電支' }
};

export interface ResolvedPlatform {
  original: string;
  standard: string;
  group: string;
  confidence: number; // 0-100
}

/**
 * 依據原始平台名稱或對照規則解析標準名稱與群組
 */
export const resolvePlatform = (
  rawName: string,
  mappings: PlatformMapping[] = []
): ResolvedPlatform => {
  const name = String(rawName || '').trim();
  if (!name) {
    return { original: '', standard: '未知平台', group: '待確認群組', confidence: 0 };
  }

  // 1. 比對傳入的自訂 Mappings 規則 (最優先)
  const exactMatch = mappings.find(m => m.original.toLowerCase() === name.toLowerCase());
  if (exactMatch) {
    return {
      original: name,
      standard: exactMatch.standard,
      group: exactMatch.channelGroup,
      confidence: 100
    };
  }

  // 2. 模糊關鍵字匹配
  const lowerName = name.toLowerCase();
  for (const [key, val] of Object.entries(PLATFORM_SYMBOLS)) {
    if (lowerName.includes(key)) {
      return {
        original: name,
        standard: val.standard,
        group: val.group,
        confidence: 90
      };
    }
  }

  // 3. 預設平台對照匹配 (後備)
  const defaultMatch = DEFAULT_PLATFORM_MAPPINGS.find(m => m.original.toLowerCase() === name.toLowerCase());
  if (defaultMatch) {
    return {
      original: name,
      standard: defaultMatch.standard,
      group: defaultMatch.channelGroup,
      confidence: 95
    };
  }

  // 4. 無法識別，保留原始名稱
  return {
    original: name,
    standard: name,
    group: '待確認群組',
    confidence: 50
  };
};

/**
 * 針對沒有「平台」欄位的報表，從檔案名稱與工作表名稱推估其平台
 */
export const inferPlatformFromContext = (
  fileName: string,
  sheetName: string
): ResolvedPlatform | null => {
  const combined = `${fileName} ${sheetName}`.toLowerCase();

  for (const [key, val] of Object.entries(PLATFORM_SYMBOLS)) {
    if (combined.includes(key)) {
      return {
        original: key.toUpperCase(),
        standard: val.standard,
        group: val.group,
        confidence: 85
      };
    }
  }

  return null;
};
