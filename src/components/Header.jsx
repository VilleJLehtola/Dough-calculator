import { Link } from 'react-router-dom';

export default function Header({ user }) {
  // Try username first, fallback to email
  const displayName =
    user?.user_metadata?.username ||
    user?.username ||
    user?.email ||
    '';

  return (
    <header className="w-full flex items-center justify-between px-4 md:px-6 h-14 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Left: Logo */}
      <div className="flex items-center gap-3">
        <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white">
          Everything Dough
        </Link>
      </div>

      {/* Right: Username if logged in */}
      <div className="flex items-center gap-3">
        {user ? (
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
            {displayName}
          </span>
        ) : null}
      </div>
    </header>
  );
}
