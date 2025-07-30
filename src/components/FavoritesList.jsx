import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/supabaseClient";
import {
  FaBreadSlice,
  FaPizzaSlice,
  FaTrash,
  FaChevronDown,
  FaChevronUp,
} from "react-icons/fa";

export default function FavoritesList({ user, onLoadFavorite }) {
  const [favorites, setFavorites] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      fetchFavorites();
    }
  }, [user]);

  const fetchFavorites = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("favorites")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Virhe suosikkien haussa:", error.message);
    } else {
      setFavorites(data);
    }
    setLoading(false);
  };

  const handleDelete = async (id) => {
    const { error } = await supabase.from("favorites").delete().eq("id", id);
    if (!error) {
      setFavorites((prev) => prev.filter((fav) => fav.id !== id));
    } else {
      console.error("Virhe poistettaessa suosikkia:", error.message);
    }
  };

  const toggleExpand = (id) => {
    setExpandedId((prev) => (prev === id ? null : id));
  };

  return (
    <div className="max-w-xl mx-auto p-4">
      <h2 className="text-2xl font-semibold mb-4 text-center dark:text-white">
        Suosikit
      </h2>

      {loading ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          Ladataan...
        </p>
      ) : favorites.length === 0 ? (
        <p className="text-center text-gray-500 dark:text-gray-400">
          Ei tallennettuja suosikkeja.
        </p>
      ) : (
        <ul className="space-y-4">
          <AnimatePresence>
            {favorites.map((fav) => {
              const isExpanded = fav.id === expandedId;
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
                      {fav.mode === "pizza" ? (
                        <FaPizzaSlice className="text-yellow-500" />
                      ) : (
                        <FaBreadSlice className="text-orange-600" />
                      )}
                      <span>{fav.name}</span>
                    </div>

                    <div className="flex gap-2 items-center">
                      <button
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        onClick={() => onLoadFavorite(fav)}
                      >
                        Lataa
                      </button>
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
                        aria-expanded={isExpanded}
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
                        <p>Hydraatio: {fav.hydration}%</p>
                        <p>Suola: {fav.salt_pct}%</p>
                        {fav.use_oil && <p>Öljy: kyllä</p>}
                        {fav.use_seeds && <p>Siemenet: kyllä</p>}
                        {fav.use_rye && <p>Ruisjauho: kyllä</p>}
                        {fav.cold_fermentation && <p>Kylmäkohotus: kyllä</p>}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.li>
              );
            })}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
