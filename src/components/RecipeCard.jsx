// RecipeCard.jsx

export default function RecipeCard({ title, subtitle, image }) {
  return (
    <div className="rounded overflow-hidden shadow-sm">
      <div className="h-40 w-full bg-gray-200 dark:bg-gray-800">
        <img
          src={image}
          alt={title}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="p-2">
        <div className="font-semibold truncate">{title}</div>
        <div className="text-sm text-gray-500 dark:text-gray-400">{subtitle}</div>
      </div>
    </div>
  );
}
