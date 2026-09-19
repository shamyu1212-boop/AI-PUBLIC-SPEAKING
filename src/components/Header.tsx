import React from 'react';
import { Mic2, Sparkles, Wind, History, Zap, ShieldCheck } from 'lucide-react';

interface HeaderProps {
  onOpenWarmup: () => void;
  onOpenImpromptu: () => void;
  onOpenHistory: () => void;
  historyCount: number;
  hasApiKey: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenWarmup,
  onOpenImpromptu,
  onOpenHistory,
  historyCount,
  hasApiKey,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 sm:h-18">
          {/* Brand & Identity */}
          <div className="flex items-center space-x-3">
            <div className="h-10 w-10 sm:h-11 sm:w-11 rounded-xl bg-gradient-to-tr from-teal-600 to-emerald-500 flex items-center justify-center text-white shadow-md shadow-teal-500/20 ring-2 ring-teal-100">
              <Mic2 className="h-5 w-5 sm:h-6 sm:w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 font-display">
                  SpeakReady <span className="text-teal-600">AI</span>
                </span>
                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-teal-50 text-teal-700 border border-teal-200/60">
                  College Edition
                </span>
              </div>
              <p className="text-xs text-slate-500 hidden sm:block">
                Supportive speech delivery & presentation coach for first-year students
              </p>
            </div>
          </div>

          {/* Action Tools */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            <button
              id="btn-open-warmup"
              onClick={onOpenWarmup}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200/80 border border-slate-200 transition-colors"
              title="Calm presentation jitters with box breathing and vocal drills"
            >
              <Wind className="h-4 w-4 text-teal-600" />
              <span className="hidden md:inline">Pre-Speech</span> Calmer
            </button>

            <button
              id="btn-open-impromptu"
              onClick={onOpenImpromptu}
              className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-amber-900 bg-amber-50 hover:bg-amber-100/80 border border-amber-200 transition-colors"
              title="Random topic drill for impromptu classroom participation"
            >
              <Zap className="h-4 w-4 text-amber-600" />
              <span className="hidden md:inline">Impromptu</span> Drill
            </button>

            <button
              id="btn-open-history"
              onClick={onOpenHistory}
              className="relative inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-medium text-slate-700 bg-white hover:bg-slate-50 border border-slate-200 transition-colors shadow-xs"
              title="View past rehearsed speeches"
            >
              <History className="h-4 w-4 text-slate-500" />
              <span className="hidden sm:inline">Rehearsals</span>
              {historyCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[11px] font-bold bg-teal-600 text-white">
                  {historyCount}
                </span>
              )}
            </button>

            <div className="hidden lg:flex items-center pl-2 text-xs text-slate-500 border-l border-slate-200">
              <span className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-600 font-mono text-[11px]">
                <Sparkles className="h-3 w-3 text-teal-600" />
                Gemini 3.8 Flash
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
