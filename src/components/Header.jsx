import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '@/supabaseClient';
import InstallAppButton from '@/components/InstallAppButton'; // ⬅️ NEW

/**
 * Header — mobile-safe
 * - Reserves space for the fixed hamburger (MobileMenu places it at top-4 left-4).
 * - Centers the title on mobile; uses normal flow on md+.
 * - Truncates long titles and prevents overlap.
 * - Displays a friendly name: user_metadata -> DB -> email prefix.
 */
export default function Header({ user }) {
  const [displayName, setDisplayName] = useState('');

  useEffect(() => {
    let active = true;

    const fromEmail = (em) => (em ? em.split('@')[0] : '');

    // 1) Instant local value (no DB call)
    const meta = user?.user_metadata || {};
    const immediate =
      meta.username ||
      meta.user_name ||
      meta.full_name ||
      meta.name ||
      fromEmail(user?.email) ||
      '';

    setDisplayName(user?.id ? immediate : '');

    // 2) Optional: try to upgrade from your public table if it exists
    (async () => {
      if (!user?.id) return;

      try {
        // Try common table names in order. Safe even if a table doesn't exist.
        const candidates = ['profiles', 'users'];
        for (const tbl of candidates) {
          const { data, error } = await supabase
            .from(tbl)
            .select('username, display_name, full_name')
            .eq('id', user.id)
            .maybeSingle();

          if (error) continue;

          const dbName =
            data?.username ||
            data?.display_name ||
            data?.full_name ||
            '';

          if (dbName && active) {
            setDisplayName(dbName);
            break;
          }
        }
      } catch {
        // swallow; fallback already set
      }
    })();

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
      {/* Left spacer on mobile so the fixed hamburger doesn't overlap */}
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

      {/* Right: install button (md+) and username if logged in */}
      <div className="min-w-[40px] flex items-center justify-end gap-3">
        {/* Install PWA button — hidden on small screens to keep the centered layout clean */}
        <InstallAppButton className="hidden md:inline-flex" />

        {user ? (
          <span className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate max-w-[40vw] md:max-w-none">
            {displayName}
          </span>
        ) : null}
      </div>
    </header>
  );
}
