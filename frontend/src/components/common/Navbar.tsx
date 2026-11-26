import React, { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { BookOpen, CheckCircle, GraduationCap, History, LogIn, LogOut, Menu, Sparkles, User, X } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const Navbar: React.FC = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `inline-flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors ${
      isActive
        ? 'bg-blue-50 text-blue-700 font-semibold'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
    }`;

  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-3 px-3 py-2 text-base font-medium rounded-lg ${
      isActive ? 'bg-blue-50 text-blue-700 font-semibold' : 'text-slate-700 hover:bg-slate-100'
    }`;

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-50 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
                <GraduationCap className="w-6 h-6" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-lg text-slate-900 leading-tight">AI Driving Tutor</span>
                <span className="text-xs text-blue-600 font-medium">ПДР України & ШІ</span>
              </div>
            </Link>

            {/* Desktop Navigation Links */}
            <div className="hidden md:ml-8 md:flex md:space-x-1">
              <NavLink to="/rules" className={navLinkClass}>
                <BookOpen className="w-4 h-4 mr-1.5 text-slate-500" />
                Правила ПДР
              </NavLink>
              <NavLink to="/testing" className={navLinkClass}>
                <CheckCircle className="w-4 h-4 mr-1.5 text-emerald-500" />
                Тестування
              </NavLink>
              <NavLink to="/ai-tutor" className={navLinkClass}>
                <Sparkles className="w-4 h-4 mr-1.5 text-amber-500" />
                AI-Інструктор
              </NavLink>
              {isAuthenticated && (
                <>
                  <NavLink to="/statistics" className={navLinkClass}>
                    <CheckCircle className="w-4 h-4 mr-1.5 text-blue-500" />
                    Статистика
                  </NavLink>
                  <NavLink to="/history" className={navLinkClass}>
                    <History className="w-4 h-4 mr-1.5 text-slate-500" />
                    Історія
                  </NavLink>
                </>
              )}
            </div>
          </div>

          {/* Desktop User / Auth Actions */}
          <div className="hidden md:flex md:items-center md:space-x-3">
            {isAuthenticated ? (
              <div className="flex items-center gap-3">
                <Link
                  to="/profile"
                  className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  <User className="w-4 h-4 text-slate-500" />
                  <span className="max-w-[150px] truncate">{user?.first_name || user?.email}</span>
                </Link>
                <button
                  onClick={handleLogout}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-rose-600 hover:bg-rose-50 rounded-lg transition cursor-pointer"
                  title="Вийти"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Вихід</span>
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition"
                >
                  <LogIn className="w-4 h-4" />
                  Вхід
                </Link>
                <Link
                  to="/register"
                  className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm shadow-blue-500/20 transition"
                >
                  Реєстрація
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex items-center md:hidden">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
              aria-label="Відкрити меню"
            >
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="md:hidden border-t border-slate-200 px-4 pt-2 pb-4 space-y-1 bg-white">
          <NavLink to="/rules" onClick={() => setIsOpen(false)} className={mobileNavLinkClass}>
            <BookOpen className="w-5 h-5 text-slate-500" />
            Правила ПДР
          </NavLink>
          <NavLink to="/testing" onClick={() => setIsOpen(false)} className={mobileNavLinkClass}>
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            Тестування
          </NavLink>
          <NavLink to="/ai-tutor" onClick={() => setIsOpen(false)} className={mobileNavLinkClass}>
            <Sparkles className="w-5 h-5 text-amber-500" />
            AI-Інструктор
          </NavLink>
          {isAuthenticated && (
            <>
              <NavLink to="/statistics" onClick={() => setIsOpen(false)} className={mobileNavLinkClass}>
                <CheckCircle className="w-5 h-5 text-blue-500" />
                Статистика
              </NavLink>
              <NavLink to="/history" onClick={() => setIsOpen(false)} className={mobileNavLinkClass}>
                <History className="w-5 h-5 text-slate-500" />
                Історія
              </NavLink>
              <NavLink to="/profile" onClick={() => setIsOpen(false)} className={mobileNavLinkClass}>
                <User className="w-5 h-5 text-slate-500" />
                Профіль ({user?.email})
              </NavLink>
            </>
          )}

          <div className="pt-3 border-t border-slate-200">
            {isAuthenticated ? (
              <button
                onClick={() => {
                  setIsOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-rose-600 font-medium rounded-lg hover:bg-rose-50"
              >
                <LogOut className="w-5 h-5" />
                Вийти з акаунта
              </button>
            ) : (
              <div className="flex flex-col gap-2">
                <Link
                  to="/login"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center px-4 py-2 font-medium text-slate-700 bg-slate-100 rounded-lg"
                >
                  Вхід
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsOpen(false)}
                  className="w-full text-center px-4 py-2 font-medium text-white bg-blue-600 rounded-lg"
                >
                  Реєстрація
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};
