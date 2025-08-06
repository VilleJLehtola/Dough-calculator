import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/supabaseClient';
import { useNavigate } from 'react-router-dom';
import {
  FaBreadSlice,
  FaPizzaSlice,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaRegFileAlt,
  FaShareAlt,
} from 'react-icons/fa';

const ITEMS_PER_PAGE = 5;

export default function FavoritesList({ user, onLoadFavorite }) {
  const [favorites, setFavorites] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recipesMap, setRecipesMap] = useState({});
  const [selectedTags, setSelectedTags] = useState([]);
  const [showTagFilter, setShowTagFilter] = useState(false);
  const [sortOption, setSortOption] = useState('newest');
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) fetchFavorites();
  }, [user]);

  const fetchFavorites = async () => {
    setLoading(true);
    const { data: favs, error } = await supabase
      .from('favorites')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching favorites:', error);
      setLoading(false);
      return;
    }

    const recipeIds = favs.map(f => f.recipe_id).filter(Boolean);
    const { data: recipes = [] } = await supabase
      .from('recipes')
      .select('*')
      .in('id', recipeIds);

    const recipeMap = Object.fromEntries(recipes.map(r => [r.id, r]));
    setRecipesMap(recipeMap);
    setFavorites(favs);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('favorites').delete().eq('id', id);
    if (!error) setFavorites(prev => prev.filter(fav => fav.id !== id));
  };

  const toggleExpand = (id) => {
    setExpandedId(prev => (prev === id ? null : id));
  };

  const copyLink = (fav) => {
    if (!fav.share_path) return alert("Ei jaettavaa linkkiä.");
    const link = `https://www.breadcalculator.online/${fav.share_path}`;
    navigator.clipboard.writeText(link)
      .then(() => alert(`Linkki kopioitu:\n${link}`))
      .catch(() => alert('Kopiointi epäonnistui.'));
  };

  const allTags = Array.from(
    new Set(
      favorites.flatMap(f => f.recipe_id ? (recipesMap[f.recipe_id]?.tags || []) : [])
    )
  );

  const filteredFavorites = favorites.filter(fav => {
    if (!selectedTags.length || !fav.recipe_id) return true;
    const recipeTags = recipesMap[fav.recipe_id]?.tags || [];
    return selectedTags.every(tag => recipeTags.includes(tag));
  });

  const sortedFavorites = [...filteredFavorites].sort((a, b) => {
    if (sortOption === 'title') {
      const titleA = recipesMap[a.recipe_id]?.title || a.name || '';
      const titleB = recipesMap[b.recipe_id]?.title || b.name || '';
      return titleA.localeCompare(titleB);
    }
    if (sortOption === 'oldest') return new Date(a.created_at) - new Date(b.created_at);
    return new Date(b.created_at) - new Date(a.created_at);
  });

  const pageCount = Math.ceil(sortedFavorites.length / ITEMS_PER_PAGE);
  const paginatedFavorites = sortedFavorites.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-bold mb-4 text-center dark:text-white">Suosikit</h2>

      {/* Sorting + Tag Filters */}
      <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
        <select
          className="px-3 py-1 border rounded dark:bg-gray-800 dark:text-white"
          value={sortOption}
          onChange={(e) => setSortOption(e.target.value)}
        >
          <option value="newest">Uusin ensin</option>
          <option value="oldest">Vanhin ensin</option>
          <option value="title">Aakkosjärjestys</option>
        </select>

        <button
          onClick={() => setShowTagFilter(prev => !prev)}
          className="text-blue-600 hover:underline text-sm"
        >
          {showTagFilter ? 'Piilota tagit' : 'Suodata tageilla'}
        </button>
      </div>

      {/* Tag Filter UI */}
      <AnimatePresence>
        {showTagFilter && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-4 flex flex-wrap gap-2"
          >
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() =>
                  setSelectedTags(prev =>
                    prev.includes(tag)
                      ? prev.filter(t => t !== tag)
                      : [...prev, tag]
                  )
                }
                className={`px-3 py-1 rounded-full text-sm ${
                  selectedTags.includes(tag)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 dark:bg-gray-700 dark:text-white'
                }`}
              >
                {tag}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* List Rendering */}
      {loading ? (
        <p className="text-center text-gray-600 dark:text-gray-400">Ladataan...</p>
      ) : paginatedFavorites.length === 0 ? (
        <p className="text-center text-gray-600 dark:text-gray-400">Ei suosikkeja.</p>
      ) : (
        <ul className="space-y-4">
          {paginatedFavorites.map(fav => {
            const recipe = fav.recipe_id ? recipesMap[fav.recipe_id] : null;

            return (
              <li
                key={fav.id}
                className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700"
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-2 font-semibold">
                    {recipe ? (
                      <FaRegFileAlt className="text-green-600" />
                    ) : fav.mode === 'pizza' ? (
                      <FaPizzaSlice className="text-yellow-500" />
                    ) : (
                      <FaBreadSlice className="text-orange-600" />
                    )}
                    <span>{fav.name}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {recipe && (
                      <button
                        onClick={() => navigate(`/recipe/${fav.recipe_id}`)}
                        className="text-blue-600 text-sm hover:underline"
                      >
                        Avaa resepti
                      </button>
                    )}
                    {fav.share_path && (
                      <button onClick={() => copyLink(fav)} title="Kopioi linkki">
                        <FaShareAlt className="text-purple-600" />
                      </button>
                    )}
                    <button onClick={() => handleDelete(fav.id)} title="Poista">
                      <FaTrash className="text-red-600" />
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Pagination */}
      {pageCount > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          {Array.from({ length: pageCount }, (_, i) => i + 1).map(page => (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-1 border rounded ${
                currentPage === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 dark:text-white'
              }`}
            >
              {page}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
