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
      setError(`\${t('email')} ja salasana vaaditaan.');
      return;
    }

    if (isRegistering) {
      const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

      if (signUpError) {
        setError(signUpError.message);
        return;
      }

      const user = data.user;
      if (user) {
        const { error: insertError } = await supabase.from('users').insert({
          id: user.id,
          email: user.email,
          created_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error('Failed to insert user:', insertError.message);
          setError('Rekisteröinti onnistui, mutta käyttäjää ei voitu tallentaa.');
        } else {
          setUser(user);
          setActiveView('calculator');
        }
      } else {
        setError('Rekisteröinti epäonnistui.');
      }
    } else {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

      if (signInError) {
        setError(signInError.message);
      } else {
        setUser(data.user);
        setActiveView('calculator');
      }
    }
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-blue-200 space-y-4">
      <h2 className="text-xl font-semibold text-blue-800 text-center">
        {isRegistering ? `\${t('register')}` : `\${t('login')} sisään'}
      </h2>

      {error && <p className="text-red-500 text-sm">{error}</p>}

      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder={t("email")}
        className="w-full p-2 border border-gray-300 rounded"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder={t("password")}
        className="w-full p-2 border border-gray-300 rounded"
      />

      <p
        className="text-sm text-blue-600 hover:underline cursor-pointer text-center"
        onClick={() => setActiveView('forgot-password')}
      >
        Unohtuiko salasana?
      </p>

      <button
        onClick={handleAuth}
        className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition"
      >
        {isRegistering ? `\${t('register')}` : `\${t('login')}`}
      </button>

      <p
        className="text-sm text-center text-blue-600 cursor-pointer hover:underline"
        onClick={() => setIsRegistering(prev => !prev)}
      >
        {isRegistering ? `\${t('have_account_login')}` : `\${t('no_account_register')}`}
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
