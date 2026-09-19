import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { SpeechStudio } from './components/SpeechStudio';
import { AnalysisReportView } from './components/AnalysisReportView';
import { WarmupModal } from './components/WarmupModal';
import { ImpromptuDrillModal } from './components/ImpromptuDrillModal';
import { HistoryDrawer } from './components/HistoryDrawer';
import { SpeechAnalysisReport, SpeechMode, SavedSpeechSession, ImpromptuTopic } from './types';
import { Mic2, Sparkles, BookOpen, ShieldCheck } from 'lucide-react';

const STORAGE_KEY = 'speakready_rehearsals_v1';

export default function App() {
  const [activeView, setActiveView] = useState<'studio' | 'report'>('studio');
  const [currentReport, setCurrentReport] = useState<SpeechAnalysisReport | null>(null);
  const [currentSpeechMeta, setCurrentSpeechMeta] = useState<{
    title: string;
    mode: SpeechMode;
    durationSeconds: number;
    transcript: string;
    audioUrl?: string;
  }>({
    title: '',
    mode: 'comm101',
    durationSeconds: 60,
    transcript: '',
  });

  const [savedSessions, setSavedSessions] = useState<SavedSpeechSession[]>([]);
  const [isSavedCurrentSession, setIsSavedCurrentSession] = useState(false);
  const [isLoadingAnalysis, setIsLoadingAnalysis] = useState(false);

  // Modals
  const [isWarmupOpen, setIsWarmupOpen] = useState(false);
  const [isImpromptuOpen, setIsImpromptuOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(true);

  // Load saved rehearsals from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setSavedSessions(JSON.parse(stored));
      }
    } catch (e) {
      console.warn('Could not read saved sessions:', e);
    }

    // Health check
    fetch('/api/health')
      .then((res) => res.json())
      .then((data) => {
        if (data && typeof data.hasApiKey === 'boolean') {
          setHasApiKey(data.hasApiKey);
        }
      })
      .catch(() => {});
  }, []);

  const saveSessionsToStorage = (sessions: SavedSpeechSession[]) => {
    setSavedSessions(sessions);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to save sessions:', e);
    }
  };

  const handleAnalysisComplete = (
    report: SpeechAnalysisReport,
    meta: {
      title: string;
      mode: SpeechMode;
      durationSeconds: number;
      transcript: string;
      audioUrl?: string;
    }
  ) => {
    setCurrentReport(report);
    setCurrentSpeechMeta(meta);
    setIsSavedCurrentSession(false);
    setActiveView('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSaveCurrentSession = () => {
    if (!currentReport) return;
    const newSession: SavedSpeechSession = {
      id: 'sess_' + Date.now(),
      title: currentSpeechMeta.title || 'Rehearsal Session',
      mode: currentSpeechMeta.mode,
      date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }),
      durationSeconds: currentSpeechMeta.durationSeconds,
      wordCount: currentReport.metrics.wordCount,
      wpm: currentReport.metrics.wpm,
      fillerWordsCount: currentReport.metrics.fillerWordsCount,
      overallScore: currentReport.overallScore,
      transcript: currentSpeechMeta.transcript,
      report: currentReport,
      audioUrl: currentSpeechMeta.audioUrl,
    };

    const updated = [newSession, ...savedSessions];
    saveSessionsToStorage(updated);
    setIsSavedCurrentSession(true);
  };

  const handleDeleteSession = (id: string) => {
    const updated = savedSessions.filter((s) => s.id !== id);
    saveSessionsToStorage(updated);
  };

  const handleClearAllSessions = () => {
    if (window.confirm('Clear all saved rehearsal sessions on this device?')) {
      saveSessionsToStorage([]);
    }
  };

  const handleSelectHistoricalSession = (sess: SavedSpeechSession) => {
    setCurrentReport(sess.report);
    setCurrentSpeechMeta({
      title: sess.title,
      mode: sess.mode,
      durationSeconds: sess.durationSeconds,
      transcript: sess.transcript,
      audioUrl: sess.audioUrl,
    });
    setIsSavedCurrentSession(true);
    setActiveView('report');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectImpromptuTopic = (topic: ImpromptuTopic) => {
    setCurrentSpeechMeta({
      title: `Impromptu: ${topic.topic}`,
      mode: 'impromptu',
      durationSeconds: topic.timeLimitSeconds,
      transcript: `Topic: ${topic.topic}\nScenario: ${topic.context}\n\nKey Angles:\n- ${topic.guidingQuestions.join('\n- ')}\n\nDelivery Flow:\n${topic.suggestedStructure}\n\n[Start speaking or typing your practice speech here...]`,
    });
    setActiveView('studio');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col selection:bg-teal-500 selection:text-white">
      {/* Top Navigation */}
      <Header
        onOpenWarmup={() => setIsWarmupOpen(true)}
        onOpenImpromptu={() => setIsImpromptuOpen(true)}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={savedSessions.length}
        hasApiKey={hasApiKey}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeView === 'studio' ? (
          <SpeechStudio
            onAnalysisComplete={handleAnalysisComplete}
            isLoadingAnalysis={isLoadingAnalysis}
          />
        ) : currentReport ? (
          <AnalysisReportView
            report={currentReport}
            speechMeta={currentSpeechMeta}
            onRehearseAgain={() => {
              setActiveView('studio');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onSaveToHistory={handleSaveCurrentSession}
            isSaved={isSavedCurrentSession}
          />
        ) : null}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200/80 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-2">
            <span className="font-bold text-slate-800 font-display">SpeakReady AI</span>
            <span>•</span>
            <span>Empowering first-year college voices with supportive AI coaching</span>
          </div>

          <div className="flex items-center space-x-4">
            <button
              onClick={() => setIsWarmupOpen(true)}
              className="hover:text-teal-700 transition-colors"
            >
              Pre-Speech Calmer
            </button>
            <button
              onClick={() => setIsImpromptuOpen(true)}
              className="hover:text-teal-700 transition-colors"
            >
              Impromptu Drills
            </button>
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="hover:text-teal-700 transition-colors"
            >
              Rehearsal Log ({savedSessions.length})
            </button>
          </div>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <WarmupModal
        isOpen={isWarmupOpen}
        onClose={() => setIsWarmupOpen(false)}
      />

      <ImpromptuDrillModal
        isOpen={isImpromptuOpen}
        onClose={() => setIsImpromptuOpen(false)}
        onSelectTopicForRehearsal={handleSelectImpromptuTopic}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        sessions={savedSessions}
        onSelectSession={handleSelectHistoricalSession}
        onDeleteSession={handleDeleteSession}
        onClearAll={handleClearAllSessions}
      />
    </div>
  );
}
