import { motion } from 'framer-motion'

// Shown while the reader waits for its first question: a pulsing badge, a shimmer
// sweeping over skeleton lines, and bouncing dots. Keeps the 404 state from flashing.
const bar = 'relative overflow-hidden rounded bg-slate-200 dark:bg-slate-700'
const shimmer = { x: ['-100%', '100%'] }

export default function ReaderLoading() {
  return (
    <div role="status" aria-live="polite" className="w-full max-w-2xl px-6 flex flex-col items-center gap-7">
      <motion.div
        className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold shadow-lg shadow-blue-500/30"
        animate={{ scale: [1, 1.08, 1], rotate: [0, 4, -4, 0] }}
        transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }}
      >
        IR
      </motion.div>

      <div className="w-full space-y-3">
        {[
          { w: 'w-3/4', h: 'h-6', d: 0 },
          { w: 'w-full', h: 'h-4', d: 0.15 },
          { w: 'w-11/12', h: 'h-4', d: 0.3 },
          { w: 'w-2/3', h: 'h-4', d: 0.45 },
        ].map((l, i) => (
          <motion.div
            key={i}
            className={`${bar} ${l.w} ${l.h}`}
            initial={{ opacity: 0.4 }}
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.6, repeat: Infinity, delay: l.d, ease: 'easeInOut' }}
          >
            <motion.span
              className="absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-white/10"
              animate={shimmer}
              transition={{ duration: 1.4, repeat: Infinity, delay: l.d, ease: 'linear' }}
            />
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
        <span>Loading question</span>
        {[0, 0.15, 0.3].map((d, i) => (
          <motion.span
            key={i}
            className="inline-block h-1.5 w-1.5 rounded-full bg-blue-500"
            animate={{ y: [0, -5, 0] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: d, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <span className="sr-only">Loading question…</span>
    </div>
  )
}
