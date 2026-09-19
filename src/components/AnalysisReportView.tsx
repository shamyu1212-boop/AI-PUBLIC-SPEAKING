import React, { useState } from 'react';
import { 
  CheckCircle2, AlertTriangle, Sparkles, ArrowLeft, Volume2, 
  RotateCcw, Shield, Award, Lightbulb, Zap, TrendingUp, MessageSquare,
  HelpCircle, Copy, Check, Bookmark, ArrowRight, Play, Pause
} from 'lucide-react';
import { SpeechAnalysisReport, SpeechMode } from '../types';

interface AnalysisReportViewProps {
  report: SpeechAnalysisReport;
  speechMeta: {
    title: string;
    mode: SpeechMode;
    durationSeconds: number;
    transcript: string;
    audioUrl?: string;
  };
  onRehearseAgain: () => void;
  onSaveToHistory: () => void;
  isSaved: boolean;
}

export const AnalysisReportView: React.FC<AnalysisReportViewProps> = ({
  report,
  speechMeta,
  onRehearseAgain,
  onSaveToHistory,
  isSaved,
}) => {
  const [activeTab, setActiveTab] = useState<'coaching' | 'transcript' | 'polisher'>('coaching');
  const [selectedFillerFilter, setSelectedFillerFilter] = useState<string | null>(null);
  
  // Rhetorical Polisher state
  const [polishInput, setPolishInput] = useState('');
  const [isPolishing, setIsPolishing] = useState(false);
  const [polishVariations, setPolishVariations] = useState<Array<{ text: string; explanation: string; styleBadge: string }>>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  // AI TTS Coach audio
  const [isPlayingCoachVoice, setIsPlayingCoachVoice] = useState(false);
  const [isLoadingCoachVoice, setIsLoadingCoachVoice] = useState(false);
  const [coachAudioElement, setCoachAudioElement] = useState<HTMLAudioElement | null>(null);

  // Color mapping for confidence badge
  const badgeColorClass = report.confidenceBadge?.color === 'emerald'
    ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
    : report.confidenceBadge?.color === 'blue'
    ? 'bg-blue-50 text-blue-700 border-blue-200'
    : report.confidenceBadge?.color === 'indigo'
    ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
    : 'bg-amber-50 text-amber-700 border-amber-200';

  const wpmRatingClass = report.metrics.wpmRating === 'optimal'
    ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
    : report.metrics.wpmRating === 'too_fast'
    ? 'text-amber-700 bg-amber-50 border-amber-200'
    : 'text-blue-700 bg-blue-50 border-blue-200';

  const handleRunSentencePolish = async (sentenceToPolish?: string) => {
    const text = sentenceToPolish || polishInput;
    if (!text.trim()) return;

    setIsPolishing(true);
    try {
      const res = await fetch('/api/speech-rewrite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sentence: text,
          goal: 'more_persuasive',
        }),
      });

      if (!res.ok) throw new Error('Failed to polish phrase');
      const data = await res.json();
      setPolishVariations(data.variations || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsPolishing(false);
    }
  };

  const handleCopyText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Play audio coach tip
  const handlePlayCoachAudio = async () => {
    if (coachAudioElement) {
      if (isPlayingCoachVoice) {
        coachAudioElement.pause();
        setIsPlayingCoachVoice(false);
      } else {
        coachAudioElement.play();
        setIsPlayingCoachVoice(true);
      }
      return;
    }

    setIsLoadingCoachVoice(true);
    try {
      const summaryText = `Here is your SpeakReady coach summary: ${report.toneAssessment}. You achieved an overall score of ${report.overallScore}. Your pacing was ${report.metrics.wpm} words per minute. Take a deep breath before your key slide, and remember: your audience wants you to succeed!`;

      const res = await fetch('/api/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: summaryText }),
      });

      if (!res.ok) throw new Error('Failed to fetch TTS');
      const data = await res.json();

      if (data.audioBase64) {
        const audioSrc = `data:audio/mp3;base64,${data.audioBase64}`;
        const audio = new Audio(audioSrc);
        audio.onended = () => setIsPlayingCoachVoice(false);
        setCoachAudioElement(audio);
        audio.play();
        setIsPlayingCoachVoice(true);
      }
    } catch (err) {
      console.warn('TTS playback error:', err);
    } finally {
      setIsLoadingCoachVoice(false);
    }
  };

  // Render highlighted transcript for filler words
  const renderHighlightedTranscript = () => {
    const text = speechMeta.transcript;
    const fillers = report.metrics.fillerWordsList.map(f => f.word);

    if (fillers.length === 0) {
      return <p className="leading-relaxed whitespace-pre-wrap">{text}</p>;
    }

    // Highlight target filler words
    const regex = new RegExp(`\\b(${fillers.join('|')})\\b`, 'gi');
    const parts = text.split(regex);

    return (
      <p className="leading-relaxed text-slate-800 text-sm sm:text-base">
        {parts.map((part, idx) => {
          const match = fillers.find(f => f.toLowerCase() === part.toLowerCase());
          if (match) {
            const isFiltered = selectedFillerFilter && selectedFillerFilter.toLowerCase() !== part.toLowerCase();
            return (
              <mark
                key={idx}
                className={`px-1 rounded-sm font-semibold transition-all ${
                  isFiltered 
                    ? 'bg-slate-200 text-slate-600' 
                    : 'bg-amber-200 text-amber-900 ring-1 ring-amber-300'
                }`}
                title={`Detected filler word: ${part}`}
              >
                {part}
              </mark>
            );
          }
          return <span key={idx}>{part}</span>;
        })}
      </p>
    );
  };

  return (
    <div className="space-y-6">
      {/* Top Navigation & Score Summary Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-1">
            <button
              onClick={onRehearseAgain}
              className="inline-flex items-center space-x-1 text-xs font-semibold text-teal-700 hover:text-teal-800 mb-2 transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Rehearsal Studio</span>
            </button>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 font-display">
              {speechMeta.title}
            </h2>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500 pt-1">
              <span className="capitalize font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-sm">
                {speechMeta.mode.replace('-', ' ')}
              </span>
              <span>•</span>
              <span>{Math.round(speechMeta.durationSeconds)} seconds</span>
              <span>•</span>
              <span>{report.metrics.wordCount} words spoken</span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-2.5">
            <button
              id="btn-play-coach-voice"
              onClick={handlePlayCoachAudio}
              disabled={isLoadingCoachVoice}
              className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 transition-colors"
              title="Hear coach voice summary"
            >
              {isLoadingCoachVoice ? (
                <div className="h-3.5 w-3.5 border-2 border-teal-600 border-t-transparent rounded-full animate-spin" />
              ) : isPlayingCoachVoice ? (
                <Pause className="h-3.5 w-3.5 text-teal-700" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 text-teal-700" />
              )}
              <span>{isPlayingCoachVoice ? 'Pause Audio' : 'Hear Coach Audio'}</span>
            </button>

            <button
              id="btn-save-rehearsal"
              onClick={onSaveToHistory}
              disabled={isSaved}
              className={`inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold border transition-colors ${
                isSaved
                  ? 'bg-slate-100 text-slate-500 border-slate-200 cursor-default'
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 shadow-xs'
              }`}
            >
              {isSaved ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Bookmark className="h-3.5 w-3.5 text-slate-400" />}
              <span>{isSaved ? 'Saved to History' : 'Save Session'}</span>
            </button>

            <button
              id="btn-rehearse-again-primary"
              onClick={onRehearseAgain}
              className="inline-flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              <span>Rehearse Again</span>
            </button>
          </div>
        </div>

        {/* Overall Score & Supportive Badge Card */}
        <div className="pt-6 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Big Score Card */}
          <div className="lg:col-span-4 bg-gradient-to-br from-slate-900 to-teal-950 text-white p-6 rounded-2xl flex flex-col justify-between shadow-md">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs uppercase font-bold tracking-wider text-teal-300">
                  Overall Delivery Score
                </span>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${badgeColorClass}`}>
                  {report.confidenceBadge?.label || 'Developing Speaker'}
                </span>
              </div>
              <div className="flex items-baseline space-x-2 my-2">
                <span className="text-5xl font-black font-display tracking-tight text-white">
                  {report.overallScore}
                </span>
                <span className="text-slate-400 font-bold text-lg">/100</span>
              </div>
            </div>
            <p className="text-xs text-slate-300 italic pt-2 border-t border-slate-800">
              "{report.toneAssessment}"
            </p>
          </div>

          {/* Quick Metrics Columns */}
          <div className="lg:col-span-8 grid grid-cols-2 sm:grid-cols-4 gap-3">
            {/* WPM */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Pacing (WPM)
              </span>
              <div className="text-2xl font-extrabold text-slate-900 font-mono">
                {report.metrics.wpm}
              </div>
              <span className={`inline-block mt-1 text-[11px] font-semibold px-1.5 py-0.5 rounded-sm border ${wpmRatingClass}`}>
                {report.metrics.wpmRating === 'optimal' ? 'Optimal Pace' : report.metrics.wpmRating === 'too_fast' ? 'Too Fast' : 'Deliberate'}
              </span>
            </div>

            {/* Filler Words */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Filler Words
              </span>
              <div className="text-2xl font-extrabold text-amber-700 font-mono">
                {report.metrics.fillerWordsCount}
              </div>
              <span className="text-xs text-slate-500 block mt-1">
                {report.metrics.fillerWordPercentage}% of total words
              </span>
            </div>

            {/* Clarity */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Clarity Score
              </span>
              <div className="text-2xl font-extrabold text-teal-700 font-mono">
                {report.metrics.clarityScore}%
              </div>
              <span className="text-xs text-slate-500 block mt-1">
                Articulation & flow
              </span>
            </div>

            {/* Engagement */}
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Rhetorical Punch
              </span>
              <div className="text-2xl font-extrabold text-indigo-700 font-mono">
                {report.metrics.engagementScore}%
              </div>
              <span className="text-xs text-slate-500 block mt-1">
                Audience retention
              </span>
            </div>
          </div>
        </div>

        {/* Audio Recording Playback if available */}
        {speechMeta.audioUrl && (
          <div className="mt-6 p-4 bg-teal-50/50 border border-teal-200/60 rounded-xl flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center space-x-2">
              <Volume2 className="h-4 w-4 text-teal-700" />
              <span className="text-xs font-semibold text-slate-800">
                Listen Back to Your Rehearsal:
              </span>
              <span className="text-xs text-slate-500">
                Notice where you paused or felt hesitant.
              </span>
            </div>
            <audio controls src={speechMeta.audioUrl} className="h-8 max-w-sm" />
          </div>
        )}
      </div>

      {/* Tabs: Coaching Feedback vs Transcript Analysis vs Rhetorical Polisher */}
      <div className="flex items-center space-x-2 border-b border-slate-200 pb-px">
        <button
          onClick={() => setActiveTab('coaching')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'coaching'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Coaching Feedback & Drills
        </button>
        <button
          onClick={() => setActiveTab('transcript')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all ${
            activeTab === 'transcript'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Transcript & Filler Words Inspector
        </button>
        <button
          onClick={() => setActiveTab('polisher')}
          className={`px-4 py-2 text-sm font-semibold border-b-2 transition-all flex items-center space-x-1.5 ${
            activeTab === 'polisher'
              ? 'border-teal-600 text-teal-700'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Sparkles className="h-3.5 w-3.5 text-teal-600" />
          <span>Rhetorical Sentence Polisher</span>
        </button>
      </div>

      {/* TAB 1: COACHING FEEDBACK */}
      {activeTab === 'coaching' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Strengths & Growth Areas */}
          <div className="lg:col-span-8 space-y-6">
            {/* Strengths: What Shone Bright */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1.5 rounded-lg bg-emerald-100 text-emerald-800">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    What Shone Bright in Your Delivery
                  </h3>
                  <p className="text-xs text-slate-500">
                    Validated strengths to carry forward into the real classroom presentation
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                {report.strengths.map((str, idx) => (
                  <div key={idx} className="flex items-start space-x-3 p-3 rounded-xl bg-emerald-50/60 border border-emerald-100/80">
                    <span className="flex h-5 w-5 rounded-full bg-emerald-600 text-white text-xs font-bold items-center justify-center shrink-0 mt-0.5">
                      {idx + 1}
                    </span>
                    <p className="text-sm text-emerald-950 leading-relaxed font-medium">
                      {str}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Growth Areas: High-Impact Adjustments */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs">
              <div className="flex items-center space-x-2 mb-4">
                <div className="p-1.5 rounded-lg bg-amber-100 text-amber-800">
                  <TrendingUp className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 font-display">
                    High-Impact Adjustments
                  </h3>
                  <p className="text-xs text-slate-500">
                    Tactical adjustments to elevate your confidence and delivery impact
                  </p>
                </div>
              </div>

              <div className="space-y-4">
                {report.growthAreas.map((area, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold uppercase tracking-wider text-amber-800 bg-amber-100/80 px-2 py-0.5 rounded-sm">
                        {area.area}
                      </span>
                    </div>
                    <p className="text-sm text-slate-800 font-medium leading-relaxed">
                      {area.suggestion}
                    </p>
                    {area.exampleFromSpeech && (
                      <div className="text-xs text-slate-600 bg-white p-2.5 rounded-lg border border-slate-200/80 italic">
                        <span className="font-semibold text-slate-700 not-italic">Speech note: </span>
                        "{area.exampleFromSpeech}"
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Opening Hook & Closing Punch Deep-Dive */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-2 py-0.5 rounded-sm">
                    Opening Hook (First 15s)
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {report.openingHookAnalysis?.score ?? 75}/100
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {report.openingHookAnalysis?.feedback}
                </p>
                {report.openingHookAnalysis?.suggestion && (
                  <div className="text-xs bg-teal-50/50 p-2.5 rounded-lg border border-teal-100 text-teal-900 font-medium">
                    <span className="font-bold">Coach Suggestion: </span>
                    {report.openingHookAnalysis.suggestion}
                  </div>
                )}
              </div>

              <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-sm">
                    Closing Punch (Takeaway)
                  </span>
                  <span className="text-xs font-bold text-slate-700">
                    {report.closingPunchAnalysis?.score ?? 75}/100
                  </span>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  {report.closingPunchAnalysis?.feedback}
                </p>
                {report.closingPunchAnalysis?.suggestion && (
                  <div className="text-xs bg-indigo-50/50 p-2.5 rounded-lg border border-indigo-100 text-indigo-900 font-medium">
                    <span className="font-bold">Coach Suggestion: </span>
                    {report.closingPunchAnalysis.suggestion}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Next Practice Drill & Coach Tips */}
          <div className="lg:col-span-4 space-y-6">
            {/* Interactive Next Practice Drill */}
            <div className="bg-gradient-to-br from-teal-900 to-slate-900 text-white p-6 rounded-2xl shadow-md space-y-4">
              <div className="flex items-center space-x-2">
                <Zap className="h-5 w-5 text-amber-400" />
                <span className="text-xs font-bold uppercase tracking-wider text-teal-300">
                  Recommended Next Drill
                </span>
              </div>
              <h4 className="text-lg font-bold font-display text-white">
                {report.nextPracticeDrill?.title || 'The 3-Second Silent Pause Drill'}
              </h4>
              <p className="text-xs text-slate-200 leading-relaxed">
                {report.nextPracticeDrill?.description ||
                  'Deliver your speech again, replacing every filler word with a confident silent breath.'}
              </p>
              <div className="pt-2">
                <button
                  onClick={onRehearseAgain}
                  className="w-full py-2.5 px-4 bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center justify-center space-x-2"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  <span>Start This Drill ({report.nextPracticeDrill?.durationMin || 2} min)</span>
                </button>
              </div>
            </div>

            {/* Pacing Coach Card */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm font-display">
                <Award className="h-4 w-4 text-teal-600" />
                <span>Pacing Assessment</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                {report.metrics.wpmFeedback}
              </p>
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 text-xs space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Student Norm:</span>
                  <span className="font-bold text-slate-800">130–150 WPM</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Your Speed:</span>
                  <span className="font-bold text-teal-700">{report.metrics.wpm} WPM</span>
                </div>
              </div>
            </div>

            {/* First-Year College Presentation Golden Rules */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
              <div className="flex items-center space-x-2 text-slate-900 font-bold text-sm font-display">
                <Lightbulb className="h-4 w-4 text-amber-500" />
                <span>COMM 101 Survival Tips</span>
              </div>
              <ul className="text-xs text-slate-600 space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span><strong>The 3-Second Rule:</strong> Silence feels twice as long to you as it does to the audience. Don't rush to fill pauses.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span><strong>Friendly Eyes:</strong> Pick 3 supportive classmates across the room (left, center, right) and rotate between them.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-teal-600 font-bold">•</span>
                  <span><strong>Slide Staring:</strong> Keep your chest angled toward the audience, not twisted backward toward the projector screen.</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TRANSCRIPT & FILLER WORDS INSPECTOR */}
      {activeTab === 'transcript' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Filler Words & Speech Cadence Map
              </h3>
              <p className="text-xs text-slate-500">
                Click any word below to filter and see where it appears in your speech transcript
              </p>
            </div>

            {/* Word Chips */}
            <div className="flex flex-wrap items-center gap-1.5">
              <button
                onClick={() => setSelectedFillerFilter(null)}
                className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                  selectedFillerFilter === null
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                All ({report.metrics.fillerWordsCount})
              </button>
              {report.metrics.fillerWordsList.map((f) => (
                <button
                  key={f.word}
                  onClick={() => setSelectedFillerFilter(f.word)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-all ${
                    selectedFillerFilter === f.word
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
                  }`}
                >
                  "{f.word}": {f.count}
                </button>
              ))}
            </div>
          </div>

          {/* Transcript Reader */}
          <div className="p-6 bg-slate-50 rounded-xl border border-slate-200/80 max-h-96 overflow-y-auto leading-relaxed">
            {renderHighlightedTranscript()}
          </div>

          <div className="text-xs text-slate-500 flex items-center justify-between pt-2">
            <span>Highlighted words represent hesitation markers or pacing stumbling blocks.</span>
            <span>Total word count: {report.metrics.wordCount}</span>
          </div>
        </div>
      )}

      {/* TAB 3: RHETORICAL SENTENCE POLISHER */}
      {activeTab === 'polisher' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-6">
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <Sparkles className="h-4 w-4 text-teal-600" />
              <h3 className="text-base font-bold text-slate-900 font-display">
                Rhetorical Sentence Polisher
              </h3>
            </div>
            <p className="text-xs text-slate-500">
              Have an awkward phrase, tentative opener, or rambling sentence? Let the AI coach rewrite it for crisp vocal delivery.
            </p>
          </div>

          <div className="space-y-3">
            <textarea
              rows={3}
              value={polishInput}
              onChange={(e) => setPolishInput(e.target.value)}
              placeholder="e.g. So basically, um, I think that maybe sleep is pretty important for students because..."
              className="w-full p-3.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-900 font-sans"
            />
            <div className="flex items-center justify-between">
              <div className="flex flex-wrap gap-2 text-xs">
                <span className="text-slate-400 self-center">Try quick sample:</span>
                <button
                  onClick={() => {
                    const sample = 'I just wanted to say that maybe we should think about sleep more.';
                    setPolishInput(sample);
                    handleRunSentencePolish(sample);
                  }}
                  className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-[11px]"
                >
                  "Tentative opinion opener"
                </button>
                <button
                  onClick={() => {
                    const sample = 'So, like, basically my brother got injured and that made me want to do engineering.';
                    setPolishInput(sample);
                    handleRunSentencePolish(sample);
                  }}
                  className="px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors text-[11px]"
                >
                  "Filler-heavy personal intro"
                </button>
              </div>

              <button
                id="btn-run-polisher"
                disabled={!polishInput.trim() || isPolishing}
                onClick={() => handleRunSentencePolish()}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  !polishInput.trim() || isPolishing
                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    : 'bg-teal-600 hover:bg-teal-700 text-white shadow-xs'
                }`}
              >
                {isPolishing ? (
                  <>
                    <div className="h-3 w-3 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    <span>Polishing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Polish Delivery</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Polished Variations List */}
          {polishVariations.length > 0 && (
            <div className="pt-4 space-y-3">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Spoken Alternatives with Rhetorical Lift
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {polishVariations.map((v, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-slate-50 border border-slate-200 flex flex-col justify-between space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-teal-100 text-teal-800 px-2 py-0.5 rounded-sm">
                          {v.styleBadge}
                        </span>
                        <button
                          onClick={() => handleCopyText(v.text, idx)}
                          className="text-slate-400 hover:text-slate-700 transition-colors"
                          title="Copy polished sentence"
                        >
                          {copiedIndex === idx ? (
                            <Check className="h-3.5 w-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5" />
                          )}
                        </button>
                      </div>
                      <p className="text-sm font-medium text-slate-900 leading-snug">
                        "{v.text}"
                      </p>
                    </div>
                    <p className="text-xs text-slate-500 pt-2 border-t border-slate-200">
                      {v.explanation}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
