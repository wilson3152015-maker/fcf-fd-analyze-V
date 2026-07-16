import React, { useState, useMemo } from 'react';
import { DonationMonthlyRecord } from '../types/donation';
import { TrendingUp, ArrowUpRight, ArrowDownRight, Award, PieChart, BarChart2, Sparkles } from 'lucide-react';

interface InteractiveChartsProps {
  data: DonationMonthlyRecord[];
}

export const InteractiveCharts: React.FC<InteractiveChartsProps> = ({ data }) => {
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedGroup, setSelectedGroup] = useState<string>('全部');

  // Tooltip state
  const [tooltip, setTooltip] = useState<{
    show: boolean;
    x: number;
    y: number;
    title: string;
    content: string;
  } | null>(null);

  // 1. 各管道分類群組
  const channelGroups = useMemo(() => {
    return ['全部', ...Array.from(new Set(data.map(d => d.channelGroup)))];
  }, [data]);

  // 篩選後數據
  const filteredData = useMemo(() => {
    return data.filter(d => {
      if (selectedGroup !== '全部' && d.channelGroup !== selectedGroup) return false;
      return true;
    });
  }, [data, selectedGroup]);

  // 取得資料庫中最新的年月
  const latestDataPeriod = useMemo(() => {
    if (data.length === 0) return { year: 2026, month: 5, period: '2026-05' };
    const sorted = [...data].sort((a, b) => b.period.localeCompare(a.period));
    return {
      year: sorted[0].year,
      month: sorted[0].month,
      period: sorted[0].period
    };
  }, [data]);

  // 24 個月募款趨勢 (2025-01 到 最新月份)
  const trendData = useMemo(() => {
    const endPeriod = latestDataPeriod.period;
    const monthsList: string[] = [];
    const [startY, startM] = [2025, 1];
    const [endY, endM] = endPeriod.split('-').map(Number);
    
    let curY = startY;
    let curM = startM;
    while (curY < endY || (curY === endY && curM <= endM)) {
      const pStr = `${curY}-${curM.toString().padStart(2, '0')}`;
      monthsList.push(pStr);
      curM++;
      if (curM > 12) {
        curM = 1;
        curY++;
      }
    }

    return monthsList.map(m => {
      const records = filteredData.filter(d => d.period === m);
      const total = records.reduce((sum, d) => sum + d.amount, 0);
      return {
        period: m,
        total,
        label: m.split('-')[1] + '月',
        year: m.split('-')[0]
      };
    });
  }, [filteredData, latestDataPeriod]);

  // YoY 同期月份對比
  const yoyComparison = useMemo(() => {
    const targetYearData = filteredData.filter(d => d.year === 2026);
    const maxMonth = targetYearData.length > 0 ? Math.max(...targetYearData.map(d => d.month)) : latestDataPeriod.month;
    const months = Array.from({ length: maxMonth }, (_, i) => i + 1);

    return months.map(m => {
      const lastYear = filteredData.filter(d => d.year === 2025 && d.month === m).reduce((s, r) => s + r.amount, 0);
      const curYear = filteredData.filter(d => d.year === 2026 && d.month === m).reduce((s, r) => s + r.amount, 0);
      return {
        monthName: `${m}月`,
        monthNum: m,
        '114年(2025)': lastYear,
        '115年(2026)': curYear
      };
    });
  }, [filteredData, latestDataPeriod]);

  // 平台佔比 (依選定年份的最新月份)
  const platformShares = useMemo(() => {
    const targetYearData = filteredData.filter(d => d.year === selectedYear);
    if (targetYearData.length === 0) return [];
    const maxMonth = Math.max(...targetYearData.map(d => d.month), 1);
    const latestMonthData = targetYearData.filter(d => d.month === maxMonth);
    const total = latestMonthData.reduce((sum, d) => sum + d.amount, 0);

    const map: Record<string, number> = {};
    latestMonthData.forEach(d => {
      map[d.platformStandard] = (map[d.platformStandard] || 0) + d.amount;
    });

    return Object.entries(map)
      .map(([name, amount]) => ({
        name,
        amount,
        percentage: total === 0 ? 0 : amount / total,
        month: maxMonth
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [filteredData, selectedYear]);

  // 平台 YTD 成長與衰退貢獻排行 (1 到 最新月份同期比)
  const platformGrowthRanking = useMemo(() => {
    const standardPlatforms = Array.from(new Set(filteredData.map(d => d.platformStandard)));
    const targetYearData = filteredData.filter(d => d.year === 2026);
    const maxMonth = targetYearData.length > 0 ? Math.max(...targetYearData.map(d => d.month)) : latestDataPeriod.month;

    return standardPlatforms.map(name => {
      const lastYtd = filteredData.filter(d => d.year === 2025 && d.month <= maxMonth && d.platformStandard === name).reduce((s, r) => s + r.amount, 0);
      const curYtd = filteredData.filter(d => d.year === 2026 && d.month <= maxMonth && d.platformStandard === name).reduce((s, r) => s + r.amount, 0);
      const diff = curYtd - lastYtd;
      const rate = lastYtd === 0 ? 0 : diff / lastYtd;
      return {
        name,
        lastYtd,
        curYtd,
        diff,
        rate,
        maxMonth
      };
    }).sort((a, b) => b.diff - a.diff);
  }, [filteredData, latestDataPeriod]);

  // 輔助函式：千分位與縮寫
  const formatK = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(0)}K`;
    return num.toString();
  };

  const formatNT = (num: number) => `NT$ ${num.toLocaleString()}`;

  // SVG 趨勢線最大值計算
  const maxTrendVal = Math.max(...trendData.map(d => d.total), 1) * 1.1;

  return (
    <div className="space-y-6 font-sans">
      {/* 篩選與標題區 - Natural Tones */}
      <div className="bg-white p-6 rounded-[32px] border border-brand-border-light shadow-sm flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h3 className="text-xl font-bold font-serif text-brand-heading flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-brand-primary" />
            小額募款多維度數據分析圖表
          </h3>
          <p className="text-xs text-brand-muted mt-0.5">
            支援管道群組篩選。平台佔比統計以西元 {selectedYear} 年 (民國 {selectedYear - 1911} 年) 最新月為準。
          </p>
        </div>

        <div className="flex flex-wrap gap-4 items-center">
          {/* 管道分類篩選 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-brand-muted">管道群組:</span>
            <div className="inline-flex rounded-full border border-brand-border-light bg-brand-bg/40 p-1">
              {channelGroups.map(grp => (
                <button
                  key={grp}
                  onClick={() => setSelectedGroup(grp)}
                  className={`px-3 py-1 text-xs font-semibold rounded-full transition-all cursor-pointer ${
                    selectedGroup === grp
                      ? 'bg-brand-primary text-white font-bold shadow-xs'
                      : 'text-brand-muted hover:text-brand-heading'
                  }`}
                >
                  {grp}
                </button>
              ))}
            </div>
          </div>

          {/* 佔比年份選擇 */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-brand-muted">佔比年份:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              className="rounded-full border border-brand-border-medium bg-white py-1 px-3.5 text-xs font-bold text-brand-text outline-none cursor-pointer focus:ring-1 focus:ring-brand-primary focus:border-brand-primary"
            >
              <option value={2026}>115年 (2026)</option>
              <option value={2025}>114年 (2025)</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 1. 月度募款趨勢 Area Chart */}
        <div className="bg-white p-6 rounded-[32px] border border-brand-border-light shadow-sm relative">
          <h4 className="text-sm font-bold text-brand-heading flex items-center gap-2 mb-4">
            <BarChart2 className="h-4.5 w-4.5 text-brand-primary" />
            小額募款月度波動趨勢 (2025年1月至最新)
          </h4>
          <div className="relative h-60 w-full mt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200">
              {/* 背景網格線 */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                const y = 20 + ratio * 140;
                const val = maxTrendVal * (1 - ratio);
                return (
                  <g key={i}>
                    <line x1="40" y1={y} x2="480" y2={y} stroke="var(--color-brand-border-light)" strokeWidth="1" strokeDasharray="3 3" />
                    <text x="35" y={y + 4} textAnchor="end" className="text-[10px] font-mono text-brand-muted fill-current">
                      {formatK(val)}
                    </text>
                  </g>
                );
              })}

              {/* 趨勢填滿區域與曲線 */}
              {(() => {
                const points = trendData.map((d, i) => {
                  const x = 50 + (i * (430 / (trendData.length - 1)));
                  const y = 160 - (d.total / maxTrendVal) * 140;
                  return { x, y, ...d };
                });

                const pathD = points.reduce((acc, p, i) => {
                  return acc + `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y} `;
                }, '');

                const areaD = pathD + `L ${points[points.length - 1].x} 160 L ${points[0].x} 160 Z`;

                return (
                  <g>
                    {/* 漸層區域 */}
                    <path d={areaD} fill="url(#trendGrad)" opacity="0.15" />
                    {/* 曲線 */}
                    <path d={pathD} fill="none" stroke="var(--color-brand-primary)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    {/* 點與提示 */}
                    {points.map((p, i) => (
                      <g
                        key={i}
                        className="group cursor-pointer"
                        onMouseMove={(e) => {
                          const svg = e.currentTarget.ownerSVGElement;
                          if (svg) {
                            const rect = svg.getBoundingClientRect();
                            const x = e.clientX - rect.left + 15;
                            const y = e.clientY - rect.top - 55;
                            setTooltip({
                              show: true,
                              x,
                              y,
                              title: `${p.period.split('-')[0]}年 ${p.period.split('-')[1]}月`,
                              content: `捐款總金額: ${formatNT(p.total)}`
                            });
                          }
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      >
                        <circle cx={p.x} cy={p.y} r="3.5" className="fill-white stroke-brand-primary stroke-2 hover:r-5 transition-all" />
                        <text x={p.x} y={180} textAnchor="middle" className="text-[9px] text-brand-muted font-medium fill-current">
                          {p.label}
                        </text>
                        {/* 2026年的劃分輔助垂直線 */}
                        {i === 12 && (
                          <line x1={p.x} y1="20" x2={p.x} y2="160" stroke="var(--color-brand-border-medium)" strokeWidth="1" strokeDasharray="2 2" />
                        )}
                      </g>
                    ))}
                  </g>
                );
              })()}

              {/* 漸層定義 */}
              <defs>
                <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--color-brand-primary)" />
                  <stop offset="100%" stopColor="var(--color-brand-primary)" stopOpacity="0" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute top-2 right-2 flex items-center gap-2 text-[10px] text-brand-muted font-bold bg-brand-bg px-2.5 py-1 rounded-full border border-brand-border-light">
              <span className="w-2.5 h-2.5 bg-brand-primary rounded-full inline-block"></span>
              每月小額募款總額 (NT$)
            </div>
          </div>

          {/* Interactive Tooltip rendering */}
          {tooltip && tooltip.show && (
            <div
              className="absolute z-50 bg-brand-heading text-white text-[11px] p-2.5 rounded-xl shadow-lg pointer-events-none border border-brand-border-medium animate-fade-in"
              style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
            >
              <div className="font-bold flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-brand-primary" />
                {tooltip.title}
              </div>
              <div className="mt-1 opacity-90 font-mono font-medium">{tooltip.content}</div>
            </div>
          )}
        </div>

        {/* 2. YoY 年度同期月度對比 Side-by-Side Bar Chart */}
        <div className="bg-white p-6 rounded-[32px] border border-brand-border-light shadow-sm relative">
          <h4 className="text-sm font-bold text-brand-heading flex items-center gap-2 mb-4">
            <BarChart2 className="h-4.5 w-4.5 text-brand-primary" />
            114年 vs 115年同期小額募款對比 (1月至{yoyComparison.length}月)
          </h4>
          <div className="relative h-60 w-full mt-2">
            <svg className="w-full h-full overflow-visible" viewBox="0 0 500 200">
              {/* 背景網格線 */}
              {(() => {
                if (yoyComparison.length === 0) return null;
                const maxVal = Math.max(
                  ...yoyComparison.map(m => Math.max(m['114年(2025)'], m['115年(2026)']))
                ) * 1.1;

                return (
                  <g>
                    {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
                      const y = 20 + ratio * 140;
                      const val = maxVal * (1 - ratio);
                      return (
                        <g key={i}>
                          <line x1="45" y1={y} x2="480" y2={y} stroke="var(--color-brand-border-light)" strokeWidth="1" />
                          <text x="40" y={y + 4} textAnchor="end" className="text-[10px] font-mono text-brand-muted fill-current">
                            {formatK(val)}
                          </text>
                        </g>
                      );
                    })}

                    {/* 繪製長條圖 */}
                    {yoyComparison.map((d, i) => {
                      const dynamicWidth = 400 / yoyComparison.length;
                      const groupX = 65 + i * dynamicWidth;
                      const barW = Math.max(8, Math.min(25, dynamicWidth * 0.35));
                      const lastYearH = (d['114年(2025)'] / maxVal) * 140;
                      const curYearH = (d['115年(2026)'] / maxVal) * 140;

                      return (
                        <g key={i}>
                          {/* 去年條 (2025) - Warm Gray */}
                          <rect
                            x={groupX}
                            y={160 - lastYearH}
                            width={barW}
                            height={lastYearH}
                            fill="var(--color-brand-border-medium)"
                            rx="3"
                            className="hover:opacity-85 transition-opacity cursor-pointer"
                            onMouseMove={(e) => {
                              const svg = e.currentTarget.ownerSVGElement;
                              if (svg) {
                                const rect = svg.getBoundingClientRect();
                                const x = e.clientX - rect.left + 15;
                                const y = e.clientY - rect.top - 55;
                                setTooltip({
                                  show: true,
                                  x,
                                  y,
                                  title: `民國 114 年 (2025) - ${d.monthName}`,
                                  content: `捐款金額: ${formatNT(d['114年(2025)'])}`
                                });
                              }
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          />

                          {/* 今年條 (2026) - Forest Green */}
                          <rect
                            x={groupX + barW + 4}
                            y={160 - curYearH}
                            width={barW}
                            height={curYearH}
                            fill="var(--color-brand-primary)"
                            rx="3"
                            className="hover:opacity-95 transition-opacity cursor-pointer"
                            onMouseMove={(e) => {
                              const svg = e.currentTarget.ownerSVGElement;
                              if (svg) {
                                const rect = svg.getBoundingClientRect();
                                const x = e.clientX - rect.left + 15;
                                const y = e.clientY - rect.top - 55;
                                setTooltip({
                                  show: true,
                                  x,
                                  y,
                                  title: `民國 115 年 (2026) - ${d.monthName}`,
                                  content: `捐款金額: ${formatNT(d['115年(2026)'])}`
                                });
                              }
                            }}
                            onMouseLeave={() => setTooltip(null)}
                          />

                          {/* X 軸月分標籤 */}
                          <text x={groupX + barW + 2} y={180} textAnchor="middle" className="text-[10px] font-semibold text-brand-text fill-current">
                            {d.monthName}
                          </text>
                        </g>
                      );
                    })}
                  </g>
                );
              })()}
            </svg>
            <div className="absolute top-2 right-2 flex items-center gap-4 text-[10px] text-brand-muted font-bold bg-brand-bg px-2.5 py-1 rounded-full border border-brand-border-light">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-brand-border-medium rounded-xs inline-block"></span>
                114年 (2025)
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 bg-brand-primary rounded-xs inline-block"></span>
                115年 (2026)
              </div>
            </div>
          </div>

          {/* Interactive Tooltip rendering */}
          {tooltip && tooltip.show && (
            <div
              className="absolute z-50 bg-brand-heading text-white text-[11px] p-2.5 rounded-xl shadow-lg pointer-events-none border border-brand-border-medium animate-fade-in"
              style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
            >
              <div className="font-bold flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-brand-primary" />
                {tooltip.title}
              </div>
              <div className="mt-1 opacity-90 font-mono font-medium">{tooltip.content}</div>
            </div>
          )}
        </div>

        {/* 3. 平台佔比 Donut Chart */}
        <div className="bg-white p-6 rounded-[32px] border border-brand-border-light shadow-sm relative">
          <h4 className="text-sm font-bold text-brand-heading flex items-center gap-2 mb-4">
            <PieChart className="h-4.5 w-4.5 text-brand-primary" />
            管道佔比貢獻分佈圖 (最新單月數據)
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
            {/* SVG Donut */}
            <div className="relative h-44 flex items-center justify-center">
              <svg className="w-full h-full max-w-[170px]" viewBox="0 0 100 100">
                {(() => {
                  let accumulatedPercent = 0;
                  const colors = ['#5a5a40', '#7a7a5a', '#9a9a7a', '#baba9a', '#d4d4c4', '#e5e5dc', '#8a8a78'];

                  return platformShares.map((p, idx) => {
                    const strokeDasharray = `${p.percentage * 251.2} 251.2`;
                    const strokeDashoffset = -accumulatedPercent * 251.2;
                    accumulatedPercent += p.percentage;

                    return (
                      <circle
                        key={idx}
                        cx="50"
                        cy="50"
                        r="40"
                        fill="transparent"
                        stroke={colors[idx % colors.length]}
                        strokeWidth="12"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-500 hover:stroke-[15px] cursor-pointer"
                        onMouseMove={(e) => {
                          const svg = e.currentTarget.ownerSVGElement;
                          if (svg) {
                            const rect = svg.getBoundingClientRect();
                            const x = e.clientX - rect.left + 15;
                            const y = e.clientY - rect.top - 55;
                            setTooltip({
                              show: true,
                              x,
                              y,
                              title: p.name,
                              content: `金額: ${formatNT(p.amount)} (${(p.percentage * 100).toFixed(1)}%)`
                            });
                          }
                        }}
                        onMouseLeave={() => setTooltip(null)}
                      />
                    );
                  });
                })()}
                <circle cx="50" cy="50" r="30" fill="white" />
                <g className="translate-x-1/2 translate-y-1/2">
                  <text x="50" y="52" textAnchor="middle" className="text-[10px] font-bold text-brand-text fill-current">
                    管道佔比
                  </text>
                </g>
              </svg>
            </div>

            {/* 說明與百分比清單 */}
            <div className="space-y-2.5">
              {platformShares.map((p, idx) => {
                const colors = ['#5a5a40', '#7a7a5a', '#9a9a7a', '#baba9a', '#d4d4c4', '#e5e5dc', '#8a8a78'];
                return (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2 text-brand-text font-medium">
                      <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: colors[idx % colors.length] }}></span>
                      <span className="truncate max-w-[120px]">{p.name}</span>
                    </div>
                    <div className="font-mono text-brand-heading font-bold">
                      {(p.percentage * 100).toFixed(1)}%
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Interactive Tooltip rendering */}
          {tooltip && tooltip.show && (
            <div
              className="absolute z-50 bg-brand-heading text-white text-[11px] p-2.5 rounded-xl shadow-lg pointer-events-none border border-brand-border-medium animate-fade-in"
              style={{ left: `${tooltip.x}px`, top: `${tooltip.y}px` }}
            >
              <div className="font-bold flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-brand-primary" />
                {tooltip.title}
              </div>
              <div className="mt-1 opacity-90 font-mono font-medium">{tooltip.content}</div>
            </div>
          )}
        </div>

        {/* 4. YTD 成長貢獻排行榜 Waterfall / Growth list */}
        <div className="bg-white p-6 rounded-[32px] border border-brand-border-light shadow-sm">
          <h4 className="text-sm font-bold text-brand-heading flex items-center gap-2 mb-4">
            <Award className="h-4.5 w-4.5 text-brand-primary" />
            各平台 YTD 募款成長貢獻排行 (1-{yoyComparison.length}月同期比)
          </h4>
          <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
            {platformGrowthRanking.map((p, idx) => {
              const isPositive = p.diff >= 0;
              return (
                <div key={idx} className="flex items-center justify-between p-3.5 rounded-2xl border border-brand-border-light bg-brand-bg/20 hover:bg-brand-bg/50 transition-colors">
                  <div className="flex items-center gap-2.5">
                    <span className="text-xs font-bold text-brand-muted font-mono w-4">
                      #{idx + 1}
                    </span>
                    <div>
                      <div className="text-xs font-bold text-brand-heading">{p.name}</div>
                      <div className="text-[10px] text-brand-muted font-mono mt-0.5">
                        114年: {formatK(p.lastYtd)} → 115年: {formatK(p.curYtd)}
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`text-xs font-bold font-mono flex items-center justify-end gap-1 ${isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {isPositive ? <ArrowUpRight className="h-3.5 w-3.5 text-emerald-600" /> : <ArrowDownRight className="h-3.5 w-3.5 text-rose-600" />}
                      {isPositive ? '+' : ''}{formatK(p.diff)}
                    </div>
                    <div className="text-[9px] text-brand-muted font-semibold mt-0.5">
                      貢獻率: {isPositive ? '+' : ''}{(p.rate * 100).toFixed(1)}%
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
