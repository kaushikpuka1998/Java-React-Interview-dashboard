import { useId } from 'react'

// Metallic hexagon badge per league: a gold, platinum, silver or bronze rim around a dark centre.
const TIERS = {
  Platinum: { stops: ['#ecfeff', '#67e8f9', '#0e7490', '#cffafe'], text: '#cffafe' },
  Gold: { stops: ['#fef3c7', '#f59e0b', '#92400e', '#fde68a'], text: '#fde68a' },
  Silver: { stops: ['#f8fafc', '#cbd5e1', '#64748b', '#e2e8f0'], text: '#e2e8f0' },
  Bronze: { stops: ['#ffedd5', '#fb923c', '#7c2d12', '#fdba74'], text: '#fed7aa' },
  Unranked: { stops: ['#f1f5f9', '#94a3b8', '#334155', '#e2e8f0'], text: '#cbd5e1' },
}

const OUTER = '50,2 96,28 96,82 50,108 4,82 4,28'
const INNER = '50,11 88,33 88,77 50,99 12,77 12,33'

// size "md" shows the tier name; "sm" (lists) and "xs" (compact profile row) show just the initial to stay legible.
export default function LeagueBadge({ league = 'Unranked', size = 'md' }) {
  const id = useId()
  const tier = TIERS[league] || TIERS.Unranked
  const label = league === 'Unranked' ? '—' : league.toUpperCase()
  const dims = size === 'sm' ? 'w-6 h-[27px]' : size === 'xs' ? 'w-8 h-9' : 'w-14 h-16'
  const initialOnly = size === 'sm' || size === 'xs'
  return (
    <span role="img" aria-label={`${league} league`} title={`${league} league`} className={`inline-block align-middle ${dims} drop-shadow-md`}>
      <svg viewBox="0 0 100 110" className="h-full w-full" aria-hidden="true">
        <defs>
          <linearGradient id={`${id}-rim`} x1="0" y1="0" x2="1" y2="1">
            {tier.stops.map((c, i) => <stop key={i} offset={`${(i / (tier.stops.length - 1)) * 100}%`} stopColor={c} />)}
          </linearGradient>
        </defs>
        <polygon points={OUTER} fill={`url(#${id}-rim)`} />
        <polygon points={INNER} fill="#1e293b" />
        {initialOnly ? (
          <text x="50" y="66" textAnchor="middle" fontSize="46" fontWeight="700" fill={tier.text} fontFamily="ui-sans-serif, system-ui">{league[0]}</text>
        ) : (
          <>
            <text x="50" y="50" textAnchor="middle" fontSize="20" fill={tier.text}>★</text>
            <text x="50" y="74" textAnchor="middle" fontSize="11" fontWeight="700" letterSpacing="1" fill={tier.text} fontFamily="ui-sans-serif, system-ui">{label}</text>
          </>
        )}
      </svg>
    </span>
  )
}
