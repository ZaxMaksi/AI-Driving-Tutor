import React, { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Clock,
  Flag,
  HelpCircle,
} from 'lucide-react';
import { testingApi } from '../api/testing';
import { questionsApi } from '../api/questions';
import { trafficRulesApi } from '../api/trafficRules';
import { TestSessionDetail, UserAnswerItem } from '../types/testing';
import { Question } from '../types/question';
import { QuestionView } from '../components/testing/QuestionView';
import { QuestionNav } from '../components/testing/QuestionNav';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const TestSessionPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const sessionId = parseInt(id || '0', 10);
  const navigate = useNavigate();

  const [session, setSession] = useState<TestSessionDetail | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Map of questionId -> selectedOptionId
  const [answersMap, setAnswersMap] = useState<Map<number, number>>(new Map());
  const [answeredQuestionIds, setAnsweredQuestionIds] = useState<Set<number>>(new Set());
  const [answerResultsMap, setAnswerResultsMap] = useState<Map<number, boolean>>(new Map());

  // Timer
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(20 * 60); // 20 mins default for exam
  const timerRef = useRef<any>(null);

  // Finish confirmation dialog
  const [showFinishModal, setShowFinishModal] = useState<boolean>(false);

  // Initialize session and load questions
  useEffect(() => {
    let isMounted = true;

    const loadSessionAndQuestions = async () => {
      try {
        setLoading(true);
        const sessionData = await testingApi.getSessionDetail(sessionId);
        if (!isMounted) return;

        if (sessionData.status === 'completed') {
          navigate(`/testing/results/${sessionId}`, { replace: true });
          return;
        }

        setSession(sessionData);

        // Prepopulate already answered questions if resuming
        const initialAnswers = new Map<number, number>();
        const answeredIds = new Set<number>();
        const initialResults = new Map<number, boolean>();
        sessionData.user_answers.forEach((ua: UserAnswerItem) => {
          initialAnswers.set(ua.question.id, ua.selected_option);
          answeredIds.add(ua.question.id);
          initialResults.set(ua.question.id, ua.is_correct);
        });
        setAnswersMap(initialAnswers);
        setAnsweredQuestionIds(answeredIds);
        setAnswerResultsMap(initialResults);

        // Fetch questions based on session mode
        let filterParams: { section_number?: number; question_type?: 'official' | 'ai_generated' } = {};

        if (sessionData.mode === 'by_topic' && sessionData.section_title) {
          // Find section number by matching title or getting sections
          const sections = await trafficRulesApi.getSections();
          const matchedSection = sections.find((s) => s.title === sessionData.section_title);
          if (matchedSection) {
            filterParams.section_number = matchedSection.number;
          }
        } else if (sessionData.mode === 'ai_training') {
          filterParams.question_type = 'ai_generated';
        }

        const qListResponse = await questionsApi.getQuestions(filterParams);
        const candidateQuestions = qListResponse.results.slice(0, sessionData.total_questions || 20);

        // Fetch full question detail with answers for each candidate question
        const fullQuestions = await Promise.all(
          candidateQuestions.map((q) => questionsApi.getQuestionDetail(q.id))
        );

        if (isMounted) {
          setQuestions(fullQuestions);
        }
      } catch (err) {
        console.error('Error loading session or questions:', err);
        if (isMounted) {
          setError('Не вдалося завантажити сесію тестування або банк питань.');
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadSessionAndQuestions();

    return () => {
      isMounted = false;
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [sessionId, navigate]);

  // Countdown timer for exam mode
  useEffect(() => {
    if (session?.mode === 'exam') {
      timerRef.current = setInterval(() => {
        setTimeLeftSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            handleFinishSession();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session?.mode]);

  const currentQuestion: Question | undefined = questions[currentIndex];

  const handleSelectOption = (optionId: number) => {
    if (!currentQuestion) return;
    const nextMap = new Map(answersMap);
    nextMap.set(currentQuestion.id, optionId);
    setAnswersMap(nextMap);
  };

  const handleSaveAndNext = async () => {
    if (!currentQuestion) return;
    const selectedOptionId = answersMap.get(currentQuestion.id);

    if (selectedOptionId) {
      setSubmitting(true);
      try {
        const submitResult = await testingApi.submitAnswer(sessionId, {
          question_id: currentQuestion.id,
          selected_option_id: selectedOptionId,
          time_spent_seconds: 5,
        });

        setAnsweredQuestionIds((prev) => new Set(prev).add(currentQuestion.id));
        setAnswerResultsMap((prev) => {
          const next = new Map(prev);
          next.set(currentQuestion.id, submitResult.is_correct);
          return next;
        });
      } catch (err) {
        console.error('Failed to submit answer:', err);
      } finally {
        setSubmitting(false);
      }
    }

    // Move to next question if not at the end
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    }
  };

  const handleFinishSession = async () => {
    try {
      setSubmitting(true);
      await testingApi.finishSession(sessionId);
      navigate(`/testing/results/${sessionId}`);
    } catch (err) {
      console.error('Error finishing session:', err);
      navigate(`/testing/results/${sessionId}`);
    } finally {
      setSubmitting(false);
    }
  };

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Підготовка тестової сесії..." />
      </div>
    );
  }

  if (error || !session || questions.length === 0) {
    return (
      <div className="max-w-xl mx-auto py-16 text-center space-y-4">
        <AlertTriangle className="w-12 h-12 text-amber-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-800">
          {error || 'Не знайдено питань для даної тестової сесії.'}
        </h2>
        <button
          onClick={() => navigate('/testing')}
          className="px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          Повернутися до вибору режимів
        </button>
      </div>
    );
  }

  const answeredCount = answeredQuestionIds.size;
  const totalCount = questions.length;
  const isLastQuestion = currentIndex === questions.length - 1;
  const mistakesCount = Array.from(answerResultsMap.values()).filter((isCorrect) => isCorrect === false).length;

  return (
    <div className="max-w-5xl mx-auto py-6 px-4 space-y-6">
      {/* Top Session Bar (Mode, Progress, Timer, Finish Button) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-4 md:p-6 shadow-xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
            {session.mode_display}
          </span>
          <div className="text-xs text-slate-500 font-medium flex items-center gap-2">
            <span>
              Відповідей: <strong className="text-slate-800">{answeredCount}</strong> / {totalCount}
            </span>
            {session.mode === 'exam' && (
              <span className="border-l border-slate-200 pl-2">
                Помилок:{' '}
                <strong
                  className={
                    mistakesCount > 2
                      ? 'text-rose-600 font-bold'
                      : mistakesCount > 0
                      ? 'text-amber-600 font-semibold'
                      : 'text-emerald-600 font-semibold'
                  }
                >
                  {mistakesCount}
                </strong>{' '}
                / 2
              </span>
            )}
          </div>
        </div>

        {/* Timer (Exam Mode) */}
        {session.mode === 'exam' && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-sm font-mono font-bold ${
              timeLeftSeconds < 180
                ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                : 'bg-slate-50 border-slate-200 text-slate-800'
            }`}
          >
            <Clock className="w-4 h-4 text-slate-500" />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>
        )}

        <button
          type="button"
          onClick={() => setShowFinishModal(true)}
          className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-xl transition cursor-pointer"
        >
          <Flag className="w-3.5 h-3.5" />
          <span>Завершити тест</span>
        </button>
      </div>

      {/* Main Question View */}
      {currentQuestion && (
        <QuestionView
          question={currentQuestion}
          selectedOptionId={answersMap.get(currentQuestion.id) || null}
          onSelectOption={handleSelectOption}
          isSubmitting={submitting}
        />
      )}

      {/* Navigation & Controls */}
      <div className="flex items-center justify-between gap-4">
        <button
          type="button"
          disabled={currentIndex === 0}
          onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-50 transition cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Попереднє</span>
        </button>

        <button
          type="button"
          disabled={submitting}
          onClick={handleSaveAndNext}
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-bold shadow-md shadow-blue-500/20 transition cursor-pointer disabled:opacity-60"
        >
          <span>{isLastQuestion ? 'Зберегти відповідь' : 'Зберегти та далі'}</span>
          {!isLastQuestion && <ArrowRight className="w-4 h-4" />}
        </button>
      </div>

      {/* Numbers Navigation Bar */}
      <QuestionNav
        totalQuestions={totalCount}
        currentIndex={currentIndex}
        answeredQuestionIds={answeredQuestionIds}
        answerResultsMap={answerResultsMap}
        questionIds={questions.map((q) => q.id)}
        onSelectIndex={(idx) => setCurrentIndex(idx)}
      />

      {/* Confirm Finish Modal */}
      {showFinishModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <h3 className="text-lg font-bold text-slate-900">Завершити тестування?</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Ви відповіли на <strong>{answeredCount}</strong> з <strong>{totalCount}</strong> питань.
              {answeredCount < totalCount && (
                <span className="text-amber-600 block mt-1">
                  Увага: невідповістині питання будуть зараховані як помилкові!
                </span>
              )}
            </p>

            <div className="flex items-center justify-end gap-3 pt-3">
              <button
                type="button"
                onClick={() => setShowFinishModal(false)}
                className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl"
              >
                Продовжити тест
              </button>
              <button
                type="button"
                onClick={handleFinishSession}
                className="px-5 py-2.5 text-xs font-bold text-white bg-rose-600 hover:bg-rose-700 rounded-xl shadow-md transition"
              >
                Так, завершити
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
