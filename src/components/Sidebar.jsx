import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Search,
  Calculator,
  List,
  Heart,
  User,
  Moon,
  Sun,
} from 'lucide-react';
import { useEffect, useState } from 'react';

const Sidebar = () => {
  const location = useLocation();
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  const navItems = [
    {
      label: 'Discover',
      items: [
        { name: 'Home', to: '/', icon: <Home size={18} /> },
        { name: 'Browse', to: '/browse', icon: <Search size={18} /> },
        { name: 'Calculator', to: '/calculator', icon: <Calculator size={18} /> },
      ],
    },
    {
      label: 'Library',
      items: [
        { name: 'Your recipes', to: '/your-recipes', icon: <List size={18} /> },
        { name: 'Favorites', to: '/favorites', icon: <Heart size={18} /> },
        { name: 'Your profile', to: '/profile', icon: <User size={18} /> },
      ],
    },
  ];

  const isActive = (to) => location.pathname === to;

  return (
    <div className="w-60 h-screen border-r border-gray-200 dark:border-gray-800 px-4 py-6 flex flex-col justify-between bg-white dark:bg-gray-900 text-gray-800 dark:text-white">
      <div>
        <h1 className="text-xl font-bold mb-6">Everything dough</h1>
        {navItems.map((section) => (
          <div key={section.label} className="mb-6">
            <p className="text-xs uppercase text-gray-400 dark:text-gray-500 mb-2 tracking-wide">
              {section.label}
            </p>
            <ul className="space-y-2">
              {section.items.map(({ name, to, icon }) => (
                <li key={name}>
                  <Link
                    to={to}
                    className={`flex items-center space-x-2 px-2 py-2 rounded-md text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition ${
                      isActive(to) ? 'bg-gray-200 dark:bg-gray-800 font-semibold' : ''
                    }`}
                  >
                    {icon}
                    <span>{name}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Dark Mode Toggle */}
      <div className="flex items-center justify-between px-2">
        <span className="text-sm">Dark Mode</span>
        <button
          onClick={() => setDarkMode(!darkMode)}
          className="w-10 h-6 flex items-center rounded-full bg-gray-300 dark:bg-gray-700 p-1 transition"
        >
          <div
            className={`w-4 h-4 bg-white dark:bg-black rounded-full shadow-md transform transition ${
              darkMode ? 'translate-x-4' : ''
            }`}
          ></div>
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
