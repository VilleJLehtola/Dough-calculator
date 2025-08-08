import { Link, useNavigate } from 'react-router-dom';
import supabase from '../supabaseClient';
import { useEffect, useState } from 'react';

export default function Sidebar({ isOpen, setIsOpen }) {
  const [session, setSession] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/');
    window.location.reload();
  };

  return (
    <aside
      className={`fixed z-50 inset-y-0 left-0 transform bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 w-64 p-4 transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}
    >
      <h1 className="text-xl font-semibold mb-6">Everything dough</h1>

      <nav className="space-y-4 text-sm">
        <div className="text-gray-500 uppercase">Discover</div>
        <ul className="space-y-2">
          <li><Link to="/" onClick={() => setIsOpen(false)}>🏠 Home</Link></li>
          <li><Link to="/calculator" onClick={() => setIsOpen(false)}>📟 Calculator</Link></li>
        </ul>

        <div className="text-gray-500 uppercase mt-6">Library</div>
        <ul className="space-y-2">
          <li><Link to="/favorites" onClick={() => setIsOpen(false)}>⭐ Favorites</Link></li>
          <li><Link to="/admin" onClick={() => setIsOpen(false)}>🛠️ Admin</Link></li>
        </ul>
      </nav>

      <div className="mt-10">
        {session ? (
          <button
            onClick={handleLogout}
            className="text-sm text-red-400 hover:text-red-600"
          >
            🚪 Log out
          </button>
        ) : (
          <Link to="/login" onClick={() => setIsOpen(false)} className="text-sm text-green-500">
            🔑 Log in
          </Link>
        )}
      </div>
    </aside>
  );
}
