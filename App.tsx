import React, { useState } from 'react';
import { UserProfile, FortuneResult, InputMode } from './types';
import { analyzeProvidedBazi, getLuckyNumbers } from './services/geminiService';
import { getBaziLocally, validateDayPillarLocally, getUpcomingMarkSixDates } from './services/calendarService';

const App: React.FC = () => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  const [fortune, setFortune] = useState<FortuneResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inputMode, setInputMode] = useState<InputMode>('solar');
  const [validationMsg, setValidationMsg] = useState<string | null>(null);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);

  const handleOnboard = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setValidationMsg(null);
    setInfoMsg(null);
    setError(null);
    
    const formData = new FormData(e.currentTarget);
    const name = formData.get('name') as string;

    let year, month, day, hour;
    let birthDate = '', birthTime = '';

    try {
      if (inputMode === 'solar') {
        birthDate = formData.get('birthDate') as string;
        birthTime = formData.get('birthTime') as string;
        
        const localBazi = getBaziLocally(birthDate, birthTime);
        year = localBazi.yearPillar;
        month = localBazi.monthPillar;
        day = localBazi.dayPillar;
        hour = localBazi.hourPillar;
        
        setInfoMsg(`已使用本地高精度萬年曆數據庫完成排盤。`);
      } else {
        year = formData.get('year') as string;
        month = formData.get('month') as string;
        day = formData.get('day') as string;
        hour = formData.get('hour') as string;
        birthDate = formData.get('verifyDate') as string;

        if (birthDate) {
          const isDayValid = validateDayPillarLocally(birthDate, day);
          if (!isDayValid) {
            setValidationMsg(`所選日期與輸入的日柱 [${day}] 不符，請檢查輸入。`);
            setLoading(false);
            return;
          }
        }
      }

      const baziAnalysis = await analyzeProvidedBazi(year, month, day, hour);
      setUser({
        name,
        yearPillar: year,
        monthPillar: month,
        dayPillar: day,
        hourPillar: hour,
        birthDate,
        baziAnalysis
      });
    } catch (err: any) {
      console.error("排盤分析錯誤:", err);
      setError(err.message || '分析失敗');
    } finally {
      setLoading(false);
    }
  };

  const calculateFortune = async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const candidates = getUpcomingMarkSixDates();
      const result = await getLuckyNumbers(user, candidates);
      setFortune(result);
    } catch (err: any) {
      console.error("號碼計算錯誤:", err);
      setError(err.message || '計算失敗，請檢查 API 設定或網路。');
    } finally {
      setLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-stone-950">
        <div className="w-full max-w-lg bg-stone-900 border border-amber-900/30 p-8 rounded-3xl shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/5 blur-3xl -mr-16 -mt-16 rounded-full"></div>
          
          <div className="text-center mb-8">
            <h1 className="text-4xl font-black text-amber-500 font-serif mb-2 animate-glow">玄機命理</h1>
            <div className="h-0.5 w-16 bg-amber-700 mx-auto mb-6"></div>
            
            <div className="flex bg-stone-800 p-1 rounded-xl mb-6">
              <button 
                onClick={() => setInputMode('solar')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold tracking-widest uppercase transition-all ${inputMode === 'solar' ? 'bg-amber-600 text-stone-950' : 'text-stone-500 hover:text-stone-300'}`}
              >
                西曆生日
              </button>
              <button 
                onClick={() => setInputMode('bazi')}
                className={`flex-1 py-2 rounded-lg text-xs font-bold tracking-widest uppercase transition-all ${inputMode === 'bazi' ? 'bg-amber-600 text-stone-950' : 'text-stone-500 hover:text-stone-300'}`}
              >
                八字四柱
              </button>
            </div>
          </div>

          <form onSubmit={handleOnboard} className="space-y-6">
            <div>
              <label className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-widest">福主姓名</label>
              <input name="name" required placeholder="如：張小明" className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 focus:ring-1 focus:ring-amber-500 outline-none text-amber-50 placeholder:text-stone-600" />
            </div>

            {inputMode === 'solar' ? (
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-widest">出生日期</label>
                  <input name="birthDate" type="date" required className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-amber-50 outline-none focus:ring-1 focus:ring-amber-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-widest">出生時間</label>
                  <input name="birthTime" type="time" required className="w-full bg-stone-800 border border-stone-700 rounded-xl px-4 py-3 text-amber-50 outline-none focus:ring-1 focus:ring-amber-500" />
                </div>
              </div>
            ) : (
              <>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {['year', 'month', 'day', 'hour'].map((p) => (
                    <div key={p}>
                      <label className="block text-xs font-bold text-stone-500 mb-2 uppercase tracking-widest text-center">{p === 'year' ? '年' : p === 'month' ? '月' : p === 'day' ? '日' : '時'}</label>
                      <input name={p} required placeholder="干支" maxLength={2} className="w-full bg-stone-800 border border-stone-700 rounded-xl px-2 py-3 text-center text-amber-100 font-serif text-xl outline-none focus:ring-1 focus:ring-amber-500" />
                    </div>
                  ))}
                </div>
                <div className="bg-stone-800/50 p-4 rounded-xl border border-stone-700/50">
                  <label className="block text-[10px] font-bold text-stone-500 mb-2 uppercase tracking-[0.2em]">選填：校驗日期 (確保日柱準確)</label>
                  <input name="verifyDate" type="date" className="w-full bg-stone-900/50 border border-stone-700 rounded-lg px-3 py-2 text-sm text-amber-200 outline-none focus:border-amber-500/50" />
                </div>
              </>
            )}

            {error && (
              <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-xl">
                <p className="text-xs text-red-400 font-bold italic">⚠️ {error}</p>
              </div>
            )}

            {validationMsg && (
              <div className="p-4 bg-red-900/20 border border-red-900/50 rounded-xl">
                <p className="text-xs text-red-400 font-medium italic">{validationMsg}</p>
              </div>
            )}

            <button 
              type="submit" 
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-500 py-4 rounded-xl font-black text-stone-950 shadow-lg active:scale-95 transition-all uppercase tracking-[0.2em]"
            >
              {loading ? '命理分析中...' : '排盤分析'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-950 pb-20 font-sans text-stone-200 ritual-gradient">
      <header className="bg-stone-900/80 backdrop-blur-lg sticky top-0 z-30 border-b border-amber-900/10 px-6 py-5 flex justify-between items-center">
        <h2 className="text-xl font-black text-amber-500 font-serif tracking-tighter">玄機命理</h2>
        <div className="text-right">
          <p className="text-[10px] font-bold text-stone-500 uppercase tracking-widest">福主</p>
          <p className="text-sm font-bold text-amber-50">{user.name}</p>
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-6 space-y-10">
        {error && (
          <div className="bg-red-950/40 border border-red-900/50 p-6 rounded-3xl text-center">
            <p className="text-red-400 text-sm font-bold mb-4">⚠️ {error}</p>
            <button 
              onClick={() => { setError(null); setUser(null); setFortune(null); }}
              className="text-xs text-stone-400 underline uppercase tracking-widest"
            >
              返回重新輸入
            </button>
          </div>
        )}

        {infoMsg && !error && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4">
            <p className="text-xs text-amber-500 font-bold italic">✨ {infoMsg}</p>
          </div>
        )}

        <section className="bg-stone-900/60 rounded-3xl p-6 border border-stone-800 shadow-xl relative overflow-hidden backdrop-blur-sm">
          <div className="absolute -top-10 -right-10 opacity-5 text-[12rem] font-serif text-amber-500 pointer-events-none select-none">命</div>
          <div className="flex justify-between items-center mb-6">
             <h3 className="text-amber-500 text-[10px] font-black uppercase tracking-[0.4em]">命主四柱命盤</h3>
             <span className="text-[9px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded font-bold uppercase tracking-tighter">本地高精度數據庫</span>
          </div>
          <div className="grid grid-cols-4 gap-2 mb-8">
            {[
              { label: '年', value: user.yearPillar },
              { label: '月', value: user.monthPillar },
              { label: '日', value: user.dayPillar },
              { label: '時', value: user.hourPillar }
            ].map((p, i) => (
              <div key={i} className="bg-stone-800/40 rounded-2xl p-4 border border-stone-700/30 text-center">
                <p className="text-[10px] text-stone-500 mb-2 font-bold">{p.label}</p>
                <p className="text-3xl font-serif font-black text-amber-100">{p.value}</p>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-stone-950/50 p-5 rounded-2xl border border-stone-800/50">
              <p className="text-[10px] text-amber-700 font-black uppercase mb-1">能量批註</p>
              <p className="text-sm text-stone-400 leading-relaxed font-medium italic">
                「{user.baziAnalysis?.summary}」 —— {user.baziAnalysis?.elementBalance}
              </p>
            </div>

            <div className="bg-stone-950/50 p-5 rounded-2xl border border-amber-900/20">
              <div className="flex justify-between items-center mb-2">
                <p className="text-[10px] text-amber-500 font-black uppercase">偏財力量與互動</p>
                <span className="px-2 py-0.5 bg-amber-600 text-stone-950 text-[10px] font-black rounded uppercase">
                  {user.baziAnalysis?.pianCaiStrength}
                </span>
              </div>
              <p className="text-xs text-stone-400 leading-relaxed italic">
                {user.baziAnalysis?.pianCaiAnalysis}
              </p>
            </div>
          </div>
        </section>

        <section className="text-center space-y-6">
          {!fortune ? (
            <div className="py-10">
               <button 
                onClick={calculateFortune}
                disabled={loading || !!error}
                className="group relative inline-flex items-center justify-center px-12 py-5 overflow-hidden font-bold rounded-full bg-amber-600 text-stone-950 shadow-2xl hover:bg-amber-500 transition-all active:scale-95 disabled:opacity-50"
              >
                <span className="text-lg tracking-widest uppercase">尋找開運攪珠日</span>
              </button>
            </div>
          ) : (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom duration-700">
              <div className="bg-stone-900/80 rounded-3xl p-8 border border-amber-600/20 shadow-2xl relative overflow-hidden">
                 <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent"></div>
                 <h3 className="text-amber-500 text-xs font-black uppercase tracking-[0.5em] mb-8">開運靈數結果</h3>
                 
                 <div className="flex flex-wrap justify-center gap-4 mb-10">
                   {fortune.numbers.map((num, i) => (
                     <div key={i} className="w-16 h-16 bg-gradient-to-tr from-stone-800 to-stone-900 border-2 border-amber-500/50 rounded-full flex items-center justify-center text-3xl font-black text-amber-50 shadow-xl hover:scale-110 transition-transform cursor-default">
                       {num}
                     </div>
                   ))}
                 </div>

                 <div className="grid md:grid-cols-2 gap-4 text-left">
                   <div className="bg-amber-950/20 border border-amber-900/30 p-5 rounded-2xl">
                     <p className="text-[10px] text-amber-600 font-black uppercase mb-2">最佳投注時辰</p>
                     <p className="text-2xl font-serif font-black text-amber-100">{fortune.bettingTime || '待定'}</p>
                   </div>
                   <div className="bg-amber-950/20 border border-amber-900/30 p-5 rounded-2xl">
                     <div className="flex justify-between items-start">
                        <p className="text-[10px] text-amber-600 font-black uppercase mb-2">建議開運日期</p>
                        <span className="text-[8px] bg-amber-500/20 text-amber-400 px-1 rounded font-bold uppercase">本地數據庫計算</span>
                     </div>
                     <p className="text-xl font-serif font-black text-amber-100">{fortune.auspiciousDate || '待定'}</p>
                   </div>
                 </div>

                 <div className="mt-8 text-left bg-stone-950/30 p-6 rounded-2xl border border-stone-800">
                   <h4 className="text-amber-500 text-xs font-black uppercase mb-3">開運策略分析</h4>
                   <p className="text-stone-400 text-sm leading-relaxed italic leading-loose">
                     {fortune.explanation || '系統未能生成分析，請重試。'}
                   </p>
                 </div>
                 
                 <button 
                  onClick={() => { setFortune(null); setUser(null); setValidationMsg(null); setInfoMsg(null); setError(null); }}
                  className="mt-8 text-[10px] text-stone-600 uppercase font-black hover:text-amber-500 tracking-widest transition-colors"
                 >
                   重新排盤
                 </button>
              </div>
            </div>
          )}
        </section>
      </main>

      {loading && (
        <div className="fixed inset-0 z-[100] bg-stone-950/90 flex flex-col items-center justify-center space-y-6">
          <div className="w-20 h-20 relative">
             <div className="absolute inset-0 border-4 border-amber-900/30 rounded-full"></div>
             <div className="absolute inset-0 border-4 border-t-amber-500 rounded-full animate-spin"></div>
          </div>
          <div className="text-center px-6">
            <p className="text-amber-500 font-serif font-black tracking-[0.4em] text-sm animate-pulse">命理推算中...</p>
            <p className="text-stone-600 text-[10px] uppercase font-bold mt-2">完全由本地萬年曆數據驅動分析</p>
          </div>
        </div>
      )}

      <footer className="text-center py-12 px-6 max-w-lg mx-auto border-t border-stone-900 mt-10">
        <p className="text-[10px] text-stone-700 leading-relaxed uppercase tracking-widest mb-2">
          排盤與日期功能完全基於本地高精度天文曆法計算。號碼僅供娛樂參考。
        </p>
        <p className="text-[9px] text-stone-800">博彩有風險，請支持負責任博彩。</p>
      </footer>
    </div>
  );
};

export default App;