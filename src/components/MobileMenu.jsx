import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, LogOut, LogIn, Menu } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';
import { useTranslation } from 'react-i18next';

export default function MobileMenu({
  isOpen,
  setIsOpen,
  user,
  onLoginClick,
  onLogout,
}) {
  const { i18n, t } = useTranslation();
  const isDark = document.documentElement.classList.contains('dark');

  const langs = [
    { code: 'fi', label: 'FI' },
    { code: 'en', label: 'EN' },
    { code: 'sv', label: 'SV' },
  ];
  const activeLang =
    localStorage.getItem('lang') || i18n.language || 'fi';

  const changeLang = (code) => {
    try {
      localStorage.setItem('lang', code);
      i18n.changeLanguage(code);
      // notify parts of the app that listen for language changes
      window.dispatchEvent(new CustomEvent('langchange', { detail: code }));
    } catch {}
  };

  return (
    <>
      {/* Single global hamburger (mobile only) */}
      <button
        className="fixed top-4 left-4 z-[60] p-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-md md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
        type="button"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Dim overlay */}
      {isOpen && (
        <button
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-label="Close menu"
          type="button"
        />
      )}

      {/* Sliding drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 z-50 bg-white dark:bg-slate-900 shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        <nav className="flex flex-col p-6 space-y-4 text-gray-900 dark:text-gray-100">
          <Link to="/" onClick={() => setIsOpen(false)}>
            {t('home', 'Home')}
          </Link>
          <Link to="/browse" onClick={() => setIsOpen(false)}>
            {t('browse', 'Browse')}
          </Link>
          <Link to="/calculator" onClick={() => setIsOpen(false)}>
            {t('calculator', 'Calculator')}
          </Link>
          <Link to="/favorites" onClick={() => setIsOpen(false)}>
            {t('favorites', 'Favorites')}
          </Link>
          <Link to="/profile" onClick={() => setIsOpen(false)}>
            {t('your_profile', 'Your profile')}
          </Link>

          {/* Language selector */}
          <div className="pt-4 mt-2 border-t border-gray-200 dark:border-slate-700">
            <div className="mb-2 text-xs uppercase tracking-wide opacity-70">
              {t('language', 'Language')}
            </div>
            <div className="flex gap-2">
              {langs.map((l) => (
                <button
                  key={l.code}
                  type="button"
                  onClick={() => changeLang(l.code)}
                  className={`px-2.5 py-1 rounded-md border text-sm ${
                    activeLang === l.code
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-800'
                  }`}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          {/* Theme toggle */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-200 dark:border-slate-700">
            {isDark ? (
              <Moon className="w-5 h-5 text-yellow-400" />
            ) : (
              <Sun className="w-5 h-5 text-blue-500" />
            )}
            <span className="text-sm">{t('dark_mode', 'Dark mode')}</span>
            <DarkModeToggle />
          </div>

          {/* Auth actions */}
          <div className="pt-6 border-t border-gray-200 dark:border-slate-700 mt-2">
            {user ? (
              <button
                onClick={() => {
                  onLogout?.();
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:underline"
                type="button"
              >
                <LogOut className="w-4 h-4" />
                {t('logout', 'Log out')}
              </button>
            ) : (
              <button
                onClick={() => {
                  onLoginClick?.();
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
                type="button"
              >
                <LogIn className="w-4 h-4" />
                {t('login', 'Login')}
              </button>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
}
