import React from 'react';
import { Link } from 'react-router-dom';
import {
  Award,
  BookOpen,
  CheckCircle,
  GraduationCap,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();

  return (
    <div className="space-y-16 py-8">
      {/* Hero Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-8 md:p-16 shadow-2xl">
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-xs md:text-sm font-semibold text-blue-200">
            <Sparkles className="w-4 h-4 text-amber-300 animate-pulse" />
            <span>Інтелектуальна підготовка з Google Gemini 2.5</span>
          </div>

          <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold tracking-tight leading-tight">
            Складай іспит ПДР з першого разу з <span className="text-blue-400">ШІ-автоінструктором</span>
          </h1>

          <p className="text-base md:text-lg text-slate-300 leading-relaxed max-w-2xl">
            Повна офіційна нормативна база ПДР України (Постанова КМУ № 1306, 34 розділи), інтерактивні
            екзамени та віртуальний асистент, який персонально пояснить кожну твою помилку.
          </p>

          <div className="flex flex-wrap gap-4 pt-4">
            <Link
              to="/testing"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/30 transition transform hover:-translate-y-0.5"
            >
              <CheckCircle className="w-5 h-5" />
              Розпочати іспит
            </Link>

            <Link
              to="/rules"
              className="inline-flex items-center gap-2 px-6 py-3.5 bg-white/10 hover:bg-white/20 backdrop-blur-md text-white font-semibold rounded-xl border border-white/20 transition"
            >
              <BookOpen className="w-5 h-5" />
              Читати ПДР України
            </Link>

            {!isAuthenticated && (
              <Link
                to="/register"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/30 transition"
              >
                <GraduationCap className="w-5 h-5" />
                Створити кабінет
              </Link>
            )}
          </div>
        </div>

        {/* Decorative background grid/circles */}
        <div className="absolute -right-20 -bottom-20 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl pointer-events-none" />
        <div className="absolute right-1/4 -top-20 w-80 h-80 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
      </section>

      {/* Core Advantages */}
      <section className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mb-3">
            Чому AI Driving Tutor ефективніший за звичайні тести
          </h2>
          <p className="text-sm md:text-base text-slate-600">
            Поєднання суворої перевірки знань бекендом та персоналізованої підтримки штучного інтелекту.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600 mb-5">
              <Sparkles className="w-6 h-6 text-amber-500" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">ШІ-пояснення помилок</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Не просто показує правильну літеру, а детально розбирає причину твоєї помилки із посиланням на
              конкретні пункти ПДР та життєві ситуації.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 mb-5">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Офіційні норми без галюцинацій</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Усі 34 розділи ПДР України завантажені в структуровану базу. Підрахунок балів ведеться
              виключно бекендом — ШІ не може помилково зарахувати бал.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs hover:shadow-md transition">
            <div className="w-12 h-12 rounded-xl bg-purple-50 border border-purple-100 flex items-center justify-center text-purple-600 mb-5">
              <TrendingUp className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Адаптивна аналітика</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Система відстежує рівень освоєння кожного розділу (критерій освоєння ≥ 90%) та автоматично
              рекомендує повторити слабкі теми.
            </p>
          </div>
        </div>
      </section>

      {/* Modes Overview */}
      <section className="bg-slate-100/70 rounded-3xl p-8 md:p-12 border border-slate-200 max-w-7xl mx-auto">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
          <div>
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600">Навчальні сценарії</span>
            <h2 className="text-2xl md:text-3xl font-bold text-slate-900 mt-1">Обери свій формат тренування</h2>
          </div>
          <Link
            to="/testing"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            Переглянути всі режими →
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md inline-block mb-3">
                Екзамен
              </div>
              <h4 className="font-bold text-slate-900 mb-1">Реальний іспит</h4>
              <p className="text-xs text-slate-500 mb-4">
                20 випадкових питань з таймером на 20 хвилин. Дозволено не більше 2 помилок.
              </p>
            </div>
            <Link
              to="/testing?mode=exam"
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              Скласти іспит →
            </Link>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md inline-block mb-3">
                За розділами
              </div>
              <h4 className="font-bold text-slate-900 mb-1">Тематичний тест</h4>
              <p className="text-xs text-slate-500 mb-4">
                Закріплюй окремий розділ правил, наприклад «Проїзд перехресть» чи «Дорожні знаки».
              </p>
            </div>
            <Link
              to="/rules"
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
            >
              Обрати розділ →
            </Link>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md inline-block mb-3">
                Змішаний
              </div>
              <h4 className="font-bold text-slate-900 mb-1">Різноманітні питання</h4>
              <p className="text-xs text-slate-500 mb-4">
                Швидка перевірка знань по всьому банку питань без обмеження за часом.
              </p>
            </div>
            <Link
              to="/testing?mode=mixed"
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
              Тренуватись →
            </Link>
          </div>

          <div className="bg-white p-5 rounded-2xl border border-slate-200 flex flex-col justify-between">
            <div>
              <div className="text-xs font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md inline-block mb-3 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-amber-500" />
                ШІ-Генератор
              </div>
              <h4 className="font-bold text-slate-900 mb-1">Нестандартні ситуації</h4>
              <p className="text-xs text-slate-500 mb-4">
                Створюй унікальні ситуативні завдання через Gemini за будь-яким розділом ПДР.
              </p>
            </div>
            <Link
              to="/ai-tutor"
              className="text-xs font-semibold text-amber-600 hover:text-amber-700 flex items-center gap-1"
            >
              Згенерувати →
            </Link>
          </div>
        </div>
      </section>

      {/* Virtual Instructor Consultation CTA */}
      <section className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-12 text-white flex flex-col md:flex-row items-center justify-between gap-8 max-w-7xl mx-auto shadow-xl">
        <div className="space-y-3 max-w-xl">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold text-blue-100">
            <MessageSquare className="w-4 h-4 text-amber-300" />
            <span>Консультації 24/7</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold">Маєш сумнів у трактуванні пункту правил?</h2>
          <p className="text-blue-100 text-sm md:text-base leading-relaxed">
            Постав будь-яке запитання нашому віртуальному автоінструктору на природній українській мові й
            отримай точну відповідь із посиланням на офіційні норми.
          </p>
        </div>
        <Link
          to="/ai-tutor"
          className="shrink-0 px-6 py-3.5 bg-white text-blue-700 hover:bg-blue-50 font-bold rounded-xl shadow-lg transition"
        >
          Запитати автоінструктора
        </Link>
      </section>
    </div>
  );
};
