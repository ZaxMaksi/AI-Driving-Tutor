import React from 'react';
import { AnswerOption, Question } from '../../types/question';

interface QuestionViewProps {
  question: Question;
  selectedOptionId: number | null;
  onSelectOption: (optionId: number) => void;
  isSubmitting?: boolean;
}

export const QuestionView: React.FC<QuestionViewProps> = ({
  question,
  selectedOptionId,
  onSelectOption,
  isSubmitting = false,
}) => {
  const mainImage = question.images && question.images.length > 0 ? question.images[0] : null;
  const optionsList: AnswerOption[] = question.answers || [];

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs">
      {/* Question Header & Meta */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-100">
        <div className="flex items-center gap-2">
          {question.section_title && (
            <span className="text-xs font-semibold px-2.5 py-1 rounded bg-slate-100 text-slate-700">
              {question.section_title}
            </span>
          )}
          <span
            className={`text-xs font-bold px-2 py-0.5 rounded ${
              question.difficulty === 1
                ? 'bg-emerald-50 text-emerald-700'
                : question.difficulty === 2
                ? 'bg-amber-50 text-amber-700'
                : 'bg-rose-50 text-rose-700'
            }`}
          >
            {question.difficulty === 1
              ? 'Легке'
              : question.difficulty === 2
              ? 'Середнє'
              : 'Складне'}
          </span>
          {question.question_type === 'ai_generated' && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500 animate-pulse" />
              ШІ-питання
            </span>
          )}
        </div>
        <span className="text-xs text-slate-400 font-mono">ID: #{question.id}</span>
      </div>

      {/* Question Text */}
      <h2 className="text-lg md:text-xl font-bold text-slate-900 mb-6 leading-snug">
        {question.text}
      </h2>

      {/* Question Image (if any) */}
      {mainImage && (
        <div className="mb-6 rounded-2xl overflow-hidden border border-slate-200 bg-slate-50 max-w-lg mx-auto shadow-inner">
          <img
            src={mainImage.image}
            alt={mainImage.caption || 'Ілюстрація до питання'}
            className="w-full h-auto max-h-72 object-contain mx-auto"
          />
          {mainImage.caption && (
            <p className="text-xs text-slate-500 p-2 text-center bg-slate-100 border-t border-slate-200">
              {mainImage.caption}
            </p>
          )}
        </div>
      )}

      {/* Answer Options */}
      <div className="space-y-3">
        {optionsList.map((option: AnswerOption, index: number) => {
          const isSelected = selectedOptionId === option.id;
          const letterLabel = String.fromCharCode(65 + index); // A, B, C, D...

          return (
            <button
              key={option.id}
              type="button"
              disabled={isSubmitting}
              onClick={() => onSelectOption(option.id)}
              className={`w-full text-left p-4 rounded-2xl border transition-all flex items-start gap-4 cursor-pointer ${
                isSelected
                  ? 'border-blue-600 bg-blue-50/70 ring-2 ring-blue-600/20'
                  : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/60 bg-white'
              } ${isSubmitting ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <div
                className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                  isSelected
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'
                }`}
              >
                {letterLabel}
              </div>
              <div className="flex-1 text-sm md:text-base text-slate-800 pt-0.5 leading-relaxed">
                {option.text}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
