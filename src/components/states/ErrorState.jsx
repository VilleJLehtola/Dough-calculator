export default function ErrorState({
  title = 'Something went wrong',
  detail = '',
  action = null,         // e.g. a Retry button
}) {
  return (
    <div className="text-center py-12 text-red-600 dark:text-red-400">
      <div className="text-lg font-medium">{title}</div>
      {detail ? (
        <div className="mt-1 text-sm opacity-90 max-w-xl mx-auto break-words">
          {detail}
        </div>
      ) : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}
