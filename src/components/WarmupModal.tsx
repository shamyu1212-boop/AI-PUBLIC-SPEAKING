import React, { useState, useEffect } from 'react';
import { X, Wind, Music, Smile, Volume2, ArrowRight, Check } from 'lucide-react';

interface WarmupModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const WarmupModal: React.FC<WarmupModalProps> = ({ isOpen, onClose }) => {
  const [activeTab, setActiveTab] = useState<'breathing' | 'vocal' | 'mindset'>('breathing');
  
  // Box breathing state (4s Inhale, 4s Hold, 4s Exhale, 4s Hold)
  const [breathPhase, setBreathPhase] = useState<'Inhale' | 'Hold' | 'Exhale' | 'Pause'>('Inhale');
  const [breathCountdown, setBreathCountdown] = useState(4);
  const [isBreathingActive, setIsBreathingActive] = useState(true);

  useEffect(() => {
    if (!isOpen || !isBreathingActive) return;

    const interval = setInterval(() => {
      setBreathCountdown((prev) => {
        if (prev > 1) {
          return prev - 1;
        } else {
          // Advance phase
          setBreathPhase((currentPhase) => {
            if (currentPhase === 'Inhale') return 'Hold';
            if (currentPhase === 'Hold') return 'Exhale';
            if (currentPhase === 'Exhale') return 'Pause';
            return 'Inhale';
          });
          return 4;
        }
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, isBreathingActive]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-teal-100 text-teal-800">
              <Wind className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Pre-Speech Calmer & Vocal Prep
              </h3>
              <p className="text-xs text-slate-500">
                60 seconds to soothe presentation jitters before stepping to the podium
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200/60 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 bg-white px-4 pt-2">
          <button
            onClick={() => setActiveTab('breathing')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'breathing'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Box Breathing (4-4-4-4)
          </button>
          <button
            onClick={() => setActiveTab('vocal')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'vocal'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Vocal Drills
          </button>
          <button
            onClick={() => setActiveTab('mindset')}
            className={`pb-2.5 px-3 text-xs font-bold border-b-2 transition-all ${
              activeTab === 'mindset'
                ? 'border-teal-600 text-teal-700'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            Mindset Anchors
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {/* TAB 1: BOX BREATHING */}
          {activeTab === 'breathing' && (
            <div className="flex flex-col items-center justify-center text-center space-y-6 py-4">
              <div className="relative flex items-center justify-center">
                {/* Breathing animated circle */}
                <div
                  className={`w-44 h-44 rounded-full flex flex-col items-center justify-center transition-all duration-1000 ${
                    breathPhase === 'Inhale'
                      ? 'scale-110 bg-teal-500 text-white shadow-xl shadow-teal-500/30 ring-8 ring-teal-100'
                      : breathPhase === 'Hold'
                      ? 'scale-110 bg-emerald-600 text-white shadow-xl shadow-emerald-600/30 ring-8 ring-emerald-100'
                      : breathPhase === 'Exhale'
                      ? 'scale-90 bg-slate-700 text-white shadow-inner ring-4 ring-slate-200'
                      : 'scale-90 bg-slate-500 text-white ring-4 ring-slate-200'
                  }`}
                >
                  <span className="text-xs uppercase tracking-widest font-bold opacity-80">
                    {breathPhase}
                  </span>
                  <span className="text-4xl font-extrabold font-mono mt-1">
                    {breathCountdown}s
                  </span>
                </div>
              </div>

              <div className="max-w-xs space-y-2">
                <p className="text-sm font-semibold text-slate-800">
                  {breathPhase === 'Inhale' && 'Breathe in slowly through your nose into your belly.'}
                  {breathPhase === 'Hold' && 'Gently hold that calm breath without straining.'}
                  {breathPhase === 'Exhale' && 'Release slowly through relaxed lips.'}
                  {breathPhase === 'Pause' && 'Rest comfortably before the next cycle.'}
                </p>
                <p className="text-xs text-slate-400">
                  Used by elite athletes and TED speakers to trigger the parasympathetic nervous system and stop heart palpitations.
                </p>
              </div>

              <button
                onClick={() => setIsBreathingActive(!isBreathingActive)}
                className="px-4 py-1.5 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
              >
                {isBreathingActive ? 'Pause Rhythm' : 'Resume Rhythm'}
              </button>
            </div>
          )}

          {/* TAB 2: VOCAL DRILLS */}
          {activeTab === 'vocal' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Warm up your lips, tongue, and soft palate so you don't mumble or stumble on your speech opener:
              </p>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                  Drill 1: The Articulation Crisp
                </span>
                <p className="text-sm font-semibold text-slate-900">
                  "Red leather, yellow leather. Unique New York."
                </p>
                <p className="text-xs text-slate-500">
                  Repeat 3 times, focusing on exaggerated mouth movements.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                  Drill 2: The Pitch Siren (Vocal Variety)
                </span>
                <p className="text-sm font-semibold text-slate-900">
                  Gently hum from your lowest note up to your highest, like a soft police siren.
                </p>
                <p className="text-xs text-slate-500">
                  Relaxes vocal cords and prevents monotone delivery in 8:00 AM classes.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1.5">
                <span className="text-[11px] font-bold text-teal-800 uppercase tracking-wider">
                  Drill 3: The Power Breath Exhale
                </span>
                <p className="text-sm font-semibold text-slate-900">
                  Inhale deep, then exhale on a loud, sustained "Shhhhh" for 10 seconds.
                </p>
                <p className="text-xs text-slate-500">
                  Builds diaphragmatic breath support so your voice projects across the lecture room.
                </p>
              </div>
            </div>
          )}

          {/* TAB 3: MINDSET ANCHORS */}
          {activeTab === 'mindset' && (
            <div className="space-y-4">
              <p className="text-xs text-slate-500">
                Cognitive reframing tips for first-year presentation imposter syndrome:
              </p>

              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 space-y-1">
                <h4 className="text-sm font-bold text-teal-900">
                  1. "Excitement, not fear."
                </h4>
                <p className="text-xs text-teal-800 leading-relaxed">
                  Adrenaline and excitement produce the exact same physical sensation. When your heart races, tell yourself: <em>"My body is getting energized to share something cool."</em>
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <h4 className="text-sm font-bold text-slate-900">
                  2. Nobody is rooting for you to fail.
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  Every student in that room is thinking about their own turn. They want you to succeed because good presentations are engaging to watch.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-1">
                <h4 className="text-sm font-bold text-slate-900">
                  3. The audience doesn't know your script.
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  If you forget a line or skip a bullet point, nobody knows except you! Smile, take a breath, and continue seamlessly.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-colors"
          >
            I'm Ready to Rehearse
          </button>
        </div>
      </div>
    </div>
  );
};
