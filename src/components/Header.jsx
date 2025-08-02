import React, { useState, useEffect } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';

export default function Header({ user, activeView, setActiveView, logout }) {
  const [showMenu, setShowMenu] = useState(false);
  const [theme, setTheme] = useState('light');
  const { t, i18n } = useTranslation();

  const isAdmin = user?.email === 'ville.j.lehtola@gmail.com';

  const toggleLanguage = () => {
    const newLang = i18n.language === 'fi' ? 'en' : 'fi';
    i18n.changeLanguage(newLang);
  };

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
    setShowMenu(false);
  };

  const handleViewChange = (view) => {
    setActiveView(view);
    setShowMenu(false);
  };

  return (
    <div className="relative">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold dark:text-white">{t("Calculator")}</h1>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-2xl focus:outline-none text-gray-700 dark:text-gray-100"
          aria-label="Menu"
        >
          {showMenu ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded shadow z-50 transition-all duration-300">
          <button
            onClick={() => handleViewChange('calculator')}
            className={`block w-full text-left px-4 py-2 rounded ${
              activeView === 'calculator'
                ? 'bg-blue-500 text-white'
                : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white'
            }`}
          >
            {t("Calculator")}
          </button>

          {user && (
            <>
              <button
                onClick={() => handleViewChange('favorites')}
                className={`block w-full text-left px-4 py-2 rounded ${
                  activeView === 'favorites'
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white'
                }`}
              >
                {t("Favorites")}
              </button>

              <button
                onClick={() => handleViewChange('recipes')}
                className={`block w-full text-left px-4 py-2 rounded ${
                  activeView === 'recipes'
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white'
                }`}
              >
                {t("Recipes")}
              </button>

              {isAdmin && (
                <button
                  onClick={() => handleViewChange('admin')}
                  className={`block w-full text-left px-4 py-2 rounded ${
                    activeView === 'admin'
                      ? 'bg-blue-500 text-white'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white'
                  }`}
                >
                  {t("Admin")}
                </button>
              )}

              <button
                onClick={logout}
                className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                {t("Logout")}
              </button>
            </>
          )}

          {!user && (
            <button
              onClick={() => handleViewChange('auth')}
              className="block w-full text-left px-4 py-2 text-blue-600 dark:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              {t("Login")}
            </button>
          )}

          {/* 🌐 Language Toggle */}
          <div className="flex items-center justify-between px-4 py-2 border-t dark:border-gray-700">
  <span className="text-sm dark:text-white">{t("Language")}</span>
  <button
    onClick={toggleLanguage}
    className="text-lg hover:scale-105 transition-transform"
    title={i18n.language === 'fi' ? 'Switch to English' : 'Vaihda suomeksi'}
  >
    {i18n.language === 'fi' ? '🇬🇧' : '🇫🇮'}
  </button>
</div>


          {/* 🌙 Dark Mode Toggle */}
          <div className="flex items-center justify-between px-4 py-2">
            <span className="text-sm dark:text-white">{t("Dark Mode")}</span>
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
