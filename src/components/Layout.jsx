import Header from '@/components/Header';
import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Sidebar from './components/Sidebar';

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
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-white to-[#f0f4ff] dark:from-gray-900 dark:to-gray-800 transition-colors duration-300">
      <Header user={user} onLogout={onLogout} toggleSidebar={toggleSidebar} />
      <div className="flex flex-1">
        {showSidebar && !isMobile && <Sidebar />}
        <main className="flex-1 p-6">{children}</main>
      </div>
    </div>
  );
}
