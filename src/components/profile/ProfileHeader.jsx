export default function ProfileHeader({ profile, isOwner, stats }) {
  const display = profile.username || profile.email;
  const initials = (profile.username || profile.email || 'U?')
    .slice(0, 2)
    .toUpperCase();

  const joined = new Date(profile.created_at).toLocaleDateString();

  return (
    <section className="flex items-center gap-4">
      {/* Avatar */}
      {profile.avatar_url ? (
        <img
          src={profile.avatar_url}
          alt={display}
          className="h-16 w-16 rounded-full object-cover ring-2 ring-gray-200 dark:ring-gray-700"
        />
      ) : (
        <div className="h-16 w-16 rounded-full bg-blue-600 text-white grid place-items-center text-lg font-bold">
          {initials}
        </div>
      )}

      {/* Info */}
      <div className="flex-1">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
          {display}
        </h1>
        <p className="text-sm text-gray-600 dark:text-gray-300">
          Joined {joined}
        </p>
        {profile.bio && (
          <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">
            {profile.bio}
          </p>
        )}
      </div>

      {/* Stats */}
      <div className="flex items-center gap-6 text-sm">
        <div className="text-gray-800 dark:text-gray-200">
          <span className="font-semibold">{stats.recipes}</span> Recipes
        </div>
        <div className="text-gray-800 dark:text-gray-200">
          <span className="font-semibold">{stats.favorites}</span> Favorites
        </div>
        {isOwner && (
          <a
            href="/create"
            className="rounded-lg bg-blue-600 text-white px-3 py-2 hover:bg-blue-700"
          >
            Create
          </a>
        )}
      </div>
    </section>
  );
}
