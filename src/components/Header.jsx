import React from 'react';
import { GiHamburgerMenu } from 'react-icons/gi';

export default function Header({ user, setUser, activeView, setActiveView }) {
  return (
    <div className="flex justify-between items-center mb-4">
      <h1 className="text-2xl font-bold text-blue-800">🥖 Taikinalaskin</h1>
      <div className="flex items-center space-x-4">
        <button
          onClick={() => setActiveView('calculator')}
          className={`px-3 py-1 rounded ${activeView === 'calculator' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}
        >
          Näytä laskin
        </button>
        <button
          onClick={() => setActiveView('favorites')}
          className={`px-3 py-1 rounded ${activeView === 'favorites' ? 'bg-blue-600 text-white' : 'bg-blue-100 text-blue-700'}`}
        >
          Suosikit
        </button>
        {!user && (
          <button
            onClick={() => setActiveView('auth')}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            Kirjaudu
          </button>
        )}
        {user && (
          <button
            onClick={async () => {
              await supabase.auth.signOut();
              setUser(null);
              setActiveView('calculator'); // fallback view
            }}
            className="px-3 py-1 bg-gray-200 text-gray-700 rounded"
          >
            Kirjaudu ulos
          </button>
        )}
        <GiHamburgerMenu
          className="text-2xl text-blue-700 cursor-pointer"
          onClick={() =>
            setActiveView(
              activeView === 'calculator' ? 'favorites' : 'calculator'
            )
          }
        />
      </div>
    </div>
  );
}
