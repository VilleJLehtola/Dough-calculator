import React, { useState, useEffect } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';

export default function Header({ user, activeView, setActiveView, logout }) {
  const [showMenu, setShowMenu] = useState(false);
  const [theme, setTheme] = useState('light'); // 🌙 track theme
  const isAdmin = user?.email === 'ville.j.lehtola@gmail.com';

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'light';
    setTheme(saved);
  }, []);

  const handleViewChange = (view) => {
    setActiveView(view);
    setShowMenu(false);
  };

  const toggleDarkMode = () => {
    const root = document.documentElement;
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);

    root.classList.toggle('dark', newTheme === 'dark');
    setShowMenu(false);
  };

  return (
    <div className="relative">
      {/* top row */}
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

      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded shadow z-50">
          <button onClick={() => handleViewChange('calculator')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white">
            Laskuri
          </button>
          {user && (
            <>
              <button onClick={() => handleViewChange('favorites')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white">
                Suosikit
              </button>
              <button onClick={() => handleViewChange('recipes')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white">
                Reseptit
              </button>
              {isAdmin && (
                <button onClick={() => handleViewChange('admin')} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white">
                  Admin
                </button>
              )}
              <button onClick={toggleDarkMode} className="block w-full text-left px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white">
                {theme === 'dark' ? 'Vaalea tila' : 'Tumma tila'}
              </button>
              <button onClick={logout} className="block w-full text-left px-4 py-2 text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700">
                Kirjaudu ulos
              </button>
            </>
          )}
          {!user && (
            <button onClick={() => handleViewChange('auth')} className="block w-full text-left px-4 py-2 text-blue-600 dark:text-blue-300 hover:bg-gray-100 dark:hover:bg-gray-700">
              Kirjaudu sisään
            </button>
          )}
        </div>
      )}
    </div>
  );
}
