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
  const [confirmed, setConfirmed] = useState(false);
  const [showDialog, setShowDialog] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('atlas_mode') as Mode | null;
    if (stored === 'live') setMode('live');
  }, []);

  const toggle = () => {
    if (mode === 'test') {
      setShowDialog(true); // ask before going live
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8">
            <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center mx-auto mb-5">
              <svg className="w-7 h-7 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-black text-slate-900 text-center mb-2">Switch to Live Mode?</h2>
            <p className="text-slate-500 text-sm text-center leading-relaxed mb-6">
              You are about to leave Test Mode. In Live Mode,{' '}
              <strong className="text-slate-800">real money will be processed</strong> and live API keys will be used.
              Make sure your integration is fully tested before proceeding.
            </p>
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-6 text-xs text-amber-800 leading-relaxed">
              ⚠️ Live mode uses your <strong>sk_live_...</strong> keys. Test transactions and test data will not be visible.
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => setShowDialog(false)}
                className="flex-1 py-3 border border-slate-200 text-slate-600 font-semibold rounded-xl hover:bg-slate-50 transition-colors text-sm"
              >
                Stay in Test Mode
              </button>
              <button
                onClick={confirmGoLive}
                className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-xl transition-colors text-sm"
              >
                Yes, Go Live
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
  const { mode, toggle, isLive } = useMode();
  return (
    <button
      onClick={toggle}
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border transition-colors cursor-pointer select-none ${
        isLive
          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
          : 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
      }`}
      title={isLive ? 'Click to switch to Test Mode' : 'Click to switch to Live Mode'}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${isLive ? 'bg-emerald-500' : 'bg-amber-500 animate-pulse'}`} />
      {isLive ? 'Live Mode' : 'Test Mode'}
      <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
      </svg>
    </button>
  );
}
