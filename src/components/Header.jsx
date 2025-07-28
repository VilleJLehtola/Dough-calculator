import React, { useState } from 'react';
import { supabase } from '../supabaseClient';


export default function Header({ user, activeView, setActiveView, logout }) {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-blue-800">Taikinalaskin</h1>

      {user && (
        <div className="relative">
          <button
            className="text-blue-800 px-3 py-2 rounded hover:bg-blue-100 transition"
            onClick={() => setMenuOpen((prev) => !prev)}
          >
            ☰
          </button>

          {menuOpen && (
            <div className="absolute right-0 mt-2 bg-white shadow-lg rounded border border-blue-200 w-40 z-10">
              <button
                onClick={() => {
                  setActiveView('calculator');
                  setMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2 hover:bg-blue-100 ${
                  activeView === 'calculator' ? 'font-semibold text-blue-700' : ''
                }`}
              >
                Laskin
              </button>
              <button
                onClick={() => {
                  setActiveView('favorites');
                  setMenuOpen(false);
                }}
                className={`w-full text-left px-4 py-2 hover:bg-blue-100 ${
                  activeView === 'favorites' ? 'font-semibold text-blue-700' : ''
                }`}
              >
                Suosikit
              </button>
              <button
                onClick={() => {
                  logout();
                  setMenuOpen(false);
                }}
                className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-100"
              >
                Kirjaudu ulos
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
