import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Award, BookOpen, CheckCircle, Clock, Shuffle, Sparkles, AlertCircle } from 'lucide-react';
import { testingApi } from '../api/testing';
import { trafficRulesApi } from '../api/trafficRules';
import { RuleSection } from '../types/trafficRules';
import { TestMode } from '../types/testing';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const TestingModesPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const preselectedMode = (searchParams.get('mode') as TestMode) || 'exam';
  const preselectedSectionId = searchParams.get('section_id')
    ? parseInt(searchParams.get('section_id')!, 10)
    : null;

  const [mode, setMode] = useState<TestMode>(preselectedMode);
  const [selectedSectionId, setSelectedSectionId] = useState<number | null>(preselectedSectionId);
  const [questionCount, setQuestionCount] = useState<number>(20);

  const [sections, setSections] = useState<RuleSection[]>([]);
  const [loadingSections, setLoadingSections] = useState(false);
  const [starting, setStarting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoadingSections(true);
    trafficRulesApi
      .getSections()
      .then((data) => {
        setSections(data);
        if (!selectedSectionId && data.length > 0) {
          setSelectedSectionId(data[0].id);
        }
      })
      .catch((err) => console.error('Failed to load sections:', err))
      .finally(() => setLoadingSections(false));
  }, []);

  const handleStartSession = async () => {
    setError(null);
    if (mode === 'by_topic' && !selectedSectionId) {
      setError('Будь ласка, оберіть розділ ПДР для тематичного тестування.');
      return;
    }

    setStarting(true);
    try {
      const session = await testingApi.startSession({
        mode,
        section_id: mode === 'by_topic' ? selectedSectionId : null,
        question_count: mode === 'exam' ? 20 : questionCount,
      });
      navigate(`/testing/session/${session.id}`);
    } catch (err: unknown) {
      console.error('Failed to start test session:', err);
      const axiosError = err as { response?: { data?: Record<string, string[] | string> | string } };
      let msg = 'Не вдалося створити тестову сесію. Можливо, в базі немає доступних питань для обраного розділу.';
      if (typeof axiosError.response?.data === 'string') {
        msg = axiosError.response.data;
      } else if (axiosError.response?.data?.section_id) {
        msg = String(axiosError.response.data.section_id);
      } else if (axiosError.response?.data?.detail) {
        msg = String(axiosError.response.data.detail);
      }
      setError(msg);
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 space-y-8">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs font-bold uppercase tracking-wider text-blue-600 bg-blue-50 px-3 py-1 rounded-full">
          Центр тестування
        </span>
        <h1 className="text-2xl md:text-4xl font-extrabold text-slate-900 mt-2">
          Оберіть режим підготовки
        </h1>
        <p className="text-sm text-slate-600 mt-2">
          Тренуйтеся за офіційними екзаменаційними білетами, закріплюйте окремі теми або перевіряйте себе
          на унікальних ситуаціях від ШІ.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-sm flex items-start gap-3">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Modes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Mode 1: Real Exam */}
        <div
          onClick={() => setMode('exam')}
          className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            mode === 'exam'
              ? 'border-blue-600 bg-blue-50/50 shadow-md ring-2 ring-blue-600/10'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-700">
                Офіційний формат
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Екзамен ПДР</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Імітація реального сервісного іспиту МВС: 20 випадкових питань, 20 хвилин. Дозволяється не
              більше 2 помилок.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> 20 питань
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5 text-blue-500" /> 20 хвилин
            </span>
          </div>
        </div>

        {/* Mode 2: By Topic */}
        <div
          onClick={() => setMode('by_topic')}
          className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            mode === 'by_topic'
              ? 'border-emerald-600 bg-emerald-50/50 shadow-md ring-2 ring-emerald-600/10'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <BookOpen className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                Тематичний
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Тест за розділом</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Фокусована перевірка знань за одним із 34 розділів. Допомагає закрити прогалини в складних
              темах.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-500" /> На вибір
            </span>
            <span>Без ліміту часу</span>
          </div>
        </div>

        {/* Mode 3: Mixed */}
        <div
          onClick={() => setMode('mixed')}
          className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            mode === 'mixed'
              ? 'border-indigo-600 bg-indigo-50/50 shadow-md ring-2 ring-indigo-600/10'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center">
                <Shuffle className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                Довільний
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">Змішаний марафон</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Випадкові питання з різних тем без тиску таймера для спокійного щоденного тренування.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-indigo-500" /> Гнучка кількість
            </span>
            <span>Збереження прогресу</span>
          </div>
        </div>

        {/* Mode 4: AI Training */}
        <div
          onClick={() => setMode('ai_training')}
          className={`p-6 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between ${
            mode === 'ai_training'
              ? 'border-amber-600 bg-amber-50/50 shadow-md ring-2 ring-amber-600/10'
              : 'border-slate-200 hover:border-slate-300 bg-white'
          }`}
        >
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5" />
              </div>
              <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                Gemini 2.5
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-base mb-1">ШІ-Тренування</h3>
            <p className="text-xs text-slate-500 leading-relaxed mb-4">
              Тестування за питаннями, сформульованими штучним інтелектом для аналізу складних нюансів та
              підводних каменів.
            </p>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500 border-t border-slate-100 pt-3">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" /> Ситуативні кейси
            </span>
          </div>
        </div>
      </div>

      {/* Mode Configurations (Topic Selector / Question Count) */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-4">
        {mode === 'by_topic' && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Оберіть розділ ПДР:
            </label>
            {loadingSections ? (
              <LoadingSpinner size="sm" />
            ) : (
              <select
                value={selectedSectionId || ''}
                onChange={(e) => setSelectedSectionId(parseInt(e.target.value, 10))}
                className="w-full p-3 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    Розділ {s.number}: {s.title} ({s.points_count || 0} пунктів)
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        {mode !== 'exam' && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-2">
              Кількість питань: {questionCount}
            </label>
            <input
              type="range"
              min="5"
              max="30"
              step="5"
              value={questionCount}
              onChange={(e) => setQuestionCount(parseInt(e.target.value, 10))}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-slate-400 mt-1 font-mono">
              <span>5</span>
              <span>10</span>
              <span>15</span>
              <span>20</span>
              <span>25</span>
              <span>30</span>
            </div>
          </div>
        )}

        {/* Start Button */}
        <div className="pt-2">
          <button
            onClick={handleStartSession}
            disabled={starting}
            className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl shadow-lg shadow-blue-500/20 transition cursor-pointer flex items-center justify-center gap-2 text-base disabled:opacity-60"
          >
            {starting ? <LoadingSpinner size="sm" /> : <CheckCircle className="w-5 h-5" />}
            <span>{starting ? 'Формування білета...' : 'Розпочати тестування'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
