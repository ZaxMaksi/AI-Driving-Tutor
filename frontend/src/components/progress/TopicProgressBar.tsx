import React from 'react';
import { CheckCircle2, AlertCircle } from 'lucide-react';
import { TopicProgressItem } from '../../types/progress';

interface TopicProgressBarProps {
  item: TopicProgressItem;
}

export const TopicProgressBar: React.FC<TopicProgressBarProps> = ({ item }) => {
  const isMastered = item.is_mastered;

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition shadow-xs">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-mono">
            № {item.section_number}
          </span>
          <h4 className="text-sm font-semibold text-slate-900 line-clamp-1">{item.section_title}</h4>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {isMastered ? (
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Освоєно
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
              <AlertCircle className="w-3.5 h-3.5" />
              В процесі
            </span>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-100 rounded-full h-2 mb-2 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            item.accuracy_percent >= 90
              ? 'bg-emerald-500'
              : item.accuracy_percent >= 70
              ? 'bg-blue-500'
              : 'bg-amber-500'
          }`}
          style={{ width: `${Math.min(100, Math.max(0, item.accuracy_percent))}%` }}
        />
      </div>

      <div className="flex justify-between text-xs text-slate-500">
        <span>Спроб: {item.questions_attempted} (Правильно: {item.correct_answers})</span>
        <span className="font-semibold text-slate-800">{item.accuracy_percent}%</span>
      </div>
    </div>
  );
};
