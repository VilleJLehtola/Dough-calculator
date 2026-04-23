import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { isAdminUser } from '../utils/auth';

const linkClass = ({ isActive }) =>
  `block rounded px-2 py-1 ${
    isActive
      ? 'bg-blue-600 text-white'
      : 'text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800'
  }`;

export default function Sidebar({ user }) {
  const { t } = useTranslation();

  return (
    <aside className="hidden md:flex flex-col w-60 p-4 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <h1 className="text-xl font-semibold mb-6">Everything Dough</h1>

      <nav className="space-y-4 text-sm">
        <div className="text-gray-500 uppercase">{t('Discover')}</div>
        <ul className="space-y-2">
          <li>
            <NavLink to="/" className={linkClass}>
              🏠 {t('Home')}
            </NavLink>
          </li>
          <li>
            <NavLink to="/calculator" className={linkClass}>
              📟 {t('Calculator')}
            </NavLink>
          </li>
          <li>
            <NavLink to="/favorites" className={linkClass}>
              🎵 {t('Favorites')}
            </NavLink>
          </li>
          {isAdminUser(user) && (
            <li>
              <NavLink to="/admin" className={linkClass}>
                🛠️ {t('Admin')}
              </NavLink>
            </li>
          )}
        </ul>
      </nav>
    </aside>
  );
}
