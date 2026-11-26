import React, { useEffect, useState } from 'react';
import { BookOpen, Search, ShieldCheck, X } from 'lucide-react';
import { trafficRulesApi } from '../api/trafficRules';
import { RulePointSearchResult, RuleSection } from '../types/trafficRules';
import { SectionCard } from '../components/rules/SectionCard';
import { PointItem } from '../components/rules/PointItem';
import { LoadingSpinner } from '../components/common/LoadingSpinner';

export const TrafficRulesPage: React.FC = () => {
  const [sections, setSections] = useState<RuleSection[]>([]);
  const [loading, setLoading] = useState(true);

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<RulePointSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  useEffect(() => {
    trafficRulesApi
      .getSections()
      .then((data) => setSections(data))
      .catch((err) => console.error('Error fetching sections:', err))
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsSearching(true);
    setHasSearched(true);
    try {
      const results = await trafficRulesApi.searchPoints(searchQuery);
      setSearchResults(results);
    } catch (err) {
      console.error('Error searching rule points:', err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
    setHasSearched(false);
  };

  return (
    <div className="space-y-8 py-6 max-w-7xl mx-auto px-4">
      {/* Header & Search */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-8 text-white shadow-xl">
        <div className="max-w-3xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-xs font-semibold text-blue-100">
            <ShieldCheck className="w-4 h-4 text-emerald-300" />
            <span>Офіційна редакція: Постанова КМУ № 1306</span>
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">
            Правила дорожнього руху України
          </h1>
          <p className="text-sm md:text-base text-blue-100 leading-relaxed">
            Повний текст усіх 34 розділів та 297 пунктів чинних ПДР України. Зручний повнотекстовий пошук
            за номерами пунктів або ключовими словами.
          </p>

          {/* Search Form */}
          <form onSubmit={handleSearch} className="pt-2 flex gap-2">
            <div className="relative flex-1">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Search className="w-5 h-5" />
              </div>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Пошук за текстом чи номером пункту (наприклад: 1.10, обгін, швидкість)..."
                className="w-full pl-11 pr-10 py-3 rounded-xl bg-white text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-400 text-sm shadow-md"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={handleClearSearch}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <button
              type="submit"
              disabled={isSearching}
              className="px-5 py-3 bg-blue-500 hover:bg-blue-400 text-white font-semibold rounded-xl text-sm transition cursor-pointer shrink-0 shadow-md"
            >
              {isSearching ? 'Пошук...' : 'Знайти'}
            </button>
          </form>
        </div>
      </div>

      {/* Main Content: Search Results OR Sections Grid */}
      {hasSearched ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <h2 className="text-lg font-bold text-slate-900">
              Результати пошуку за запитом "{searchQuery}" ({searchResults.length})
            </h2>
            <button
              onClick={handleClearSearch}
              className="text-xs font-semibold text-blue-600 hover:text-blue-800 cursor-pointer"
            >
              ← Повернутись до списку розділів
            </button>
          </div>

          {isSearching ? (
            <LoadingSpinner size="lg" text="Виконується пошук у нормативній базі..." />
          ) : searchResults.length === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-slate-700">Нічого не знайдено</h3>
              <p className="text-xs text-slate-500 mt-1">
                Спробуйте змінити пошуковий запит або ввести номер пункту без пробілів (наприклад, 12.4).
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {searchResults.map((point) => (
                <div key={point.id} className="space-y-1">
                  <div className="text-xs font-medium text-slate-500 pl-1">
                    Розділ {point.section_number}: {point.section_title}
                  </div>
                  <PointItem point={point} highlightQuery={searchQuery} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-slate-900">Усі розділи правил (34)</h2>
              <p className="text-xs text-slate-500">Оберіть розділ для вивчення або проходження тесту</p>
            </div>
          </div>

          {loading ? (
            <LoadingSpinner size="lg" text="Завантаження розділів ПДР..." />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {sections.map((section) => (
                <SectionCard key={section.id} section={section} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
