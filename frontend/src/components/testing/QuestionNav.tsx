import React from 'react';

interface QuestionNavProps {
  totalQuestions: number;
  currentIndex: number;
  answeredQuestionIds: Set<number>;
  answerResultsMap?: Map<number, boolean>;
  questionIds: number[];
  onSelectIndex: (index: number) => void;
}

export const QuestionNav: React.FC<QuestionNavProps> = ({
  totalQuestions,
  currentIndex,
  answeredQuestionIds,
  answerResultsMap,
  questionIds,
  onSelectIndex,
}) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Навігація по тесту ({currentIndex + 1} з {totalQuestions})
        </h4>

        {/* Legend */}
        <div className="flex items-center gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
            <span>Вірно</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500 inline-block" />
            <span>Помилка</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-slate-200 border border-slate-300 inline-block" />
            <span>Немає відповіді</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-5 sm:grid-cols-10 gap-2">
        {Array.from({ length: totalQuestions }).map((_, idx) => {
          const isCurrent = idx === currentIndex;
          const qId = questionIds[idx];
          const isAnswered = qId !== undefined && answeredQuestionIds.has(qId);
          const isCorrect = qId !== undefined && answerResultsMap ? answerResultsMap.get(qId) : undefined;

          let btnClass = 'bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 hover:bg-slate-100';

          if (isAnswered) {
            if (isCorrect === true) {
              btnClass = 'bg-emerald-500 text-white border-emerald-600 font-bold hover:bg-emerald-600 shadow-2xs';
            } else if (isCorrect === false) {
              btnClass = 'bg-rose-500 text-white border-rose-600 font-bold hover:bg-rose-600 shadow-2xs';
            } else {
              btnClass = 'bg-slate-200 text-slate-700 border-slate-300 font-semibold';
            }
          }

          if (isCurrent) {
            if (isAnswered) {
              btnClass += ' ring-3 ring-blue-500 ring-offset-2 scale-105 z-10';
            } else {
              btnClass = 'bg-blue-600 text-white border-blue-600 ring-3 ring-blue-500/40 font-bold scale-105 z-10 shadow-sm';
            }
          }

          return (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectIndex(idx)}
              className={`h-10 w-full rounded-xl border text-sm flex items-center justify-center transition-all cursor-pointer ${btnClass}`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>
    </div>
  );
};
