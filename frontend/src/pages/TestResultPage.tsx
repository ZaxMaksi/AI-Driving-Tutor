import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import {
  AlertCircle,
  Award,
  CheckCircle2,
  Clock,
  RotateCcw,
  Sparkles,
  TrendingUp,
  XCircle,
  BookOpen,
} from 'lucide-react';
import { testingApi } from '../api/testing';
import { TestSessionDetail, UserAnswerItem } from '../types/testing';
import { ExplainModal } from '../components/ai/ExplainModal';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const TestResultPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const sessionId = parseInt(id || '0', 10);

  const [session, setSession] = useState<TestSessionDetail | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // AI Explain Modal state
  const [selectedMistake, setSelectedMistake] = useState<{
    questionId: number;
    selectedOptionId: number;
    questionText: string;
  } | null>(null);

  useEffect(() => {
    testingApi
      .getSessionDetail(sessionId)
      .then((data) => setSession(data))
      .catch((err) => {
        console.error('Error fetching session results:', err);
        setError('Не вдалося завантажити результати тестування.');
      })
      .finally(() => setLoading(false));
  }, [sessionId]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Завантаження результатів тесту..." />
      </div>
    );
  }

  if (error || !session) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">{error || 'Сесію не знайдено.'}</h2>
        <Link to="/testing" className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold">
          До тестування
        </Link>
      </div>
    );
  }

  const isPassed = session.is_passed;
  const isExam = session.mode === 'exam';
  const totalQuestions = session.total_questions;
  const correctCount = session.correct_answers_count;
  const incorrectCount = session.incorrect_answers_count;
  const unansweredCount = Math.max(0, totalQuestions - (correctCount + incorrectCount));
  const successPercentage = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} хв ${secs} сек`;
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Result Hero Banner */}
      <div
        className={`rounded-3xl p-8 md:p-10 text-white shadow-xl relative overflow-hidden ${
          isPassed
            ? 'bg-gradient-to-br from-emerald-600 via-teal-700 to-slate-900'
            : 'bg-gradient-to-br from-rose-600 via-red-700 to-slate-900'
        }`}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-3 text-center md:text-left">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold uppercase tracking-wider">
              {session.mode_display}
            </div>

            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight">
              {isPassed ? 'Вітаємо! Тест успішно складено' : 'Тест не складено'}
            </h1>

            <p className="text-white/90 text-sm md:text-base max-w-lg">
              {isExam
                ? isPassed
                  ? `Чудовий результат! Допущено лише ${incorrectCount} помилок (норма: не більше 2). Ви готові до офіційного іспиту в сервісному центрі МВС!`
                  : `Допущено ${incorrectCount} помилок при допустимій нормі не більше 2. Не засмучуйтесь, розберіть помилки нижче та повторіть спробу!`
                : isPassed
                ? `Правильних відповідей: ${correctCount} з ${totalQuestions} (${successPercentage}%). Тему успішно закріплено!`
                : `Правильних відповідей: ${correctCount} з ${totalQuestions} (${successPercentage}%). Рекомендуємо повторити цей розділ ПДР.`}
            </p>
          </div>

          {/* Large percentage circle */}
          <div className="w-32 h-32 rounded-full bg-white/10 backdrop-blur-md border-4 border-white/40 flex flex-col items-center justify-center shrink-0 shadow-lg">
            <span className="text-3xl font-extrabold">{successPercentage}%</span>
            <span className="text-xs text-white/80 font-medium">Успішність</span>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center">
          <span className="text-xs font-semibold text-slate-500 uppercase">Всього питань</span>
          <div className="text-2xl font-extrabold text-slate-900 mt-1">{totalQuestions}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center">
          <span className="text-xs font-semibold text-emerald-600 uppercase">Правильних</span>
          <div className="text-2xl font-extrabold text-emerald-600 mt-1">{correctCount}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center">
          <span className="text-xs font-semibold text-rose-600 uppercase">Помилок</span>
          <div className="text-2xl font-extrabold text-rose-600 mt-1">{incorrectCount}</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs text-center">
          <span className="text-xs font-semibold text-slate-500 uppercase">Витрачено часу</span>
          <div className="text-base font-bold text-slate-800 mt-2 font-mono">
            {formatDuration(session.duration_seconds)}
          </div>
        </div>
      </div>

      {/* Quick Action Buttons */}
      <div className="flex flex-wrap items-center gap-3">
        <Link
          to="/testing"
          className="inline-flex items-center gap-2 px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold rounded-xl shadow-md transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Пройти новий тест</span>
        </Link>

        <Link
          to="/statistics"
          className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 text-sm font-semibold rounded-xl transition"
        >
          <TrendingUp className="w-4 h-4 text-blue-600" />
          <span>Переглянути статистику</span>
        </Link>

        <Link
          to="/ai-tutor"
          className="inline-flex items-center gap-2 px-5 py-3 bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 text-sm font-semibold rounded-xl transition ml-auto"
        >
          <Sparkles className="w-4 h-4 text-amber-500" />
          <span>Запитати інструктора Gemini</span>
        </Link>
      </div>

      {/* Detailed Question-by-Question Breakdown */}
      <div className="space-y-6 pt-4">
        <h2 className="text-xl font-bold text-slate-900">
          Детальний розбір відповідей ({session.user_answers.length})
        </h2>

        {session.user_answers.map((ua: UserAnswerItem, index: number) => {
          const isCorrect = ua.is_correct;
          const question = ua.question;

          return (
            <div
              key={ua.id}
              className={`bg-white rounded-3xl border p-6 md:p-8 shadow-xs transition ${
                isCorrect ? 'border-emerald-200' : 'border-rose-200'
              }`}
            >
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="flex items-center gap-2">
                  <span className="w-7 h-7 rounded-xl bg-slate-100 font-mono font-bold text-xs flex items-center justify-center text-slate-700">
                    #{index + 1}
                  </span>
                  <span
                    className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      isCorrect ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                    }`}
                  >
                    {isCorrect ? <CheckCircle2 className="w-3.5 h-3.5" /> : <XCircle className="w-3.5 h-3.5" />}
                    {isCorrect ? 'Правильно' : 'Помилка'}
                  </span>
                </div>

                {/* AI Explanation Trigger Button for incorrect answers */}
                {!isCorrect && (
                  <button
                    type="button"
                    onClick={() =>
                      setSelectedMistake({
                        questionId: question.id,
                        selectedOptionId: ua.selected_option,
                        questionText: question.text,
                      })
                    }
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Пояснити з Gemini AI</span>
                  </button>
                )}
              </div>

              {/* Question Text */}
              <h3 className="font-bold text-slate-900 text-base mb-4 leading-snug">{question.text}</h3>

              {/* Options Breakdown */}
              <div className="space-y-2 mb-4">
                {(question.answers || []).map((opt) => {
                  const isUserSelection = opt.id === ua.selected_option;
                  const isTheCorrectOne = opt.is_correct === true;

                  let optBg = 'bg-slate-50 border-slate-200 text-slate-700';
                  if (isTheCorrectOne) {
                    optBg = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold';
                  } else if (isUserSelection && !isCorrect) {
                    optBg = 'bg-rose-50 border-rose-300 text-rose-900 font-semibold line-through';
                  }

                  return (
                    <div
                      key={opt.id}
                      className={`p-3 rounded-xl border text-sm flex items-center justify-between gap-3 ${optBg}`}
                    >
                      <span>{opt.text}</span>
                      <div className="shrink-0 flex items-center gap-1.5 text-xs font-semibold">
                        {isTheCorrectOne && (
                          <span className="text-emerald-700 flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" /> Правильна відповідь
                          </span>
                        )}
                        {isUserSelection && (
                          <span className={isCorrect ? 'text-emerald-700' : 'text-rose-700'}>
                            (Ваш вибір)
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Official Backend Law Explanation */}
              {question.explanation && (
                <div className="p-3.5 bg-blue-50/70 border border-blue-100 rounded-xl text-xs text-slate-700 space-y-1">
                  <div className="font-bold text-blue-800 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" />
                    <span>Нормативне пояснення (ПДР України):</span>
                  </div>
                  <p className="leading-relaxed">{question.explanation}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* AI Explanation Modal */}
      {selectedMistake && (
        <ExplainModal
          isOpen={!!selectedMistake}
          onClose={() => setSelectedMistake(null)}
          questionId={selectedMistake.questionId}
          selectedOptionId={selectedMistake.selectedOptionId}
          questionText={selectedMistake.questionText}
        />
      )}
    </div>
  );
};
