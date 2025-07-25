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
    <div className="flex items-center justify-between mb-4">
      <h1 className="text-2xl font-bold text-blue-800">🥖 Taikinalaskin</h1>
      <div className="relative">
        <button onClick={() => setMenuOpen(!menuOpen)}>
          <GiHamburgerMenu className="text-2xl text-blue-800" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 mt-2 bg-white border border-blue-200 rounded-lg shadow-md w-40 z-10">
            <button
              onClick={() => setActiveView('calculator')}
              className="block w-full px-4 py-2 text-left hover:bg-blue-100"
            >
              Laskin
            </button>
            {user && (
              <>
                <button
                  onClick={() => setActiveView('favorites')}
                  className="block w-full px-4 py-2 text-left hover:bg-blue-100"
                >
                  Suosikit
                </button>
                <button
                  onClick={handleLogout}
                  className="block w-full px-4 py-2 text-left text-red-600 hover:bg-red-100"
                >
                  Kirjaudu ulos
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
