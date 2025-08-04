import { useParams, Link } from 'react-router-dom';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/supabaseClient';
import {
  FaPizzaSlice,
  FaBreadSlice,
  FaTimes,
  FaDownload,
  FaChevronLeft,
  FaChevronRight,
  FaSearchPlus,
  FaSearchMinus
} from 'react-icons/fa';
import { motion, AnimatePresence } from 'framer-motion';

export default function RecipeViewPage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [showModal, setShowModal] = useState(false);
  const [modalIndex, setModalIndex] = useState(0);
  const [zoom, setZoom] = useState(1);

  useEffect(() => {
    const fetchRecipe = async () => {
      const { data, error } = await supabase.from('recipes').select('*').eq('id', id).single();
      if (!error) setRecipe(data);
    };

    const fetchImages = async () => {
      const { data, error } = await supabase
        .from('recipe_images')
        .select('*')
        .eq('recipe_id', id)
        .order('created_at', { ascending: true });
      if (!error) setImages(data);
    };

    Promise.all([fetchRecipe(), fetchImages()]).then(() => setLoading(false));
  }, [id]);

  const escHandler = useCallback((e) => {
    if (e.key === 'Escape') {
      setShowModal(false);
      setZoom(1);
    }
  }, []);

  useEffect(() => {
    if (showModal) window.addEventListener('keydown', escHandler);
    return () => window.removeEventListener('keydown', escHandler);
  }, [showModal, escHandler]);

  const renderInstructions = (text, folds = []) => {
    const lines = text.split('\n').filter(Boolean);
    let foldIndex = 0;

    return lines.map((line, idx) => {
      if (/\[FOLD \d+\]/i.test(line)) {
        const timing = folds[foldIndex++] || null;
        return (
          <p key={idx} className="font-semibold text-blue-500 dark:text-blue-300">
            Taitto {foldIndex} {timing ? `(${timing} min)` : ''}
          </p>
        );
      }
      return <p key={idx}>• {line}</p>;
    });
  };

  const openModal = (index) => {
    setModalIndex(index);
    setZoom(1);
    setShowModal(true);
  };

  const currentImage = images[modalIndex]?.url;

  if (loading) return <p className="text-center">Ladataan...</p>;
  if (!recipe) return <p className="text-center">Reseptiä ei löytynyt.</p>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-100 via-white to-blue-200 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-10 px-4 text-gray-900 dark:text-gray-100">
      <div className="bg-white dark:bg-gray-800 shadow-xl rounded-xl max-w-2xl w-full mx-auto p-6 space-y-6 border border-blue-200 dark:border-gray-700">
        <Link to="/" className="text-blue-500 hover:underline">← Takaisin</Link>

        {/* Image gallery */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 gap-4 cursor-pointer">
            {images.map((img, idx) => (
              <img
                key={img.id}
                src={img.url}
                alt={`Kuva ${idx + 1}`}
                className="w-full max-h-96 object-cover rounded-xl shadow-md hover:opacity-90 transition"
                onClick={() => openModal(idx)}
              />
            ))}
          </div>
        )}

        {/* Modal */}
        <AnimatePresence>
          {showModal && currentImage && (
            <motion.div
              className="fixed inset-0 bg-black bg-opacity-80 z-50 flex items-center justify-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ duration: 0.3 }}
                onClick={(e) => e.stopPropagation()}
                className="relative max-w-4xl w-full mx-4"
              >
                <div className="absolute top-2 right-2 flex gap-2 z-10">
                  <button onClick={() => setZoom(zoom + 0.1)} className="text-white text-lg bg-black bg-opacity-40 p-2 rounded-full hover:bg-opacity-60"><FaSearchPlus /></button>
                  <button onClick={() => setZoom(Math.max(0.5, zoom - 0.1))} className="text-white text-lg bg-black bg-opacity-40 p-2 rounded-full hover:bg-opacity-60"><FaSearchMinus /></button>
                  <button onClick={() => setZoom(1)} className="text-white text-sm bg-black bg-opacity-40 px-3 rounded-full hover:bg-opacity-60">Reset</button>
                  <a
                    href={currentImage}
                    download
                    className="text-white text-lg bg-black bg-opacity-40 p-2 rounded-full hover:bg-opacity-60"
                    title="Lataa kuva"
                  >
                    <FaDownload />
                  </a>
                  <button onClick={() => setShowModal(false)} className="text-white text-lg bg-black bg-opacity-40 p-2 rounded-full hover:bg-opacity-60"><FaTimes /></button>
                </div>

                {/* Navigation */}
                {images.length > 1 && (
                  <>
                    <button
                      className="absolute left-2 top-1/2 transform -translate-y-1/2 text-white text-2xl bg-black bg-opacity-40 p-2 rounded-full hover:bg-opacity-60"
                      onClick={() => setModalIndex((modalIndex - 1 + images.length) % images.length)}
                    >
                      <FaChevronLeft />
                    </button>
                    <button
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-white text-2xl bg-black bg-opacity-40 p-2 rounded-full hover:bg-opacity-60"
                      onClick={() => setModalIndex((modalIndex + 1) % images.length)}
                    >
                      <FaChevronRight />
                    </button>
                  </>
                )}

                <img
                  src={currentImage}
                  alt="Esikatselu"
                  style={{ transform: `scale(${zoom})` }}
                  className="w-full h-auto rounded-lg shadow-lg max-h-[90vh] object-contain transition-transform"
                />
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center gap-3 mt-4">
          {recipe.mode === 'pizza' ? (
            <FaPizzaSlice className="text-yellow-500 text-2xl" />
          ) : (
            <FaBreadSlice className="text-orange-600 text-2xl" />
          )}
          <h1 className="text-3xl font-bold">{recipe.title}</h1>
        </div>

        {recipe.description && (
          <p className="italic text-gray-600 dark:text-gray-400 mt-2 mb-4">{recipe.description}</p>
        )}

        {recipe.tags && recipe.tags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {recipe.tags.map(tag => (
              <span
                key={tag}
                className="bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-white px-2 py-0.5 rounded text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-4">
          <h2 className="font-semibold mb-2">Ohjeet</h2>
          <div className="space-y-1">
            {renderInstructions(recipe.instructions, recipe.fold_timings)}
          </div>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded space-y-1 text-sm text-white">
          <h2 className="font-semibold mb-2 text-base">Ainekset</h2>
          <ul className="space-y-1">
            {recipe.flour_amount !== null && <li>Jauho: {recipe.flour_amount} g</li>}
            {recipe.water_amount !== null && <li>Vesi: {recipe.water_amount} g</li>}
            {recipe.salt_amount !== null && <li>Suola: {recipe.salt_amount} g</li>}
            {recipe.oil_amount !== null && <li>Öljy: {recipe.oil_amount} g</li>}
            {recipe.juuri_amount !== null && <li>Juuri: {recipe.juuri_amount} g</li>}
            {recipe.seeds_amount !== null && <li>Siemenet: {recipe.seeds_amount} g</li>}
            {recipe.total_time && <li>Kokonaika: {recipe.total_time}</li>}
            {recipe.active_time && <li>Työaika: {recipe.active_time}</li>}
          </ul>
        </div>
      </div>
    </div>
  );
}
