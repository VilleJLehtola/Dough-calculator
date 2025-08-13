import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Header({ user }) {
  return (
    <header className="w-full flex items-center justify-between px-4 md:px-6 h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white">
          {/* Logo text or image */}
        </Link>
      </div>

      {/* Right: Auth buttons (Favorites removed) */}
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
        ) : null}
      </div>
    </header>
  );
}
