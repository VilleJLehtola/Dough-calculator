// src/components/CommentsSection.jsx
import React, { useEffect, useState } from 'react';
import supabase from '@/supabaseClient';
import { useTranslation } from 'react-i18next';
import { Trash2 } from 'lucide-react';

export default function CommentsSection({ recipeId, user }) {
  const { t } = useTranslation();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');

  // Load comments
  const fetchComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('recipe_comments')
      .select('id, content, created_at, user_id, users(username)')
      .eq('recipe_id', recipeId)
      .order('created_at', { ascending: false });

    if (!error) {
      setComments(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    if (recipeId) fetchComments();
  }, [recipeId]);

  // Post comment
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const { error } = await supabase.from('recipe_comments').insert({
      recipe_id: recipeId,
      user_id: user.id,
      content: newComment.trim(),
    });

    if (!error) {
      setNewComment('');
      fetchComments();
    }
  };

  // Delete own comment
  const handleDelete = async (id) => {
    const { error } = await supabase.from('recipe_comments').delete().eq('id', id);
    if (!error) {
      setComments((prev) => prev.filter((c) => c.id !== id));
    }
  };

  return (
    <div className="mt-8">
      <h2 className="text-lg font-semibold mb-4">{t('comments', 'Comments')}</h2>

      {/* Comment form */}
      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <textarea
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder={t('add_a_comment', 'Add a comment…')}
            className="w-full p-2 border rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500"
            rows={3}
          />
          <button
            type="submit"
            className="mt-2 px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700"
          >
            {t('post', 'Post')}
          </button>
        </form>
      ) : (
        <p className="text-sm opacity-80">{t('login_to_comment','Login to leave a comment.')}</p>
      )}

      {/* Comments list */}
      {loading ? (
        <p className="text-sm opacity-70">{t('loading','Loading…')}</p>
      ) : comments.length === 0 ? (
        <p className="text-sm opacity-70">{t('no_comments_yet','No comments yet.')}</p>
      ) : (
        <ul className="space-y-4">
          {comments.map((c) => (
            <li key={c.id} className="border-b border-gray-200 dark:border-gray-700 pb-3">
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {c.users?.username || 'Anon'}
                </span>
                <span className="text-xs text-gray-500">
                  {new Date(c.created_at).toLocaleString()}
                </span>
              </div>
              <p className="text-gray-800 dark:text-gray-200 text-sm whitespace-pre-wrap">
                {c.content}
              </p>
              {user?.id === c.user_id && (
                <button
                  onClick={() => handleDelete(c.id)}
                  className="mt-1 flex items-center gap-1 text-xs text-red-500 hover:underline"
                >
                  <Trash2 size={14} /> {t('delete','Delete')}
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
