import React, { useState, useMemo } from 'react';
import { mockDonationRecords, initialPlatformMappings } from './data/mockData';
import { calculateKPIs } from './utils/kpiEngine';
import { performQualityChecks } from './utils/dataProcessor';
import { DonationMonthlyRecord, PlatformMapping, KPIMetrics, QualityCheckResult } from './types/donation';

// Components
import { LoginScreen } from './components/LoginScreen';
import { DataIntegrator } from './components/DataIntegrator';
import { PlatformMapper } from './components/PlatformMapper';
import { QualityChecker } from './components/QualityChecker';
import { InteractiveCharts } from './components/InteractiveCharts';
import { AIChatSection } from './components/AIChatSection';

// Icons
import {
  Heart,
  TrendingUp,
  AlertTriangle,
  User,
  LogOut,
  Sliders,
  DollarSign,
  Calendar,
  Percent,
  TrendingDown,
  Activity,
  Award,
  ShieldCheck,
  MapPin,
  Settings,
  HelpCircle,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export default function App() {
  // 1. 登入狀態 (未登入者 100% 擋住，不可查看任何資料)
  const [user, setUser] = useState<{ email: string; name: string; role: string; department: string } | null>(null);

  // 2. 募款數據資料庫狀態
  const [donationRecords, setDonationRecords] = useState<DonationMonthlyRecord[]>(mockDonationRecords);
  const [platformMappings, setPlatformMappings] = useState<PlatformMapping[]>(initialPlatformMappings);
  const [unmappedPlatforms, setUnmappedPlatforms] = useState<string[]>([]);
  const [currentFileName, setCurrentFileName] = useState('台癌官方114/115年資料庫.xlsx');

  // 3. 排除平台設定 (支持隨選排除，例如：7-ELEVEN，動態運算排除後成長率)
  const [exclude711, setExclude711] = useState(false);

  // 3.1 分頁狀態
  const [currentTab, setCurrentTab] = useState<'analysis' | 'import' | 'settings'>('analysis');

  // 4. 統計期程與 KPI 運算 (動態期程推算，預設 2026-05 最新)
  const [selectedTargetPeriod, setSelectedTargetPeriod] = useState<string>('2026-05');

  const availablePeriods = useMemo(() => {
    const periods = Array.from(new Set(donationRecords.map(r => r.period))) as string[];
    return periods.sort((a, b) => b.localeCompare(a)); // 最新排在最前
  }, [donationRecords]);

  const [targetYear, targetMonth] = useMemo(() => {
    let activePeriod = selectedTargetPeriod;
    if (!donationRecords.some(r => r.period === activePeriod)) {
      if (availablePeriods.length > 0) {
        activePeriod = availablePeriods[0];
      } else {
        activePeriod = '2026-05';
      }
    }
    const [y, m] = activePeriod.split('-').map(Number);
    return [y, m];
  }, [selectedTargetPeriod, availablePeriods, donationRecords]);

  const excludedPlatforms = useMemo(() => {
    return exclude711 ? ['7-ELEVEN'] : [];
  }, [exclude711]);

  const kpis: KPIMetrics = useMemo(() => {
    return calculateKPIs(donationRecords, targetYear, targetMonth, excludedPlatforms);
  }, [donationRecords, targetYear, targetMonth, excludedPlatforms]);

  // 5. 品質核對邏輯 (10項財務指標，實時追隨 Mappings 與 Records 變化)
  const qualityChecks: QualityCheckResult[] = useMemo(() => {
    return performQualityChecks(donationRecords, donationRecords, platformMappings, currentFileName);
  }, [donationRecords, platformMappings, currentFileName]);

  const hasCrucialErrors = useMemo(() => {
    return qualityChecks.some(c => c.status === 'error');
  }, [qualityChecks]);

  // 6. 資料庫對照表管理
  const handleAddMapping = (newRule: PlatformMapping) => {
    // 過濾可能重複的 original 鍵
    const filtered = platformMappings.filter(m => m.original.toLowerCase() !== newRule.original.toLowerCase());
    setPlatformMappings([...filtered, newRule]);

    // 從「未對應新平台」列表中移出
    setUnmappedPlatforms(unmappedPlatforms.filter(p => p.toLowerCase() !== newRule.original.toLowerCase()));

    // 自動套用新標準名稱到對應的記錄中
    const updatedRecords = donationRecords.map(r => {
      if (r.platformOriginal.toLowerCase() === newRule.original.toLowerCase()) {
        return {
          ...r,
          platformStandard: newRule.standard,
          channelGroup: newRule.channelGroup
        };
      }
      return r;
    });
    setDonationRecords(updatedRecords);
  };

  const handleDeleteMapping = (originalName: string) => {
    setPlatformMappings(platformMappings.filter(m => m.original !== originalName));
  };

  // 7. 新增/上傳檔案後加載
  const handleDataLoaded = (
    newRecords: DonationMonthlyRecord[],
    fileName: string,
    newUnmapped: string[]
  ) => {
    setDonationRecords(newRecords);
    setCurrentFileName(fileName);
    setUnmappedPlatforms(newUnmapped);

    // 自動更新為新數據的最新期程！
    if (newRecords.length > 0) {
      const sorted = [...newRecords].sort((a, b) => b.period.localeCompare(a.period));
      setSelectedTargetPeriod(sorted[0].period);
    }
  };

  const handleResetToMock = () => {
    setDonationRecords(mockDonationRecords);
    setPlatformMappings(initialPlatformMappings);
    setUnmappedPlatforms([]);
    setCurrentFileName('台癌官方114/115年資料庫.xlsx');
    setSelectedTargetPeriod('2026-05');
  };

  const handleLogout = () => {
    setUser(null);
  };

  // 輔助格式化
  const formatCurrency = (num: number) => `NT$ ${Math.round(num).toLocaleString()}`;
  const formatPercent = (num: number) => {
    const p = num * 100;
    return `${p >= 0 ? '+' : ''}${p.toFixed(1)}%`;
  };

  const formatPeriodToROC = (p: string) => {
    const [y, m] = p.split('-').map(Number);
    return `民國 ${y - 1911} 年 ${m} 月`;
  };

  // 未登入擋住介面
  if (!user) {
    return <LoginScreen onLoginSuccess={(u) => setUser(u)} />;
  }

  return (
    <div className="min-h-screen bg-brand-bg text-brand-text font-sans antialiased pb-16">
      {/* 頂部美化導覽欄 - Natural Tones */}
      <header className="bg-brand-bg/95 border-b border-brand-border-medium sticky top-0 z-50 backdrop-blur-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-20 items-center">
            {/* 基金會名稱 */}
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-brand-primary rounded-2xl flex items-center justify-center text-white font-serif italic text-2xl shadow-sm">
                台
              </div>
              <div>
                <h1 className="font-bold text-brand-heading tracking-tight text-lg sm:text-2xl">
                  台癌基金會小額募款數據分析助手
                </h1>
                <p className="text-xs text-brand-muted italic mt-0.5">
                  數據開發組專用面板 • 隨選期程分析與自動對位系統
                </p>
              </div>
            </div>

            {/* 用戶資訊與登出 */}
            <div className="flex items-center gap-4">
              <div className="hidden md:flex flex-col text-right">
                <span className="text-xs font-bold text-brand-heading">{user.name}</span>
                <span className="text-[10px] text-brand-muted italic">{user.role} ({user.department})</span>
              </div>
              <div className="h-10 w-10 rounded-full bg-brand-border-light border border-brand-border-medium flex items-center justify-center text-brand-text font-medium text-xs shadow-inner">
                {user.name ? user.name.slice(0, 2) : 'JD'}
              </div>
              <button
                onClick={handleLogout}
                className="p-2 hover:bg-brand-border-light rounded-full text-brand-muted hover:text-red-700 transition-colors cursor-pointer border border-transparent hover:border-brand-border-medium"
                title="安全登出"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* 整合式分頁選單 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="flex border-b border-brand-border-medium gap-2">
          <button
            onClick={() => setCurrentTab('analysis')}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              currentTab === 'analysis'
                ? 'border-brand-primary text-brand-primary font-bold'
                : 'border-transparent text-brand-muted hover:text-brand-text'
            }`}
          >
            <Activity className="h-4 w-4" />
            募款分析 Dashboard
          </button>
          <button
            onClick={() => setCurrentTab('import')}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              currentTab === 'import'
                ? 'border-brand-primary text-brand-primary font-bold'
                : 'border-transparent text-brand-muted hover:text-brand-text'
            }`}
          >
            <ArrowRight className="h-4 w-4 rotate-[-45deg]" />
            資料匯入
          </button>
          <button
            onClick={() => setCurrentTab('settings')}
            className={`px-5 py-3 text-sm font-bold flex items-center gap-2 border-b-2 transition-all cursor-pointer ${
              currentTab === 'settings'
                ? 'border-brand-primary text-brand-primary font-bold'
                : 'border-transparent text-brand-muted hover:text-brand-text'
            }`}
          >
            <Settings className="h-4 w-4" />
            進階設定 & 對照表
          </button>
        </div>
      </div>

      {/* 主面板容器 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6 space-y-8">
        
        {currentTab === 'analysis' && (
          <>
            {/* 募款統計期程與對比控制列 */}
            <section className="space-y-4">
              {/* 控制列 */}
              <div className="bg-white p-5 rounded-[24px] border border-brand-border-light shadow-sm flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-brand-muted">分析期程與控制對比</h3>
                  <p className="text-[11px] text-brand-muted mt-0.5">自訂設定分析月份、一鍵排除特殊大額管道，觀察小額募款體質成長率。</p>
                </div>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-brand-heading shrink-0">📅 結算年月:</span>
                    <select
                      value={selectedTargetPeriod}
                      onChange={(e) => setSelectedTargetPeriod(e.target.value)}
                      className="rounded-full border border-brand-border-medium bg-white py-1.5 px-4 text-xs font-bold text-brand-heading outline-none cursor-pointer focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
                    >
                      {availablePeriods.map(p => (
                        <option key={p} value={p}>{formatPeriodToROC(p)}</option>
                      ))}
                    </select>
                  </div>

                  {/* 動態排除平台設定 */}
                  <div className="flex items-center gap-2 bg-brand-bg/50 px-4 py-1.5 rounded-full border border-brand-border-medium">
                    <Sliders className="h-3.5 w-3.5 text-brand-primary" />
                    <label className="text-xs font-semibold text-brand-text flex items-center gap-1.5 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={exclude711}
                        onChange={(e) => setExclude711(e.target.checked)}
                        className="rounded border-brand-border-medium text-brand-primary focus:ring-brand-primary accent-brand-primary h-3.5 w-3.5"
                      />
                      隨選排除 7-ELEVEN 管道
                    </label>
                  </div>
                </div>
              </div>

              {/* 主要動態標題 */}
              <div className="border-b border-brand-border-light pb-2">
                <h2 className="text-xl font-bold font-serif text-brand-heading flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-brand-primary" />
                  民國 {targetYear - 1911} 年 1 月至 {targetMonth} 月募款分析
                </h2>
              </div>
            </section>

            {/* 如果有嚴重錯誤則擋住正式數據結論，防杜財務偏差 */}
            {hasCrucialErrors ? (
              <div className="bg-white p-10 rounded-[32px] border border-brand-border-medium shadow-sm text-center max-w-xl mx-auto space-y-4">
                <AlertTriangle className="h-12 w-12 text-amber-700 mx-auto" />
                <h3 className="text-xl font-serif italic text-brand-heading">
                  分析暫時鎖定中
                </h3>
                <p className="text-sm text-brand-text/90 leading-relaxed">
                  因上傳的捐款數據中包含**嚴重錯誤（紅色狀態）**。為維護基金會募款統計精確度，系統已自動限制報表分析與 AI 助理功能。請點擊上方進階設定，修正錯誤後，系統會自動解鎖。
                </p>
              </div>
            ) : (
              <>
                {/* 核心 KPI 數字卡片區 */}
                <section className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {/* 1. 本月募款總額 */}
                    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-brand-border-light flex flex-col justify-between group hover:shadow-md transition-shadow">
                      <span className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
                        {targetMonth}月 募款總額
                      </span>
                      <div className="mt-4">
                        <div className="text-2xl font-bold text-brand-heading font-mono">
                          {formatCurrency(kpis.currentMonthTotal)}
                        </div>
                        <div className="text-[10px] text-brand-muted mt-2 flex items-center gap-1.5 font-medium">
                          <Calendar className="h-3.5 w-3.5" />
                          <span>對應來源期間: {kpis.currentMonth}</span>
                        </div>
                      </div>
                    </div>

                    {/* 2. 月增率 MoM */}
                    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-brand-border-light flex flex-col justify-between group hover:shadow-md transition-shadow">
                      <span className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
                        月增增幅 (MoM)
                      </span>
                      <div className="mt-4">
                        <div className={`text-2xl font-bold font-mono ${kpis.momRate >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {formatPercent(kpis.momRate)}
                        </div>
                        <div className="text-[10px] text-brand-muted mt-2">
                          較上月增減: <strong className={kpis.momRate >= 0 ? 'text-emerald-800' : 'text-rose-800'}>{formatCurrency(Math.abs(kpis.momAmount))}</strong>
                        </div>
                      </div>
                    </div>

                    {/* 3. 年增率 YoY */}
                    <div className="bg-white p-6 rounded-[32px] shadow-sm border border-brand-border-light flex flex-col justify-between group hover:shadow-md transition-shadow">
                      <span className="text-xs font-semibold uppercase tracking-widest text-brand-muted">
                        單月年增率 (YoY)
                      </span>
                      <div className="mt-4">
                        <div className={`text-2xl font-bold font-mono ${kpis.yoyRate >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                          {formatPercent(kpis.yoyRate)}
                        </div>
                        <div className="text-[10px] text-brand-muted mt-2">
                          較 114 年同月增減: <strong className={kpis.yoyRate >= 0 ? 'text-emerald-800' : 'text-rose-800'}>{formatCurrency(Math.abs(kpis.yoyAmount))}</strong>
                        </div>
                      </div>
                    </div>

                    {/* 4. YTD 累計成長與排除 */}
                    <div className="bg-brand-primary p-6 rounded-[32px] shadow-lg text-white flex flex-col justify-between group hover:shadow-xl transition-all">
                      <span className="text-xs font-semibold uppercase tracking-widest text-white/80">
                        1-{targetMonth}月 YTD 累計年增
                      </span>
                      <div className="mt-4">
                        <div className="text-2xl font-bold font-mono text-white">
                          {formatPercent(kpis.ytdYoyRate)}
                        </div>
                        <div className="text-[10px] text-white/80 mt-2 flex justify-between items-center">
                          <span>累計: {formatK(kpis.ytdTotal)}</span>
                          {exclude711 && (
                            <span className="bg-white/20 text-white px-2 py-0.5 rounded text-[9px] font-bold">
                              排7-11: {formatPercent(kpis.excludedPlatformGrowth)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </section>

                {/* 互動圖表展示區 */}
                <section>
                  <InteractiveCharts data={donationRecords} />
                </section>

                {/* Gemini 智慧對話分析區 */}
                <section>
                  <AIChatSection
                    allDonations={donationRecords}
                    currentFileName={currentFileName}
                  />
                </section>
              </>
            )}
          </>
        )}

        {currentTab === 'import' && (
          <section className="grid grid-cols-1 gap-6">
            <div className="bg-white p-6 rounded-[32px] border border-brand-border-light shadow-sm">
              <h3 className="text-lg font-bold font-serif text-brand-heading flex items-center gap-2 mb-2">
                📂 台灣癌症基金會募款報表上傳中心
              </h3>
              <p className="text-xs text-brand-muted mb-6">
                支援匯入不同格式的原始工作表（包括多平台彙總、單月/跨月交叉表、或逐筆明細）。系統將自動解析欄位並統一標準化。
              </p>
              <DataIntegrator
                mappings={platformMappings}
                onDataLoaded={handleDataLoaded}
                onResetToMock={handleResetToMock}
                showTechnical={false}
                onSwitchTab={setCurrentTab}
              />
            </div>
          </section>
        )}

        {currentTab === 'settings' && (
          <div className="space-y-8">
            {/* 實時品質自動檢查儀表 */}
            <section className="bg-white p-6 rounded-[32px] border border-brand-border-light shadow-sm">
              <h3 className="text-lg font-bold font-serif text-brand-heading flex items-center gap-2 mb-2">
                🛡️ 實時品質自動檢查儀表
              </h3>
              <p className="text-xs text-brand-muted mb-4">
                執行 10 項關鍵財務對帳與資料一致性品質檢驗，確保入庫資料具備完全的審計性。
              </p>
              <QualityChecker results={qualityChecks} />
            </section>

            {/* 如果正在上傳檔案，進階欄位映射設定面板 */}
            <section className="bg-white p-6 rounded-[32px] border border-brand-border-light shadow-sm">
              <h3 className="text-lg font-bold font-serif text-brand-heading flex items-center gap-2 mb-2">
                ⚙️ 進階試算表結構與對位調整
              </h3>
              <p className="text-xs text-brand-muted mb-4">
                此處提供完整的資料校正面板。您可在此手動調整試算表中的起始列、標頭列，或變更欄位與資料庫的 Mapping 屬性。
              </p>
              <DataIntegrator
                mappings={platformMappings}
                onDataLoaded={handleDataLoaded}
                onResetToMock={handleResetToMock}
                showTechnical={true}
                onSwitchTab={setCurrentTab}
              />
            </section>

            {/* 對照表與待確認 */}
            <section>
              <PlatformMapper
                mappings={platformMappings}
                unmappedPlatforms={unmappedPlatforms}
                onAddMapping={handleAddMapping}
                onDeleteMapping={handleDeleteMapping}
              />
            </section>
          </div>
        )}
      </main>

      {/* Footer from Natural Tones theme */}
      <footer className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-12 pt-8 border-t border-brand-border-medium flex flex-col sm:flex-row justify-between items-center text-[10px] text-brand-muted font-medium gap-4">
        <div className="flex gap-4">
          <span>台癌數據分析助手 v1.4.2</span>
          <span>系統伺服器: 連線中</span>
          <span>最後同步: 剛剛</span>
        </div>
        <div className="flex gap-4">
          <span className="text-brand-muted">台灣癌症基金會 資源開發組 © 2026</span>
        </div>
      </footer>
    </div>
  );
}

// 輔助百萬縮寫
function formatK(num: number) {
  if (num >= 1000000) return `${(num / 1000000).toFixed(2)}M`;
  if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
  return num.toString();
}
