// src/components/Header.jsx
import React, { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';

export default function Header({ user, activeView, setActiveView, logout }) {
  const [showMenu, setShowMenu] = useState(false);
  const isAdmin = user?.email === 'ville.j.lehtola@gmail.com';

  const handleViewChange = (view) => {
    setActiveView(view);
    setShowMenu(false);
  };

  const toggleDarkMode = () => {
    const root = document.documentElement;
    if (root.classList.contains('dark')) {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    } else {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    }
    setShowMenu(false);
  };

  return (
    <div className="relative">
      {/* Top row with title + menu icon */}
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

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded shadow z-50">
          <button
            onClick={() => handleViewChange('calculator')}
            className={`block w-full text-left px-4 py-2 rounded ${
              activeView === 'calculator' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white'
            }`}
          >
            Laskuri
          </button>

          {user && (
            <>
              <button
                onClick={() => handleViewChange('favorites')}
                className={`block w-full text-left px-4 py-2 rounded ${
                  activeView === 'favorites' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white'
                }`}
              >
                Suosikit
              </button>

              <button
                onClick={() => handleViewChange('recipes')}
                className={`block w-full text-left px-4 py-2 rounded ${
                  activeView === 'recipes' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white'
                }`}
              >
                Reseptit
              </button>

              {isAdmin && (
                <button
                  onClick={() => handleViewChange('admin')}
                  className={`block w-full text-left px-4 py-2 rounded ${
                    activeView === 'admin' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white'
                  }`}
                >
                  Admin
                </button>
              )}

              <button
                onClick={toggleDarkMode}
                className="block w-full text-left px-4 py-2 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Tumma / vaalea tila
              </button>

              <button
                onClick={logout}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-red-400"
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
