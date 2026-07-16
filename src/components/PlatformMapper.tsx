import React, { useState } from 'react';
import { PlatformMapping } from '../types/donation';
import { HelpCircle, Plus, Trash2, Edit, Check } from 'lucide-react';

interface PlatformMapperProps {
  mappings: PlatformMapping[];
  unmappedPlatforms: string[];
  onAddMapping: (newRule: PlatformMapping) => void;
  onDeleteMapping: (originalName: string) => void;
}

export const PlatformMapper: React.FC<PlatformMapperProps> = ({
  mappings,
  unmappedPlatforms,
  onAddMapping,
  onDeleteMapping,
}) => {
  const [original, setOriginal] = useState('');
  const [standard, setStandard] = useState('LINE Pay愛心捐款平台');
  const [channelGroup, setChannelGroup] = useState('電支');
  const [showAddForm, setShowAddForm] = useState(false);

  const standardPlatforms = [
    'LINE Pay愛心捐款平台',
    '7-ELEVEN機台',
    '7-ELEVEN APP',
    'NPO Channel',
    'iGiving',
    'TAAZE',
    '自家官網線上捐款'
  ];

  const channelGroups = ['電支', '超商', '網頁', '自有網頁', '其他'];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!original.trim()) return;

    onAddMapping({
      original: original.trim(),
      standard,
      channelGroup
    });
    setOriginal('');
    setShowAddForm(false);
  };

  const handleQuickMap = (unmapped: string, targetStandard: string) => {
    // 推論群組
    let group = '網頁';
    if (targetStandard.includes('Pay')) group = '電支';
    else if (targetStandard.includes('7-ELEVEN') || targetStandard.includes('機台')) group = '超商';
    else if (targetStandard.includes('官網')) group = '自有網頁';

    onAddMapping({
      original: unmapped,
      standard: targetStandard,
      channelGroup: group
    });
  };

  return (
    <div className="bg-white rounded-[32px] shadow-sm border border-brand-border-light p-6 sm:p-8 font-sans">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h3 className="text-xl font-bold font-serif text-brand-heading flex items-center gap-2">
            平台名稱標準化對照表
            <span className="px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-brand-bg text-brand-primary border border-brand-border-light">
              共 {mappings.length} 條規則
            </span>
          </h3>
          <p className="text-xs text-brand-muted mt-1.5">
            負責對齊多元上傳名稱（如 7-11 ibon 或 7-11統一超商）到標準格式，維持報表公式一致性。
          </p>
        </div>
        <div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="w-full sm:w-auto inline-flex items-center justify-center px-5 py-2.5 border border-transparent text-xs font-bold rounded-full text-white bg-brand-primary hover:bg-brand-primary/90 cursor-pointer shadow-xs"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            新增對照規則
          </button>
        </div>
      </div>

      {/* 待確認平台列表 */}
      {unmappedPlatforms.length > 0 && (
        <div className="mb-6 p-5 bg-[#dfdcd3]/30 rounded-2xl border border-[#c1bda3]/70">
          <h4 className="text-sm font-bold text-brand-heading flex items-center gap-1.5 mb-2">
            ⚠️ 發現待確認原始平台 ({unmappedPlatforms.length})
          </h4>
          <p className="text-xs text-brand-text mb-4">
            以下為上傳檔案中包含、但「未對照」的新平台名稱。請選擇標準名稱以一鍵合併分析：
          </p>
          <div className="space-y-3">
            {unmappedPlatforms.map((p, idx) => (
              <div key={idx} className="flex flex-col xl:flex-row xl:items-center justify-between gap-3 p-3.5 bg-white rounded-xl border border-brand-border-medium text-xs">
                <span className="font-mono font-bold text-brand-heading bg-brand-bg px-2.5 py-1 rounded-lg border border-brand-border-light">{p}</span>
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-brand-muted font-semibold mr-1">對應至:</span>
                  {standardPlatforms.map(std => (
                    <button
                      key={std}
                      onClick={() => handleQuickMap(p, std)}
                      className="px-2.5 py-1 bg-brand-bg hover:bg-brand-primary hover:text-white rounded-lg text-[11px] text-brand-primary font-bold border border-brand-border-light transition-all cursor-pointer"
                    >
                      {std}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 新增表單 */}
      {showAddForm && (
        <form onSubmit={handleSubmit} className="mb-6 p-5 bg-brand-bg/30 rounded-2xl border border-brand-border-light">
          <div className="grid grid-cols-1 gap-y-4 sm:grid-cols-3 sm:gap-x-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                原始檔案中 platform 名稱 (不區分大小寫)
              </label>
              <input
                type="text"
                required
                value={original}
                onChange={(e) => setOriginal(e.target.value)}
                placeholder="例如: 7-11_ibon_v2"
                className="block w-full rounded-xl border border-brand-border-medium text-xs p-3 bg-white text-brand-text focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                標準對應名稱 (Donation Standard)
              </label>
              <select
                value={standard}
                onChange={(e) => setStandard(e.target.value)}
                className="block w-full rounded-xl border border-brand-border-medium text-xs p-3 bg-white text-brand-text focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none cursor-pointer font-semibold"
              >
                {standardPlatforms.map(std => (
                  <option key={std} value={std}>{std}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                管道群組 (Channel Group)
              </label>
              <select
                value={channelGroup}
                onChange={(e) => setChannelGroup(e.target.value)}
                className="block w-full rounded-xl border border-brand-border-medium text-xs p-3 bg-white text-brand-text focus:ring-1 focus:ring-brand-primary focus:border-brand-primary outline-none cursor-pointer font-semibold"
              >
                {channelGroups.map(grp => (
                  <option key={grp} value={grp}>{grp}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-5 py-2 border border-brand-border-medium rounded-full text-xs font-bold text-brand-text hover:bg-brand-bg/50 cursor-pointer"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-5 py-2 border border-transparent rounded-full text-xs font-bold text-white bg-brand-primary hover:bg-brand-primary/90 cursor-pointer shadow-xs"
            >
              新增規則
            </button>
          </div>
        </form>
      )}

      {/* 對照表清單 */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-brand-border-light text-left">
          <thead className="bg-brand-bg/50 text-xs font-bold text-brand-muted uppercase tracking-wider">
            <tr>
              <th className="px-5 py-4">原始申報名稱</th>
              <th className="px-5 py-4">標準分析名稱</th>
              <th className="px-5 py-4">管道分類群組</th>
              <th className="px-5 py-4 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-brand-border-light text-xs text-brand-text">
            {mappings.map((m, idx) => (
              <tr key={idx} className="hover:bg-brand-bg/20 transition-all">
                <td className="px-5 py-3.5 font-mono font-bold text-brand-heading">{m.original}</td>
                <td className="px-5 py-3.5 text-brand-primary font-bold">{m.standard}</td>
                <td className="px-5 py-3.5">
                  <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                    m.channelGroup === '超商' ? 'bg-[#7a7a5a]/10 text-[#7a7a5a] border-[#7a7a5a]/20' :
                    m.channelGroup === '電支' ? 'bg-[#5a5a40]/10 text-[#5a5a40] border-[#5a5a40]/20' :
                    m.channelGroup === '自有網頁' ? 'bg-[#9a9a7a]/10 text-[#9a9a7a] border-[#9a9a7a]/20' :
                    'bg-[#baba9a]/10 text-[#baba9a] border-[#baba9a]/20'
                  }`}>
                    {m.channelGroup}
                  </span>
                </td>
                <td className="px-5 py-3.5 text-right">
                  <button
                    onClick={() => onDeleteMapping(m.original)}
                    className="text-brand-muted hover:text-red-700 inline-flex items-center transition-colors cursor-pointer p-1.5 hover:bg-red-50 rounded-lg"
                    title="刪除規則"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
