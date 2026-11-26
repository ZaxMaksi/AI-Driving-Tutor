import React, { useEffect, useState } from 'react';
import { Award, CheckCircle2, Lock, Save, User, ShieldCheck, Clock } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { authApi } from '../api/auth';
import { progressApi } from '../api/progress';
import { UserStatistics } from '../types/progress';
import { LoadingSpinner } from '../components/common/LoadingSpinner';
import { Alert } from '../components/common/Alert';
import { StatCard } from '../components/progress/StatCard';

export const ProfilePage: React.FC = () => {
  const { user, refreshProfile } = useAuth();

  const [firstName, setFirstName] = useState(user?.first_name || '');
  const [lastName, setLastName] = useState(user?.last_name || '');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Password change state
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [newPasswordConfirm, setNewPasswordConfirm] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Statistics state
  const [stats, setStats] = useState<UserStatistics | null>(null);
  const [statsLoading, setStatsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name || '');
      setLastName(user.last_name || '');
    }
  }, [user]);

  useEffect(() => {
    progressApi
      .getSummary()
      .then((data) => setStats(data))
      .catch((err) => console.error('Failed to load user statistics:', err))
      .finally(() => setStatsLoading(false));
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileSaving(true);
    setProfileMessage(null);
    try {
      await authApi.updateProfile({ first_name: firstName, last_name: lastName });
      await refreshProfile();
      setProfileMessage({ type: 'success', text: 'Профіль успішно оновлено!' });
    } catch {
      setProfileMessage({ type: 'error', text: 'Не вдалося оновити профіль.' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordMessage(null);

    if (newPassword !== newPasswordConfirm) {
      setPasswordMessage({ type: 'error', text: 'Нові паролі не збігаються.' });
      return;
    }

    if (newPassword.length < 8) {
      setPasswordMessage({ type: 'error', text: 'Пароль повинен бути щонайменше 8 символів.' });
      return;
    }

    setPasswordSaving(true);
    try {
      await authApi.changePassword({
        old_password: oldPassword,
        new_password: newPassword,
        new_password_confirm: newPasswordConfirm,
      });
      setPasswordMessage({ type: 'success', text: 'Пароль успішно змінено!' });
      setOldPassword('');
      setNewPassword('');
      setNewPasswordConfirm('');
    } catch (err: unknown) {
      const axiosError = err as { response?: { data?: { error?: string; detail?: string } } };
      setPasswordMessage({
        type: 'error',
        text: axiosError.response?.data?.error || axiosError.response?.data?.detail || 'Помилка зміни пароля.',
      });
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-8 px-4 space-y-8">
      {/* Profile Header */}
      <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white text-2xl font-bold shadow-md shadow-blue-500/20">
            {user?.first_name ? user.first_name[0].toUpperCase() : user?.email[0].toUpperCase()}
          </div>
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-slate-900">
              {user?.first_name || user?.last_name
                ? `${user?.first_name || ''} ${user?.last_name || ''}`
                : 'Курсант автошколи'}
            </h1>
            <p className="text-sm text-slate-500">{user?.email}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              <span>
                Дата реєстрації:{' '}
                {user?.date_joined
                  ? new Date(user.date_joined).toLocaleDateString('uk-UA')
                  : 'Сьогодні'}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-xs font-semibold">
          <ShieldCheck className="w-4 h-4" />
          <span>Акаунт активний</span>
        </div>
      </div>

      {/* Quick Stats Overview */}
      <div>
        <h2 className="text-lg font-bold text-slate-900 mb-4">Навчальні показники</h2>
        {statsLoading ? (
          <LoadingSpinner size="md" />
        ) : stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              icon={<Award className="w-5 h-5" />}
              label="Складено іспитів"
              value={stats.total_exams_passed}
              color="emerald"
            />
            <StatCard
              icon={<CheckCircle2 className="w-5 h-5" />}
              label="Пройдено тестів"
              value={stats.total_tests_passed}
              color="blue"
            />
            <StatCard
              icon={<Clock className="w-5 h-5" />}
              label="Відповідей на питання"
              value={stats.total_questions_answered}
              color="indigo"
            />
            <StatCard
              icon={<Award className="w-5 h-5" />}
              label="Успішність"
              value={`${stats.success_rate_percent}%`}
              color={stats.success_rate_percent >= 85 ? 'emerald' : 'amber'}
            />
          </div>
        ) : null}
      </div>

      {/* Forms Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Personal Details Form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs">
          <div className="flex items-center gap-2 mb-6">
            <User className="w-5 h-5 text-blue-600" />
            <h3 className="text-lg font-bold text-slate-900">Особисті дані</h3>
          </div>

          {profileMessage && (
            <Alert
              type={profileMessage.type}
              message={profileMessage.text}
              onClose={() => setProfileMessage(null)}
              className="mb-4"
            />
          )}

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Ім'я
              </label>
              <input
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="Ім'я"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Прізвище
              </label>
              <input
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Прізвище"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 text-sm disabled:opacity-60 shadow-sm shadow-blue-500/20"
            >
              {profileSaving ? <LoadingSpinner size="sm" /> : <Save className="w-4 h-4" />}
              <span>{profileSaving ? 'Збереження...' : 'Зберегти зміни'}</span>
            </button>
          </form>
        </div>

        {/* Change Password Form */}
        <div className="bg-white rounded-3xl border border-slate-200 p-6 md:p-8 shadow-xs">
          <div className="flex items-center gap-2 mb-6">
            <Lock className="w-5 h-5 text-indigo-600" />
            <h3 className="text-lg font-bold text-slate-900">Зміна пароля</h3>
          </div>

          {passwordMessage && (
            <Alert
              type={passwordMessage.type}
              message={passwordMessage.text}
              onClose={() => setPasswordMessage(null)}
              className="mb-4"
            />
          )}

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Старий пароль
              </label>
              <input
                type="password"
                required
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Новий пароль
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Мінімум 8 символів"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                Повторіть новий пароль
              </label>
              <input
                type="password"
                required
                minLength={8}
                value={newPasswordConfirm}
                onChange={(e) => setNewPasswordConfirm(e.target.value)}
                placeholder="Повторіть новий пароль"
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
              />
            </div>

            <button
              type="submit"
              disabled={passwordSaving}
              className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl transition cursor-pointer flex items-center justify-center gap-2 text-sm disabled:opacity-60"
            >
              {passwordSaving ? <LoadingSpinner size="sm" /> : <Lock className="w-4 h-4" />}
              <span>{passwordSaving ? 'Оновлення...' : 'Оновити пароль'}</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
