// Shared badge styling for tech and difficulty, so the reader, profile and any
// future list all colour them the same way.

const TECH_BADGE = {
  java: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300',
  react: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300',
  node: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  sql: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
  hld: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300',
  golang: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
  kafka: 'bg-slate-200 text-slate-800 dark:bg-slate-700/50 dark:text-slate-200',
  microservices: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  'design-patterns': 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
}

const DIFFICULTY_BADGE = {
  Basic: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  Intermediate: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  Advanced: 'bg-rose-100 text-rose-700 dark:bg-rose-900/30 dark:text-rose-300',
  Experienced: 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300',
}

const NEUTRAL = 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'

export const techBadge = (tech) => TECH_BADGE[tech] || NEUTRAL
export const difficultyBadge = (d) => DIFFICULTY_BADGE[d] || NEUTRAL

/** Display name for a tech slug: "hld" -> "HLD", "design-patterns" -> "Design Patterns". */
export function techLabel(tech) {
  if (!tech) return ''
  if (tech === 'hld') return 'HLD'
  if (tech === 'sql') return 'SQL'
  if (tech === 'golang') return 'Go'
  return tech.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')
}
