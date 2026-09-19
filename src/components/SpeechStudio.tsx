import React, { useState, useEffect, useRef } from 'react';
import { 
  Mic, Square, Play, Pause, RotateCcw, Sparkles, FileText, 
  Volume2, Clock, Gauge, BookOpen, AlertCircle, ChevronDown, Check,
  Flame, HelpCircle, Layers
} from 'lucide-react';
import { SpeechMode, SpeechModeOption, SpeechAnalysisReport } from '../types';
import { AudioVisualizer } from './AudioVisualizer';
import { SAMPLE_SPEECHES, SampleSpeech } from '../data/sampleSpeeches';

const SPEECH_MODES: SpeechModeOption[] = [
  {
    id: 'comm101',
    name: 'COMM 101 Speech',
    tagline: 'Persuasive or informative presentation',
    suggestedDurationSec: 120,
    iconName: 'GraduationCap',
    badge: 'Standard Coursework',
    typicalAudience: 'College peers & professor',
    description: 'Structure with a strong hook, 2-3 evidence-backed claims, and a memorable concluding takeaway.',
  },
  {
    id: 'icebreaker',
    name: 'Freshman Seminar',
    tagline: '60-second intro & icebreakers',
    suggestedDurationSec: 60,
    iconName: 'Smile',
    badge: 'High Anxiety',
    typicalAudience: 'First-year cohort & peer advisors',
    description: 'Warm, authentic self-introduction highlighting your hometown, major, and unique quirky story.',
  },
  {
    id: 'club-pitch',
    name: 'Campus Club Pitch',
    tagline: 'Funding pitch or recruitment drive',
    suggestedDurationSec: 90,
    iconName: 'Megaphone',
    badge: 'Fast & Punchy',
    typicalAudience: 'Student council or prospective members',
    description: 'Clear problem, community solution, exact budget or action request, and enthusiastic finish.',
  },
  {
    id: 'research-poster',
    name: 'Research Poster',
    tagline: 'Undergraduate symposium talk',
    suggestedDurationSec: 120,
    iconName: 'Microscope',
    badge: 'Academic Clarity',
    typicalAudience: 'Faculty judges & symposium attendees',
    description: 'Context, research question, figure walkthrough, and environmental or scientific takeaway.',
  },
  {
    id: 'impromptu',
    name: 'Impromptu / Q&A',
    tagline: 'Fast thinking off-the-cuff',
    suggestedDurationSec: 75,
    iconName: 'Zap',
    badge: 'Spontaneous',
    typicalAudience: 'Classroom seminar discussion',
    description: 'Quick stance, 2 concrete supporting reasons, and crisp closing sentence.',
  },
];

interface SpeechStudioProps {
  onAnalysisComplete: (report: SpeechAnalysisReport, meta: {
    title: string;
    mode: SpeechMode;
    durationSeconds: number;
    transcript: string;
    audioUrl?: string;
  }) => void;
  isLoadingAnalysis: boolean;
}

