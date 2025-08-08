// src/pages/RecipeViewPage.jsx
import { useParams } from 'react-router-dom';

export default function RecipeViewPage() {
  const { id } = useParams();
  return (
    <div className="p-4">
      <h1 className="text-xl font-bold">Resepti ID: {id}</h1>
      {/* Load recipe details here */}
    </div>
  );
}
