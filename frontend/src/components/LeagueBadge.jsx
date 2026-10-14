// League tier pill. Colours go from grey (unranked) up to cyan (platinum).
const STYLE = {
  Platinum: 'bg-cyan-100 text-cyan-800 ring-cyan-300 dark:bg-cyan-500/15 dark:text-cyan-300 dark:ring-cyan-500/40',
  Gold: 'bg-amber-100 text-amber-800 ring-amber-300 dark:bg-amber-500/15 dark:text-amber-300 dark:ring-amber-500/40',
  Silver: 'bg-slate-200 text-slate-700 ring-slate-300 dark:bg-slate-400/15 dark:text-slate-200 dark:ring-slate-400/40',
  Bronze: 'bg-orange-100 text-orange-800 ring-orange-300 dark:bg-orange-500/15 dark:text-orange-300 dark:ring-orange-500/40',
  Unranked: 'bg-slate-100 text-slate-500 ring-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:ring-slate-700',
}

export default function LeagueBadge({ league = 'Unranked' }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1 ${STYLE[league] || STYLE.Unranked}`}>
      {league}
    </span>
  )
}
