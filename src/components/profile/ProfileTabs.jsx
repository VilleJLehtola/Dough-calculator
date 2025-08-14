export default function ProfileTabs({ tab, onChange, isOwner }) {
  const tabs = [
    { key: 'recipes', label: 'Recipes' },
    { key: 'favorites', label: 'Favorites' },
    ...(isOwner ? [{ key: 'settings', label: 'Settings' }] : []),
  ];

  return (
    <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
      {tabs.map(t => (
        <button
          key={t.key}
          onClick={() => onChange(t.key)}
          className={`px-4 py-2 rounded-t-md ${
            tab === t.key
              ? 'bg-blue-600 text-white'
              : 'text-gray-700 dark:text-gray-300 hover:bg-blue-50 dark:hover:bg-gray-800'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
