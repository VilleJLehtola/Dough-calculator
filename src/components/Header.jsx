// src/components/Header.jsx
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function Header({ user, onLoginClick, toggleMobileMenu }) {
  return (
    <header className="w-full flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Left side: Hamburger + Logo */}
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button className="md:hidden" onClick={toggleMobileMenu}>
          <Menu className="w-6 h-6 text-gray-800 dark:text-gray-200" />
        </button>

        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white">
          Taikinalaskin
        </Link>
      </div>

      {/* Right side: Login (desktop only) or user email */}
      <div className="flex items-center gap-4">
        {user ? (
          <span className="text-sm text-gray-800 dark:text-gray-200">
            Tervetuloa, {user.email}
          </span>
        ) : (
          <Button onClick={onLoginClick} variant="outline" className="hidden md:block">
            Kirjaudu
          </Button>
        )}
      </div>
    </header>
  );
}
