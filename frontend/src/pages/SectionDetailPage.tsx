import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, BookOpen, CheckCircle2, ChevronLeft, ChevronRight, ShieldCheck } from 'lucide-react';
import { trafficRulesApi } from '../api/trafficRules';
import { RulePoint, RuleSection } from '../types/trafficRules';
import { PointItem } from '../components/rules/PointItem';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const SectionDetailPage: React.FC = () => {
  const { number } = useParams<{ number: string }>();
  const sectionNum = parseInt(number || '1', 10);

  const [section, setSection] = useState<RuleSection | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    trafficRulesApi
      .getSectionDetail(sectionNum)
      .then((data) => setSection(data))
      .catch((err) => console.error('Error fetching section details:', err))
      .finally(() => setLoading(false));
  }, [sectionNum]);

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <LoadingSpinner size="lg" text="Завантаження тексту розділу ПДР..." />
      </div>
    );
  }

  if (!section) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-800">Розділ не знайдено</h2>
        <p className="text-sm text-slate-500 mt-2">
          Розділ ПДР № {sectionNum} не існує в офіційній нормативній базі.
        </p>
        <Link
          to="/rules"
          className="mt-4 inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> До переліку розділів
        </Link>
      </div>
    );
  }

  const prevSectionNum = sectionNum > 1 ? sectionNum - 1 : null;
  const nextSectionNum = sectionNum < 34 ? sectionNum + 1 : null;

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 space-y-6">
      {/* Back button & Section Navigation */}
      <div className="flex items-center justify-between">
        <Link
          to="/rules"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-4 h-4" /> До всіх розділів
        </Link>

        <div className="flex items-center gap-2">
          {prevSectionNum && (
            <Link
              to={`/rules/${prevSectionNum}`}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition text-xs font-medium flex items-center gap-1"
            >
              <ChevronLeft className="w-4 h-4" /> Розділ {prevSectionNum}
            </Link>
          )}
          {nextSectionNum && (
            <Link
              to={`/rules/${nextSectionNum}`}
              className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 transition text-xs font-medium flex items-center gap-1"
            >
              Розділ {nextSectionNum} <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </div>
      </div>

      {/* Section Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold font-mono">
            Розділ {section.number}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500 font-medium">
              {section.points ? section.points.length : 0} пунктів
            </span>
            <Link
              to={`/testing?mode=by_topic&section_id=${section.id}`}
              className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              Пройти тест за розділом
            </Link>
          </div>
        </div>

        <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900 mb-3">{section.title}</h1>

        {section.description && (
          <p className="text-sm text-slate-600 leading-relaxed border-t border-slate-100 pt-3">
            {section.description}
          </p>
        )}
      </div>

      {/* Points List */}
      <div className="space-y-3">
        <h3 className="text-sm font-bold uppercase tracking-wider text-slate-500 px-1">
          Нормативні пункти
        </h3>
        {section.points && section.points.length > 0 ? (
          section.points.map((point: RulePoint) => <PointItem key={point.id} point={point} />)
        ) : (
          <div className="p-8 bg-white rounded-2xl border border-slate-200 text-center text-sm text-slate-500">
            Пункти для даного розділу завантажуються або відсутні.
          </div>
        )}
      </div>

      {/* Bottom CTA Card */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl p-6 md:p-8 text-white flex flex-col sm:flex-row items-center justify-between gap-4 shadow-lg">
        <div>
          <h4 className="text-lg font-bold">Закріпити знання з розділу {section.number}</h4>
          <p className="text-xs text-blue-100 mt-1">
            Пройдіть тестування за цим розділом або запитайте в AI-інструктора незрозумілі нюанси.
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <Link
            to={`/testing?mode=by_topic&section_id=${section.id}`}
            className="px-5 py-2.5 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-xs font-bold shadow-md transition"
          >
            Розпочати тест
          </Link>
        </div>
      </div>
    </div>
  );
};
