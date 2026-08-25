import { motion } from 'framer-motion';
import SketchLostDoc from './SketchLostDoc.jsx';
import './NotFound.css';

/**
 * Contained 404 / empty state for the reader (QA) section.
 * The hand-drawn icon lives in SketchLostDoc; this file owns layout + copy.
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
        <SketchLostDoc />
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
