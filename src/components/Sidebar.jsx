// src/components/Sidebar.jsx
import { Link, useLocation } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();
  const links = [
    { name: 'Etusivu', path: '/' },
    { name: 'Laskin', path: '/calculator' },
    { name: 'Suosikit', path: '/favorites' },
    { name: 'Admin', path: '/admin' },
  ];

  return (
    <div className="hidden md:flex flex-col w-64 bg-white dark:bg-gray-900 shadow-lg p-4">
      {links.map((link) => (
        <Link
          key={link.path}
          to={link.path}
          className={`p-2 rounded hover:bg-gray-100 dark:hover:bg-gray-800 ${
            location.pathname === link.path ? 'bg-gray-200 dark:bg-gray-700' : ''
          }`}
        >
          {link.name}
        </Link>
      ))}
    </div>
  );
}
