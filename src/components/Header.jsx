import React from 'react';
import { supabase } from '../supabaseClient';


export default function Header({ user, setUser, activeView, setActiveView }) {
  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout failed:', error.message);
    } else {
      setUser(null);
      setActiveView('calculator'); // Reset to calculator view on logout
    }
  };

  return (
    <div className="flex justify-between items-center">
      <h1 className="text-2xl font-bold text-blue-800">Taikinalaskin</h1>
      <div className="flex items-center gap-3">
        {user && (
          <>
            <button
              onClick={() => setActiveView('calculator')}
              className={`px-3 py-1 rounded ${
                activeView === 'calculator' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Laskin
            </button>
            <button
              onClick={() => setActiveView('favorites')}
              className={`px-3 py-1 rounded ${
                activeView === 'favorites' ? 'bg-blue-600 text-white' : 'bg-gray-200 text-gray-700'
              }`}
            >
              Suosikit
            </button>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
            >
              Kirjaudu ulos
            </button>
          </>
        )}
      </div>
    </div>
  );
}
