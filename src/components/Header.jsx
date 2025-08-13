import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function Header({ user }) {
  return (
    <header className="w-full flex items-center justify-between px-4 md:px-6 h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Left: Logo (no hamburger here anymore) */}
      <div className="flex items-center gap-3">
        <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white">
          {/* You can drop a logo image/text here */}
        </Link>
      </div>

      {/* Right: Auth buttons */}
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
