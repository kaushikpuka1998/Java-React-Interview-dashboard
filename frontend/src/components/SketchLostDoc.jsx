import { motion } from 'framer-motion';

// Sketch draw-on: each stroke draws itself in sequence, then a subtle settle.
const draw = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: (i = 1) => ({
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: { delay: i * 0.25, duration: 1.1, ease: 'easeInOut' },
      opacity: { delay: i * 0.25, duration: 0.2 },
    },
  }),
};

// Ordered strokes for the "lost document + magnifier" icon. Each entry draws
// after the previous (custom = delay index), giving the hand-sketched feel.
const strokes = [
  // paper outline
  { d: 'M55 40 h70 l25 25 v95 a6 6 0 0 1 -6 6 h-89 a6 6 0 0 1 -6 -6 v-114 a6 6 0 0 1 6 -6 z', at: 0 },
  // folded corner
  { d: 'M125 40 v25 h25', at: 1 },
  // text lines
  { d: 'M70 95 h60', at: 2 },
  { d: 'M70 112 h60', at: 2.4 },
  { d: 'M70 129 h35', at: 2.8 },
  // magnifier ring (the "404" lens)
  { d: 'M150 120 m-34 0 a34 34 0 1 0 68 0 a34 34 0 1 0 -68 0', at: 3.4 },
  // question mark inside the lens
  { d: 'M150 104 v20 M150 136 v0.5', at: 4 },
  // magnifier handle
  { d: 'M182 152 l22 22', at: 4.4 },
];

/**
 * Hand-drawn "lost document" sketch that animates itself in.
 * Inherits color via `currentColor` so it adapts to light/dark themes.
 */
export default function SketchLostDoc({ className = 'nf-sketch' }) {
  return (
    <motion.svg
      className={className}
      viewBox="0 0 220 200"
      initial="hidden"
      animate="visible"
      fill="none"
      stroke="currentColor"
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {strokes.map((s, i) => (
        <motion.path key={i} variants={draw} custom={s.at} d={s.d} />
      ))}
    </motion.svg>
  );
}
