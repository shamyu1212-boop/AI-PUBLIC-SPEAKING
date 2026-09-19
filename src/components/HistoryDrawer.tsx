import React from 'react';
import { X, Calendar, Clock, Gauge, Award, Trash2, ArrowRight, TrendingUp } from 'lucide-react';
import { SavedSpeechSession } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  sessions: SavedSpeechSession[];
  onSelectSession: (session: SavedSpeechSession) => void;
  onDeleteSession: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  sessions,
  onSelectSession,
  onDeleteSession,
  onClearAll,
}) => {
  if (!isOpen) return null;

  // Compute aggregate progress
  const totalRehearsals = sessions.length;
  const avgScore = totalRehearsals > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.overallScore, 0) / totalRehearsals)
    : 0;
  const avgWpm = totalRehearsals > 0
    ? Math.round(sessions.reduce((acc, s) => acc + s.wpm, 0) / totalRehearsals)
    : 0;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col border-l border-slate-200">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-base font-bold text-slate-900 font-display">
              Rehearsal Log & Progress
            </h3>
            <p className="text-xs text-slate-500">
              {totalRehearsals} practice sessions recorded on this device
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Progress Snapshot Banner */}
        {totalRehearsals > 0 && (
          <div className="p-4 bg-teal-50/70 border-b border-teal-100 flex items-center justify-around text-center">
            <div>
              <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider block">
                Average Score
              </span>
              <span className="text-xl font-extrabold text-teal-950 font-display">
                {avgScore}/100
              </span>
            </div>
            <div className="h-6 w-px bg-teal-200" />
            <div>
              <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider block">
                Avg Cadence
              </span>
              <span className="text-xl font-extrabold text-teal-950 font-mono">
                {avgWpm} WPM
              </span>
            </div>
            <div className="h-6 w-px bg-teal-200" />
            <div>
              <span className="text-[10px] uppercase font-bold text-teal-800 tracking-wider block">
                Practices
              </span>
              <span className="text-xl font-extrabold text-teal-950 font-mono">
                {totalRehearsals}
              </span>
            </div>
          </div>
        )}

        {/* Session List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {sessions.length === 0 ? (
            <div className="text-center py-12 px-4 space-y-3">
              <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center mx-auto text-slate-400">
                <Clock className="h-6 w-6" />
              </div>
              <h4 className="text-sm font-bold text-slate-800">
                No Saved Rehearsals Yet
              </h4>
              <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                When you finish rehearsing and get your AI coach analysis, click "Save Session" to track your progress over time.
              </p>
            </div>
          ) : (
            sessions.map((sess) => (
              <div
                key={sess.id}
                className="p-4 rounded-xl border border-slate-200 bg-white hover:border-teal-400 transition-all shadow-2xs group relative"
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-1.5 py-0.5 rounded-sm">
                      {sess.mode.replace('-', ' ')}
                    </span>
                    <h5 className="text-sm font-bold text-slate-900 mt-1 line-clamp-1">
                      {sess.title}
                    </h5>
                  </div>
                  <span className="text-base font-extrabold text-teal-800 font-display">
                    {sess.overallScore}
                    <span className="text-xs text-slate-400 font-normal">/100</span>
                  </span>
                </div>

                <div className="flex items-center space-x-3 text-xs text-slate-500 mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {Math.round(sess.durationSeconds)}s
                  </span>
                  <span>•</span>
                  <span className="font-mono">{sess.wpm} WPM</span>
                  <span>•</span>
                  <span>{sess.fillerWordsCount} fillers</span>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <button
                    onClick={() => {
                      onSelectSession(sess);
                      onClose();
                    }}
                    className="text-xs font-bold text-teal-600 hover:text-teal-700 flex items-center space-x-1"
                  >
                    <span>Review Report</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>

                  <button
                    onClick={() => onDeleteSession(sess.id)}
                    className="p-1 text-slate-400 hover:text-red-600 transition-colors"
                    title="Delete record"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {sessions.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
            <button
              onClick={onClearAll}
              className="text-xs text-slate-400 hover:text-red-600 font-medium transition-colors"
            >
              Clear All Logs
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
            >
              Close
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
