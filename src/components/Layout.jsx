import { useState } from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function Layout({ children }) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      {/* Sidebar (toggle for mobile) */}
      <Sidebar isOpen={isSidebarOpen} setIsOpen={setIsSidebarOpen} />

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        <Header toggleSidebar={() => setIsSidebarOpen((prev) => !prev)} />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
