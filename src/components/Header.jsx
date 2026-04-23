import { useState, useEffect } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import { NavLink } from 'react-router-dom';
import { isAdminUser } from '../utils/auth';

const navLinkClass = ({ isActive }) =>
  `block w-full text-left px-4 py-2 rounded ${
    isActive
      ? 'bg-blue-500 text-white'
      : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white'
  }`;

export default function Header({ user, onLogout }) {
  const [showMenu, setShowMenu] = useState(false);
  const [theme, setTheme] = useState('light');
  const { t, i18n } = useTranslation();

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light';
    setTheme(saved);
    document.documentElement.classList.toggle('dark', saved === 'dark');
  }, []);

  const toggleDarkMode = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    document.documentElement.classList.toggle('dark', newTheme === 'dark');
  };

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fi' ? 'en' : 'fi';
    i18n.changeLanguage(newLang);
  };

  return (
    <div className="relative p-6 pb-0">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold dark:text-white">Everything Dough</h1>
        <button
          onClick={() => setShowMenu((prev) => !prev)}
          className="text-2xl focus:outline-none text-gray-700 dark:text-gray-100"
          aria-label="Menu"
        >
          {showMenu ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {showMenu && (
        <div className="absolute right-6 mt-2 w-56 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded shadow z-50 transition-all duration-300">
          <NavLink to="/" onClick={() => setShowMenu(false)} className={navLinkClass}>
            {t('Home')}
          </NavLink>
          <NavLink
            to="/calculator"
            onClick={() => setShowMenu(false)}
            className={navLinkClass}
          >
            {t('Calculator')}
          </NavLink>
          {user && (
            <NavLink
              to="/favorites"
              onClick={() => setShowMenu(false)}
              className={navLinkClass}
            >
              {t('Favorites')}
            </NavLink>
          )}
          {isAdminUser(user) && (
            <NavLink to="/admin" onClick={() => setShowMenu(false)} className={navLinkClass}>
              {t('Admin')}
            </NavLink>
          )}

          {user && (
            <button
              onClick={() => {
                onLogout?.();
                setShowMenu(false);
              }}
              className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {t('Logout')}
            </button>
          )}

          <div className="flex items-center justify-between px-4 py-2 border-t dark:border-gray-700">
            <span className="text-sm dark:text-white">{t('Language')}</span>
            <button
              onClick={toggleLanguage}
              className="text-lg hover:scale-105 transition-transform"
              title={i18n.language === 'fi' ? 'Switch to English' : 'Vaihda suomeksi'}
            >
              {i18n.language === 'fi' ? '🇬🇧' : '🇫🇮'}
            </button>
          </div>

          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-sm dark:text-white">{t('Dark Mode')}</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={theme === 'dark'}
                onChange={toggleDarkMode}
              />
              <div className="w-11 h-6 bg-gray-300 dark:bg-gray-600 peer-checked:bg-blue-600 rounded-full transition duration-300" />
              <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transform transition duration-300 peer-checked:translate-x-full" />
            </label>
          </div>
        </div>
      )}
    </div>
  );
}
