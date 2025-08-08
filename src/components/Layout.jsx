import Header from '@/components/Header';
import Sidebar from '@/components/Sidebar'; // ✅ make sure this is the updated Sidebar.jsx
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
        {showSidebar && !isMobile && <Sidebar />} {/* ✅ replaces the old hardcoded sidebar */}

        <main className="flex-1 p-4">{children}</main>
      </div>
    </div>
  );
}
