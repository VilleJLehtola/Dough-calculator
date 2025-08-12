import React, { useState } from 'react';
import supabase from '@/supabaseClient';
import { useTranslation } from 'react-i18next';

export default function AuthForm({ setUser, setActiveView }) {
  const { t } = useTranslation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');

  const handleAuth = async () => {
    setError('');
    if (!email || !password) {
      setError('Missing email or password.');
      return;
    }
    try {
      if (isRegistering) {
        const { data, error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        if (data?.user) setUser(data.user);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        if (data?.user) setUser(data.user);
      }
    } catch (e) {
      setError(e.message || 'Auth error');
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-900 p-6 rounded-xl shadow space-y-3">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
        {isRegistering ? t('register') : t('login')}
      </h2>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder={t('email')}
        className="w-full p-2 border border-gray-300 rounded"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder={t('password')}
        className="w-full p-2 border border-gray-300 rounded"
      />

      <button
        onClick={handleAuth}
        className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded mt-2"
      >
        {isRegistering ? t('register') : t('login')}
      </button>

      <p
        className="text-sm text-gray-500 mt-2 cursor-pointer hover:underline"
        onClick={() => setIsRegistering(v => !v)}
      >
        {isRegistering ? t('have_account_login') : t('no_account_register')}
      </p>

      <button
        onClick={() => setActiveView('calculator')}
        className="w-full text-sm text-gray-500 mt-2 hover:underline"
      >
        {t('back_to_calculator')}
      </button>
    </div>
  );
}
