import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '@/supabaseClient';

/**
 * Header — mobile-safe
 * - Reserves space for the fixed hamburger (MobileMenu places it at top-4 left-4).
 * - Centers the title on mobile; uses normal flow on md+.
 * - Truncates long titles and prevents overlap.
 */
export default function Header({ user }) {
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!user?.id) {
        setDisplayName('');
        return;
      }
      try {
        const { data, error } = await supabase
          .from('users')
          .select('username, full_name')
          .eq('id', user.id)
          .single();

        if (!active) return;

        if (error) {
          setDisplayName(user.email || '');
        } else {
          const name = data?.username || data?.full_name || user.email || '';
          setDisplayName(name);
        }
      } catch {
        if (active) setDisplayName(user?.email || '');
      }
    };

    load();
    return () => {
      active = false;
    };
  }, [user]);

  return (
    <header
      className={[
        // Base layout
        'relative flex items-center justify-between',
        // Horizontal padding; reserve extra left padding on mobile for hamburger
        'pl-14 pr-4 py-3',
        // On md+ screens, normal padding (no hamburger overlay)
        'md:pl-6 md:pr-6 md:py-4',
        // Border and backdrop
        'border-b border-gray-200 dark:border-slate-800 bg-white/70 dark:bg-slate-900/70 backdrop-blur'
      ].join(' ')}
      role="banner"
    >
      {/* Left spacer on mobile so the hamburger doesn't overlap */}
      <div className="w-6 h-6 md:hidden" aria-hidden="true" />

      {/* Center title (absolute centered on mobile; normal flow on md+) */}
      <div className="absolute left-1/2 -translate-x-1/2 md:static md:translate-x-0 md:left-auto flex-1 text-center">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-semibold text-lg md:text-xl text-gray-900 dark:text-gray-100 truncate max-w-[70vw] md:max-w-none"
        >
          <span className="rounded-xl px-2 py-1 bg-gradient-to-r from-amber-100 to-indigo-100 dark:from-amber-900/30 dark:to-indigo-900/30">
            Everything Dough
          </span>
        </Link>
      </div>

      {/* Right: username if logged in (acts as balancing element) */}
      <div className="min-w-[40px] flex items-center justify-end gap-3">
        {user ? (
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[40vw] md:max-w-none">
            {displayName}
          </span>
        ) : null}
      </div>
    </header>
  );
}
