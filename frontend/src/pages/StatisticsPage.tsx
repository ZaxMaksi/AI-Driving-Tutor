import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  Award,
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { progressApi } from '../api/progress';
import { TopicProgressItem, UserStatistics, WeakTopicRecommendation } from '../types/progress';
import { StatCard } from '../components/progress/StatCard';
import { TopicProgressBar } from '../components/progress/TopicProgressBar';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const StatisticsPage: React.FC = () => {
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [topics, setTopics] = useState<TopicProgressItem[]>([]);
  const [recommendations, setRecommendations] = useState<WeakTopicRecommendation[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    Promise.all([
      progressApi.getSummary(),
      progressApi.getTopicProgress(),
      progressApi.getRecommendations(),
    ])
      .then(([statsData, topicsData, recsData]) => {
        setStats(statsData);
        setTopics(topicsData);
        setRecommendations(recsData);
      })
      .catch((err) => console.error('Error fetching statistics:', err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Розрахунок аналітики успішності..." />
      </div>
    );
  }

  const masteredCount = topics.filter((t) => t.is_mastered).length;

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 flex items-center gap-2">
          <TrendingUp className="w-7 h-7 text-blue-600" />
          <span>Навчальна статистика та аналітика</span>
        </h1>
        <p className="text-xs md:text-sm text-slate-500 mt-1">
          Відстежуйте свій прогрес, опанування окремих розділів ПДР та персональні рекомендації ШІ
        </p>
      </div>

      {/* Summary Stat Cards */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Award className="w-5 h-5" />}
            label="Офіційних іспитів"
            value={stats.total_exams_passed}
            subtitle="Складено без перескладання"
            color="emerald"
          />
          <StatCard
            icon={<CheckCircle2 className="w-5 h-5" />}
            label="Освоєно тем"
            value={`${masteredCount} з 34`}
            subtitle="Критерій: точність ≥ 90%"
            color="blue"
          />
          <StatCard
            icon={<Clock className="w-5 h-5" />}
            label="Відповідей на питання"
            value={stats.total_questions_answered}
            subtitle={`Правильних: ${stats.total_correct_answers}`}
            color="indigo"
          />
          <StatCard
            icon={<TrendingUp className="w-5 h-5" />}
            label="Середня успішність"
            value={`${stats.success_rate_percent}%`}
            subtitle={stats.success_rate_percent >= 85 ? 'Високий рівень' : 'Потребує уваги'}
            color={stats.success_rate_percent >= 85 ? 'emerald' : 'amber'}
          />
        </div>
      )}

      {/* AI Recommendations / Weak Topics */}
      {recommendations.length > 0 && (
        <div className="bg-gradient-to-r from-amber-500/10 via-orange-500/10 to-amber-500/5 border border-amber-200/80 rounded-3xl p-6 md:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-2 text-amber-800">
            <Sparkles className="w-5 h-5 text-amber-600" />
            <h3 className="font-bold text-lg">Рекомендації від AI Driving Tutor</h3>
          </div>
          <p className="text-xs md:text-sm text-slate-600">
            На основі ваших відповідей ШІ виявив теми з найбільшою кількістю помилок. Рекомендуємо повторити їх перед іспитом:
          </p>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
            {recommendations.map((rec) => (
              <div
                key={rec.section_number}
                className="bg-white p-4 rounded-2xl border border-amber-200 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="font-bold font-mono text-amber-700">
                      Розділ {rec.section_number}
                    </span>
                    <span className="text-rose-600 font-semibold">
                      {rec.incorrect_answers} помилок
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mb-2">{rec.section_title}</h4>
                  <p className="text-xs text-slate-600 leading-relaxed">{rec.recommendation}</p>
                </div>

                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between">
                  <Link
                    to={`/rules/${rec.section_number}`}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <BookOpen className="w-3.5 h-3.5" /> Читати правила
                  </Link>
                  <Link
                    to={`/testing?mode=by_topic`}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700"
                  >
                    Повторити тест →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Topics Progress Grid (34 sections) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Прогрес за розділами ПДР (34)</h3>
            <p className="text-xs text-slate-500">
              Тема вважається освоєною, якщо точність ваших відповідей становить щонайменше 90%
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {topics.map((t) => (
            <TopicProgressBar key={t.id} item={t} />
          ))}
        </div>
      </div>
    </div>
  );
};
