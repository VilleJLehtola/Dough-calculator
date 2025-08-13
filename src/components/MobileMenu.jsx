import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, LogOut, LogIn, Menu, Plus, BookOpen, Heart, User } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';
import { useTranslation } from 'react-i18next';

export default function MobileMenu(props) {
  const {
    // optional controlled state (preferred)
    isOpen,
    setIsOpen,
    // legacy props some layouts still pass (ignored unless you also pass setIsOpen)
    open: _legacyOpen,
    onClose: _legacyOnClose,
    user,
    onLoginClick,
    onLogout,
  } = props;

  // If parent provides setIsOpen, use controlled mode; otherwise keep our own state
  const controlled = typeof setIsOpen === 'function';
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlled ? !!isOpen : internalOpen;
  const setOpen = controlled ? setIsOpen : setInternalOpen;

  const { i18n, t } = useTranslation();
  const isDark = document.documentElement.classList.contains('dark');

  const langs = [
    { code: 'fi', label: 'FI' },
    { code: 'en', label: 'EN' },
    { code: 'sv', label: 'SV' },
  ];
  const activeLang = localStorage.getItem('lang') || i18n.language || 'fi';

  const changeLang = (code) => {
    localStorage.setItem('lang', code);
    i18n.changeLanguage(code);
    window.dispatchEvent(new CustomEvent('langchange', { detail: code }));
  };

  return (
    <>
      {/* Hamburger (mobile only) */}
      <button
        type="button"
        className="fixed top-4 left-4 z-[60] p-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-md md:hidden"
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Overlay closes drawer */}
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setOpen(false)}
          aria-label="Close menu"
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 left-0 h-full w-72 z-50 bg-white dark:bg-slate-900 shadow-lg transform transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Push content down so it doesn't sit under the hamburger */}
        <nav className="flex flex-col px-6 pb-6 pt-16 space-y-3 text-gray-900 dark:text-gray-100 overflow-y-auto h-full">
          {/* --- Discover --- */}
          <div className="text-xs uppercase tracking-wide opacity-60">{t('discover', 'Discover')}</div>
          <Link to="/" onClick={() => setOpen(false)} className="py-2">{t('home','Home')}</Link>
          <Link to="/browse" onClick={() => setOpen(false)} className="py-2">{t('browse','Browse')}</Link>
          <Link to="/calculator" onClick={() => setOpen(false)} className="py-2">{t('calculator','Calculator')}</Link>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-slate-700 my-2" />

          {/* --- Create --- */}
          <div className="text-xs uppercase tracking-wide opacity-60">{t('create', 'Create')}</div>
          <Link to="/create" onClick={() => setOpen(false)} className="py-2 inline-flex items-center gap-2">
            <Plus className="w-4 h-4" /> {t('create_recipe','Create a recipe')}
          </Link>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-slate-700 my-2" />

          {/* --- Library --- */}
          <div className="text-xs uppercase tracking-wide opacity-60">{t('library', 'Library')}</div>
          {/* If you have a "Your recipes" route, keep this; otherwise remove/adjust */}
          <Link to="/your-recipes" onClick={() => setOpen(false)} className="py-2 inline-flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> {t('your_recipes','Your recipes')}
          </Link>
          <Link to="/favorites" onClick={() => setOpen(false)} className="py-2 inline-flex items-center gap-2">
            <Heart className="w-4 h-4" /> {t('favorites','Favorites')}
          </Link>
          <Link to="/profile" onClick={() => setOpen(false)} className="py-2 inline-flex items-center gap-2">
            <User className="w-4 h-4" /> {t('your_profile','Your profile')}
          </Link>

          {/* Divider */}
          <div className="border-t border-gray-200 dark:border-slate-700 my-3" />

          {/* Language selector */}
          <div>
            <div className="mb-2 text-xs uppercase tracking-wide opacity-60">
              {t('language','Language')}
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
          <div className="flex items-center gap-3 pt-3 border-t border-gray-200 dark:border-slate-700">
            {isDark ? (
              <Moon className="w-5 h-5 text-yellow-400" />
            ) : (
              <Sun className="w-5 h-5 text-blue-500" />
            )}
            <span className="text-sm">{t('dark_mode','Dark mode')}</span>
            <DarkModeToggle />
          </div>

          {/* Auth */}
          <div className="pt-3 border-t border-gray-200 dark:border-slate-700">
            {user ? (
              <button
                type="button"
                onClick={() => { onLogout?.(); setOpen(false); }}
                className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                {/* lucide logout icon included above */}
                {t('logout','Log out')}
              </button>
            ) : (
              <button
                type="button"
                onClick={() => { onLoginClick?.(); setOpen(false); }}
                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <LogIn className="w-4 h-4" />
                {t('login','Login')}
              </button>
            )}
          </div>
        </nav>
      </aside>
    </>
  );
}
