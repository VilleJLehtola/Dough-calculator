import React, { useEffect, useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';
import MobileMenu from './MobileMenu';
import DarkModeToggle from './DarkModeToggle';
import Footer from '@/components/Footer';

const Layout = ({ children, user, onLoginClick, onLogout }) => {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setSidebarOpen(!mobile);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSidebar = () => setSidebarOpen((prev) => !prev);

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-gray-950">
      {/* Sidebar (desktop) */}
      {!isMobile && (
        <aside
          className={`transition-all duration-300 ${
            sidebarOpen ? 'w-64' : 'w-20'
          } bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800`}
        >
          <Sidebar
            user={user}
            onLogout={onLogout}          // pass logout
            onLoginClick={onLoginClick}  // pass login/register trigger
            collapsed={!sidebarOpen}
            toggleSidebar={toggleSidebar}
          />
        </aside>
      )}

      {/* Mobile menu (overlay) */}
      {isMobile && (
        <MobileMenu
          isOpen={mobileMenuOpen}
          setIsOpen={setMobileMenuOpen}
          user={user}
          onLoginClick={onLoginClick}
          onLogout={onLogout}
        />
      )}

      {/* Main content column */}
      <div className="flex-1 flex flex-col">
        <Header user={user} />
        <main className="flex-1 p-4" role="main">
          {children}
        </main>
        {/* New global footer */}
        <Footer />
      </div>

      {!isMobile && (
        <div className="fixed bottom-4 left-4 z-50">
          <DarkModeToggle />
        </div>
      )}
    </div>
  );
};

export default Layout;
