import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/supabaseClient';
import {
  FaBreadSlice,
  FaPizzaSlice,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
  FaRegFileAlt,
} from 'react-icons/fa';

export default function FavoritesList({ user, onLoadFavorite }) {
  const [favorites, setFavorites] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recipesMap, setRecipesMap] = useState({});

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

    const recipeIds = favs.map(f => f.recipe_id).filter(Boolean);
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

    const recipeMap = Object.fromEntries(recipesData.map(r => [r.id, r]));
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
    navigator.clipboard.writeText(link)
      .then(() => alert(`Linkki kopioitu:\n${link}`))
      .catch(() => alert('Linkin kopiointi epäonnistui.'));
  };

  const quickFavorites = favorites.filter(f => !f.recipe_id);
  const recipeFavorites = favorites.filter(f => f.recipe_id);

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
                  ) : fav.mode === "pizza" ? (
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

                  {fav.share_path && (
                    <button
                      className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                      onClick={() => copyLink(fav)}
                    >
                      Jaa linkki
                    </button>
                  )}

                  <button
                    className="text-red-500 hover:text-red-700"
                    onClick={() => handleDelete(fav.id)}
                    title="Poista suosikki"
                  >
                    <FaTrash />
                  </button>
                  <button
                    className="text-gray-600 dark:text-gray-300"
                    onClick={() => toggleExpand(fav.id)}
                    title="Näytä lisätiedot"
                  >
                    {isExpanded ? <FaChevronUp /> : <FaChevronDown />}
                  </button>
                </div>
              </div>

              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="overflow-hidden mt-4 text-sm text-gray-700 dark:text-gray-300 space-y-1"
                  >
                    {linkedRecipe ? (
                      <div>
                        <p>{linkedRecipe.description}</p>
                        {(linkedRecipe.tags || []).map((tag) => (
                          <span
                            key={tag}
                            className="inline-block bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-white px-2 py-0.5 rounded text-xs mr-1"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <>
                        <p>Hydraatio: {fav.hydration}%</p>
                        <p>Suola: {fav.salt_pct}%</p>
                        {fav.use_oil && <p>Öljy: kyllä</p>}
                        {fav.use_seeds && <p>Siemenet: kyllä</p>}
                        {fav.use_rye && <p>Ruisjauho: kyllä</p>}
                        {fav.cold_fermentation && <p>Kylmäkohotus: kyllä</p>}
                      </>
                    )}
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
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4 text-center dark:text-white">
        Suosikit
      </h2>

      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Ladataan...</p>
      ) : (
        <div className="space-y-8">
          {recipeFavorites.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">Reseptisuosikit</h3>
              {renderFavoriteList(recipeFavorites, true)}
            </div>
          )}

          {quickFavorites.length > 0 && (
            <div>
              <h3 className="text-lg font-semibold mb-2 dark:text-white">Pikasuosikit</h3>
              {renderFavoriteList(quickFavorites)}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
