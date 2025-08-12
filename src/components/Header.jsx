import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function Header({ user, toggleMobileMenu }) {
  const { t } = useTranslation();
  return (
    <header className="w-full flex items-center justify-between ...border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
      {/* Left side: Hamburger + Logo */}
      <div className="flex items-center gap-4">
        {/* Mobile menu toggle */}
        <button className="md:hidden" onClick={toggleMobileMenu}>
          <Menu className="w-6 h-6 text-gray-800 dark:text-gray-200" />
        </button>

        {/* Logo */}
        <Link to="/" className="text-xl font-bold text-gray-900 dark:text-white">
          {t('brand')}
        </Link>
      </div>

      {/* Right side: Auth */}
      <div className="flex items-center gap-3">
        {user ? (
          <span className="text-sm text-gray-800 dark:text-gray-200">
            {t('welcome_user', { email: user.email })}
          </span>
        ) : (
          <Link to="/login">
            <Button variant="outline" className="hidden md:block">
              {t('login')}
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
}
