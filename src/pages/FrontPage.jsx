// src/pages/FrontPage.jsx
import { useEffect, useState } from 'react';
import supabase from '@/supabaseClient';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

// Add/extend this list when you designate more admins
const ADMIN_EMAILS = ['ville.j.lehtola@gmail.com'];

export default function FrontPage() {
  const { t } = useTranslation();
  const [latestAdminRecipes, setLatestAdminRecipes] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    (async () => {
      setLoading(true);

      // 1) Resolve admin user IDs by email
      const { data: admins, error: adminErr } = await supabase
        .from('users')
        .select('id,email')
        .in('email', ADMIN_EMAILS);

      if (adminErr) {
        console.warn('Admin lookup failed', adminErr);
        setLatestAdminRecipes([]);
        setLoading(false);
        return;
      }

      const adminIds = (admins || []).map((a) => a.id).filter(Boolean);
      if (adminIds.length === 0) {
        setLatestAdminRecipes([]);
        setLoading(false);
        return;
      }

      // 2) Fetch only recipes authored by admins
      const { data: rows, error: recErr } = await supabase
        .from('recipes')
        .select('id,title,description,cover_image,images,author_id,created_at')
        .in('author_id', adminIds)
        .order('created_at', { ascending: false })
        .limit(12);

      if (recErr) {
        console.warn('Admin recipes fetch failed', recErr);
        setLatestAdminRecipes([]);
      } else {
        setLatestAdminRecipes(rows || []);
      }
      setLoading(false);
    })();
  }, []);

  // Pick hero image: cover_image → first(images)
  const heroFor = (r) => {
    if (r?.cover_image) return r.cover_image;
    if (Array.isArray(r?.images) && r.images.length) {
      const first = r.images[0];
      return typeof first === 'string' ? first : first?.url;
    }
    return null;
  };

  return (
    <div className="max-w-6xl mx-auto px-4 md:px-6">
      {/* ===== Top: Latest admin recipes ===== */}
      <section className="mt-2">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
          {t('latest_admin_recipes', 'Latest admin recipes')}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          {t('recipe_library', 'Recipe library')}
        </p>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="rounded-xl overflow-hidden border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800"
              >
                <div className="w-full aspect-[16/9] bg-gray-100 dark:bg-slate-900 animate-pulse" />
                <div className="p-3 space-y-2">
                  <div className="h-5 w-2/3 bg-g
