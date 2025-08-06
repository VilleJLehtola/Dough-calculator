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
  FaShareAlt
} from 'react-icons/fa';

export default function FavoritesList({ user, onLoadFavorite }) {
  const [favorites, setFavorites] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recipesMap, setRecipesMap] = useState({});
  const [imagesMap, setImagesMap] = useState({});
  const [showRecipeSection, setShowRecipeSection] = useState(true);
  const [showQuickSection, setShowQuickSection] = useState(true);
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

    if (error) return console.error('Error fetching favorites:', error);

    const recipeIds = favs.map(f => f.recipe_id).filter(Boolean);

    let recipesData = [], imagesData = [];
    if (recipeIds.length) {
      const { data: recipes } = await supabase
        .from('recipes')
        .select('*')
        .in('id', recipeIds);

      const { data: images } = await supabase
        .from('recipe_images')
        .select('*')
        .in('recipe_id', recipeIds)
        .order('created_at', { ascending: true });

      recipesData = recipes || [];
      imagesData = images || [];
    }

    const recipeMap = Object.fromEntries(recipesData.map(r => [r.id, r]));
    const imageMap = {};
    imagesData.forEach(img => {
      if (!imageMap[img.recipe_id]) imageMap[img.recipe_id] = img.url;
    });

    setRecipesMap(recipeMap);
    setImagesMap(imageMap);
    setFavorites(favs);
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from('favorites').delete().eq('id', id);
    if (!error) {
      setFavorites(prev => prev.filter(f => f.id !== id));
    }
  };

  const copyLink = (fav) => {
    const link = `https://www.breadcalculator.online/${fav.share_path}`;
    navigator.clipboard.writeText(link)
      .then(() => alert(`Linkki kopioitu:\n${link}`))
      .catch(() => alert('Linkin kopiointi epäonnistui.'));
  };

  const quickFavorites = favorites.filter(f => !f.recipe_id);
  const recipeFavorites = favorites.filter(f => f.recipe_id);

  const renderRecipeCard = (fav) => {
    const recipe = recipesMap[fav.recipe_id];
    const img = imagesMap[fav.recipe_id];

    return (
      <div className="bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-xl overflow-hidden shadow-md">
        {img && (
          <img
            src={img}
            alt={recipe.title}
            className="w-full h-48 object-cover rounded-t-xl"
          />
        )}
        <div className="p-4">
          <h3 className="text-lg font-semibold mb-1 dark:text-white">{recipe.title}</h3>
          {recipe.description && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mb-2">{recipe.description}</p>
          )}
          <div className="flex flex-wrap gap-1 mb-3">
            {(recipe.tags || []).map(tag => (
              <span
                key={tag}
                className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-white px-2 py-0.5 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
          <div className="flex justify-between items-center">
            <button
              className="text-blue-600 dark:text-blue-400 hover:underline text-sm"
              onClick={() => navigate(`/recipe/${fav.recipe_id}`)}
            >
              Avaa resepti
            </button>
            <div className="flex items-center gap-2">
              {fav.share_path && (
                <button
                  onClick={() => copyLink(fav)}
                  className="text-purple-600 dark:text-purple-400 hover:text-purple-800 dark:hover:text-purple-300"
                >
                  <FaShareAlt />
                </button>
              )}
              <button
                onClick={() => handleDelete(fav.id)}
                className="text-red-500 hover:text-red-700"
                title="Poista suosikki"
              >
                <FaTrash />
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderQuickCard = (fav) => (
    <motion.li
      key={fav.id}
      layout
      className="bg-white dark:bg-gray-800 rounded-xl shadow p-4 border border-gray-200 dark:border-gray-700"
    >
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2 font-medium text-gray-900 dark:text-white">
          {fav.mode === "pizza" ? <FaPizzaSlice className="text-yellow-500" /> : <FaBreadSlice className="text-orange-600" />}
          <span>{fav.name}</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => onLoadFavorite(fav)} className="text-sm text-blue-600 dark:text-blue-400 hover:underline">Lataa</button>
          {fav.share_path && (
            <button onClick={() => copyLink(fav)} className="text-purple-600 dark:text-purple-400">
              <FaShareAlt />
            </button>
          )}
          <button onClick={() => handleDelete(fav.id)} className="text-red-500 hover:text-red-700">
            <FaTrash />
          </button>
        </div>
      </div>
      <div className="text-sm text-gray-700 dark:text-gray-300 space-y-1">
        <p>Hydraatio: {fav.hydration}%</p>
        <p>Suola: {fav.salt_pct}%</p>
        {fav.use_oil && <p>Öljy: kyllä</p>}
        {fav.use_seeds && <p>Siemenet: kyllä</p>}
        {fav.use_rye && <p>Ruisjauho: kyllä</p>}
        {fav.cold_fermentation && <p>Kylmäkohotus: kyllä</p>}
      </div>
    </motion.li>
  );

  return (
    <div className="max-w-3xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-6 text-center dark:text-white">Suosikit</h2>

      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400">Ladataan...</p>
      ) : (
        <div className="space-y-8">

          {/* Recipe Favorites */}
          {recipeFavorites.length > 0 && (
            <div>
              <button
                onClick={() => setShowRecipeSection(prev => !prev)}
                className="flex items-center justify-between w-full text-left text-lg font-semibold mb-3 dark:text-white"
              >
                Reseptisuosikit
                {showRecipeSection ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              <AnimatePresence>
                {showRecipeSection && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="grid gap-4 sm:grid-cols-2"
                  >
                    {recipeFavorites.map(fav => (
                      <div key={fav.id}>{renderRecipeCard(fav)}</div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}

          {/* Quick Favorites */}
          {quickFavorites.length > 0 && (
            <div>
              <button
                onClick={() => setShowQuickSection(prev => !prev)}
                className="flex items-center justify-between w-full text-left text-lg font-semibold mb-3 dark:text-white"
              >
                Pikasuosikit
                {showQuickSection ? <FaChevronUp /> : <FaChevronDown />}
              </button>
              <AnimatePresence>
                {showQuickSection && (
                  <motion.ul
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-4"
                  >
                    {quickFavorites.map(fav => renderQuickCard(fav))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          )}

        </div>
      )}
    </div>
  );
}
