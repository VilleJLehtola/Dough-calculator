import React, { useState, useEffect } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';

export default function Header({ user, activeView, setActiveView, logout }) {
  const [showMenu, setShowMenu] = useState(false);
  const [theme, setTheme] = useState('light');
  const isAdmin = user?.email === 'ville.j.lehtola@gmail.com';

  // Load theme from localStorage
  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light';
    setTheme(saved);
    const root = document.documentElement;
    if (saved === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, []);

  const handleViewChange = (view) => {
    setActiveView(view);
    setShowMenu(false);
  };

  const toggleDarkMode = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    setShowMenu(false);
  };

  return (
    <div className="relative">
      {/* Top bar */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold dark:text-white">Taikinalaskin</h1>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-2xl focus:outline-none text-gray-700 dark:text-gray-100"
          aria-label="Menu"
        >
          {showMenu ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Menu dropdown */}
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
            Laskuri
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
                Suosikit
              </button>

              <button
                onClick={() => handleViewChange('recipes')}
                className={`block w-full text-left px-4 py-2 rounded ${
                  activeView === 'recipes'
                    ? 'bg-blue-500 text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white'
                }`}
              >
                Reseptit
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
                  Admin
                </button>
              )}

              {/* 🌗 Dark Mode Switch */}
              <div className="flex items-center justify-between px-4 py-2">
                <span className="text-sm dark:text-white">Tummat värit</span>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={theme === 'dark'}
                    onChange={toggleDarkMode}
                  />
                  <div className="w-11 h-6 bg-gray-300 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 dark:peer-focus:ring-blue-300 rounded-full peer dark:bg-gray-600 peer-checked:bg-blue-600 transition-all duration-300"></div>
                  <div className="absolute left-0.5 top-0.5 w-5 h-5 bg-white rounded-full shadow transform transition-all duration-300 peer-checked:translate-x-full" />
                </label>
              </div>

              <button
                onClick={logout}
                className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Kirjaudu ulos
              </button>
            </>
          )}

          {!user && (
            <button
              onClick={() => handleViewChange('auth')}
              className="block w-full text-left px-4 py-2 text-blue-600 dark:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Kirjaudu sisään
            </button>
          )}
        </div>
      )}
    </div>
  );
}
