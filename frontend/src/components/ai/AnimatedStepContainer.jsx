import { motion } from "motion/react";

export default function AnimatedStepContainer({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -100 }}
    >
      {children}
    </motion.div>
  );
}
