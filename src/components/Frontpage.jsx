// Frontpage.jsx

import Sidebar from "./Sidebar";
import Header from "./Header";
import RecipeCard from "./RecipeCard";

export default function Frontpage() {
  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-900 text-gray-900 dark:text-white">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        <Header />

        <main className="p-6 space-y-12">
          {/* Tabs */}
          <div className="flex gap-2">
            <button className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-full text-sm">Tab</button>
            <button className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-full text-sm">Tab</button>
            <button className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-full text-sm">Tab</button>
          </div>

          {/* Latest recipes */}
          <section>
            <h2 className="text-2xl font-bold">Latest recipes</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Latest admin added recipes</p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {[1, 2, 3, 4].map((id) => (
                <RecipeCard
                  key={id}
                  title={`Recipe ${id}`}
                  subtitle="Description of recipe"
                  image={`/img/recipe${id}.jpg`} // Replace with real image
                />
              ))}
            </div>
          </section>

          {/* Most liked recipes */}
          <section>
            <h2 className="text-2xl font-bold">Most liked recipes</h2>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Most liked community recipes</p>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {[1, 2, 3, 4, 5, 6].map((id) => (
                <RecipeCard
                  key={id}
                  title="Recipe sam1"
                  subtitle={`user ${id}`}
                  image={`/img/user${id}.jpg`} // Replace with real image
                />
              ))}
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}
