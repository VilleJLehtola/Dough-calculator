import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-white/10 text-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="text-gray-500 dark:text-gray-400">
          © {new Date().getFullYear()} Everything dough
        </div>
        <nav className="flex items-center gap-4 text-gray-600 dark:text-gray-300">
          <Link className="hover:underline" to="/privacy">Privacy</Link>
          <Link className="hover:underline" to="/terms">Terms</Link>
          <Link className="hover:underline" to="/contact">Contact</Link>
        </nav>
      </div>
    </footer>
  );
}
