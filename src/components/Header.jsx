// src/components/Header.jsx
import React, { useState } from 'react';
import { GiHamburgerMenu } from 'react-icons/gi';
import { supabase } from '../supabaseClient';

export default function Header({ user, setUser, activeView, setActiveView }) {
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setActiveView('calculator');
  };

  return (
    <header className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-bold text-blue-800">Taikinalaskin</h1>

      <div className="relative">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="text-blue-800 text-2xl"
        >
          <GiHamburgerMenu />
        </button>

        {menuOpen && (
          <div className="absolute right-0 mt-2 w-40 bg-white border rounded shadow z-10">
            <button
              onClick={() => {
                setActiveView('calculator');
                setMenuOpen(false);
              }}
              className="block w-full text-left px-4 py-2 hover:bg-blue-100 text-sm"
            >
              Laskin
            </button>
            {user && (
              <button
                onClick={() => {
                  setActiveView('favorites');
                  setMenuOpen(false);
                }}
                className="block w-full text-left px-4 py-2 hover:bg-blue-100 text-sm"
              >
                Suosikit
              </button>
            )}
            {user ? (
              <button
                onClick={handleLogout}
                className="block w-full text-left px-4 py-2 hover:bg-blue-100 text-sm"
              >
                Kirjaudu ulos
              </button>
            ) : null}
          </div>
        )}
      </div>
    </header>
  );
}
