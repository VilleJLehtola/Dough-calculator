// src/components/Header.jsx
import React, { useState } from 'react';
import { FiMenu, FiX } from 'react-icons/fi';

export default function Header({ user, activeView, setActiveView, logout }) {
  const [showMenu, setShowMenu] = useState(false);
  const isAdmin = user?.email === 'ville.j.lehtola@gmail.com';

  const handleViewChange = (view) => {
    setActiveView(view);
    setShowMenu(false);
  };

  return (
    <div className="relative">
      {/* Top row */}
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-semibold">Taikinalaskin</h1>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="text-2xl focus:outline-none"
          aria-label="Menu"
        >
          {showMenu ? <FiX /> : <FiMenu />}
        </button>
      </div>

      {/* Dropdown Menu */}
      {showMenu && (
        <div className="absolute right-0 mt-2 w-48 bg-white border rounded shadow z-50">
          <button
            onClick={() => handleViewChange('calculator')}
            className={`block w-full text-left px-4 py-2 rounded ${
              activeView === 'calculator' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
            }`}
          >
            Laskuri
          </button>

          {user && (
            <>
              <button
                onClick={() => handleViewChange('favorites')}
                className={`block w-full text-left px-4 py-2 rounded ${
                  activeView === 'favorites' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                }`}
              >
                Suosikit
              </button>

              <button
                onClick={() => handleViewChange('recipes')}
                className={`block w-full text-left px-4 py-2 rounded ${
                  activeView === 'recipes' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                }`}
              >
                Reseptit
              </button>

              {isAdmin && (
                <button
                  onClick={() => handleViewChange('admin')}
                  className={`block w-full text-left px-4 py-2 rounded ${
                    activeView === 'admin' ? 'bg-blue-500 text-white' : 'hover:bg-gray-100'
                  }`}
                >
                  Admin
                </button>
              )}

              <button
                onClick={logout}
                className="block w-full text-left px-4 py-2 text-red-600 hover:bg-gray-100"
              >
                Kirjaudu ulos
              </button>
            </>
          )}

          {!user && (
            <button
              onClick={() => handleViewChange('auth')}
              className="block w-full text-left px-4 py-2 text-blue-600 hover:bg-gray-100"
            >
              Kirjaudu sisään
            </button>
          )}
        </div>
      )}
    </div>
  );
}
