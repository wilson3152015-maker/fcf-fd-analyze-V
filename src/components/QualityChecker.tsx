import React, { useState } from 'react';
import { QualityCheckResult } from '../types/donation';
import { ShieldCheck, ShieldAlert, AlertTriangle, Info, ChevronDown, ChevronUp, CheckCircle2 } from 'lucide-react';

interface QualityCheckerProps {
  results: QualityCheckResult[];
}

export const QualityChecker: React.FC<QualityCheckerProps> = ({ results }) => {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const errors = results.filter(r => r.status === 'error');
  const warnings = results.filter(r => r.status === 'warning');
  const infos = results.filter(r => r.status === 'info' || r.status === 'success');

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-brand-border-light p-6 sm:p-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold font-serif text-brand-heading flex items-center gap-2">
            資料品質自動檢查儀表
            <span className="text-[10px] px-2.5 py-1 rounded-full bg-brand-bg border border-brand-border-light font-semibold text-brand-text">
              共 10 項標準核算
            </span>
          </h3>
          <p className="text-xs text-brand-muted mt-1.5">
            依據台癌基金會稽核標準，確保小額募款總額與來源一致，杜絕「垃圾進，垃圾出」。
          </p>
        </div>

        <div>
          {errors.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-red-50 text-red-800 border border-red-200">
              <ShieldAlert className="h-4 w-4 text-red-700" />
              拒絕分析 (含有嚴重錯誤)
            </span>
          ) : warnings.length > 0 ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-700" />
              建議修正 (含有警告項目)
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold bg-brand-primary text-white shadow-sm">
              <ShieldCheck className="h-4 w-4" />
              品質優良 (全數通過)
            </span>
          )}
        </div>
      </div>

      {errors.length > 0 && (
        <div className="mb-6 bg-red-50 border border-red-200 text-red-950 text-xs p-4 rounded-xl leading-relaxed">
          <div className="font-bold flex items-center gap-1.5 text-red-800 text-sm">
            <ShieldAlert className="h-5 w-5" />
            系統警告：目前資料中包含 {errors.length} 項嚴重錯誤 (🔴)！
          </div>
          <p className="mt-2 text-red-900">
            依據財務法規與基金會內部規定，在修正嚴重錯誤前，**正式募款趨勢卡片與 AI 主管摘要功能將會暫時限制**。請檢視下方錯誤細節並修正上傳檔案或對照表：
          </p>
        </div>
      )}

      {/* 10 項檢查項卡片清單 */}
      <div className="space-y-3">
        {results.map((r) => {
          const isError = r.status === 'error';
          const isWarning = r.status === 'warning';
          const isInfo = r.status === 'info';
          const isSuccess = r.status === 'success';

          return (
            <div
              key={r.id}
              className={`border rounded-2xl transition-all ${
                isError ? 'border-red-200 bg-red-50/10' :
                isWarning ? 'border-amber-200 bg-amber-50/10' :
                isInfo ? 'border-brand-primary/20 bg-brand-bg/20' :
                'border-brand-border-light bg-white hover:border-brand-border-medium'
              }`}
            >
              <div
                onClick={() => toggleExpand(r.id)}
                className="flex items-center justify-between p-4 cursor-pointer hover:bg-brand-bg/20 transition-colors rounded-t-2xl select-none"
              >
                <div className="flex items-start gap-3">
                  <div className="mt-0.5">
                    {isError && <ShieldAlert className="h-5 w-5 text-red-600" />}
                    {isWarning && <AlertTriangle className="h-5 w-5 text-amber-500" />}
                    {isInfo && <Info className="h-5 w-5 text-brand-primary" />}
                    {isSuccess && <CheckCircle2 className="h-5 w-5 text-brand-primary" />}
                  </div>
                  <div>
                    <h4 className={`text-sm font-bold ${
                      isError ? 'text-red-950' :
                      isWarning ? 'text-amber-950' :
                      isInfo ? 'text-brand-heading' :
                      'text-brand-heading'
                    }`}>
                      {r.title}
                    </h4>
                    <p className="text-xs text-brand-muted mt-0.5">{r.description}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-[10px] px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider border ${
                    isError ? 'bg-red-50 text-red-800 border-red-200' :
                    isWarning ? 'bg-amber-50 text-amber-800 border-amber-200' :
                    isInfo ? 'bg-brand-primary/10 text-brand-primary border-brand-primary/20' :
                    'bg-brand-bg text-brand-primary border-brand-border-medium'
                  }`}>
                    {isError ? '嚴重錯誤' : isWarning ? '警告' : isInfo ? '提醒' : '正常'}
                  </span>
                  {expandedId === r.id ? <ChevronUp className="h-4 w-4 text-brand-muted" /> : <ChevronDown className="h-4 w-4 text-brand-muted" />}
                </div>
              </div>

              {expandedId === r.id && (
                <div className="px-4 pb-4 pt-2 border-t border-dashed border-brand-border-light text-xs text-brand-text bg-brand-bg/40 rounded-b-2xl">
                  <div className="font-semibold text-brand-heading mb-1.5">診斷與細節：</div>
                  <div className="whitespace-pre-wrap font-mono leading-relaxed bg-white p-3 rounded-xl border border-brand-border-light text-brand-text">
                    {r.details}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
