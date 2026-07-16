export interface SheetProfile {
  sheetName: string;
  rowCount: number;
  colCount: number;
  previewMatrix: any[][]; // 30x30 bounding box
  emptyRows: number[];    // 0-indexed row indices that are completely empty
  emptyCols: number[];    // 0-indexed column indices that are completely empty
  possibleTitleRows: number[]; // rows with text spanning only a few columns at the top
  summaryRows: number[];  // rows containing summary keyword like 總計, 合計, Total
  nonEmptyRowsCount: number;
  nonEmptyColsCount: number;
}

/**
 * 分析工作表的前 30 列與前 30 欄，萃取出結構特徵
 */
export const profileSheet = (sheetName: string, matrix: any[][]): SheetProfile => {
  const rowCount = matrix.length;
  // 找出最大列寬
  let colCount = 0;
  matrix.forEach(r => {
    if (r.length > colCount) colCount = r.length;
  });

  const emptyRows: number[] = [];
  const emptyColsSet = new Set<number>();
  const possibleTitleRows: number[] = [];
  const summaryRows: number[] = [];

  // 1. 偵測空白列與彙總列
  matrix.forEach((row, rIdx) => {
    const isRowEmpty = row.every(val => val === undefined || val === null || String(val).trim() === '');
    if (isRowEmpty) {
      emptyRows.push(rIdx);
    } else {
      // 檢查是否是彙總列 (合計/總計)
      const rowTextCombined = row.map(v => String(v)).join(' ');
      if (
        rowTextCombined.includes('總計') ||
        rowTextCombined.includes('合計') ||
        rowTextCombined.toLowerCase().includes('total') ||
        rowTextCombined.toLowerCase().includes('grand total') ||
        rowTextCombined.toLowerCase().includes('subtotal')
      ) {
        summaryRows.push(rIdx);
      }

      // 檢查是否為可能得標題列：在前 5 列，且只有 1-2 個儲存格有字
      if (rIdx < 5) {
        const filledCells = row.filter(val => val !== undefined && val !== null && String(val).trim() !== '');
        if (filledCells.length > 0 && filledCells.length <= 2) {
          possibleTitleRows.push(rIdx);
        }
      }
    }
  });

  // 2. 偵測空白欄
  for (let c = 0; c < colCount; c++) {
    let isColEmpty = true;
    for (let r = 0; r < rowCount; r++) {
      const cellVal = matrix[r]?.[c];
      if (cellVal !== undefined && cellVal !== null && String(cellVal).trim() !== '') {
        isColEmpty = false;
        break;
      }
    }
    if (isColEmpty) {
      emptyColsSet.add(c);
    }
  }

  // 3. 截取 30x30 預覽矩陣
  const previewRows = Math.min(30, rowCount);
  const previewCols = Math.min(30, colCount);
  const previewMatrix: any[][] = [];

  for (let r = 0; r < previewRows; r++) {
    const rowData: any[] = [];
    for (let c = 0; c < previewCols; c++) {
      rowData.push(matrix[r]?.[c] ?? '');
    }
    previewMatrix.push(rowData);
  }

  return {
    sheetName,
    rowCount,
    colCount,
    previewMatrix,
    emptyRows,
    emptyCols: Array.from(emptyColsSet),
    possibleTitleRows,
    summaryRows,
    nonEmptyRowsCount: rowCount - emptyRows.length,
    nonEmptyColsCount: colCount - emptyColsSet.size
  };
};
