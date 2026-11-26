import React from 'react';
import { RulePoint } from '../../types/trafficRules';

interface PointItemProps {
  point: RulePoint;
  highlightQuery?: string;
}

export const PointItem: React.FC<PointItemProps> = ({ point, highlightQuery }) => {
  const renderHighlightedText = (text: string, query?: string) => {
    if (!query || !query.trim()) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return (
      <>
        {parts.map((part, i) =>
          part.toLowerCase() === query.toLowerCase() ? (
            <mark key={i} className="bg-yellow-200 text-slate-900 px-0.5 rounded">
              {part}
            </mark>
          ) : (
            part
          )
        )}
      </>
    );
  };

  return (
    <div className="p-4 bg-white rounded-xl border border-slate-200 hover:border-slate-300 transition shadow-xs">
      <div className="flex items-start gap-3">
        <span className="shrink-0 px-2.5 py-1 text-xs font-bold font-mono rounded bg-slate-100 text-blue-700">
          п. {point.number}
        </span>
        <div className="flex-1 text-sm text-slate-800 leading-relaxed whitespace-pre-line">
          {renderHighlightedText(point.text, highlightQuery)}
        </div>
      </div>
    </div>
  );
};
