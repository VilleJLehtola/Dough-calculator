import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';

export default function Header({ user, toggleMobileMenu }) {
  return (
    <header className="w-full flex items-center justify-be...border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
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

      {/* Right side: Auth buttons */}
      <div className="flex items-center gap-3">
        {!user ? (
          <>
            <Link to="/login">
              <Button variant="outline" className="text-gray-800 dark:text-gray-200">
                Login
              </Button>
            </Link>
            <Link to="/register">
              <Button className="bg-gray-900 text-white dark:bg-white dark:text-gray-900">
                Register
              </Button>
            </Link>
          </>
        ) : (
          <Link to="/favorites">
            <Button variant="outline" className="text-gray-800 dark:text-gray-200">
              Favorites
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
