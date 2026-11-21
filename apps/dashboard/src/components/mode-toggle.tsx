'use client';
import React, { createContext, useContext, useState, useEffect } from 'react';

type Mode = 'test' | 'live';

interface ModeContextValue {
  mode: Mode;
  toggle: () => void;
  isLive: boolean;
}

const ModeContext = createContext<ModeContextValue>({ mode: 'test', toggle: () => {}, isLive: false });

export function ModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<Mode>('test');
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('atlas_mode') as Mode | null;
    if (stored === 'live') setMode('live');
  }, []);

  const toggle = () => {
    if (mode === 'test') {
      setShowDialog(true);
    } else {
      setMode('test');
      localStorage.setItem('atlas_mode', 'test');
    }
  };

  const confirmGoLive = () => {
    setMode('live');
    localStorage.setItem('atlas_mode', 'live');
    setShowDialog(false);
  };

  return (
    <ModeContext.Provider value={{ mode, toggle, isLive: mode === 'live' }}>
      {children}

      {/* Go-live confirmation dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-zinc-950/60 backdrop-blur-sm flex items-end sm:items-center justify-center z-[9999] p-0 sm:p-4">
          <div className="bg-white dark:bg-zinc-900 rounded-t-3xl sm:rounded-2xl shadow-2xl w-full max-w-md p-6 sm:p-7 border sm:border border-zinc-200 dark:border-zinc-800 animate-in slide-in-from-bottom sm:zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center mx-auto mb-4 border border-amber-200 dark:border-amber-800">
              <svg className="w-6 h-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-zinc-900 dark:text-white text-center mb-1.5">Switch to Live Mode?</h2>
            <p className="text-zinc-500 dark:text-zinc-400 text-xs text-center leading-relaxed mb-5">
              In Live Mode, <strong className="text-zinc-800 dark:text-zinc-200">real funds are moved</strong> across MTN, Telecel, and bank clearing rails. Verify your live credentials before processing real customer charges.
            </p>
            <div className="bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 rounded-xl px-3.5 py-2.5 mb-5 text-[11px] text-amber-800 dark:text-amber-300 leading-relaxed">
              ⚠️ Live mode calls use your <strong>sk_live_...</strong> API keys. Test data will be isolated from your live ledger.
            </div>
            <div className="flex gap-2.5">
              <button
                onClick={() => setShowDialog(false)}
                className="flex-1 py-2.5 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 font-semibold rounded-xl hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors text-xs"
              >
                Stay in Testnet
              </button>
              <button
                onClick={confirmGoLive}
                className="flex-1 py-2.5 bg-brand hover:bg-brand-dark text-white font-semibold rounded-xl transition-colors text-xs shadow-sm"
              >
                Activate Live
              </button>
            </div>
          </div>
        </div>
      )}
    </ModeContext.Provider>
  );
}

export function useMode() {
  return useContext(ModeContext);
}

export function ModeBadge() {
  const { toggle, isLive } = useMode();
  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border transition-all cursor-pointer select-none active:scale-95 ${
        isLive
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 hover:bg-emerald-100'
          : 'bg-amber-50 text-amber-800 border-amber-200 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-800 hover:bg-amber-100'
      }`}
      title={isLive ? 'Click to switch to Test Mode' : 'Click to switch to Live Mode'}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
      <span>{isLive ? 'Live' : 'Testnet'}</span>
      <svg className="w-2.5 h-2.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
      </svg>
    </button>
  );
}
