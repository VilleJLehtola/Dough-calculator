import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

export default function RequireAuth({ user, children }) {
  const location = useLocation();
  const { t } = useTranslation();

  if (user) return children;

  return (
    <div className="max-w-xl mx-auto mt-10 p-6 rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700">
      <h2 className="text-xl font-semibold mb-2">{t('Authentication required')}</h2>
      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
        {t('Please sign in to continue.')}
      </p>
      <Link
        to="/"
        state={{ from: location.pathname }}
        className="inline-block bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
      >
        {t('Go back home')}
      </Link>
    </div>
  );
}
