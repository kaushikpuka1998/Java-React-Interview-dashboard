import { motion } from 'framer-motion';
import './NotFound.css';

// Sketch draw-on for each stroke: line draws itself, then a subtle settle.
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

/**
 * Contained 404 / empty state for the reader (QA) section.
 * Hand-drawn sketch icon that draws itself in, with a gentle float.
 */
const NotFound = ({
  title = 'Nothing to read here',
  message = 'Pick a question from the sidebar to start reading.',
}) => {
  return (
    <div className="nf-wrap">
      <motion.div
        className="nf-float"
        animate={{ y: [0, -10, 0] }}
        transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      >
        {/* Sketch-style icon: a lost document with a magnifying glass */}
        <motion.svg
          className="nf-sketch"
          viewBox="0 0 220 200"
          initial="hidden"
          animate="visible"
          fill="none"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* paper */}
          <motion.path variants={draw} custom={0}
            d="M55 40 h70 l25 25 v95 a6 6 0 0 1 -6 6 h-89 a6 6 0 0 1 -6 -6 v-114 a6 6 0 0 1 6 -6 z" />
          {/* folded corner */}
          <motion.path variants={draw} custom={1} d="M125 40 v25 h25" />
          {/* text lines */}
          <motion.path variants={draw} custom={2} d="M70 95 h60" />
          <motion.path variants={draw} custom={2.4} d="M70 112 h60" />
          <motion.path variants={draw} custom={2.8} d="M70 129 h35" />
          {/* big 404 mark */}
          <motion.path variants={draw} custom={3.4}
            d="M150 120 m-34 0 a34 34 0 1 0 68 0 a34 34 0 1 0 -68 0" />
          <motion.path variants={draw} custom={4}
            d="M150 104 v20 M150 136 v0.5" />
          {/* magnifier handle */}
          <motion.path variants={draw} custom={4.4} d="M182 152 l22 22" />
        </motion.svg>
      </motion.div>

      <motion.div
        className="nf-text"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5, duration: 0.6 }}
      >
        <div className="nf-code">404</div>
        <h2 className="nf-title">{title}</h2>
        <p className="nf-desc">{message}</p>
      </motion.div>
    </div>
  );
};

export default NotFound;
