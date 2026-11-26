import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Award, CheckCircle2, Clock, History, RotateCcw, XCircle, ArrowRight } from 'lucide-react';
import { testingApi } from '../api/testing';
import { TestSessionListItem } from '../types/testing';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const HistoryPage: React.FC = () => {
  const [sessions, setSessions] = useState<TestSessionListItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    testingApi
      .getSessionsList()
      .then((data) => setSessions(data))
      .catch((err) => console.error('Error fetching test history:', err))
      .finally(() => setLoading(false));
  }, []);

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins} хв ${secs} сек`;
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
            <History className="w-7 h-7 text-blue-600" />
            <span>Історія тестувань</span>
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Усі ваші спроби, офіційні іспити та результати розбору помилок
          </p>
        </div>

        <Link
          to="/testing"
          className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold shadow-sm transition"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Новий тест</span>
        </Link>
      </div>

      {loading ? (
        <LoadingSpinner size="lg" text="Завантаження історії..." />
      ) : sessions.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center space-y-4">
          <History className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-lg font-bold text-slate-800">Історія спроб порожня</h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            Ви ще не проходили жодного тесту. Розпочніть із тренувального або екзаменаційного тесту!
          </p>
          <Link
            to="/testing"
            className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-semibold"
          >
            Обрати режим тесту
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((item: TestSessionListItem) => {
            const isCompleted = item.status === 'completed';
            const isPassed = item.is_passed;

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:border-blue-300 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {item.mode_display}
                    </span>
                    {item.section_title && (
                      <span className="text-xs text-slate-500 font-medium line-clamp-1">
                        {item.section_title}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>
                      {new Date(item.started_at).toLocaleDateString('uk-UA', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" />
                      {formatDuration(item.duration_seconds)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-6 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <div className="text-right">
                    <div className="flex items-center gap-1.5 text-sm font-bold">
                      {isPassed ? (
                        <span className="text-emerald-600 flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Складено
                        </span>
                      ) : (
                        <span className="text-rose-600 flex items-center gap-1">
                          <XCircle className="w-4 h-4" /> Не складено
                        </span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {item.correct_answers_count} / {item.total_questions} правильних
                    </div>
                  </div>

                  {isCompleted ? (
                    <Link
                      to={`/testing/results/${item.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition"
                    >
                      <span>Розбір</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      to={`/testing/session/${item.id}`}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-bold rounded-xl hover:bg-blue-100"
                    >
                      Продовжити
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
