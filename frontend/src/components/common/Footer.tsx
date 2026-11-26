import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, BookOpen, Sparkles } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-slate-200 mt-auto py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-6">
          <div>
            <div className="flex items-center gap-2 font-bold text-slate-900 mb-2">
              <span className="w-6 h-6 rounded-md bg-blue-600 text-white flex items-center justify-center text-xs">
                AI
              </span>
              <span>AI Driving Tutor</span>
            </div>
            <p className="text-sm text-slate-500 leading-relaxed">
              Інтелектуальна платформа підготовки до теоретичного іспиту на отримання посвідчення водія
              з підтримкою офіційної бази ПДР України та розумного автоінструктора Gemini.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Нормативна база</h4>
            <p className="text-xs text-slate-500 mb-2">
              Правила дорожнього руху затверджені Постановою Кабінету Міністрів України № 1306 (з усіма чинними змінами).
            </p>
            <div className="flex items-center gap-2 text-xs text-emerald-600 font-medium">
              <ShieldCheck className="w-4 h-4" />
              <span>34 розділи, 297 пунктів актуалізовано</span>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-slate-900 mb-3">Швидкий доступ</h4>
            <ul className="space-y-2 text-sm text-slate-600">
              <li>
                <Link to="/rules" className="hover:text-blue-600 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" />
                  Усі розділи ПДР України
                </Link>
              </li>
              <li>
                <Link to="/testing" className="hover:text-blue-600 flex items-center gap-1.5">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Режими тестування та іспит
                </Link>
              </li>
              <li>
                <Link to="/ai-tutor" className="hover:text-blue-600 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Консультація з автоінструктором
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-100 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-2">
          <span>&copy; {new Date().getFullYear()} AI Driving Tutor. Усі права захищено.</span>
          <span>Підрахунок балів ізольовано від ШІ. Відповіді перевіряються строго сервером.</span>
        </div>
      </div>
    </footer>
  );
};
