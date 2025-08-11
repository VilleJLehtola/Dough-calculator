import {
  Home,
  Search,
  Radio,
  List,
  Heart,
  User,
  LogOut,
  Plus,
} from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import clsx from 'clsx';
import LanguageSwitcher from '@/components/LanguageSwitcher';

export default function Sidebar({ user, onLogout }) {
  const { pathname } = useLocation();
  const isActive = (path) => pathname === path || pathname.startsWith(path + '/');

  const linkClass = (path) =>
    clsx(
      'flex items-center gap-2 px-4 py-2 rounded-lg hover:bg-blue-100 dark:hover:bg-gray-700 transition-all',
      isActive(path)
        ? 'bg-blue-100 text-blue-600 dark:bg-gray-700 dark:text-blue-400'
        : 'text-gray-700 dark:text-gray-300'
    );

  return (
    <aside className="w-64 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 p-4 space-y-6 flex flex-col">
      {/* Brand */}
      <div className="px-2">
        <Link to="/" className="text-xl font-bold tracking-tight text-gray-900 dark:text-white">
          Everything Dough
        </Link>
      </div>

      {/* Language flags on their own row */}
      <div className="px-2">
        <LanguageSwitcher />
      </div>

      {/* Discover */}
      <div>
        <h3 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 px-2 mb-2">
          Discover
        </h3>
        <nav className="space-y-1">
          <Link to="/" className={linkClass('/')}>
            <Home size={18} />
            Home
          </Link>
          <Link to="/browse" className={linkClass('/browse')}>
            <Search size={18} />
            Browse
          </Link>
          <Link to="/calculator" className={linkClass('/calculator')}>
            <Radio size={18} />
            Calculator
          </Link>
        </nav>
      </div>

      {/* Create */}
      <div>
        <h3 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 px-2 mb-2">
          Create
        </h3>
        <nav className="space-y-1">
          <Link to="/create" className={linkClass('/create')}>
            <Plus size={18} />
            Create a recipe
          </Link>
        </nav>
      </div>

      {/* Library */}
      <div className="flex-1">
        <h3 className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 px-2 mb-2">
          Library
        </h3>
        <nav className="space-y-1">
          <Link to="/your-recipes" className={linkClass('/your-recipes')}>
            <List size={18} />
            Your recipes
          </Link>
          <Link to="/suosikit" className={linkClass('/suosikit')}>
            <Heart size={18} />
            Favorites
          </Link>
          <Link to="/profile" className={linkClass('/profile')}>
            <User size={18} />
            Your profile
          </Link>
        </nav>
      </div>

      {/* Footer: put dark-mode toggle (if you have one) above logout; spaced vertically */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-2">
        {/* <ThemeToggle />  // if you have a theme toggle component, place it here */}
        {user && (
          <button
            onClick={onLogout}
            className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400 hover:underline px-2"
          >
            <LogOut size={16} />
            Kirjaudu ulos
          </button>
        )}
      </div>
    </aside>
  );
}
