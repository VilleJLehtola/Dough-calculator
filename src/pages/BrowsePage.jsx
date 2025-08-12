import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import supabase from '@/supabaseClient';
import { useTranslation } from 'react-i18next';

export default function BrowsePage() {
  const { t } = useTranslation();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      // Use new schema columns only
      const { data } = await supabase
        .from('recipes')
        .select('id,title,description,cover_image,images,created_at')
        .order('created_at', { ascending: false })
        .limit(24);
      setRows(data || []);
      setLoading(false);
    })();
  }, []);

  const heroFor = (r) => {
    if (r.cover_image) return r.cover_image;
    if (Array.isArray(r.images) && r.images.length) {
      const first = r.images[0];
      return typeof first === 'string' ? first : first?.url;
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-white`>${t('browse')}</h1>

      {loading ? (
        <div className=`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-4">
          {rows.map((r) => {
            const hero = heroFor(r);
            return (
              <Link
                key={r.id}
                to={`/recipe/${r.id}`}
                className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:shadow"
              >
                <div className="w-full aspect-[16/9] bg-gray-100 dark:bg-slate-900">
                  {hero ? <img src={hero} alt={r.title} className="w-full h-full object-cover" /> : null}
                </div>
                <div className="p-3">
                  <div className="font-semibold text-gray-900 dark:text-white line-clamp-1">{r.title}</div>
                  {r.description ? (
                    <div className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{r.description}</div>
                  ) : null}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
