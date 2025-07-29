// src/components/Header.jsx
import React from 'react';

export default function Header({ user, activeView, setActiveView, logout }) {
  return (
    <div className="flex justify-between items-center mb-4">
      <div className="flex gap-2">
        <button
          onClick={() => setActiveView('calculator')}
          className={`px-3 py-1 rounded ${
            activeView === 'calculator' ? 'bg-blue-500 text-white' : 'bg-gray-100'
          }`}
        >
          Laskuri
        </button>

        {user && (
          <>
            <button
              onClick={() => setActiveView('favorites')}
              className={`px-3 py-1 rounded ${
                activeView === 'favorites' ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}
            >
              Suosikit
            </button>

            <button
              onClick={() => setActiveView('recipes')}
              className={`px-3 py-1 rounded ${
                activeView === 'recipes' ? 'bg-blue-500 text-white' : 'bg-gray-100'
              }`}
            >
              Reseptit
            </button>

            {user.email === 'ville.j.lehtola@gmail.com' && (
              <button
                onClick={() => setActiveView('admin')}
                className={`px-3 py-1 rounded ${
                  activeView === 'admin' ? 'bg-blue-500 text-white' : 'bg-gray-100'
                }`}
              >
                Admin
              </button>
            )}
          </>
        )}
      </div>

      <div>
        {user ? (
          <button
            onClick={logout}
            className="text-sm text-red-600 hover:underline"
          >
            Kirjaudu ulos
          </button>
        ) : (
          <button
            onClick={() => setActiveView('auth')}
            className="text-sm text-blue-600 hover:underline"
          >
            Kirjaudu sisään
          </button>
        )}
      </div>
    </div>
  );
}