export const SpeechStudio: React.FC<SpeechStudioProps> = ({
  onAnalysisComplete,
  isLoadingAnalysis,
}) => {
  const [selectedMode, setSelectedMode] = useState<SpeechMode>('comm101');
  const [title, setTitle] = useState('COMM 101: The 8:00 AM Class Dilemma & Sleep Hygiene');
  const [audience, setAudience] = useState('COMM 101 classmates and Professor Vance');
  const [transcript, setTranscript] = useState(SAMPLE_SPEECHES[0].transcript);
  
  // Recording state
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  const [audioBlobUrl, setAudioBlobUrl] = useState<string | null>(null);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  // Teleprompter / Pacing helper
  const [isTeleprompterActive, setIsTeleprompterActive] = useState(false);
  const [teleprompterSpeed, setTeleprompterSpeed] = useState(2); // 1 to 5
  const [fontSize, setFontSize] = useState<'normal' | 'large' | 'xl'>('large');

  // References
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);
  const teleprompterScrollRef = useRef<HTMLDivElement>(null);
  const teleprompterIntervalRef = useRef<any>(null);

  const activeModeConfig = SPEECH_MODES.find(m => m.id === selectedMode) || SPEECH_MODES[0];

  // Calculate live metrics
  const wordCount = transcript.trim() ? transcript.trim().split(/\s+/).length : 0;
  const liveWpm = elapsedSeconds > 5 ? Math.round((wordCount / (elapsedSeconds / 60))) : 0;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopTracks();
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (teleprompterIntervalRef.current) clearInterval(teleprompterIntervalRef.current);
    };
  }, []);

  const stopTracks = () => {
    if (audioStream) {
      audioStream.getTracks().forEach(t => t.stop());
    }
  };

  // Switch sample speech
  const handleLoadSample = (sample: SampleSpeech) => {
    setSelectedMode(sample.mode);
    setTitle(sample.title);
    setAudience(sample.targetAudience);
    setTranscript(sample.transcript);
    setElapsedSeconds(sample.suggestedDurationSeconds);
    setAudioBlobUrl(null);
  };

  // Start speech rehearsal recording
  const startRecording = async () => {
    setMicPermissionError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      // Setup MediaRecorder for playback
      const mimeTypes = ['audio/webm', 'audio/mp4', 'audio/ogg', ''];
      const supportedMime = mimeTypes.find(m => !m || MediaRecorder.isTypeSupported(m)) || '';
      const recorder = new MediaRecorder(stream, supportedMime ? { mimeType: supportedMime } : undefined);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: supportedMime || 'audio/webm' });
        const url = URL.createObjectURL(audioBlob);
        setAudioBlobUrl(url);
      };

      recorder.start(250);

      // Setup live Web Speech API recognition if supported
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        try {
          const recognition = new SpeechRecognition();
          recognition.continuous = true;
          recognition.interimResults = true;
          recognition.lang = 'en-US';

          let accumulatedTranscript = transcript.trim() ? transcript + '\n\n' : '';

          recognition.onresult = (event: any) => {
            let interim = '';
            for (let i = event.resultIndex; i < event.results.length; ++i) {
              if (event.results[i].isFinal) {
                accumulatedTranscript += event.results[i][0].transcript + ' ';
                setTranscript(accumulatedTranscript);
              } else {
                interim += event.results[i][0].transcript;
              }
            }
          };

          recognition.onerror = (e: any) => {
            console.warn('Speech recognition warning:', e.error);
          };

          recognition.start();
          speechRecognitionRef.current = recognition;
        } catch (e) {
          console.warn('Speech recognition start failed:', e);
        }
      }

      setIsRecording(true);
      setIsPaused(false);
      setElapsedSeconds(0);

      // Start elapsed timer
      timerIntervalRef.current = setInterval(() => {
        setElapsedSeconds(prev => prev + 1);
      }, 1000);

      // If teleprompter is open, auto start scroll
      if (isTeleprompterActive) {
        startTeleprompterScroll();
      }
    } catch (err: any) {
      console.error('Microphone access failed:', err);
      setMicPermissionError(
        'Could not access microphone. You can still paste or type your speech notes in the script box below to run the AI Coach analysis!'
      );
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (speechRecognitionRef.current) {
      try {
        speechRecognitionRef.current.stop();
      } catch (e) {}
    }
    stopTracks();
    if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    if (teleprompterIntervalRef.current) clearInterval(teleprompterIntervalRef.current);

    setIsRecording(false);
    setIsPaused(false);
  };

  // Teleprompter auto-scroll logic
  const startTeleprompterScroll = () => {
    if (teleprompterIntervalRef.current) clearInterval(teleprompterIntervalRef.current);
    teleprompterIntervalRef.current = setInterval(() => {
      if (teleprompterScrollRef.current) {
        teleprompterScrollRef.current.scrollTop += teleprompterSpeed;
      }
    }, 50);
  };

  const handleAnalyzeClick = async () => {
    if (!transcript.trim()) return;

    // Estimate realistic duration if elapsed was 0 (e.g. pasted text)
    const effectiveDuration = elapsedSeconds > 5 
      ? elapsedSeconds 
      : Math.max(30, Math.round((wordCount / 135) * 60));

    try {
      const response = await fetch('/api/analyze-speech', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          transcript,
          durationSeconds: effectiveDuration,
          mode: selectedMode,
          speechTitle: title,
          targetAudience: audience,
        }),
      });

      if (!response.ok) {
        throw new Error('Analysis failed on server');
      }

      const report: SpeechAnalysisReport = await response.json();
      onAnalysisComplete(report, {
        title: title || 'Speech Rehearsal',
        mode: selectedMode,
        durationSeconds: effectiveDuration,
        transcript,
        audioUrl: audioBlobUrl || undefined,
      });
    } catch (err) {
      console.error('Error analyzing speech:', err);
      alert('Unable to analyze speech at this moment. Please check server logs.');
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="space-y-6">
      {/* Introduction banner for college students */}
      <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
        <div className="absolute -right-12 -top-12 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 max-w-3xl">
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full text-xs font-semibold bg-teal-400/20 text-teal-200 border border-teal-400/30 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-teal-300" />
            <span>Safe Practice Zone for First-Year Students</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight font-display mb-2">
            Practice Your Speech. Banish the Jitters.
          </h1>
          <p className="text-slate-200 text-sm sm:text-base leading-relaxed mb-4">
            Rehearse your presentation out loud with instant AI feedback on pacing, filler words, vocal cadence, and rhetorical hook. No embarrassment, just supportive guidance before you face the classroom.
          </p>

          <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
            <span className="text-slate-300 font-medium">Quick Test Speeches:</span>
            {SAMPLE_SPEECHES.map((sample) => (
              <button
                key={sample.id}
                id={`btn-sample-${sample.id}`}
                onClick={() => handleLoadSample(sample)}
                className="px-2.5 py-1 rounded-md bg-white/10 hover:bg-white/20 border border-white/15 text-teal-100 transition-colors"
              >
                {sample.title.split(':')[0]}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Mode Selection Grid */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider text-slate-500 mb-2.5">
          Select Presentation Assignment / Scenario
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {SPEECH_MODES.map((mode) => {
            const isSelected = selectedMode === mode.id;
            return (
              <button
                key={mode.id}
                id={`btn-mode-${mode.id}`}
                onClick={() => setSelectedMode(mode.id)}
                className={`flex flex-col text-left p-3.5 rounded-xl border transition-all ${
                  isSelected
                    ? 'bg-teal-50/80 border-teal-500 ring-2 ring-teal-500/20 shadow-xs'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50'
                }`}
              >
                <div className="flex items-center justify-between w-full mb-2">
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-wider ${
                    isSelected ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600'
                  }`}>
                    {mode.badge}
                  </span>
                  <span className="text-xs text-slate-400 font-mono">
                    ~{Math.round(mode.suggestedDurationSec / 60)}m
                  </span>
                </div>
                <div className="font-bold text-sm text-slate-900 mb-0.5 font-display">
                  {mode.name}
                </div>
                <div className="text-xs text-slate-500 line-clamp-2">
                  {mode.tagline}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Presentation Context & Settings */}
      <div className="bg-white rounded-xl p-4 sm:p-5 border border-slate-200/80 shadow-xs grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Speech / Topic Title
          </label>
          <input
            id="input-speech-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. COMM 101 Persuasive Speech"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-900"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1">
            Target Audience & Setting
          </label>
          <input
            id="input-target-audience"
            type="text"
            value={audience}
            onChange={(e) => setAudience(e.target.value)}
            placeholder="e.g. Classmates and seminar professor"
            className="w-full px-3 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-900"
          />
        </div>
      </div>

      {/* Main Delivery & Teleprompter Studio */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Studio Control Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200/80 bg-slate-50/70 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center space-x-3">
            <span className="flex h-3 w-3 relative">
              {isRecording ? (
                <>
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-red-500"></span>
                </>
              ) : (
                <span className="relative inline-flex rounded-full h-3 w-3 bg-slate-300"></span>
              )}
            </span>
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Rehearsal Studio
              </span>
              <div className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                <span>{isRecording ? 'Recording Live Rehearsal' : 'Ready to Speak'}</span>
                {isRecording && (
                  <span className="text-red-600 font-mono font-bold text-xs bg-red-50 px-2 py-0.5 rounded-sm">
                    {formatTime(elapsedSeconds)}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Quick Toolbar */}
          <div className="flex items-center space-x-2">
            <button
              id="btn-toggle-teleprompter"
              onClick={() => setIsTeleprompterActive(!isTeleprompterActive)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all flex items-center space-x-1.5 ${
                isTeleprompterActive
                  ? 'bg-teal-600 text-white border-teal-600 shadow-xs'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
              }`}
            >
              <BookOpen className="h-3.5 w-3.5" />
              <span>Teleprompter Mode</span>
            </button>

            {isTeleprompterActive && (
              <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg px-2 py-1 text-xs">
                <span className="text-slate-400">Speed:</span>
                {[1, 2, 3, 4].map((spd) => (
                  <button
                    key={spd}
                    onClick={() => {
                      setTeleprompterSpeed(spd);
                      if (isRecording) startTeleprompterScroll();
                    }}
                    className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                      teleprompterSpeed === spd ? 'bg-teal-100 text-teal-800' : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {spd}x
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Permission Alert if Mic Blocked */}
        {micPermissionError && (
          <div className="p-4 bg-amber-50 border-b border-amber-200 text-amber-900 text-xs flex items-start space-x-2">
            <AlertCircle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Microphone notice: </span>
              {micPermissionError}
            </div>
          </div>
        )}

        {/* Script / Teleprompter Display */}
        <div className="p-4 sm:p-6">
          {isTeleprompterActive ? (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs text-slate-500 pb-1">
                <span>Prompter Scroll (Pace your delivery to roughly 130–150 words per minute)</span>
                <div className="flex items-center space-x-2">
                  <span>Font:</span>
                  <button
                    onClick={() => setFontSize('normal')}
                    className={`px-1.5 py-0.5 rounded ${fontSize === 'normal' ? 'bg-slate-200 font-bold' : ''}`}
                  >
                    A
                  </button>
                  <button
                    onClick={() => setFontSize('large')}
                    className={`px-1.5 py-0.5 rounded text-sm ${fontSize === 'large' ? 'bg-slate-200 font-bold' : ''}`}
                  >
                    A+
                  </button>
                  <button
                    onClick={() => setFontSize('xl')}
                    className={`px-1.5 py-0.5 rounded text-base ${fontSize === 'xl' ? 'bg-slate-200 font-bold' : ''}`}
                  >
                    A++
                  </button>
                </div>
              </div>

              <div
                ref={teleprompterScrollRef}
                className={`w-full h-72 overflow-y-auto p-6 rounded-xl bg-slate-900 text-white font-medium border border-slate-800 shadow-inner leading-relaxed select-none ${
                  fontSize === 'normal' ? 'text-lg' : fontSize === 'large' ? 'text-2xl' : 'text-3xl'
                }`}
              >
                {transcript ? (
                  <p className="whitespace-pre-wrap">{transcript}</p>
                ) : (
                  <p className="text-slate-500 italic text-base">
                    Type or paste your speech notes below to populate the teleprompter...
                  </p>
                )}
              </div>
            </div>
          ) : null}

          {/* Transcript / Notes Editable Textarea */}
          <div className="mt-2">
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5 text-teal-600" />
                <span>Speech Script or Outline Notes</span>
              </label>
              <span className="text-xs text-slate-400 font-mono">
                {wordCount} words | ~{Math.round(wordCount / 135)} min spoken
              </span>
            </div>
            <textarea
              id="textarea-speech-transcript"
              rows={6}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste your presentation script here, or click 'Start Rehearsal' to speak directly into your microphone..."
              className="w-full p-3.5 text-sm bg-slate-50/50 border border-slate-200 rounded-xl focus:outline-hidden focus:ring-2 focus:ring-teal-500 focus:bg-white transition-all text-slate-900 leading-relaxed font-sans"
            />
          </div>

          {/* Audio Visualizer Waveform during recording */}
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
            <div className="md:col-span-2">
              <AudioVisualizer stream={audioStream} isRecording={isRecording} />
            </div>

            {/* Live Stats Gauge */}
            <div className="bg-slate-50 rounded-lg p-2.5 border border-slate-200 flex items-center justify-around text-center">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Timer</span>
                <span className="text-sm font-bold text-slate-900 font-mono">
                  {formatTime(elapsedSeconds)}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Live WPM</span>
                <span className="text-sm font-bold text-teal-700 font-mono">
                  {liveWpm > 0 ? liveWpm : '—'}
                </span>
              </div>
              <div className="h-6 w-px bg-slate-200" />
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Target Pace</span>
                <span className="text-xs font-semibold text-slate-600 font-mono">
                  130–150
                </span>
              </div>
            </div>
          </div>

          {/* Playback Audio Element if recorded */}
          {audioBlobUrl && !isRecording && (
            <div className="mt-4 p-3 bg-teal-50/70 border border-teal-200/80 rounded-xl flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2">
                <Volume2 className="h-4 w-4 text-teal-700" />
                <span className="text-xs font-semibold text-teal-900">
                  Recorded Rehearsal Audio Available
                </span>
              </div>
              <audio controls src={audioBlobUrl} className="h-8 max-w-xs" />
            </div>
          )}

          {/* Primary Action Buttons */}
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-slate-100">
            <div className="flex items-center space-x-2 w-full sm:w-auto">
              {!isRecording ? (
                <button
                  id="btn-start-rehearsal"
                  onClick={startRecording}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 transition-colors shadow-sm shadow-teal-600/30 ring-2 ring-teal-600/10"
                >
                  <Mic className="h-4 w-4" />
                  <span>Start Live Rehearsal</span>
                </button>
              ) : (
                <button
                  id="btn-stop-rehearsal"
                  onClick={stopRecording}
                  className="w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-red-600 hover:bg-red-700 transition-colors shadow-sm shadow-red-600/30"
                >
                  <Square className="h-4 w-4 fill-white" />
                  <span>Stop Rehearsal ({formatTime(elapsedSeconds)})</span>
                </button>
              )}

              {transcript.trim() && (
                <button
                  id="btn-clear-rehearsal"
                  onClick={() => {
                    if (isRecording) stopRecording();
                    setTranscript('');
                    setAudioBlobUrl(null);
                    setElapsedSeconds(0);
                  }}
                  className="p-2.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  title="Clear text & reset Rehearsal"
                >
                  <RotateCcw className="h-4 w-4" />
                </button>
              )}
            </div>

            <button
              id="btn-run-ai-coach"
              disabled={!transcript.trim() || isLoadingAnalysis}
              onClick={handleAnalyzeClick}
              className={`w-full sm:w-auto inline-flex items-center justify-center space-x-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all ${
                !transcript.trim() || isLoadingAnalysis
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                  : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg ring-2 ring-slate-900/10'
              }`}
            >
              {isLoadingAnalysis ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>AI Coach is Analyzing Delivery...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-4 w-4 text-teal-400" />
                  <span>Run AI Speech Analysis</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
