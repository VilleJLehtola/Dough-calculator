import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children, user, onLogout }) {
  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <Sidebar user={user} />
      <div className="flex-1 flex flex-col">
        <Header user={user} onLogout={onLogout} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
