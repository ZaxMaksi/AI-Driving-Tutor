import React, { useEffect, useState } from 'react';
import { Sparkles, X, BookOpen, AlertCircle } from 'lucide-react';
import { aiTutorApi } from '../../api/aiTutor';
import { LoadingSpinner } from '../common/LoadingSpinner';

interface ExplainModalProps {
  isOpen: boolean;
  onClose: () => void;
  questionId: number;
  selectedOptionId: number;
  questionText: string;
}

export const ExplainModal: React.FC<ExplainModalProps> = ({
  isOpen,
  onClose,
  questionId,
  selectedOptionId,
  questionText,
}) => {
  const [loading, setLoading] = useState<boolean>(true);
  const [explanation, setExplanation] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && questionId && selectedOptionId) {
      setLoading(true);
      setError(null);
      aiTutorApi
        .explainMistake({
          question_id: questionId,
          selected_option_id: selectedOptionId,
        })
        .then((res) => {
          setExplanation(res.explanation);
        })
        .catch((err) => {
          console.error('Error fetching AI explanation:', err);
          setError(
            err.response?.data?.error ||
              err.response?.data?.detail ||
              'Не вдалося отримати пояснення від ШІ. Перевірте підключення або спробуйте пізніше.'
          );
        })
        .finally(() => {
          setLoading(false);
        });
    }
  }, [isOpen, questionId, selectedOptionId]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl border border-slate-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-white/20">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h3 className="font-bold text-base">Розбір помилки від Gemini AI</h3>
              <p className="text-xs text-blue-100">Персональне пояснення автоінструктора</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-white/80 hover:text-white hover:bg-white/10 transition cursor-pointer"
            aria-label="Закрити"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {/* Question context box */}
          <div className="mb-4 p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block mb-1">
              Питання, в якому допущено помилку:
            </span>
            <p className="text-sm font-medium text-slate-800">{questionText}</p>
          </div>

          {loading ? (
            <div className="py-12">
              <LoadingSpinner
                size="lg"
                text="ШІ аналізує нормативні пункти ПДР та формує педагогічне пояснення..."
              />
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl flex items-start gap-3">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p className="text-sm">{error}</p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="p-4 bg-blue-50/60 border border-blue-100 rounded-xl text-slate-800 text-sm leading-relaxed whitespace-pre-line">
                {explanation}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Відповідь згенерована на основі чинних норм ПДР України (Постанова КМУ № 1306)</span>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-xl hover:bg-slate-100 transition cursor-pointer"
          >
            Зрозуміло, закрити
          </button>
        </div>
      </div>
    </div>
  );
};
