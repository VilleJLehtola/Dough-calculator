import React from 'react';
import { Link } from 'react-router-dom';
import {
  Menu,
  LogOut,
  LogIn,
  Plus,
  BookOpen,
  Heart,
  User,
  Home,
  Calculator,
  Globe,
} from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';
import { useTranslation } from 'react-i18next';

export default function MobileMenu(props) {
  const {
    // Preferred controlled props
    isOpen,
    setIsOpen,
    // Legacy props (ignored unless setIsOpen is provided)
    open: _legacyOpen,
    onClose: _legacyOnClose,
    user,
    onLoginClick,
    onLogout,
  } = props;

  // If parent provides setIsOpen, use controlled mode; else keep internal state
  const controlled = typeof setIsOpen === 'function';
  const [internalOpen, setInternalOpen] = React.useState(false);
  const open = controlled ? !!isOpen : internalOpen;
  const setOpen = controlled ? setIsOpen : setInternalOpen;

  const { i18n, t } = useTranslation();

  // --- Language picker ---
  const langs = [
    { code: 'fi', label: 'FI' },
    { code: 'en', label: 'EN' },
    { code: 'sv', label: 'SV' },
  ];
  const activeLang =
    (typeof localStorage !== 'undefined' && localStorage.getItem('lang')) ||
    i18n.language ||
    'fi';

  const changeLang = (code) => {
    try {
      localStorage.setItem('lang', code);
    } catch (_) {}
    i18n.changeLanguage(code);
    window.dispatchEvent(new CustomEvent('langchange', { detail: code }));
  };

  const closeAnd = (fn) => () => {
    setOpen(false);
    if (typeof fn === 'function') fn();
  };

  return (
    <>
      {/* Hamburger (mobile only) — raised higher + safe-area aware */}
      <button
        type="button"
        className="fixed left-4 z-[60] p-2 bg-white dark:bg-slate-900 border border-gray-300 dark:border-slate-600 rounded-md shadow-md md:hidden top-[max(0.5rem,env(safe-area-inset-top)+0.25rem)] md:top-4"
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
        className={`fixed top-0 left-0 h-full w-72 z-50 bg-white dark:bg-slate-900 shadow-lg transform transition-transform duration-300 ease-in-out md:hidden ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        {/* Push content down so it doesn't sit under the hamburger */}
        <nav className="flex flex-col px-6 pb-6 pt-16 space-y-4 text-gray-900 dark:text-gray-100 overflow-y-auto h-full">
          {/* --- Discover --- */}
          <div className="text-xs uppercase tracking-wide opacity-60">
            {t('discover', 'Discover')}
          </div>

          <Link to="/" onClick={closeAnd()} className="flex items-center gap-3 py-2">
            <Home className="w-4 h-4" /> {t('home', 'Home')}
          </Link>

          <Link to="/browse" onClick={closeAnd()} className="flex items-center gap-3 py-2">
            <BookOpen className="w-4 h-4" /> {t('browse', 'Browse')}
          </Link>

          <Link to="/calculator" onClick={closeAnd()} className="flex items-center gap-3 py-2">
            <Calculator className="w-4 h-4" /> {t('calculator', 'Calculator')}
          </Link>

          {/* --- My stuff --- */}
          <div className="mt-2 text-xs uppercase tracking-wide opacity-60">
            {t('mystuff', 'My stuff')}
          </div>

          <Link to="/favorites" onClick={closeAnd()} className="flex items-center gap-3 py-2">
            <Heart className="w-4 h-4" /> {t('favorites', 'Favorites')}
          </Link>

          {user ? (
            <Link to="/account" onClick={closeAnd()} className="flex items-center gap-3 py-2">
              <User className="w-4 h-4" /> {t('account', 'Account')}
            </Link>
          ) : null}

          {/* --- Actions --- */}
          {user ? (
            <Link to="/admin" onClick={closeAnd()} className="flex items-center gap-3 py-2">
              <Plus className="w-4 h-4" /> {t('addRecipe', 'Add recipe')}
            </Link>
          ) : null}

          {/* Divider */}
          <hr className="border-gray-200 dark:border-slate-700 my-2" />

          {/* --- Language + Theme --- */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 opacity-70" />
              <span className="text-sm opacity-80">{t('language', 'Language')}</span>
            </div>
            <div className="flex gap-1">
              {langs.map((l) => (
                <button
                  key={l.code}
                  onClick={() => changeLang(l.code)}
                  className={[
                    'px-2 py-1 text-xs rounded-md border',
                    activeLang?.startsWith(l.code)
                      ? 'bg-blue-600 text-white border-blue-600'
                      : 'bg-transparent text-gray-800 dark:text-gray-100 border-gray-300 dark:border-slate-600',
                  ].join(' ')}
                >
                  {l.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <span className="text-sm opacity-80">{t('appearance', 'Appearance')}</span>
            <DarkModeToggle />
          </div>

          {/* Divider */}
          <hr className="border-gray-200 dark:border-slate-700 my-2" />

          {/* --- Auth --- */}
          {user ? (
            <button
              onClick={closeAnd(onLogout)}
              className="flex items-center gap-3 py-2 text-rose-600 hover:text-rose-700 dark:text-rose-400"
            >
              <LogOut className="w-4 h-4" /> {t('logout', 'Log out')}
            </button>
          ) : (
            <button
              onClick={closeAnd(onLoginClick)}
              className="flex items-center gap-3 py-2 text-blue-600 hover:text-blue-700 dark:text-blue-400"
            >
              <LogIn className="w-4 h-4" /> {t('login', 'Log in')}
            </button>
          )}

          {/* Spacer to avoid bottom cut-off on phones with home indicator */}
          <div className="pt-[env(safe-area-inset-bottom)]" />
        </nav>
      </aside>
    </>
  );
}
