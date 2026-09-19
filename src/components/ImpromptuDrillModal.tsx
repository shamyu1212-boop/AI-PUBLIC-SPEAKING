import React, { useState } from 'react';
import { X, Zap, RefreshCw, Clock, ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import { ImpromptuTopic } from '../types';

interface ImpromptuDrillModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopicForRehearsal: (topic: ImpromptuTopic) => void;
}

export const ImpromptuDrillModal: React.FC<ImpromptuDrillModalProps> = ({
  isOpen,
  onClose,
  onSelectTopicForRehearsal,
}) => {
  const [category, setCategory] = useState<'college-life' | 'academic-debate' | 'fun-quirky'>('college-life');
  const [topicData, setTopicData] = useState<ImpromptuTopic | null>({
    topic: 'Why 8:00 AM classes should be abolished by university decree',
    context: 'Freshman seminar debate where you propose a humane campus schedule.',
    guidingQuestions: [
      'What happens to student alertness and sleep hygiene?',
      'How does schedule design affect GPA and mental health?',
      'What practical alternatives could the university adopt?',
    ],
    suggestedStructure: 'Hook (The sound of the 7:15 AM alarm) -> 2 Main Points -> Humorous call to action',
    timeLimitSeconds: 90,
  });

  const [isLoading, setIsLoading] = useState(false);
  const [prepSeconds, setPrepSeconds] = useState(30);
  const [isPrepping, setIsPrepping] = useState(false);

  const fetchNewTopic = async (cat = category) => {
    setIsLoading(true);
    setIsPrepping(false);
    setPrepSeconds(30);
    try {
      const res = await fetch('/api/generate-impromptu', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ category: cat }),
      });
      if (!res.ok) throw new Error('Failed to generate prompt');
      const data = await res.json();
      setTopicData(data);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const startPrepTimer = () => {
    setIsPrepping(true);
    setPrepSeconds(30);
    const interval = setInterval(() => {
      setPrepSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsPrepping(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 flex items-center justify-between bg-amber-50/70">
          <div className="flex items-center space-x-2.5">
            <div className="p-2 rounded-xl bg-amber-200 text-amber-900">
              <Zap className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 font-display">
                Quick Impromptu Drill
              </h3>
              <p className="text-xs text-slate-600">
                Train off-the-cuff speaking for classroom seminar discussions & Q&A
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-amber-100 transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Category picker & reload */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center space-x-1.5">
            {(['college-life', 'academic-debate', 'fun-quirky'] as const).map((cat) => (
              <button
                key={cat}
                onClick={() => {
                  setCategory(cat);
                  fetchNewTopic(cat);
                }}
                className={`px-3 py-1 rounded-lg text-xs font-semibold capitalize border transition-all ${
                  category === cat
                    ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {cat.replace('-', ' ')}
              </button>
            ))}
          </div>

          <button
            id="btn-new-impromptu-topic"
            onClick={() => fetchNewTopic()}
            disabled={isLoading}
            className="px-3 py-1 rounded-lg text-xs font-semibold text-slate-700 bg-white border border-slate-200 hover:bg-slate-100 transition-colors flex items-center space-x-1"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
            <span>New Prompt</span>
          </button>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-5 flex-1">
          {topicData ? (
            <div className="space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-amber-800 bg-amber-100 px-2 py-0.5 rounded-sm">
                  Your Topic
                </span>
                <h4 className="text-xl font-extrabold text-slate-900 font-display mt-1.5">
                  "{topicData.topic}"
                </h4>
                <p className="text-xs text-slate-600 italic mt-1">
                  Scenario: {topicData.context}
                </p>
              </div>

              {/* Guiding Questions */}
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
                  Quick Angle Starters (Pick 1 or 2):
                </span>
                <ul className="space-y-1.5 text-xs text-slate-700">
                  {topicData.guidingQuestions.map((q, idx) => (
                    <li key={idx} className="flex items-start space-x-2">
                      <span className="text-amber-600 font-bold">•</span>
                      <span>{q}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Suggested 3-part structure */}
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs space-y-1">
                <span className="font-bold text-amber-950">Recommended 60s Flow:</span>
                <p className="text-amber-900">{topicData.suggestedStructure}</p>
              </div>

              {/* 30s Prep Timer Box */}
              <div className="p-4 rounded-xl bg-slate-900 text-white flex items-center justify-between">
                <div>
                  <span className="text-xs text-slate-400 font-semibold block">
                    Rapid Prep Window
                  </span>
                  <span className="text-2xl font-bold font-mono text-amber-400">
                    {prepSeconds}s remaining
                  </span>
                </div>
                {!isPrepping ? (
                  <button
                    onClick={startPrepTimer}
                    className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs rounded-xl transition-colors"
                  >
                    Start 30s Prep
                  </button>
                ) : (
                  <span className="text-xs text-slate-300 animate-pulse">
                    Breathe & pick your main point!
                  </span>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center py-8 text-slate-500">
              Loading prompt...
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-between items-center">
          <span className="text-xs text-slate-500">
            Target speech: ~{topicData?.timeLimitSeconds || 75} seconds
          </span>
          <button
            onClick={() => {
              if (topicData) {
                onSelectTopicForRehearsal(topicData);
                onClose();
              }
            }}
            className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl transition-colors flex items-center space-x-1.5 shadow-xs"
          >
            <span>Practice This Topic in Studio</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
