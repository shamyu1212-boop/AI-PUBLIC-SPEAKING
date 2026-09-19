export type SpeechMode = 
  | 'comm101'
  | 'icebreaker'
  | 'club-pitch'
  | 'research-poster'
  | 'impromptu';

export interface SpeechModeOption {
  id: SpeechMode;
  name: string;
  tagline: string;
  suggestedDurationSec: number;
  iconName: string;
  badge: string;
  typicalAudience: string;
  description: string;
}

export interface FillerWordItem {
  word: string;
  count: number;
}

export interface GrowthArea {
  area: string;
  suggestion: string;
  exampleFromSpeech?: string;
}

export interface KeyQuotation {
  quote: string;
  note: string;
  type: 'strength' | 'improve';
}

export interface SpeechAnalysisReport {
  overallScore: number;
  toneAssessment: string;
  confidenceBadge: {
    label: string;
    color: string;
  };
  metrics: {
    wpm: number;
    wpmRating: 'too_slow' | 'optimal' | 'too_fast';
    wpmFeedback: string;
    wordCount: number;
    durationSeconds: number;
    fillerWordsCount: number;
    fillerWordsList: FillerWordItem[];
    fillerWordPercentage: number;
    clarityScore: number;
    structureScore: number;
    engagementScore: number;
  };
  strengths: string[];
  growthAreas: GrowthArea[];
  openingHookAnalysis: {
    score: number;
    feedback: string;
    suggestion?: string;
  };
  closingPunchAnalysis: {
    score: number;
    feedback: string;
    suggestion?: string;
  };
  nextPracticeDrill: {
    title: string;
    description: string;
    durationMin: number;
  };
  keyQuotations?: KeyQuotation[];
}

export interface SavedSpeechSession {
  id: string;
  title: string;
  mode: SpeechMode;
  date: string;
  durationSeconds: number;
  wordCount: number;
  wpm: number;
  fillerWordsCount: number;
  overallScore: number;
  transcript: string;
  report: SpeechAnalysisReport;
  audioUrl?: string;
}

export interface ImpromptuTopic {
  topic: string;
  context: string;
  guidingQuestions: string[];
  suggestedStructure: string;
  timeLimitSeconds: number;
}

export interface SentenceRewriteVariation {
  text: string;
  explanation: string;
  styleBadge: string;
}
