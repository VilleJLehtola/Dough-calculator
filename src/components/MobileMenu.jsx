// MobileMenu.jsx

export default function MobileMenu({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 z-50">
      <div className="absolute top-0 left-0 w-64 h-full bg-white dark:bg-gray-900 p-4 shadow-md">
        <button onClick={onClose} className="mb-4 text-right w-full text-lg">✕</button>

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
      </div>
    </div>
  );
}
