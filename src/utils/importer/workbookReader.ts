import * as XLSX from 'xlsx';

export interface SheetData {
  name: string;
  matrix: any[][]; // 2D grid representation
}

export interface WorkbookData {
  fileName: string;
  sheetNames: string[];
  sheets: Record<string, any[][]>;
}

/**
 * 讀取 Excel / CSV 檔案，將所有工作表轉換為 2D 矩陣
 */
export const readWorkbook = (file: File): Promise<WorkbookData> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        if (!data) {
          return reject(new Error('無法讀取檔案內容'));
        }

        const sheets: Record<string, any[][]> = {};
        let sheetNames: string[] = [];

        if (file.name.endsWith('.csv')) {
          // CSV 處理
          const text = new TextDecoder('utf-8').decode(new Uint8Array(data as ArrayBuffer));
          const lines = text.split('\n');
          const matrix: any[][] = lines.map(line => {
            // 處理雙引號與逗號的 CSV 規則
            const row: string[] = [];
            let inQuotes = false;
            let currentCell = '';
            
            for (let i = 0; i < line.length; i++) {
              const char = line[i];
              if (char === '"') {
                inQuotes = !inQuotes;
              } else if (char === ',' && !inQuotes) {
                row.push(currentCell.trim());
                currentCell = '';
              } else {
                currentCell += char;
              }
            }
            row.push(currentCell.trim());
            return row;
          });

          const defaultSheetName = 'CSV_Data';
          sheetNames = [defaultSheetName];
          sheets[defaultSheetName] = matrix;
        } else {
          // Excel 處理
          const workbook = XLSX.read(new Uint8Array(data as ArrayBuffer), { type: 'array' });
          sheetNames = workbook.SheetNames;
          
          sheetNames.forEach(name => {
            const worksheet = workbook.Sheets[name];
            // header: 1 代表將工作表轉換為 2D Array [ [cell1, cell2], [cell3, cell4] ]
            // defval: "" 代表空值填入空字串而非 undefined，保持格子數對齊
            const matrix = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' }) as any[][];
            sheets[name] = matrix;
          });
        }

        resolve({
          fileName: file.name,
          sheetNames,
          sheets
        });
      } catch (err) {
        reject(err);
      }
    };

    reader.onerror = (err) => reject(err);
    reader.readAsArrayBuffer(file);
  });
};
