// /src/pages/FavoritesPage.jsx
import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import supabase from '@/supabaseClient';
import { BookmarkX, Clock } from 'lucide-react';
import { useTranslation } from 'react-i18next';

export default function FavoritesPage({ user }) {
  const { t } = useTranslation();
  const nav = useNavigate();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    if (!user?.id) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const { data, error } = await supabase
      .from('favorites')
      .select('id, created_at, recipe_id, recipes ( id, title, cover_image, prep_time_minutes, servings )')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });
    if (!error) setItems(data || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, [user?.id]);

  const removeFav = async (favId) => {
    const prev = items;
    setItems((list) => list.filter((r) => r.id !== favId));
    const { error } = await supabase.from('favorites').delete().eq('id', favId);
    if (error) { console.warn('unfavorite failed', error); setItems(prev); }
  };

  if (!user) {
    return (
      <div className="max-w-5xl mx-auto p-4 md:p-6">
        <h1 className="text-2xl font-semibold mb-3">{t('favorites','Favorites')}</h1>
        <p className="text-sm opacity-80 mb-4">{t('sign_in_to_view_favorites','Please sign in to view your favorites.')}</p>
        <button
          onClick={() => nav('/login')}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
        >
          {t('login','Login')}
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto p-4 md:p-6">
      <h1 className="text-2xl font-semibold mb-4">{t('favorites','Favorites')}</h1>

      {loading ? (
        <div className="text-sm opacity-70">{t('loading','Loading…')}</div>
      ) : items.length === 0 ? (
        <div className="text-sm opacity-70">{t('no_favorites_yet','No favorites yet.')}</div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((row) => {
            const r = row.recipes || {};
            return (
              <div key={row.id} className="rounded-xl border border-gray-200 dark:border-slate-700 overflow-hidden bg-white dark:bg-slate-800">
                <Link to={`/recipe/${r.id}`}>
                  <img
                    src={r.cover_image || ''}
                    alt={r.title || ''}
                    className="h-36 w-full object-cover"
                    loading="lazy"
                  />
                </Link>
                <div className="p-3 space-y-2">
                  <Link to={`/recipe/${r.id}`} className="font-medium line-clamp-2 hover:underline">
                    {r.title || t('open_recipe','Open recipe')}
                  </Link>
                  <div className="flex items-center gap-2 text-xs opacity-80">
                    {r.prep_time_minutes != null && (
                      <span className="inline-flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {r.prep_time_minutes} {t('minutes_short','min')}
                      </span>
                    )}
                    {r.servings != null && (
                      <span>• {r.servings}</span>
                    )}
                  </div>
                  <div className="pt-1">
                    <button
                      onClick={() => removeFav(row.id)}
                      className="inline-flex items-center gap-1 text-xs px-2 py-1 rounded-md border border-gray-300 dark:border-slate-600 hover:bg-gray-50 dark:hover:bg-slate-700"
                      title={t('remove_favorite','Remove favorite')}
                    >
                      <BookmarkX className="w-4 h-4" />
                      {t('remove','Remove')}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
