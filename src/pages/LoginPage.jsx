// src/pages/LoginPage.jsx
import React, { useState, useEffect } from 'react';
import AuthForm from '@/components/AuthForm';
import supabase from '@/supabaseClient';

export default function LoginPage() {
  const [user, setUser] = useState(null);
  const [activeView, setActiveView] = useState('auth');

  useEffect(() => {
    const getSession = async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data.session?.user || null);
    };
    getSession();
  }, []);

  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center text-center text-xl text-green-600">
        Olet jo kirjautunut sisään.
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-200 dark:from-slate-900 dark:to-slate-800 text-gray-900 dark:text-gray-100 p-4">
      <div className="max-w-md w-full">
        {activeView === 'auth' && (
          <AuthForm setUser={setUser} setActiveView={setActiveView} />
        )}
        {activeView === 'forgot-password' && (
          <div className="bg-white p-4 rounded-lg shadow border border-blue-200 space-y-4">
            <h2 className="text-xl font-semibold text-blue-800 text-center">Palauta salasana</h2>
            <p className="text-sm text-gray-600 text-center">
              Toiminto ei ole vielä käytössä.
            </p>
            <button
              onClick={() => setActiveView('auth')}
              className="w-full text-sm text-gray-500 mt-2 hover:underline"
            >
              ← Palaa takaisin
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
