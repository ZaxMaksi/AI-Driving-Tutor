import React, { useEffect, useState } from 'react';
import {
  BookOpen,
  HelpCircle,
  MessageSquare,
  Send,
  Sparkles,
  Zap,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import { aiTutorApi } from '../api/aiTutor';
import { trafficRulesApi } from '../api/trafficRules';
import { AIGenerationLogItem } from '../types/aiTutor';
import { RuleSection } from '../types/trafficRules';
import { Question } from '../types/question';
import { QuestionView } from '../components/testing/QuestionView';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const AITutorPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'consult' | 'generator' | 'logs'>('consult');

  // Consultation state
  const [query, setQuery] = useState('');
  const [consultSectionId, setConsultSectionId] = useState<number | null>(null);
  const [consultLoading, setConsultLoading] = useState(false);
  const [chatMessages, setChatMessages] = useState<
    Array<{ sender: 'user' | 'tutor'; text: string; time: string }>
  >([
    {
      sender: 'tutor',
      text: 'Вітаю! Я ваш віртуальний автоінструктор на базі Google Gemini 2.5. Маєте запитання щодо дорожніх ситуацій, знаків, розмітки чи пріоритетів проїзду за ПДР України? Запитайте мене!',
      time: 'Зараз',
    },
  ]);

  // Question generator state
  const [sections, setSections] = useState<RuleSection[]>([]);
  const [selectedGenSectionId, setSelectedGenSectionId] = useState<number | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [generatedQuestion, setGeneratedQuestion] = useState<Question | null>(null);
  const [selectedOptionId, setSelectedOptionId] = useState<number | null>(null);
  const [showGenResult, setShowGenResult] = useState<boolean>(false);

  // Logs state
  const [logs, setLogs] = useState<AIGenerationLogItem[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    trafficRulesApi
      .getSections()
      .then((data) => {
        setSections(data);
        if (data.length > 0) {
          setSelectedGenSectionId(data[0].id);
        }
      })
      .catch((err) => console.error('Error fetching sections:', err));
  }, []);

  const handleSendConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || consultLoading) return;

    const userText = query.trim();
    setQuery('');
    setChatMessages((prev) => [
      ...prev,
      {
        sender: 'user',
        text: userText,
        time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
      },
    ]);

    setConsultLoading(true);
    try {
      const res = await aiTutorApi.consult({
        query: userText,
        section_id: consultSectionId,
      });

      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'tutor',
          text: res.answer,
          time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } catch (err) {
      console.error('Consultation error:', err);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'tutor',
          text: 'Вибачте, сталася помилка під час зв’язку з сервісом Gemini. Спробуйте ще раз.',
          time: new Date().toLocaleTimeString('uk-UA', { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setConsultLoading(false);
    }
  };

  const handleGenerateQuestion = async () => {
    if (!selectedGenSectionId) return;
    setGenLoading(true);
    setGeneratedQuestion(null);
    setSelectedOptionId(null);
    setShowGenResult(false);

    try {
      const question = await aiTutorApi.generateQuestion({ section_id: selectedGenSectionId });
      setGeneratedQuestion(question);
    } catch (err) {
      console.error('Error generating question:', err);
    } finally {
      setGenLoading(false);
    }
  };

  const handleLoadLogs = () => {
    setActiveTab('logs');
    setLogsLoading(true);
    aiTutorApi
      .getLogs()
      .then((data) => setLogs(data))
      .catch((err) => console.error('Error fetching AI logs:', err))
      .finally(() => setLogsLoading(false));
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-purple-800 rounded-3xl p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="space-y-2 max-w-xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-xs font-bold text-amber-300">
            <Sparkles className="w-4 h-4" />
            <span>Google Gemini 2.5 Flash</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold">ШІ-Автоінструктор ПДР</h1>
          <p className="text-xs md:text-sm text-blue-100 leading-relaxed">
            Персональний наставник для розуміння найскладніших пунктів Правил дорожнього руху України.
            Відповідає виключно на підставі офіційних норм Постанови КМУ № 1306.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex bg-white/10 backdrop-blur-md p-1 rounded-2xl border border-white/20 shrink-0">
          <button
            onClick={() => setActiveTab('consult')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'consult' ? 'bg-white text-blue-700 shadow-md' : 'text-white hover:bg-white/10'
            }`}
          >
            Консультація
          </button>
          <button
            onClick={() => setActiveTab('generator')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'generator' ? 'bg-white text-blue-700 shadow-md' : 'text-white hover:bg-white/10'
            }`}
          >
            Генератор питань
          </button>
          <button
            onClick={handleLoadLogs}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer ${
              activeTab === 'logs' ? 'bg-white text-blue-700 shadow-md' : 'text-white hover:bg-white/10'
            }`}
          >
            Аудит запитів
          </button>
        </div>
      </div>

      {/* Tab 1: Virtual Instructor Consultation Chat */}
      {activeTab === 'consult' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-xs flex flex-col h-[650px] overflow-hidden">
          {/* Chat Focus Section Selector */}
          <div className="px-6 py-3 border-b border-slate-100 bg-slate-50 flex items-center justify-between gap-4 text-xs">
            <span className="font-semibold text-slate-600">Фокус на розділі (опціонально):</span>
            <select
              value={consultSectionId || ''}
              onChange={(e) =>
                setConsultSectionId(e.target.value ? parseInt(e.target.value, 10) : null)
              }
              className="py-1 px-3 rounded-lg border border-slate-200 bg-white text-xs text-slate-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">Усі розділи ПДР</option>
              {sections.map((s) => (
                <option key={s.id} value={s.id}>
                  Розділ {s.number}: {s.title}
                </option>
              ))}
            </select>
          </div>

          {/* Messages list */}
          <div className="flex-1 p-6 overflow-y-auto space-y-4 bg-slate-50/50">
            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-3 max-w-2xl ${
                  msg.sender === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'
                }`}
              >
                <div
                  className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${
                    msg.sender === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-purple-100 text-purple-700 border border-purple-200'
                  }`}
                >
                  {msg.sender === 'user' ? 'Ви' : <Sparkles className="w-4 h-4 text-amber-500" />}
                </div>

                <div>
                  <div
                    className={`p-4 rounded-2xl text-sm leading-relaxed whitespace-pre-line shadow-xs ${
                      msg.sender === 'user'
                        ? 'bg-blue-600 text-white rounded-tr-none'
                        : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-slate-400 mt-1 block px-1">{msg.time}</span>
                </div>
              </div>
            ))}

            {consultLoading && (
              <div className="flex gap-3 max-w-md">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 border border-purple-200 flex items-center justify-center shrink-0">
                  <Sparkles className="w-4 h-4 text-amber-500 animate-spin" />
                </div>
                <div className="p-4 rounded-2xl bg-white border border-slate-200 text-sm text-slate-500 flex items-center gap-2">
                  <LoadingSpinner size="sm" />
                  <span>Інструктор аналізує ПДР та пише відповідь...</span>
                </div>
              </div>
            )}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleSendConsultation} className="p-4 bg-white border-t border-slate-200 flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Напишіть своє запитання до автоінструктора (наприклад: хто має перевагу на круговому русі?)..."
              className="flex-1 px-4 py-3 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
            <button
              type="submit"
              disabled={consultLoading || !query.trim()}
              className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl shadow-md transition disabled:opacity-50 cursor-pointer flex items-center gap-1.5 shrink-0 text-sm"
            >
              <span>Запитати</span>
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}

      {/* Tab 2: Custom Question Generator */}
      {activeTab === 'generator' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-6">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Генерація унікальних питань через Gemini</h3>
            <p className="text-xs text-slate-500">
              Модель формулює нову дорожню задачу строго за обраним розділом ПДР із 4 варіантами відповідей
              та перевіряє її через Structured Outputs.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 items-end">
            <div className="flex-1">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
                Оберіть розділ ПДР:
              </label>
              <select
                value={selectedGenSectionId || ''}
                onChange={(e) => setSelectedGenSectionId(parseInt(e.target.value, 10))}
                className="w-full p-3 rounded-xl border border-slate-300 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                {sections.map((s) => (
                  <option key={s.id} value={s.id}>
                    Розділ {s.number}: {s.title}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleGenerateQuestion}
              disabled={genLoading}
              className="px-6 py-3 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold rounded-xl shadow-md transition flex items-center gap-2 text-sm disabled:opacity-60 cursor-pointer shrink-0"
            >
              {genLoading ? <LoadingSpinner size="sm" /> : <Zap className="w-4 h-4 text-amber-300" />}
              <span>{genLoading ? 'Генерація...' : 'Згенерувати питання'}</span>
            </button>
          </div>

          {generatedQuestion && (
            <div className="pt-6 border-t border-slate-100 space-y-6">
              <QuestionView
                question={generatedQuestion}
                selectedOptionId={selectedOptionId}
                onSelectOption={(optId) => {
                  setSelectedOptionId(optId);
                  setShowGenResult(true);
                }}
              />

              {showGenResult && (
                <div className="p-4 bg-blue-50 rounded-2xl border border-blue-200 space-y-2 animate-in fade-in">
                  <div className="flex items-center gap-2 text-sm font-bold text-blue-900">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    <span>Питання збережено в статусі модерації "pending"</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Усі згенеровані штучним інтелектом питання аудитуються та не потрапляють в офіційний
                    іспит без попередньої модерації.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Audit Logs */}
      {activeTab === 'logs' && (
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs space-y-4">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-slate-900">Журнал запитів до LLM (Аудит)</h3>
            <p className="text-xs text-slate-500">
              Прозорий моніторинг усіх звернень вашого акаунта до Google Gemini API
            </p>
          </div>

          {logsLoading ? (
            <LoadingSpinner size="lg" text="Завантаження журналу..." />
          ) : logs.length === 0 ? (
            <p className="text-sm text-slate-500 py-8 text-center">Записів у журналі поки що немає.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold px-2 py-0.5 rounded bg-blue-100 text-blue-700">
                      {log.request_type_display}
                    </span>
                    <span className="text-slate-400">
                      {new Date(log.created_at).toLocaleString('uk-UA')}
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 font-mono">Модель: {log.model_name}</div>
                  <p className="text-xs text-slate-700 line-clamp-3 bg-white p-3 rounded-lg border border-slate-200">
                    {log.response_text}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
