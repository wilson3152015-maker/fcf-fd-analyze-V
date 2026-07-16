import React, { useState, useRef, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { PlatformMapping, NormalizedDonationRecord } from '../types/donation';
import { 
  FileSpreadsheet, 
  Globe, 
  UploadCloud, 
  CheckCircle2, 
  AlertCircle, 
  Database, 
  HelpCircle, 
  RefreshCw, 
  Settings, 
  ChevronRight, 
  Sparkles, 
  ArrowRight,
  Sliders,
  Table,
  Check,
  AlertTriangle,
  FileText
} from 'lucide-react';

// 導入智慧匯入模組
import { readWorkbook, WorkbookData } from '../utils/importer/workbookReader';
import { profileSheet, SheetProfile } from '../utils/importer/sheetProfiler';
import { runSmartSchemaInference, InferredSchema } from '../utils/importer/schemaInference';
import { normalizeData, NormalizationResult } from '../utils/importer/dataNormalizer';
import { loadTemplates, addTemplate, findMatchingTemplate } from '../utils/importer/importTemplateStore';

interface DataIntegratorProps {
  mappings: PlatformMapping[];
  onDataLoaded: (records: NormalizedDonationRecord[], fileName: string, unmappedPlatforms: string[]) => void;
  onResetToMock: () => void;
  showTechnical?: boolean;
  onSwitchTab?: (tab: 'analysis' | 'import' | 'settings') => void;
}

export const DataIntegrator: React.FC<DataIntegratorProps> = ({
  mappings,
  onDataLoaded,
  onResetToMock,
  showTechnical = true,
  onSwitchTab,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'gsheet' | 'mock'>('upload');
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingPhase, setLoadingPhase] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // 1. 核心檔案與工作表狀態
  const [workbookData, setWorkbookData] = useState<WorkbookData | null>(null);
  const [selectedSheet, setSelectedSheet] = useState<string>('');
  const [sheetProfile, setSheetProfile] = useState<SheetProfile | null>(null);
  
  // 2. 智慧辨識結果 (Inferred Schema)
  const [inferredSchema, setInferredSchema] = useState<InferredSchema | null>(null);
  
  // 3. 使用者可互動微調狀態
  const [manualDataType, setManualDataType] = useState<'monthly_summary' | 'transaction_detail'>('monthly_summary');
  const [manualHeaderRow, setManualHeaderRow] = useState<number>(0);
  const [manualDataStartRow, setManualDataStartRow] = useState<number>(1);
  const [manualPlatformSelection, setManualPlatformSelection] = useState<string>('all_platforms_column');
  const [columnMappings, setColumnMappings] = useState<Record<string, string>>({}); // originalCol -> targetField
  const [useAIInference, setUseAIInference] = useState<boolean>(true);
  const [saveAsTemplate, setSaveAsTemplate] = useState<boolean>(false);
  const [newTemplateName, setNewTemplateName] = useState<string>('');

  // 4. 計算後與核對狀態 (動態預覽)
  const [normalizationResult, setNormalizationResult] = useState<NormalizationResult | null>(null);

  // Google Sheets states
  const [sheetUrl, setSheetUrl] = useState('https://docs.google.com/spreadsheets/d/1tcf-fundraising-data-2026/edit');
  const [gSheetName, setGSheetName] = useState('115年小額募款彙總');

  const fileInputRef = useRef<HTMLInputElement>(null);

  // 當選擇的 sheet 或標頭列等手動條件變更時，自動更新 preview 和 mapping 基礎
  useEffect(() => {
    if (!workbookData || !selectedSheet) return;
    
    const matrix = workbookData.sheets[selectedSheet];
    if (!matrix) return;

    // 重新 profile 該 sheet
    const profile = profileSheet(selectedSheet, matrix);
    setSheetProfile(profile);

    // 觸發智慧偵測 (預設先用 programmatic 檢測)
    triggerSchemaInference(selectedSheet, matrix);
  }, [selectedSheet, workbookData]);

  // 當手動微調欄位對應、資料類型或標頭列時，即時運算 NormalizationResult 作為動態回饋
  useEffect(() => {
    if (!workbookData || !selectedSheet || !inferredSchema) return;

    const matrix = workbookData.sheets[selectedSheet];
    if (!matrix) return;

    try {
      const res = normalizeData(
        matrix,
        manualHeaderRow,
        columnMappings,
        manualDataType,
        mappings,
        workbookData.fileName,
        selectedSheet,
        manualPlatformSelection === 'all_platforms_column' ? undefined : manualPlatformSelection,
        inferredSchema.crossTableInfo
      );
      setNormalizationResult(res);
    } catch (err) {
      console.error('即時對帳計算出錯', err);
    }
  }, [columnMappings, manualDataType, manualHeaderRow, manualDataStartRow, manualPlatformSelection, inferredSchema, selectedSheet, workbookData, mappings]);

  // 執行智慧辨識 (第一層 Heuristic ＋ 第二層 Gemini)
  const triggerSchemaInference = async (sheet: string, matrix: any[][]) => {
    setIsLoading(true);
    setLoadingPhase('正在分析工作表結構...');
    setErrorMsg('');

    try {
      // 呼叫包含 Heuristics 與 Gemini 的智慧辨識模組
      const schema = await runSmartSchemaInference(
        workbookData?.fileName || 'uploaded_file.xlsx',
        sheet,
        matrix,
        useAIInference
      );

      setInferredSchema(schema);
      
      // 將偵測結果同步到使用者的可調狀態中
      setManualDataType(schema.dataType);
      setManualHeaderRow(schema.headerRow);
      setManualDataStartRow(schema.dataStartRow);
      
      // 同步欄位對應
      const initialMappings: Record<string, string> = {};
      schema.columns.forEach(col => {
        initialMappings[col.sourceColumn] = col.targetField;
      });
      setColumnMappings(initialMappings);

      // 同步平台
      if (schema.platform.source === 'column') {
        setManualPlatformSelection('all_platforms_column');
      } else {
        // 如果偵測到特定平台，嘗試匹配到 mappings 中
        const found = mappings.some(m => m.standard === schema.platform.value);
        if (found) {
          setManualPlatformSelection(schema.platform.value);
        } else {
          setManualPlatformSelection('all_platforms_column');
        }
      }

    } catch (err: any) {
      setErrorMsg(`結構辨識失敗：${err.message}`);
    } finally {
      setIsLoading(false);
      setLoadingPhase('');
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setErrorMsg('');
    setSuccessMsg('');

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await loadWorkbookFile(files[0]);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg('');
    setSuccessMsg('');
    const files = e.target.files;
    if (files && files.length > 0) {
      await loadWorkbookFile(files[0]);
    }
  };

  // 1. 載入活頁簿
  const loadWorkbookFile = async (file: File) => {
    setIsLoading(true);
    setLoadingPhase('正在讀取試算表檔案...');
    try {
      const data = await readWorkbook(file);
      setWorkbookData(data);
      // 預設先選取第一個工作表
      if (data.sheetNames.length > 0) {
        setSelectedSheet(data.sheetNames[0]);
      }
      setSuccessMsg(`📂 成功載入檔案「${file.name}」，請確認下方結構對位與對帳狀態。`);
    } catch (err: any) {
      setErrorMsg(`檔案讀取失敗：${err.message}`);
      setIsLoading(false);
    } finally {
      setLoadingPhase('');
    }
  };

  // 2. 變更欄位對應
  const handleColumnMappingChange = (originalCol: string, targetField: string) => {
    setColumnMappings(prev => ({
      ...prev,
      [originalCol]: targetField
    }));
  };

  // 3. 確認匯入
  const handleConfirmImport = () => {
    if (!normalizationResult || normalizationResult.records.length === 0) {
      setErrorMsg('無有效數據可匯入，請檢查欄位對照是否正確。');
      return;
    }

    // 處理範本儲存
    if (saveAsTemplate) {
      const templateName = newTemplateName.trim() || `${workbookData?.fileName} 匯入範本`;
      try {
        addTemplate({
          name: templateName,
          platform: manualPlatformSelection === 'all_platforms_column' ? '多平台複合格式' : manualPlatformSelection,
          sheetSelectionRule: 'name_match',
          headerRow: manualHeaderRow,
          dataStartRow: manualDataStartRow,
          columnMapping: columnMappings,
          rowsToExclude: ['總計', '合計']
        });
      } catch (err) {
        console.warn('儲存範本時發生錯誤', err);
      }
    }

    // 將資料送回 App 主狀態
    onDataLoaded(
      normalizationResult.records,
      workbookData?.fileName || '未命名檔案',
      normalizationResult.unmappedPlatforms
    );

    setSuccessMsg(`🎉 成功匯入「${workbookData?.fileName}」共 ${normalizationResult.records.length} 筆標準化資料！對帳淨額 NT$ ${Math.round(normalizationResult.calculatedTotal).toLocaleString()}`);
    
    // 清空暫存，返回上傳區
    setWorkbookData(null);
    setSheetProfile(null);
    setInferredSchema(null);
    setNormalizationResult(null);
  };

  // Google Sheets 讀取
  const handleConnectGoogleSheets = async () => {
    if (!sheetUrl.trim()) return;
    setIsLoading(true);
    setLoadingPhase('正在連結 Google Sheets...');
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const response = await fetch('/api/gsheets/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ spreadsheetUrl: sheetUrl, sheetName: gSheetName }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || '連結 Google Sheets 發生錯誤');
      }

      // 我們把 gsheets 數據模擬包裝成 WorkbookData，啟用相同的「智慧對對碰確認流」！
      // 這非常強大，因為 user 連接 gsheet 後，一樣能對位！
      const headerRow = 0;
      const dataRows = result.data.map((r: any) => [
        r.year || '',
        r.month || '',
        r.platform || '',
        r.amount || ''
      ]);
      const matrix = [
        ['年度', '月份', '平台', '金額'],
        ...dataRows
      ];

      const customGSheetData: WorkbookData = {
        fileName: `Google Sheets: ${gSheetName}`,
        sheetNames: [gSheetName],
        sheets: {
          [gSheetName]: matrix
        }
      };

      setWorkbookData(customGSheetData);
      setSelectedSheet(gSheetName);
      setSuccessMsg(`✅ 成功連線 Google Sheets！請於下方確認欄位解析設定。`);
    } catch (err: any) {
      setErrorMsg(`Google Sheets 連線錯誤: ${err.message}`);
    } finally {
      setIsLoading(false);
      setLoadingPhase('');
    }
  };

  // 取消匯入
  const handleCancel = () => {
    setWorkbookData(null);
    setSheetProfile(null);
    setInferredSchema(null);
    setNormalizationResult(null);
    setErrorMsg('');
  };

  // 取得不重複的平台列表
  const uniqueStandardPlatforms = useMemo(() => {
    const list = mappings.map(m => m.standard);
    return Array.from(new Set(list));
  }, [mappings]);

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-brand-border-light overflow-hidden font-sans">
      
      {/* 整合標頭選項卡 - Natural Tones */}
      {!workbookData && (
        <div className="flex border-b border-brand-border-light bg-brand-bg/30">
          <button
            onClick={() => { setActiveTab('upload'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'upload'
                ? 'border-brand-primary text-brand-primary bg-white font-semibold'
                : 'border-transparent text-brand-muted hover:text-brand-heading hover:bg-brand-bg/20'
            }`}
          >
            <UploadCloud className="h-4 w-4" />
            上傳每月總表 (Excel / CSV)
          </button>
          <button
            onClick={() => { setActiveTab('gsheet'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'gsheet'
                ? 'border-brand-primary text-brand-primary bg-white font-semibold'
                : 'border-transparent text-brand-muted hover:text-brand-heading hover:bg-brand-bg/20'
            }`}
          >
            <Globe className="h-4 w-4" />
            連接 Google Sheets 試算表
          </button>
          <button
            onClick={() => { setActiveTab('mock'); setErrorMsg(''); setSuccessMsg(''); }}
            className={`flex items-center gap-2 px-6 py-4 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
              activeTab === 'mock'
                ? 'border-brand-primary text-brand-primary bg-white font-semibold'
                : 'border-transparent text-brand-muted hover:text-brand-heading hover:bg-brand-bg/20'
            }`}
          >
            <Database className="h-4 w-4" />
            系統預設範例資料庫
          </button>
        </div>
      )}

      {workbookData && (
        <div className="bg-brand-bg/50 px-6 py-4 border-b border-brand-border-light flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <FileSpreadsheet className="h-5 w-5 text-brand-primary shrink-0" />
            <div>
              <span className="text-xs text-brand-muted font-medium">現正對齊檔案：</span>
              <h4 className="text-sm font-bold text-brand-heading">{workbookData.fileName}</h4>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCancel}
              className="px-4 py-1.5 border border-brand-border-medium rounded-full text-brand-muted hover:text-brand-heading hover:bg-brand-border-light text-xs font-semibold cursor-pointer transition-colors"
            >
              取消並重選
            </button>
          </div>
        </div>
      )}

      <div className="p-6 sm:p-8">
        
        {/* 反饋訊息 */}
        {errorMsg && (
          <div className="mb-4 bg-red-50 border border-red-200 text-red-950 text-xs p-4 rounded-2xl flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-red-700" />
            <span>{errorMsg}</span>
          </div>
        )}
        {successMsg && (
          <div className="mb-4 bg-brand-bg border border-brand-border-medium text-brand-primary text-xs p-4 rounded-2xl flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-brand-primary" />
            <span className="font-medium">{successMsg}</span>
          </div>
        )}

        {/* 載入中狀態 */}
        {isLoading && (
          <div className="py-12 flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="h-8 w-8 text-brand-primary animate-spin" />
            <div className="text-center">
              <p className="text-sm font-semibold text-brand-heading">{loadingPhase}</p>
              <p className="text-xs text-brand-muted mt-1">智慧分析進行中，結合 AI 與程式常規品質對位...</p>
            </div>
          </div>
        )}

        {!isLoading && (
          <>
            {/* TAB 1: UPLOAD */}
            {!workbookData && activeTab === 'upload' && (
              <div className="space-y-4">
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-brand-primary bg-brand-bg/50 shadow-inner'
                      : 'border-brand-border-medium hover:border-brand-primary hover:bg-brand-bg/10'
                  }`}
                >
                  <UploadCloud className="h-12 w-12 text-brand-muted mb-4" />
                  <p className="text-sm font-bold text-brand-heading">拖放小額募款原始報表至此，或點選瀏覽</p>
                  <p className="text-xs text-brand-muted mt-1.5">支援 Excel (.xlsx, .xls) 或 CSV 檔案</p>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileChange}
                    accept=".xlsx,.xls,.csv"
                    className="hidden"
                  />
                </div>

                {/* AI 強化選項 */}
                <div className="flex items-center justify-between p-4 rounded-2xl bg-brand-bg/30 border border-brand-border-light">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-brand-primary/10 rounded-xl">
                      <Sparkles className="h-4 w-4 text-brand-primary" />
                    </div>
                    <div>
                      <h5 className="text-xs font-bold text-brand-heading">啟用 Gemini 雲端語意輔助辨識 (第二層)</h5>
                      <p className="text-[10px] text-brand-muted italic mt-0.5">當原始欄位命名極度混亂、含有空行或非標準結構時，自動呼叫大模型去識別化對位。</p>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={useAIInference}
                      onChange={(e) => setUseAIInference(e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-brand-border-medium peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-primary"></div>
                  </label>
                </div>
              </div>
            )}

            {/* TAB 2: GOOGLE SHEETS */}
            {!workbookData && activeTab === 'gsheet' && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                      Google Sheets 試算表網址 (Spreadsheet URL)
                    </label>
                    <input
                      type="text"
                      value={sheetUrl}
                      onChange={(e) => setSheetUrl(e.target.value)}
                      placeholder="https://docs.google.com/spreadsheets/d/..."
                      className="block w-full rounded-xl border border-brand-border-medium text-brand-text bg-brand-bg/20 focus:bg-white focus:ring-brand-primary focus:border-brand-primary text-xs p-3 outline-none transition-all font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                      指定工作表名稱 (Sheet Name)
                    </label>
                    <input
                      type="text"
                      value={gSheetName}
                      onChange={(e) => setGSheetName(e.target.value)}
                      placeholder="例如: 115年小額募款彙總"
                      className="block w-full rounded-xl border border-brand-border-medium text-brand-text bg-brand-bg/20 focus:bg-white focus:ring-brand-primary focus:border-brand-primary text-xs p-3 outline-none transition-all"
                    />
                  </div>
                </div>

                <button
                  onClick={handleConnectGoogleSheets}
                  disabled={isLoading || !sheetUrl.trim()}
                  className="w-full sm:w-auto inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-xs font-bold rounded-full text-white bg-brand-primary hover:bg-brand-primary/90 disabled:bg-brand-border-medium transition-colors cursor-pointer shadow-xs"
                >
                  確認連線並匯入工作表
                </button>
              </div>
            )}

            {/* TAB 3: MOCK DATA */}
            {!workbookData && activeTab === 'mock' && (
              <div className="space-y-4 text-center py-6">
                <Database className="h-12 w-12 text-brand-muted mx-auto animate-pulse" />
                <div className="max-w-md mx-auto space-y-2">
                  <p className="text-sm font-bold text-brand-heading">一鍵加載民國 114 年與 115 年官方募款資料庫</p>
                  <p className="text-xs text-brand-muted leading-relaxed">
                    此選項將會清除任何自訂上傳，重置並加載官方模擬 114 年 1-12 月與 115 年 1-4 月 (含有 LINE Pay 暴增行銷、7-ELEVEN 機台/APP 等管道) 的完整真實同期對比測試資料。
                  </p>
                </div>
                <button
                  onClick={() => {
                    onResetToMock();
                    setSuccessMsg('🎉 成功重置資料！已加載台癌官方 114/115 年標準對比資料庫。');
                  }}
                  className="inline-flex items-center justify-center px-6 py-2.5 border border-transparent text-xs font-bold rounded-full text-white bg-brand-primary hover:bg-brand-primary/90 cursor-pointer shadow-xs transition-colors"
                >
                  加載台癌標準範例資料庫
                </button>
              </div>
            )}

            {/* 智慧校正對位面板 (Multi-step confirmation state) */}
            {workbookData && sheetProfile && inferredSchema && (
              <div className="space-y-8 mt-4 animate-fade-in">
                
                {/* 步驟標籤與工作表選擇 (如果有多個工作表) */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start bg-brand-bg/20 p-5 rounded-2xl border border-brand-border-light">
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                      工作表選取 (Active Sheet)
                    </label>
                    <select
                      value={selectedSheet}
                      onChange={(e) => setSelectedSheet(e.target.value)}
                      className="block w-full rounded-xl border border-brand-border-medium text-brand-text bg-white text-xs p-2.5 outline-none font-medium"
                    >
                      {workbookData.sheetNames.map(name => (
                        <option key={name} value={name}>{name}</option>
                      ))}
                    </select>
                    <p className="text-[10px] text-brand-muted mt-1.5 italic">此試算表共含有 {workbookData.sheetNames.length} 個工作表</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                      資料類型 (DataType / Level)
                    </label>
                    <div className="flex bg-white rounded-xl border border-brand-border-medium p-1">
                      <button
                        type="button"
                        onClick={() => setManualDataType('monthly_summary')}
                        className={`flex-1 text-center py-1 text-[10px] font-bold rounded-lg transition-all ${
                          manualDataType === 'monthly_summary'
                            ? 'bg-brand-primary text-white'
                            : 'text-brand-muted hover:text-brand-heading'
                        }`}
                      >
                        月度彙總表
                      </button>
                      <button
                        type="button"
                        onClick={() => setManualDataType('transaction_detail')}
                        className={`flex-1 text-center py-1 text-[10px] font-bold rounded-lg transition-all ${
                          manualDataType === 'transaction_detail'
                            ? 'bg-brand-primary text-white'
                            : 'text-brand-muted hover:text-brand-heading'
                        }`}
                      >
                        明細流水表
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                      標準化平台解讀 (Platform Inference)
                    </label>
                    <div className="bg-white p-2.5 rounded-xl border border-brand-border-medium text-xs font-bold text-brand-heading flex items-center gap-1.5 min-h-[38px]">
                      <Table className="h-4 w-4 text-brand-primary" />
                      {manualPlatformSelection === 'all_platforms_column' ? '多通路/含有平台資料列' : manualPlatformSelection}
                    </div>
                    <p className="text-[10px] text-brand-muted mt-1.5 italic">系統已智慧偵測解讀基準軸平台</p>
                  </div>
                </div>

                {/* 報表微調對位參數 與 欄位對應細部設定 (進階/技術細節) */}
                {showTechnical ? (
                  <>
                    <div className="bg-white p-6 rounded-2xl border border-brand-border-medium space-y-4">
                      <h4 className="text-xs font-bold uppercase tracking-wider text-brand-heading flex items-center gap-1.5">
                        <Sliders className="h-4 w-4 text-brand-primary" />
                        表格範圍與平台解讀對位 (結構校對)
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <div>
                          <label className="block text-[11px] font-semibold text-brand-muted mb-1.5">
                            標頭標題列 (Header Row Index)
                          </label>
                          <select
                            value={manualHeaderRow}
                            onChange={(e) => {
                              const idx = parseInt(e.target.value, 10);
                              setManualHeaderRow(idx);
                              setManualDataStartRow(idx + 1);
                            }}
                            className="block w-full rounded-xl border border-brand-border-medium text-brand-text text-xs p-2 outline-none"
                          >
                            {Array.from({ length: Math.min(10, sheetProfile.rowCount) }).map((_, i) => (
                              <option key={i} value={i}>第 {i + 1} 列 (Index {i})</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-brand-muted mb-1.5">
                            資料起始列 (Data Start Row Index)
                          </label>
                          <select
                            value={manualDataStartRow}
                            onChange={(e) => setManualDataStartRow(parseInt(e.target.value, 10))}
                            className="block w-full rounded-xl border border-brand-border-medium text-brand-text text-xs p-2 outline-none"
                          >
                            {Array.from({ length: Math.min(15, sheetProfile.rowCount) }).map((_, i) => {
                              if (i <= manualHeaderRow) return null;
                              return <option key={i} value={i}>第 {i + 1} 列 (Index {i})</option>;
                            })}
                          </select>
                        </div>

                        <div>
                          <label className="block text-[11px] font-semibold text-brand-muted mb-1.5">
                            檔案對應募款平台
                          </label>
                          <select
                            value={manualPlatformSelection}
                            onChange={(e) => setManualPlatformSelection(e.target.value)}
                            className="block w-full rounded-xl border border-brand-border-medium text-brand-text text-xs p-2 outline-none font-medium"
                          >
                            <option value="all_platforms_column">多通路/含平台資料列 (動態欄位解析)</option>
                            {uniqueStandardPlatforms.map(std => (
                              <option key={std} value={std}>{std}</option>
                            ))}
                          </select>
                        </div>
                      </div>

                      {/* 警告列表 */}
                      {inferredSchema.warnings.length > 0 && (
                        <div className="bg-amber-50 border border-amber-200 text-amber-950 p-3 rounded-xl flex flex-col gap-1 text-[10px]">
                          <span className="font-bold flex items-center gap-1 text-amber-700">
                            <AlertTriangle className="h-3.5 w-3.5" /> 智慧對位偵測到潛在問題：
                          </span>
                          <ul className="list-disc pl-4 space-y-0.5 font-medium">
                            {inferredSchema.warnings.map((w, idx) => (
                              <li key={idx}>{w}</li>
                            ))}
                          </ul>
                        </div>
                      )}

                      {/* 交叉表提示 */}
                      {inferredSchema.crossTableInfo?.isCrossTable && (
                        <div className="bg-brand-bg/50 border border-brand-border-medium p-3.5 rounded-xl flex items-start gap-2.5 text-xs">
                          <Table className="h-4 w-4 text-brand-primary shrink-0 mt-0.5" />
                          <div>
                            <strong className="text-brand-primary">自動偵測到交叉矩陣結構 (Cross-Tabulated)</strong>
                            <p className="text-[10px] text-brand-muted mt-0.5">
                              系統判定此工作表以**「{inferredSchema.crossTableInfo.pivotColumnName}」**為基準軸，橫向展開了共 {inferredSchema.crossTableInfo.dynamicHeaderFields.length} 個動態欄位 ({inferredSchema.crossTableInfo.dynamicHeaderFields.join(', ')})。
                              確認匯入時，系統將會**自動解鎖平坦化 (Unpivot)** 轉換為長格式！
                            </p>
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="bg-white rounded-2xl border border-brand-border-medium overflow-hidden">
                      <div className="px-6 py-4 border-b border-brand-border-light bg-brand-bg/20 flex justify-between items-center">
                        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-heading flex items-center gap-1.5">
                          <Settings className="h-4 w-4 text-brand-primary" />
                          欄位映射與型別配置 (Column Schema Mapping)
                        </h4>
                        <span className="text-[10px] text-brand-muted italic font-medium">點選右側下拉選單可手動變更欄位定義</span>
                      </div>
                      
                      <div className="divide-y divide-brand-border-light text-xs max-h-[350px] overflow-y-auto">
                        <div className="grid grid-cols-12 gap-4 px-6 py-2 bg-brand-bg/10 font-bold text-brand-muted text-[10px]">
                          <div className="col-span-4">原始試算表欄位</div>
                          <div className="col-span-4">目標標準資料庫欄位</div>
                          <div className="col-span-4">首列數據樣本 / 辨識依據</div>
                        </div>

                        {inferredSchema.columns.map((col, idx) => {
                          const curMapped = columnMappings[col.sourceColumn] || 'ignore';
                          const sampleVal = workbookData.sheets[selectedSheet]?.[manualHeaderRow + 1]?.[idx] ?? '';

                          return (
                            <div key={idx} className="grid grid-cols-12 gap-4 px-6 py-3 items-center hover:bg-brand-bg/5 transition-colors">
                              <div className="col-span-4 font-semibold text-brand-heading flex items-center gap-1.5">
                                <span className="w-4 h-4 bg-brand-bg border border-brand-border-medium rounded flex items-center justify-center font-mono text-[9px] text-brand-muted">
                                  {idx + 1}
                                </span>
                                <span className="truncate" title={col.sourceColumn}>{col.sourceColumn}</span>
                              </div>

                              <div className="col-span-4">
                                <select
                                  value={curMapped}
                                  onChange={(e) => handleColumnMappingChange(col.sourceColumn, e.target.value)}
                                  className={`block w-full rounded-xl border text-[11px] p-2 outline-none font-medium transition-colors ${
                                    curMapped === 'ignore'
                                      ? 'border-brand-border-medium bg-brand-bg/20 text-brand-muted'
                                      : 'border-brand-primary/50 text-brand-primary bg-white'
                                  }`}
                                >
                                  <option value="ignore">忽略此欄 (Ignore)</option>
                                  <option value="year">西元年度 (Year - CE)</option>
                                  <option value="rocYear">民國年度 (RocYear - ROC)</option>
                                  <option value="month">月份 (Month 1-12)</option>
                                  <option value="date">完整日期 (Date - YYYY-MM-DD)</option>
                                  <option value="platform">原始平台 (Platform Original)</option>
                                  <option value="amount">捐款金額 (Amount - Net)</option>
                                  {manualDataType === 'transaction_detail' && (
                                    <>
                                      <option value="transactionId">交易訂單編號 (Transaction ID)</option>
                                      <option value="transactionStatus">交易付款狀態 (Status)</option>
                                      <option value="campaign">專案/活動用途 (Campaign)</option>
                                    </>
                                  )}
                                </select>
                              </div>

                              <div className="col-span-4 flex flex-col justify-center">
                                <span className="text-[10px] font-mono text-brand-heading truncate" title={String(sampleVal)}>
                                  樣本: {sampleVal ? String(sampleVal) : <span className="text-gray-300 italic">(空)</span>}
                                </span>
                                <span className="text-[9px] text-brand-muted italic mt-0.5 truncate" title={col.reason}>
                                  {col.reason}
                                </span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="bg-brand-bg/60 border border-brand-border-medium p-4.5 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between text-xs font-semibold text-brand-heading gap-3 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <Sparkles className="h-5 w-5 text-brand-primary shrink-0 animate-pulse" />
                      <div>
                        <span>⚙️ 試算表結構已由系統自動校對與對位完畢。</span>
                        <p className="text-[10px] text-brand-muted font-normal mt-0.5">系統將自動把交叉矩陣或明細表解鎖為長格式存入，無需手動微調。</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => onSwitchTab?.('settings')}
                      className="px-4 py-1.5 border border-brand-border-medium rounded-full hover:bg-brand-border-light text-brand-primary font-bold cursor-pointer hover:border-brand-primary/50 text-[11px] whitespace-nowrap transition-all"
                    >
                      開啟進階欄位對位
                    </button>
                  </div>
                )}

                {/* 資料預覽對帳面板 (Data Quality Checking summary) */}
                {normalizationResult && (
                  <div className="bg-white rounded-2xl border border-brand-border-medium p-6 space-y-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-border-light pb-4">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-wider text-brand-heading flex items-center gap-1.5">
                          <CheckCircle2 className="h-4.5 w-4.5 text-brand-primary" />
                          匯入前動態對帳勾稽與完整性驗證 (Data Audit)
                        </h4>
                        <p className="text-[10px] text-brand-muted mt-1">系統利用 TypeScript 常規核算引擎即時計算數據，確保 100% 精準才匯入。</p>
                      </div>
                      
                      {normalizationResult.discrepancy !== null && (
                        <div className={`px-3 py-1 rounded-full text-[10px] font-bold border flex items-center gap-1.5 ${
                          Math.abs(normalizationResult.discrepancy) < 1
                            ? 'bg-green-50 border-green-200 text-green-700'
                            : 'bg-amber-50 border-amber-200 text-amber-700'
                        }`}>
                          {Math.abs(normalizationResult.discrepancy) < 1 ? (
                            <>
                              <Check className="h-3 w-3" /> 對帳完全吻合
                            </>
                          ) : (
                            <>
                              <AlertTriangle className="h-3 w-3" /> 對帳有些微尾差：{normalizationResult.discrepancy >= 0 ? '+' : ''}{Math.round(normalizationResult.discrepancy).toLocaleString()}元
                            </>
                          )}
                        </div>
                      )}
                    </div>

                    {/* 對帳三大看板 */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                      <div className="bg-brand-bg/20 p-4 rounded-xl border border-brand-border-light flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">可提取標準捐款筆數</span>
                        <div className="mt-2 flex items-baseline gap-1">
                          <span className="text-2xl font-bold text-brand-heading font-mono">{normalizationResult.recordsCount}</span>
                          <span className="text-xs text-brand-muted">筆</span>
                        </div>
                      </div>

                      <div className="bg-brand-bg/20 p-4 rounded-xl border border-brand-border-light flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">系統重算募款淨額 (calculatedTotal)</span>
                        <div className="mt-2 flex items-baseline gap-0.5">
                          <span className="text-[11px] text-brand-heading font-semibold mr-1">NT$</span>
                          <span className="text-2xl font-bold text-brand-heading font-mono">
                            {Math.round(normalizationResult.calculatedTotal).toLocaleString()}
                          </span>
                        </div>
                      </div>

                      <div className="bg-brand-bg/20 p-4 rounded-xl border border-brand-border-light flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-brand-muted uppercase tracking-widest">原始報表標記總計 (originalTotal)</span>
                        <div className="mt-2 flex items-baseline gap-0.5">
                          <span className="text-[11px] text-brand-heading font-semibold mr-1">NT$</span>
                          <span className="text-2xl font-bold text-brand-heading font-mono">
                            {normalizationResult.originalReportTotal !== null 
                              ? Math.round(normalizationResult.originalReportTotal).toLocaleString() 
                              : <span className="text-sm font-sans text-brand-muted">(無總計行)</span>}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* 範本儲存與操作按鈕 */}
                    <div className="pt-4 border-t border-brand-border-light flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex flex-col gap-1">
                        <label className="text-xs font-semibold text-brand-text flex items-center gap-2 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={saveAsTemplate}
                            onChange={(e) => setSaveAsTemplate(e.target.checked)}
                            className="rounded border-brand-border-medium text-brand-primary focus:ring-brand-primary accent-brand-primary h-3.5 w-3.5"
                          />
                          將此配置儲存為匯入範本 (Save as Template)
                        </label>
                        {saveAsTemplate && (
                          <input
                            type="text"
                            value={newTemplateName}
                            onChange={(e) => setNewTemplateName(e.target.value)}
                            placeholder="請輸入範本名稱 (如：LINE Pay 官方明細範本)"
                            className="block w-full max-w-sm rounded-xl border border-brand-border-medium text-brand-text text-[11px] p-2 mt-1.5 outline-none focus:border-brand-primary"
                          />
                        )}
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={handleCancel}
                          className="px-5 py-2 border border-brand-border-medium rounded-full text-brand-muted hover:text-brand-heading hover:bg-brand-border-light text-xs font-bold cursor-pointer transition-colors"
                        >
                          放棄取消
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmImport}
                          className="inline-flex items-center justify-center px-6 py-2 border border-transparent text-xs font-bold rounded-full text-white bg-brand-primary hover:bg-brand-primary/90 cursor-pointer shadow-xs transition-colors"
                        >
                          確認匯入
                          <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};
