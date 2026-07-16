/**
 * 金額解析工具
 * 支援以下格式：
 * - 1,000
 * - NT$1,000
 * - $1,000
 * - 1000元
 * - 字串形式的數字
 * - 含空格或千分位符號的數字
 * 
 * 備註：
 * - 空白值不得自動視為 0，應返回 null/undefined 以供後續流程處理 (如忽略或判定缺漏)。
 * - 負數需保留其負號，代表可能退款或沖銷。
 */
export const parseAmount = (val: any): number | null => {
  if (val === undefined || val === null) {
    return null;
  }

  // 如果原本就是數字，直接返回
  if (typeof val === 'number') {
    return isNaN(val) ? null : val;
  }

  const rawStr = String(val).trim();
  if (rawStr === '') {
    return null;
  }

  // 清除常見干擾字元 (NT$, $, 元, 逗號, 空格, 等)
  // 但要保留負號 (-) 以及小數點 (.)
  const cleanedStr = rawStr
    .replace(/[Nn][Tt]\$/g, '') // 移除 NT$
    .replace(/\$/g, '')         // 移除 $
    .replace(/元/g, '')         // 移除 元
    .replace(/,/g, '')          // 移除千分位 ,
    .replace(/\s+/g, '');       // 移除所有空格

  const parsed = parseFloat(cleanedStr);
  return isNaN(parsed) ? null : parsed;
};
