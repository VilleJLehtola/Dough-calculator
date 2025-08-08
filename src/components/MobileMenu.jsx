import React from 'react';
import { Link } from 'react-router-dom';
import { Sun, Moon, LogOut, LogIn } from 'lucide-react';
import DarkModeToggle from './DarkModeToggle';

export default function MobileMenu({ isOpen, setIsOpen, user, onLoginClick, onLogout }) {
  const isDark = document.documentElement.classList.contains('dark');

  return (
    <>
      {/* Hamburger button */}
      <button
        className="fixed top-4 left-4 z-50 p-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-md shadow-md md:hidden"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle menu"
      >
        ☰
      </button>

      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black bg-opacity-50 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed top-0 left-0 h-full w-64 z-50 bg-white dark:bg-slate-900 shadow-lg transform transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex flex-col p-6 space-y-4 text-gray-900 dark:text-gray-100">
          <Link to="/" onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/browse" onClick={() => setIsOpen(false)}>Browse</Link>
          <Link to="/calculator" onClick={() => setIsOpen(false)}>Calculator</Link>
          <Link to="/favorites" onClick={() => setIsOpen(false)}>Favorites</Link>
          <Link to="/profile" onClick={() => setIsOpen(false)}>Your profile</Link>

          {/* Toggle section */}
          <div className="flex items-center gap-3 pt-4 border-t border-gray-300 dark:border-slate-700 mt-4">
            {isDark ? (
              <Moon className="w-5 h-5 text-yellow-400" />
            ) : (
              <Sun className="w-5 h-5 text-blue-500" />
            )}
            <span className="text-sm">Dark mode</span>
            <DarkModeToggle />
          </div>

          {/* Auth buttons */}
          <div className="pt-6 border-t border-gray-300 dark:border-slate-700 mt-6">
            {user ? (
              <button
                onClick={() => {
                  onLogout();
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:underline"
              >
                <LogOut className="w-4 h-4" />
                Kirjaudu ulos
              </button>
            ) : (
              <button
                onClick={() => {
                  onLoginClick();
                  setIsOpen(false);
                }}
                className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 hover:underline"
              >
                <LogIn className="w-4 h-4" />
                Kirjaudu sisään
              </button>
            )}
          </div>
        </nav>
      </div>
    </>
  );
}
