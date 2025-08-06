import React from 'react';
import Header from './Header';

export default function Layout({
  children,
  user,
  logout,
  activeView,
  setActiveView,
  maxWidth = 'max-w-6xl',
  className = ''
}) {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-100 via-white to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 text-gray-900 dark:text-gray-100 py-10 px-4">
      <div className={`bg-white dark:bg-gray-800 shadow-xl rounded-xl w-full ${maxWidth} mx-auto p-6 space-y-6 border border-blue-200 dark:border-gray-700 ${className}`}>
        <Header user={user} activeView={activeView} setActiveView={setActiveView} logout={logout} />
        {children}
      </div>
    </div>
  );
}
