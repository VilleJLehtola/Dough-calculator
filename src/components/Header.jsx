export default function Header({ toggleSidebar }) {
  return (
    <header className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-800 md:hidden">
      <button onClick={toggleSidebar} className="text-2xl">☰</button>
      <h1 className="text-lg font-bold">Everything dough</h1>
    </header>
  );
}
