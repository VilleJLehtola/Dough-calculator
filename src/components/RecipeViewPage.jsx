import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/supabaseClient';
import { useTranslation } from 'react-i18next';
import Slider from 'react-slick';
import 'slick-carousel/slick/slick.css';
import 'slick-carousel/slick/slick-theme.css';

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
      const parsedData = {
        ...data,
        ingredients: typeof data.ingredients === 'string' ? JSON.parse(data.ingredients) : data.ingredients,
        flour_types: typeof data.flour_types === 'string' ? JSON.parse(data.flour_types) : data.flour_types,
      };
      setRecipe(parsedData);
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

  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: false,
  };

  const iconMap = {
    jauho: '🌾',
    vesi: '💧',
    suola: '🧂',
    juuri: '🧬',
    öljy: '🪔',
    siemenet: '🌻',
  };

  return (
    <div className="max-w-screen-md mx-auto p-4">
      {recipe_images?.length > 0 && (
        <Slider {...settings} className="rounded-lg overflow-hidden mb-4">
          {recipe_images.map((img) => (
            <div key={img.url} className="px-2">
              <img
                src={img.url}
                alt={title}
                className="w-full h-64 object-cover rounded-lg"
              />
            </div>
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
              {instructions
                .split('\n')
                .map((line, index) => {
                  const match = line.match(/^Taitto\s*(\d)/i);
                  if (match) {
                    const number = match[1];
                    return (
                      <p key={index}>
                        🌀 <strong>{t('Fold')} {number}:</strong>{' '}
                        {line.replace(/^Taitto\s*\d+:?/i, '').trim()}
                      </p>
                    );
                  }
                  return <p key={index}>{line}</p>;
                })}
            </div>
          </div>
        )}

        {/* Ingredients Section */}
        <div className="bg-gray-200 dark:bg-gray-700 rounded p-4 text-sm text-gray-900 dark:text-white">
          <h3 className="font-semibold mb-2">{t('Ingredients') || 'Ainekset'}</h3>

          {Object.entries(iconMap).map(([key, icon]) => {
            const value = ingredients?.[key];
            if (value > 0) {
              return (
                <p key={key}>
                  {icon}{' '}
                  <strong>
                    {t(key.charAt(0).toUpperCase() + key.slice(1))}:
                  </strong>{' '}
                  {value.toFixed(1)}g
                </p>
              );
            }
            return null;
          })}

          {ingredients?.yhteensa && (
            <p className="mt-2">
              ⚖️ <strong>{t('Total dough weight') || 'Taikinan kokonaispaino'}:</strong>{' '}
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
