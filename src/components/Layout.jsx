// src/components/Layout.jsx
import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import Header from './Header';
import Sidebar from './Sidebar';
import MobileMenu from './MobileMenu';
import DarkModeToggle from './DarkModeToggle';

const Layout = ({ children, user }) => {
  const location = useLocation();
  const [isMobile, setIsMobile] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(prev => !prev);
  };

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-gray-50 to-gray-200 dark:from-slate-900 dark:to-slate-800 text-gray-900 dark:text-gray-100 transition-colors duration-500">
      {isMobile ? (
        <MobileMenu isOpen={isMobileMenuOpen} setIsOpen={setIsMobileMenuOpen} user={user} />
      ) : (
        <Sidebar user={user} />
      )}

      <div className="flex-1 flex flex-col">
        <Header user={user} toggleMobileMenu={toggleMobileMenu} />
        <main className="flex-1 p-4">{children}</main>
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
