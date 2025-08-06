// src/components/RecipeViewPage.jsx
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import { useTranslation } from 'react-i18next';
import Slider from 'react-slick';

export default function RecipeViewPage() {
  const { id } = useParams();
  const [recipe, setRecipe] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchRecipe = async () => {
      const { data, error } = await supabase
        .from('recipes')
        .select(
          `
          *,
          recipe_images (
            url
          )
        `
        )
        .eq('id', id)
        .single();

      if (!error) {
        setRecipe(data);
      }
    };

    fetchRecipe();
  }, [id]);

  if (!recipe) {
    return <p className="text-center p-4">Ladataan...</p>;
  }

  const {
    title,
    description,
    tags,
    instructions,
    flour_types,
    hydration,
    salt,
    starter,
    oil,
    seeds,
    ingredients,
    total_time,
    active_time,
    recipe_images,
  } = recipe;

  return (
    <div className="max-w-screen-md mx-auto p-4">
      {recipe_images?.length > 0 && (
        <Slider dots infinite speed={500} slidesToShow={1} slidesToScroll={1}>
          {recipe_images.map((img) => (
            <img
              key={img.url}
              src={img.url}
              alt={title}
              className="w-full h-64 object-cover rounded-xl"
            />
          ))}
        </Slider>
      )}

      <div className="mt-4 bg-gray-100 dark:bg-gray-800 p-4 rounded-xl shadow">
        <Link to="/" className="text-blue-500 hover:underline text-sm mb-2 inline-block">
          ← {t('Back') || 'Takaisin'}
        </Link>

        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          🍞 {title}
        </h2>

        {description && (
          <p className="text-sm text-gray-700 dark:text-gray-300">{description}</p>
        )}

        <div className="flex flex-wrap gap-2 mt-2 mb-4">
          {(tags || []).map((tag) => (
            <span
              key={tag}
              className="bg-blue-200 text-blue-900 dark:bg-blue-700 dark:text-white px-2 py-0.5 rounded text-xs"
            >
              {tag}
            </span>
          ))}
        </div>

        {/* Instructions */}
        {instructions && (
          <div className="mb-4">
            <h3 className="text-lg font-semibold mb-1">{t('Instructions') || 'Ohjeet'}</h3>
            <div className="prose dark:prose-invert text-sm whitespace-pre-line">
              {instructions}
            </div>
          </div>
        )}

        {/* Ingredients Section */}
        <div className="bg-gray-200 dark:bg-gray-700 rounded p-4 text-sm text-gray-900 dark:text-white">
          <h3 className="font-semibold mb-2">{t('Ingredients') || 'Ainekset'}</h3>

          {ingredients?.jauho && (
            <p>
              <strong>{t('Flour') || 'Jauhot'}:</strong> {ingredients.jauho.toFixed(0)}g
            </p>
          )}
          {ingredients?.vesi && (
            <p>
              <strong>{t('Water') || 'Vesi'}:</strong> {ingredients.vesi.toFixed(0)}g
            </p>
          )}
          {ingredients?.suola && (
            <p>
              <strong>{t('Salt') || 'Suola'}:</strong> {ingredients.suola.toFixed(1)}g
            </p>
          )}
          {ingredients?.juuri && (
            <p>
              <strong>{t('Starter') || 'Juuri'}:</strong> {ingredients.juuri.toFixed(0)}g
            </p>
          )}
          {ingredients?.öljy > 0 && (
            <p>
              <strong>{t('Oil') || 'Öljy'}:</strong> {ingredients.öljy.toFixed(1)}g
            </p>
          )}
          {ingredients?.siemenet > 0 && (
            <p>
              <strong>{t('Seeds') || 'Siemenet'}:</strong> {ingredients.siemenet.toFixed(0)}g
            </p>
          )}
          {ingredients?.yhteensa && (
            <p className="mt-2">
              <strong>{t('Total dough weight') || 'Taikinan kokonaispaino'}:</strong>{' '}
              {ingredients.yhteensa.toFixed(0)}g
            </p>
          )}

          {flour_types && Object.keys(flour_types).length > 0 && (
            <div className="mt-2">
              <strong>{t('Flour breakdown') || 'Jauhojakauma'}:</strong>
              <ul className="list-disc list-inside ml-4">
                {Object.entries(flour_types).map(([type, amount]) => (
                  <li key={type}>
                    {type}: {amount.toFixed(0)}g
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="mt-2">
            {total_time && (
              <p>
                ⏱️ <strong>{t('Total time') || 'Kokonaisaika'}:</strong> {total_time} min
              </p>
            )}
            {active_time && (
              <p>
                💪 <strong>{t('Active time') || 'Työaika'}:</strong> {active_time} min
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
