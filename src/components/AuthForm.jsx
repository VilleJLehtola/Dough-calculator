import React, { useState, useEffect } from 'react';
import supabase from '@/supabaseClient';

export default function AuthForm({ setUser, setActiveView }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Username validation state
  const [unameValid, setUnameValid] = useState(null);      // true | false | null
  const [unameAvailable, setUnameAvailable] = useState(null); // true | false | null
  const [checkingUname, setCheckingUname] = useState(false);

  const validateUsername = (val) => {
    // 3–24 chars, letters/numbers/._-
    const ok = /^[a-zA-Z0-9._-]{3,24}$/.test(val);
    setUnameValid(ok);
    return ok;
  };

  // Check availability when username changes (debounced)
  useEffect(() => {
    const val = username.trim();
    setUnameAvailable(null);
    setInfo('');
    if (!isRegistering) return;
    if (!val) return;
    const ok = validateUsername(val);
    if (!ok) return;

    const handle = setTimeout(async () => {
      try {
        setCheckingUname(true);
        const { count, error: qErr } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .ilike('username', val); // case-insensitive

        if (qErr) throw qErr;
        setUnameAvailable((count || 0) === 0);
      } catch (e) {
        setError('Käyttäjänimen tarkistus epäonnistui. Yritä uudelleen.');
        setUnameAvailable(null);
      } finally {
        setCheckingUname(false);
      }
    }, 350);

    return () => clearTimeout(handle);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [username, isRegistering]);

  const handleAuth = async () => {
    setError('');
    setInfo('');
    setIsLoading(true);

    try {
      if (!email || !password) {
        setError('Sähköposti ja salasana vaaditaan.');
        return;
      }

      if (isRegistering) {
        const uname = username.trim();

        if (!uname) {
          setError('Käyttäjänimi vaaditaan.');
          return;
        }
        if (!validateUsername(uname)) {
          setError('Käyttäjänimen tulee olla 3–24 merkkiä (kirjaimet, numerot, . _ -).');
          return;
        }
        // Final availability check before submitting
        {
          const { count, error: qErr } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .ilike('username', uname);
          if (qErr) {
            setError('Käyttäjänimen tarkistus epäonnistui. Yritä uudelleen.');
            return;
          }
          if ((count || 0) > 0) {
            setError('Käyttäjänimi on jo varattu.');
            return;
          }
        }

        const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

        if (signUpError) {
          setError(signUpError.message);
          return;
        }

        const user = data?.user;

        // If email confirmation is ON, user may be null here
        if (!user) {
          setInfo('Rekisteröinti onnistui! Vahvista sähköpostiosoitteesi jatkaaksesi.');
          return;
        }

        // Insert into your public.users (role defaults to 'user', we also set it explicitly)
        const { error: insertError } = await supabase.from('users').insert({
          id: user.id,
          email: user.email,
          username: uname,
          role: 'user',
          created_at: new Date().toISOString(),
        });

        if (insertError) {
          console.error('Failed to insert user:', insertError.message);
          setError('Rekisteröinti onnistui, mutta käyttäjää ei voitu tallentaa.');
          // Still log the user in if session exists
          setUser(user);
          setActiveView('calculator');
          return;
        }

        setUser(user);
        setActiveView('calculator');
      } else {
        const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });

        if (signInError) {
          setError(signInError.message);
          return;
        }
        setUser(data.user);
        setActiveView('calculator');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded-lg shadow border border-blue-200 dark:border-gray-700 space-y-4 max-w-md mx-auto">
      <h2 className="text-xl font-semibold text-blue-800 dark:text-blue-200 text-center">
        {isRegistering ? 'Rekisteröidy' : 'Kirjaudu sisään'}
      </h2>

      {/* Value props (optional, short & encouraging) */}
      {isRegistering && (
        <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1">
          <li>✅ Tallenna suosikkiasetukset ja reseptit</li>
          <li>📱 Käytä laitetta vaihtamalla – asetukset pysyvät</li>
        </ul>
      )}

      {error && <p className="text-red-500 text-sm">{error}</p>}
      {info && <p className="text-green-600 text-sm">{info}</p>}

      {/* Username (register only) */}
      {isRegistering && (
        <div className="space-y-1">
          <input
            type="text"
            value={username}
            onChange={e => setUsername(e.target.value)}
            placeholder="Käyttäjänimi"
            className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
          />
          <div className="text-xs">
            {checkingUname && <span className="text-gray-500">Tarkistetaan saatavuutta…</span>}
            {!checkingUname && unameValid === false && (
              <span className="text-red-500">Salli vain kirjaimet, numerot, . _ -, pituus 3–24.</span>
            )}
            {!checkingUname && unameValid && unameAvailable === false && (
              <span className="text-red-500">Käyttäjänimi on jo varattu.</span>
            )}
            {!checkingUname && unameValid && unameAvailable && (
              <span className="text-green-600">Käyttäjänimi on saatavilla.</span>
            )}
          </div>
        </div>
      )}

      <input
        type="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        placeholder="Sähköposti"
        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
      />
      <input
        type="password"
        value={password}
        onChange={e => setPassword(e.target.value)}
        placeholder="Salasana"
        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded text-gray-900 dark:text-white bg-white dark:bg-gray-700 placeholder-gray-400 dark:placeholder-gray-500"
      />

      <p
        className="text-sm text-blue-600 dark:text-blue-300 hover:underline cursor-pointer text-center"
        onClick={() => setActiveView('forgot-password')}
      >
        Unohtuiko salasana?
      </p>

      <button
        onClick={handleAuth}
        disabled={isLoading}
        className="w-full bg-blue-600 disabled:opacity-70 disabled:cursor-not-allowed text-white py-2 rounded hover:bg-blue-700 transition"
      >
        {isLoading
          ? (isRegistering ? 'Rekisteröidään…' : 'Kirjaudutaan…')
          : (isRegistering ? 'Rekisteröidy' : 'Kirjaudu')}
      </button>

      <p
        className="text-sm text-center text-blue-600 dark:text-blue-300 cursor-pointer hover:underline"
        onClick={() => {
          setIsRegistering(prev => !prev);
          setError('');
          setInfo('');
        }}
      >
        {isRegistering ? 'Onko sinulla jo tili? Kirjaudu' : 'Ei tiliä? Rekisteröidy'}
      </p>

      <button
        onClick={() => setActiveView('calculator')}
        className="w-full text-sm text-gray-500 dark:text-gray-400 mt-2 hover:underline"
      >
        ← Palaa laskimeen ilman kirjautumista
      </button>
    </div>
  );
}
