import React, { useState } from 'react';
import { DonationMonthlyRecord, QueryPlan } from '../types/donation';
import { calculateKPIs } from '../utils/kpiEngine';
import { MessageSquare, Sparkles, Send, RefreshCw, ChevronDown, ChevronUp, Clock, FileSpreadsheet, CheckCircle2 } from 'lucide-react';

interface AIChatSectionProps {
  allDonations: DonationMonthlyRecord[];
  currentFileName: string;
}

export const AIChatSection: React.FC<AIChatSectionProps> = ({ allDonations, currentFileName }) => {
  const [question, setQuestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<string | null>(null);
  const [activePlan, setActivePlan] = useState<QueryPlan | null>(null);
  const [showPlan, setShowPlan] = useState(false);
  const [timestamp, setTimestamp] = useState<string | null>(null);

  const presetQuestions = [
    '今年跟去年同期差多少？',
    '這個月為什麼增加？',
    '哪些平台衰退最多？',
    '如果排除7-ELEVEN，整體還有成長嗎？',
    'LINE Pay目前占整體多少？',
    '幫我產出主管摘要。'
  ];

  const handleAsk = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;
    setIsLoading(true);
    setResponse(null);
    setActivePlan(null);

    try {
      // Step 1: 把中文問題送去後端，讓 Gemini 解析成結構化 QueryPlan JSON
      const planRes = await fetch('/api/analyze/plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: queryText }),
      });

      if (!planRes.ok) throw new Error('無法產生查詢計畫');
      const plan: QueryPlan = await planRes.json();
      setActivePlan(plan);

      // Step 2: 根據 QueryPlan 在 Client 進行安全的高校統計運算 (所有數字計算由 TypeScript 函式完成)
      const calculatedStats = calculateKPIs(
        allDonations,
        plan.currentYear || 2026,
        plan.throughMonth || 4,
        plan.excludePlatforms || []
      );

      // Step 3: 把計算結果 (不含原始敏感捐款名細，只傳彙總指標) 送給後端產出中文報告
      const summarizeRes = await fetch('/api/analyze/summarize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: queryText,
          plan,
          calculatedData: {
            currentMonth: calculatedStats.currentMonth,
            currentMonthTotal: calculatedStats.currentMonthTotal,
            momAmount: calculatedStats.momAmount,
            momRate: calculatedStats.momRate,
            yoyAmount: calculatedStats.yoyAmount,
            yoyRate: calculatedStats.yoyRate,
            ytdTotal: calculatedStats.ytdTotal,
            ytdYoyRate: calculatedStats.ytdYoyRate,
            concentrationTop3: calculatedStats.concentrationTop3,
            concentrationTop5: calculatedStats.concentrationTop5,
            excludedPlatformGrowth: calculatedStats.excludedPlatformGrowth,
            platformShareSample: calculatedStats.platformShare.slice(0, 3)
          },
          metadata: {
            sourceFile: currentFileName,
            lastUpdated: new Date().toISOString()
          }
        }),
      });

      if (!summarizeRes.ok) throw new Error('報告產生失敗');
      const sumResult = await summarizeRes.json();
      setResponse(sumResult.report);
      setTimestamp(new Date().toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (err: any) {
      setResponse(`⚠️ 系統發生錯誤：${err.message}。請確認後端服務是否已完全啟動並已設定 GEMINI_API_KEY。`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-brand-bg/60 rounded-[32px] shadow-sm border border-brand-border-medium p-6 sm:p-8 font-sans text-brand-text">
      <div className="flex items-center justify-between border-b border-brand-border-medium pb-4 mb-6">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-brand-primary animate-pulse" />
          <div>
            <h3 className="text-lg font-bold font-serif text-brand-heading flex items-center gap-2">
              Gemini 募款智能對話助手
              <span className="text-[10px] bg-brand-primary/10 text-brand-primary font-bold px-2.5 py-0.5 rounded-full border border-brand-primary/20">
                Gemini 2.5 Flash
              </span>
            </h3>
            <p className="text-xs text-brand-muted mt-1">
              輸入任意募款問題。系統將會即時轉換為結構化指令並由 TypeScript 高速運算核心執行。
            </p>
          </div>
        </div>
      </div>

      {/* 快捷問題清單 */}
      <div className="mb-6">
        <div className="text-xs font-bold text-brand-heading mb-2.5">💡 常用內部查詢快捷鍵：</div>
        <div className="flex flex-wrap gap-2">
          {presetQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => {
                setQuestion(q);
                handleAsk(q);
              }}
              disabled={isLoading}
              className="text-xs bg-white hover:bg-brand-bg text-brand-text px-3.5 py-2 rounded-full border border-brand-border-medium transition-all cursor-pointer disabled:opacity-50 font-semibold"
            >
              {q}
            </button>
          ))}
        </div>
      </div>

      {/* 智能分析結果展示區 */}
      {(isLoading || response) && (
        <div className="mb-6 bg-white rounded-2xl border border-brand-border-medium overflow-hidden shadow-xs">
          {/* 分析進度條 */}
          {isLoading && (
            <div className="p-8 flex flex-col items-center justify-center gap-3">
              <RefreshCw className="h-7 w-7 text-brand-primary animate-spin" />
              <div className="text-center">
                <p className="text-xs font-bold text-brand-heading">智能分析中...</p>
                <p className="text-[10px] text-brand-muted mt-1">正在產生查詢計畫 ➜ 執行 TypeScript 理性統計 ➜ 生成中文報告</p>
              </div>
            </div>
          )}

          {/* 計算計畫 JSON 展開 */}
          {activePlan && (
            <div className="border-b border-brand-border-light">
              <button
                onClick={() => setShowPlan(!showPlan)}
                className="w-full flex items-center justify-between p-3.5 bg-brand-bg/30 text-[10px] text-brand-text font-bold hover:bg-brand-bg/50 transition-colors cursor-pointer"
              >
                <span className="flex items-center gap-1.5">
                  <CheckCircle2 className="h-4 w-4 text-brand-primary" />
                  結構化查詢計畫 (Query Plan JSON) 已自動生成
                </span>
                <span className="flex items-center gap-1 text-[10px] text-brand-primary font-bold">
                  {showPlan ? '折疊' : '展開計畫'}
                  {showPlan ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                </span>
              </button>
              {showPlan && (
                <pre className="p-4 bg-brand-bg/10 border-t border-brand-border-light text-[11px] font-mono text-brand-primary overflow-x-auto leading-relaxed max-h-40">
                  {JSON.stringify(activePlan, null, 2)}
                </pre>
              )}
            </div>
          )}

          {/* 正式 AI 報表 Markdown 排版渲染 */}
          {response && (
            <div className="p-6 text-xs leading-relaxed text-brand-text">
              <div className="markdown-body prose max-w-none text-xs">
                {response.split('\n').map((line, index) => {
                  if (line.startsWith('### ')) {
                    return <h4 key={index} className="text-sm font-bold text-brand-primary mt-5 mb-2.5 first:mt-0 font-serif">{line.replace('### ', '')}</h4>;
                  }
                  if (line.startsWith('**') && line.endsWith('**')) {
                    return <p key={index} className="font-bold text-brand-heading bg-brand-bg border-l-4 border-brand-primary p-3 rounded-r my-3">{line.replace(/\*\*/g, '')}</p>;
                  }
                  if (line.startsWith('- ')) {
                    return <li key={index} className="list-disc ml-4 my-1.5 text-brand-text">{line.replace('- ', '')}</li>;
                  }
                  if (line.startsWith('|')) {
                    // 表格解析
                    if (line.includes('---')) return null; // 略過表格分隔線
                    const cells = line.split('|').map(c => c.trim()).filter(Boolean);
                    return (
                      <div key={index} className="flex border-b border-brand-border-light py-2 font-mono text-[11px]">
                        <span className="w-1/3 text-brand-muted font-bold">{cells[0]}</span>
                        <span className="w-1/3 text-brand-heading font-bold">{cells[1]}</span>
                        <span className="w-1/3 text-brand-primary font-bold text-right">{cells[2]}</span>
                      </div>
                    );
                  }
                  return <p key={index} className="my-2 text-brand-text">{line}</p>;
                })}
              </div>

              {/* 資料期程與來源註解 */}
              <div className="mt-6 pt-4 border-t border-brand-border-light text-[10px] text-brand-muted flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 font-semibold">
                <span className="flex items-center gap-1">
                  <Clock className="h-3.5 w-3.5" />
                  統計區間: 民國 114 年 1 月 至 115 年 4 月
                </span>
                <span className="flex items-center gap-1">
                  <FileSpreadsheet className="h-3.5 w-3.5" />
                  使用來源: {currentFileName}
                </span>
                <span>
                  更新時間: {timestamp}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 輸入區表單 */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleAsk(question);
        }}
        className="flex gap-3"
      >
        <div className="relative flex-1">
          <input
            type="text"
            required
            disabled={isLoading}
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            placeholder="請以中文提問（例如：幫我產出主管摘要...）"
            className="w-full bg-white border border-brand-border-medium focus:border-brand-primary focus:ring-1 focus:ring-brand-primary rounded-xl pl-4 pr-10 py-3 text-xs placeholder-brand-muted outline-none text-brand-text transition-all disabled:opacity-50"
          />
          <span className="absolute right-3.5 top-3.5">
            <MessageSquare className="h-4.5 w-4.5 text-brand-muted" />
          </span>
        </div>

        <button
          type="submit"
          disabled={isLoading || !question.trim()}
          className="bg-brand-primary hover:bg-brand-primary/90 disabled:bg-brand-border-medium text-white font-bold text-xs px-6 rounded-full flex items-center gap-1.5 transition-all cursor-pointer shadow-xs"
        >
          {isLoading ? '運算中...' : <Send className="h-4 w-4" />}
          發送
        </button>
      </form>
    </div>
  );
};
