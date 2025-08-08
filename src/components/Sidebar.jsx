// Sidebar.jsx

export default function Sidebar() {
  return (
    <aside className="hidden md:flex flex-col w-60 p-4 border-r border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
      <h1 className="text-xl font-semibold mb-6">Everything dough</h1>

      <nav className="space-y-4 text-sm">
        <div className="text-gray-500 uppercase">Discover</div>
        <ul className="space-y-2">
          <li>🏠 Home</li>
          <li>🔍 Browse</li>
          <li>📟 Calculator</li>
        </ul>

        <div className="text-gray-500 uppercase mt-6">Library</div>
        <ul className="space-y-2">
          <li>📋 Your recipes</li>
          <li>🎵 Favorites</li>
          <li>🙂 Your profile</li>
        </ul>
      </nav>

      <div className="mt-auto pt-4">
        <button className="w-full flex items-center justify-center bg-gray-300 dark:bg-gray-700 p-2 rounded-full">
          🌙 Dark mode
        </button>
      </div>
    </aside>
  );
}
