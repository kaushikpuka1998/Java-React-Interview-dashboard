/**
 * Small status badge showing whether the backend API is reachable.
 * Hover to see the API base URL being used.
 */
export default function BackendStatusBadge({ status, apiBase }) {
  const config = {
    connected: {
      label: 'Connected',
      dotClass: 'bg-emerald-500',
      textClass: 'text-emerald-700 dark:text-emerald-400',
      bgClass: 'bg-emerald-50 dark:bg-emerald-950/40',
    },
    disconnected: {
      label: 'Disconnected',
      dotClass: 'bg-red-500',
      textClass: 'text-red-700 dark:text-red-400',
      bgClass: 'bg-red-50 dark:bg-red-950/40',
    },
    loading: {
      label: 'Checking…',
      dotClass: 'bg-slate-400',
      textClass: 'text-slate-600 dark:text-slate-400',
      bgClass: 'bg-slate-100 dark:bg-slate-800/60',
    },
  }

  const { label, dotClass, textClass, bgClass } = config[status] || config.loading

  return (
    <div
      className={`flex-shrink-0 inline-flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${bgClass} ${textClass}`}
      title={`API: ${apiBase}`}
      aria-label={`Backend status: ${label}`}
    >
      {status === 'loading' ? (
        <span
          className="w-2.5 h-2.5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin"
          aria-hidden="true"
        />
      ) : (
        <span className={`w-2 h-2 rounded-full ${dotClass} ${status === 'connected' ? '' : ''}`} aria-hidden="true" />
      )}
      <span className="whitespace-nowrap">{label}</span>
    </div>
  )
}
