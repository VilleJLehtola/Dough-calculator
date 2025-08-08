import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Header({ user, onLogout, toggleSidebar }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleToggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
    toggleSidebar?.();
  };

  useEffect(() => {
    if (!isMobileMenuOpen) toggleSidebar?.(false);
  }, [isMobileMenuOpen]);

  return (
    <header className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      <Link to="/" className="text-2xl font-bold text-gray-800 dark:text-white">
        Taikinalaskin
      </Link>

      <div className="md:hidden">
        <button onClick={handleToggleMobileMenu} className="text-gray-800 dark:text-white">
          {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      <nav className="hidden md:flex items-center gap-4">
        <Link to="/" className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">
          Etusivu
        </Link>
        <Link to="/suosikit" className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">
          Suosikit
        </Link>
        <Link to="/admin" className="text-gray-700 dark:text-gray-300 hover:text-black dark:hover:text-white">
          Admin
        </Link>
        {user ? (
          <Button onClick={onLogout}>Kirjaudu ulos</Button>
        ) : (
          <Link to="/login" className="text-sm text-blue-500 hover:underline">
            Kirjaudu
          </Link>
        )}
      </nav>
    </header>
  );
}
