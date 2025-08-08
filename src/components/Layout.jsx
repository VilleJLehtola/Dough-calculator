import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

export default function Layout({ user, onLogout, children }) {
  const [showSidebar, setShowSidebar] = useState(true);
  const [isMobile, setIsMobile] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setShowSidebar(!isMobile);
  }, [isMobile]);

  const toggleSidebar = (force) => {
    if (typeof force === 'boolean') {
      setShowSidebar(force);
    } else {
      setShowSidebar((prev) => !prev);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50 dark:bg-gray-900">
      <Header user={user} onLogout={onLogout} toggleSidebar={toggleSidebar} />
      <div className="flex flex-1">
        {showSidebar && !isMobile && (
          <aside className="w-64 p-4 border-r border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <nav className="flex flex-col gap-4">
              <a href="/" className="text-gray-700 dark:text-gray-300 hover:underline">Etusivu</a>
              <a href="/suosikit" className="text-gray-700 dark:text-gray-300 hover:underline">Suosikit</a>
              <a href="/admin" className="text-gray-700 dark:text-gray-300 hover:underline">Admin</a>
            </nav>
          </aside>
        )}

        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
