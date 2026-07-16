import React, { useState } from 'react';
import { Shield, Key, Mail, Globe, Users, CheckCircle } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: { email: string; name: string; role: string; department: string }) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('wilson3152015@canceraway.org.tw');
  const [whitelist, setWhitelist] = useState<string[]>(['canceraway.org.tw', 'gmail.com']);
  const [newDomain, setNewDomain] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, whitelistDomains: whitelist }),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || '登入失敗');
      }

      onLoginSuccess(data.user);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const addDomain = () => {
    if (newDomain && !whitelist.includes(newDomain.trim())) {
      setWhitelist([...whitelist, newDomain.trim()]);
      setNewDomain('');
    }
  };

  const removeDomain = (domain: string) => {
    setWhitelist(whitelist.filter(d => d !== domain));
  };

  return (
    <div className="min-h-screen bg-brand-bg flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        {/* Natural Tones custom badge */}
        <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-brand-primary text-white mb-4 shadow-sm font-serif italic text-3xl">
          台
        </div>
        <h2 className="text-3xl font-bold font-serif text-brand-heading tracking-tight">
          台癌小額募款數據分析助手
        </h2>
        <p className="mt-2 text-xs text-brand-muted italic">
          台灣癌症基金會 資源開發組內部專用系統
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-10 px-6 shadow-sm rounded-[32px] border border-brand-border-medium sm:px-10">
          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 text-red-900 text-sm p-3 rounded-xl flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <div>{error}</div>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                內部公務電子郵件 (支援 Google 帳號)
              </label>
              <div className="mt-1 relative rounded-xl shadow-xs">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Mail className="h-4 w-4 text-brand-muted" />
                </div>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="請輸入 @canceraway.org.tw 信箱"
                  className="bg-brand-bg border border-brand-border-medium text-brand-text rounded-xl focus:ring-brand-primary focus:border-brand-primary block w-full pl-10 p-3 text-sm focus:outline-none"
                />
              </div>
              <p className="mt-2 text-[10px] text-brand-muted italic">
                系統將會自動驗證信箱網域是否包含於安全白名單。
              </p>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-full shadow-sm text-sm font-bold text-white bg-brand-primary hover:bg-brand-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-primary disabled:opacity-50 transition-colors cursor-pointer"
            >
              {isLoading ? '驗證安全憑證中...' : '經由 Google 帳號安全登入'}
            </button>
          </form>

          {/* Whitelist Configuration Panel */}
          <div className="mt-8 border-t border-brand-border-light pt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-brand-muted flex items-center gap-2 mb-3">
              <Globe className="h-4 w-4 text-brand-primary" />
              內部網域授權白名單 (Domain Whitelist)
            </h3>
            <div className="flex gap-2 mb-4">
              <input
                type="text"
                value={newDomain}
                onChange={(e) => setNewDomain(e.target.value)}
                placeholder="例如: canceraway.org.tw"
                className="bg-brand-bg border border-brand-border-medium text-brand-text rounded-xl focus:ring-brand-primary focus:border-brand-primary block flex-1 px-3 py-2 text-xs focus:outline-none"
              />
              <button
                type="button"
                onClick={addDomain}
                className="bg-brand-primary/10 hover:bg-brand-primary/20 text-brand-primary px-4 py-2 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
              >
                加入網域
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {whitelist.map(domain => (
                <span
                  key={domain}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-semibold bg-brand-bg text-brand-text border border-brand-border-medium"
                >
                  @{domain}
                  <button
                    type="button"
                    onClick={() => removeDomain(domain)}
                    className="text-brand-muted hover:text-red-700 ml-1 focus:outline-none cursor-pointer text-sm"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md text-center space-y-1">
        <p className="text-[10px] text-brand-muted">
          此內部系統實施端對端個人識別隱私去識別化保護。
        </p>
        <p className="text-[10px] text-brand-muted">
          不會留存任何姓名、電話、身分證號或信用卡等機敏隱私。
        </p>
      </div>
    </div>
  );
};
