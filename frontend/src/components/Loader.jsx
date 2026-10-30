import { motion } from 'framer-motion'

// One loading indicator for every page: the Interview Reader badge pulses while three dots bounce in turn.
// `compact` is the small inline version for panels and lists; the default is sized for a whole page.
export default function Loader({ label = 'Loading…', compact = false }) {
  const badge = compact ? 'h-8 w-8 text-xs rounded-lg' : 'h-14 w-14 text-base rounded-2xl'
  return (
    <div role="status" aria-live="polite" className={`flex flex-col items-center justify-center gap-3 text-slate-500 dark:text-slate-400 ${compact ? 'py-6' : 'min-h-[40vh] py-12'}`}>
      <motion.div
        className={`flex items-center justify-center bg-gradient-to-br from-blue-500 to-indigo-600 font-bold text-white shadow-lg shadow-blue-500/30 ${badge}`}
        animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
        transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
      >
        IR
      </motion.div>
      <div className="flex items-center gap-1.5" aria-hidden="true">
        {[0, 1, 2].map(i => (
          <motion.span
            key={i}
            className="h-2 w-2 rounded-full bg-blue-500"
            animate={{ y: [0, -7, 0], opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15, ease: 'easeInOut' }}
          />
        ))}
      </div>
      <p className={compact ? 'text-xs' : 'text-sm'}>{label}</p>
    </div>
  )
}
