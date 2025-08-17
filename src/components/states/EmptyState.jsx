export default function EmptyState({
  title = 'Nothing here yet',
  children = null,
  icon = null,
}) {
  return (
    <div className="text-center py-12 text-gray-600 dark:text-gray-300">
      {icon ? <div className="mb-3 inline-block opacity-80">{icon}</div> : null}
      <div className="text-lg font-medium">{title}</div>
      {children ? (
        <div className="mt-2 text-sm opacity-90">{children}</div>
      ) : null}
    </div>
  );
}
