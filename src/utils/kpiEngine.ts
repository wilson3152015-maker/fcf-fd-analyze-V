import { DonationMonthlyRecord, KPIMetrics } from '../types/donation';

/**
 * 核心募款 KPI 計算引擎
 * 確保所有數字均由 TypeScript 純函式計算，不依賴 LLM 心算
 */
export const calculateKPIs = (
  data: DonationMonthlyRecord[],
  targetYear: number,
  targetMonth: number,
  excludedPlatforms: string[] = []
): KPIMetrics => {
  const currentMonthStr = `${targetYear}-${String(targetMonth).padStart(2, '0')}`;

  // 1. 本月數據
  const currentMonthData = data.filter(d => d.year === targetYear && d.month === targetMonth);
  const currentMonthTotal = currentMonthData.reduce((sum, d) => sum + d.amount, 0);

  // 2. 上月數據 (MoM)
  const prevMonth = targetMonth === 1 ? 12 : targetMonth - 1;
  const prevMonthYear = targetMonth === 1 ? targetYear - 1 : targetYear;
  const prevMonthData = data.filter(d => d.year === prevMonthYear && d.month === prevMonth);
  const prevMonthTotal = prevMonthData.reduce((sum, d) => sum + d.amount, 0);

  const momAmount = currentMonthTotal - prevMonthTotal;
  const momRate = prevMonthTotal === 0 ? 0 : momAmount / prevMonthTotal;

  // 3. 去年同月數據 (YoY)
  const lastYearMonthData = data.filter(d => d.year === targetYear - 1 && d.month === targetMonth);
  const lastYearMonthTotal = lastYearMonthData.reduce((sum, d) => sum + d.amount, 0);

  const yoyAmount = currentMonthTotal - lastYearMonthTotal;
  const yoyRate = lastYearMonthTotal === 0 ? 0 : yoyAmount / lastYearMonthTotal;

  // 4. 年度至今累計 (YTD) - 指當年 1 月到 targetMonth
  const ytdData = data.filter(d => d.year === targetYear && d.month <= targetMonth);
  const ytdTotal = ytdData.reduce((sum, d) => sum + d.amount, 0);

  // 去年同期 YTD
  const lastYearYtdData = data.filter(d => d.year === targetYear - 1 && d.month <= targetMonth);
  const lastYearYtdTotal = lastYearYtdData.reduce((sum, d) => sum + d.amount, 0);

  const ytdYoyAmount = ytdTotal - lastYearYtdTotal;
  const ytdYoyRate = lastYearYtdTotal === 0 ? 0 : ytdYoyAmount / lastYearYtdTotal;

  // 5. 平台佔比 (本月平台數據彙總)
  const platformMap: Record<string, { amount: number; group: string }> = {};
  currentMonthData.forEach(d => {
    const prev = platformMap[d.platformStandard] || { amount: 0, group: d.channelGroup };
    platformMap[d.platformStandard] = {
      amount: prev.amount + d.amount,
      group: d.channelGroup
    };
  });

  const platformShare = Object.entries(platformMap)
    .map(([name, val]) => ({
      name,
      amount: val.amount,
      percentage: currentMonthTotal === 0 ? 0 : val.amount / currentMonthTotal,
      channelGroup: val.group
    }))
    .sort((a, b) => b.amount - a.amount);

  // 6. 前 3 / 前 5 大平台集中度 (基於本月)
  const sortedShares = [...platformShare].sort((a, b) => b.amount - a.amount);
  const top3Sum = sortedShares.slice(0, 3).reduce((sum, p) => sum + p.amount, 0);
  const top5Sum = sortedShares.slice(0, 5).reduce((sum, p) => sum + p.amount, 0);

  const concentrationTop3 = currentMonthTotal === 0 ? 0 : top3Sum / currentMonthTotal;
  const concentrationTop5 = currentMonthTotal === 0 ? 0 : top5Sum / currentMonthTotal;

  // 7. 平台成長貢獻度 (YTD 同期比較)
  // 本年 YTD 各平台
  const currentYtdPlatforms: Record<string, number> = {};
  ytdData.forEach(d => {
    currentYtdPlatforms[d.platformStandard] = (currentYtdPlatforms[d.platformStandard] || 0) + d.amount;
  });

  // 去年 YTD 各平台
  const lastYtdPlatforms: Record<string, number> = {};
  lastYearYtdData.forEach(d => {
    lastYtdPlatforms[d.platformStandard] = (lastYtdPlatforms[d.platformStandard] || 0) + d.amount;
  });

  // 合併所有在本年或去年出現過的平台
  const allPlatforms = Array.from(new Set([
    ...Object.keys(currentYtdPlatforms),
    ...Object.keys(lastYtdPlatforms)
  ]));

  const overallYtdGrowth = ytdTotal - lastYearYtdTotal;

  const contributions = allPlatforms.map(name => {
    const curAmt = currentYtdPlatforms[name] || 0;
    const lastAmt = lastYtdPlatforms[name] || 0;
    const contributionAmount = curAmt - lastAmt; // 平台自身增長
    const contributionRate = overallYtdGrowth === 0 ? 0 : contributionAmount / Math.abs(overallYtdGrowth);

    return {
      name,
      contributionAmount,
      contributionRate
    };
  }).sort((a, b) => b.contributionAmount - a.contributionAmount);

  // 8. 排除指定平台後的 YTD 成長率
  // 例如排除 "7-ELEVEN機台" 和 "7-ELEVEN APP"
  const isExcluded = (name: string) => {
    return excludedPlatforms.some(ex => name.toLowerCase().includes(ex.toLowerCase()));
  };

  const filteredCurrentYtd = ytdData
    .filter(d => !isExcluded(d.platformStandard))
    .reduce((sum, d) => sum + d.amount, 0);

  const filteredLastYearYtd = lastYearYtdData
    .filter(d => !isExcluded(d.platformStandard))
    .reduce((sum, d) => sum + d.amount, 0);

  const excludedPlatformGrowth = filteredLastYearYtd === 0 
    ? 0 
    : (filteredCurrentYtd - filteredLastYearYtd) / filteredLastYearYtd;

  return {
    currentMonth: currentMonthStr,
    currentMonthTotal,
    momAmount,
    momRate,
    yoyAmount,
    yoyRate,
    ytdTotal,
    ytdYoyRate,
    platformShare,
    contributions,
    concentrationTop3,
    concentrationTop5,
    excludedPlatformGrowth
  };
};

/**
 * 篩選與加總輔助工具，便於動態多條件統計
 */
export const getFilteredData = (
  data: DonationMonthlyRecord[],
  filters: {
    years?: number[];
    months?: number[];
    platforms?: string[];
    channelGroups?: string[];
  }
): DonationMonthlyRecord[] => {
  return data.filter(d => {
    if (filters.years && filters.years.length > 0 && !filters.years.includes(d.year)) return false;
    if (filters.months && filters.months.length > 0 && !filters.months.includes(d.month)) return false;
    if (filters.platforms && filters.platforms.length > 0 && !filters.platforms.includes(d.platformStandard)) return false;
    if (filters.channelGroups && filters.channelGroups.length > 0 && !filters.channelGroups.includes(d.channelGroup)) return false;
    return true;
  });
};
