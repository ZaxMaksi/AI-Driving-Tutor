import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, CheckCircle2, ChevronRight } from 'lucide-react';
import { RuleSection } from '../../types/trafficRules';

interface SectionCardProps {
  section: RuleSection;
}

export const SectionCard: React.FC<SectionCardProps> = ({ section }) => {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between group">
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="px-2.5 py-1 text-xs font-semibold rounded-md bg-blue-50 text-blue-700">
            Розділ {section.number}
          </span>
          {section.points_count !== undefined && (
            <span className="text-xs text-slate-500 font-medium">
              {section.points_count} {section.points_count === 1 ? 'пункт' : 'пунктів'}
            </span>
          )}
        </div>

        <h3 className="font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-2 mb-2">
          {section.title}
        </h3>

        {section.description && (
          <p className="text-xs text-slate-500 line-clamp-2 mb-4 leading-relaxed">
            {section.description}
          </p>
        )}
      </div>

      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2 mt-2">
        <Link
          to={`/rules/${section.number}`}
          className="inline-flex items-center text-xs font-semibold text-blue-600 hover:text-blue-800 transition"
        >
          <BookOpen className="w-3.5 h-3.5 mr-1" />
          Читати правила
          <ChevronRight className="w-3.5 h-3.5 ml-0.5" />
        </Link>

        <Link
          to={`/testing?mode=by_topic&section_id=${section.id}`}
          className="inline-flex items-center text-xs font-medium text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 px-2 py-1 rounded transition"
        >
          <CheckCircle2 className="w-3.5 h-3.5 mr-1 text-emerald-500" />
          Тест
        </Link>
      </div>
    </div>
  );
};
