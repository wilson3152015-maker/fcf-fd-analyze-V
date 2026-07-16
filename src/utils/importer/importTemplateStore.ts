import { ImportTemplate } from '../../types/donation';

const STORAGE_KEY = 'tcf_donation_import_templates';

// 預置常見範本，方便一開始就能套用
const DEFAULT_TEMPLATES: ImportTemplate[] = [
  {
    id: 'tpl_standard',
    name: '台癌標準長格式範本',
    platform: '所有平台',
    sheetSelectionRule: 'first',
    headerRow: 0,
    dataStartRow: 1,
    columnMapping: {
      'year': 'year',
      'month': 'month',
      'platform': 'platform',
      'amount': 'amount',
      '西元': 'year',
      '年度': 'year',
      '月份': 'month',
      '平台': 'platform',
      '管道': 'platform',
      '金額': 'amount',
      '捐款金額': 'amount'
    },
    rowsToExclude: ['總計', '合計']
  },
  {
    id: 'tpl_linepay_detail',
    name: 'LINE Pay 交易明細範本',
    platform: 'LINE Pay愛心捐款平台',
    sheetSelectionRule: 'first',
    headerRow: 3, // 假設前面有一些報表標題
    dataStartRow: 4,
    columnMapping: {
      '交易完成時間': 'date',
      '實付金額': 'amount',
      '交易序號': 'transactionId',
      '訂單結果': 'transactionStatus',
      '專案名稱': 'campaign'
    },
    rowsToExclude: ['合計', '總計']
  }
];

export const loadTemplates = (): ImportTemplate[] => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      // 首次加載，將預置範本存入
      saveTemplates(DEFAULT_TEMPLATES);
      return DEFAULT_TEMPLATES;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('無法讀取匯入範本：', err);
    return DEFAULT_TEMPLATES;
  }
};

export const saveTemplates = (templates: ImportTemplate[]): void => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates));
  } catch (err) {
    console.error('無法儲存匯入範本：', err);
  }
};

export const addTemplate = (template: Omit<ImportTemplate, 'id'>): ImportTemplate => {
  const templates = loadTemplates();
  const newTpl: ImportTemplate = {
    ...template,
    id: `tpl_${Date.now()}`
  };
  templates.push(newTpl);
  saveTemplates(templates);
  return newTpl;
};

export const deleteTemplate = (id: string): void => {
  const templates = loadTemplates();
  const filtered = templates.filter(t => t.id !== id);
  saveTemplates(filtered);
};

/**
 * 依據檔名或工作表內容，尋找最相似並符合的範本
 */
export const findMatchingTemplate = (
  fileName: string,
  headers: string[]
): ImportTemplate | null => {
  const templates = loadTemplates();
  const lowerFileName = fileName.toLowerCase();

  // 1. 優先匹配檔名關鍵字
  for (const tpl of templates) {
    if (tpl.platform !== '所有平台' && lowerFileName.includes(tpl.platform.toLowerCase())) {
      return tpl;
    }
  }

  // 2. 匹配欄位符合度
  let bestTemplate: ImportTemplate | null = null;
  let highestMatchCount = 0;

  for (const tpl of templates) {
    let matchCount = 0;
    const tplKeys = Object.keys(tpl.columnMapping);

    headers.forEach(h => {
      if (tplKeys.includes(h)) {
        matchCount++;
      }
    });

    if (matchCount > highestMatchCount && matchCount >= 2) {
      highestMatchCount = matchCount;
      bestTemplate = tpl;
    }
  }

  return bestTemplate;
};
