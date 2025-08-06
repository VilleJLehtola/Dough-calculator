// FavoritesList.jsx
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

export default function FavoritesList({ user, onLoadFavorite }) {
  const [favorites, setFavorites] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recipesMap, setRecipesMap] = useState({});
  const [showRecipeSection, setShowRecipeSection] = useState(true);
  const [showQuickSection, setShowQuickSection] = useState(true);
  const [sortOrder, setSortOrder] = useState('newest');
  const [activeTags, setActiveTags] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const navigate = useNavigate();

  useEffect(() => {
    if (user?.id) {
      fetchFavorites();
    }
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
      setFavorites([]);
      setLoading(false);
      return;
    }

    const recipeIds = favs.map((f) => f.recipe_id).filter(Boolean);
    let recipesData = [];
    if (recipeIds.length) {
      const { data: recipes, error: recipeError } = await supabase
        .from('recipes')
        .select('*')
        .in('id', recipeIds);
      if (!recipeError) {
        recipesData = recipes;
      }
    }

    const recipeMap = Object.fromEntries(recipesData.map((r) => [r.id, r]));
    setRecipesMap(recipeMap);
    setFavorites(favs);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('favorites').delete().eq('id', id);
    if (!error) {
      setFavorites((prev) => prev.filter((fav) => fav.id !== id));
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  const copyLink = (fav) => {
    if (!fav.share_path) {
      alert("Tällä suosikilla ei ole jaettavaa linkkiä.");
      return;
    }
    const link = `https://www.breadcalculator.online/${fav.share_path}`;
    navigator.clipboard
      .writeText(link)
      .then(() => alert(`Linkki kopioitu:\n${link}`))
      .catch(() => alert('Linkin kopiointi epäonnistui.'));
  };

  const quickFavorites = favorites.filter((f) => !f.recipe_id);
  let recipeFavorites = favorites.filter((f) => f.recipe_id);

  if (sortOrder === 'title') {
    recipeFavorites.sort((a, b) => {
      const rA = recipesMap[a.recipe_id]?.title || '';
      const rB = recipesMap[b.recipe_id]?.title || '';
      return rA.localeCompare(rB);
    });
  } else if (sortOrder === 'oldest') {
    recipeFavorites = [...recipeFavorites].reverse();
  }

  const allTags = [
    ...new Set(
      recipeFavorites
        .map((f) => recipesMap[f.recipe_id]?.tags || [])
        .flat()
    ),
  ];

  const filteredFavorites = recipeFavorites.filter((fav) => {
    const recipe = recipesMap[fav.recipe_id];
    if (!activeTags.length) return true;
    return (recipe?.tags || []).some((tag) => activeTags.includes(tag));
  });

  const totalPages = Math.ceil(filteredFavorites.length / itemsPerPage);
  const paginatedFavorites = filteredFavorites.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const renderFavoriteList = (list, isRecipeType = false) => (
    <ul className="space-y-4">
      <AnimatePresence>
        {list.map((fav) => {
          const isExpanded = fav.id === expandedId;
          const linkedRecipe = fav.recipe_id ? recipesMap[fav.recipe_id] : null;

          return (
            <motion.li
              key={fav.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="bg-white dark:bg-gray-800 rounded-2xl shadow-md p-4 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white"
            >
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 font-medium">
                  {linkedRecipe ? (
                    <FaRegFileAlt className="text-green-600" />
                  ) : fav.mode === 'pizza' ? (
                    <FaPizzaSlice className="text-yellow-500" />
                  ) : (
                    <FaBreadSlice className="text-orange-600" />
                  )}
                  <span>{fav.name}</span>
                </div>

                <div className="flex gap-2 items-center">
                  {!linkedRecipe && (
                    <button
                      className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                      onClick={() => onLoadFavorite(fav)}
                    >
                      Lataa
                    </button>
                  )}

                  {linkedRecipe && (
                    <>
                      <button
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={() => navigate(`/recipe/${fav.recipe_id}`)}
                      >
                        Avaa resepti
                      </button>

                      {fav.share_path && (
                        <motion.button
                          whileHover={{ scale: 1.2 }}
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                          onClick={() => copyLink(fav)}
                        >
                          <FaShareAlt />
                        </motion.button>
                      )}
                    </>
                  )}

                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(fav.id)}
                  >
                    <FaTrash />
                  </button>
                  <button
                    className="text-gray-600 dark:text-gray-300 hover:text-white"
                    onClick={() => toggleExpand(fav.id)}
                  >
                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && linkedRecipe && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.2 }}
                    className="mt-4 text-sm text-gray-700 dark:text-gray-300 space-y-1"
                  >
                    {linkedRecipe.description && (
                      <p className="italic">{linkedRecipe.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {(linkedRecipe.tags || []).map((tag) => (
                        <span
                          key={tag}
                          className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-white px-2 py-0.5 rounded text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.li>
          );
        })}
      </AnimatePresence>
    </ul>
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4 text-center dark:text-white">Suosikit</h2>

      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Ladataan...</p>
      ) : (
        <div className="space-y-8">

          {/* Collapsible Filter & Sort */}
          {recipeFavorites.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2 items-center mb-2">
                <span className="font-medium">Tagit:</span>
                {allTags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() =>
                      setActiveTags((prev) =>
                        prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
                      )
                    }
                    className={`px-2 py-1 rounded text-sm ${
                      activeTags.includes(tag)
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-white'
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>

              <div className="flex gap-4">
                <label>
                  Järjestä:{' '}
                  <select
                    value={sortOrder}
                    onChange={(e) => setSortOrder(e.target.value)}
                    className="ml-1 px-2 py-1 rounded border dark:bg-gray-700"
                  >
                    <option value="newest">Uusimmat</option>
                    <option value="oldest">Vanhimmat</option>
                    <option value="title">Aakkosjärjestys</option>
                  </select>
                </label>
              </div>
            </div>
          )}

          {/* Accordion: Reseptisuosikit */}
          {recipeFavorites.length > 0 && (
            <div>
              <button
                onClick={() => setShowRecipeSection((prev) => !prev)}
                className="flex justify-between w-full text-left text-lg font-semibold mb-2"
              >
                Reseptisuosikit
                {showRecipeSection ? <FaChevronUp /> : <FaChevronDown />}
              </button>

              {showRecipeSection && renderFavoriteList(paginatedFavorites, true)}

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-4 flex justify-center gap-2">
                  {Array.from({ length: totalPages }, (_, i) => (
                    <button
                      key={i}
                      onClick={() => setCurrentPage(i + 1)}
                      className={`px-3 py-1 rounded ${
                        currentPage === i + 1
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-200 dark:bg-gray-700'
                      }`}
                    >
                      {i + 1}
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Accordion: Pikasuosikit */}
          {quickFavorites.length > 0 && (
            <div>
              <button
                onClick={() => setShowQuickSection((prev) => !prev)}
                className="flex justify-between w-full text-left text-lg font-semibold mb-2"
              >
                Pikasuosikit
                {showQuickSection ? <FaChevronUp /> : <FaChevronDown />}
              </button>

              {showQuickSection && renderFavoriteList(quickFavorites)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
