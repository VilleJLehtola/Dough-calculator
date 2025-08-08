// src/components/MobileMenu.jsx
import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X } from 'lucide-react';

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const location = useLocation();

  const links = [
    { name: 'Etusivu', path: '/' },
    { name: 'Laskin', path: '/calculator' },
    { name: 'Suosikit', path: '/favorites' },
    { name: 'Admin', path: '/admin' },
  ];

  return (
    <div className="md:hidden relative z-50">
      <button onClick={() => setOpen(!open)} className="p-2">
        {open ? <X size={24} /> : <Menu size={24} />}
      </button>
      {open && (
        <div className="absolute top-10 left-0 bg-white dark:bg-gray-900 border rounded shadow w-48">
          {links.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              onClick={() => setOpen(false)}
              className={`block px-4 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 ${
                location.pathname === link.path ? 'bg-gray-200 dark:bg-gray-800' : ''
              }`}
            >
              {link.name}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
