import { useTranslation } from 'react-i18next';
import { isAdminUser } from '../../utils/auth';
import RequireAuth from './RequireAuth';

export default function RequireAdmin({ user, children }) {
  const { t } = useTranslation();

  return (
    <RequireAuth user={user}>
      {isAdminUser(user) ? (
        children
      ) : (
        <div className="max-w-xl mx-auto mt-10 p-6 rounded-xl border bg-white dark:bg-gray-800 dark:border-gray-700">
          <h2 className="text-xl font-semibold mb-2">{t('Admin only')}</h2>
          <p className="text-sm text-gray-600 dark:text-gray-300">
            {t('You do not have permission to view this page.')}
          </p>
        </div>
      )}
    </RequireAuth>
  );
}
