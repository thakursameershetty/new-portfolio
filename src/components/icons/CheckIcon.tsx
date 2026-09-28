// check - animated tick, after Animate UI's Check icon (animate-ui.com, MIT): drawn on the
// framer-motion the site already uses, and without its icon wrapper. It draws itself in with
// a small pop each time it mounts, and just appears with reduced motion.
"use client";

import { motion, useReducedMotion } from "framer-motion";

export function CheckIcon({ size = 20, className }: { size?: number; className?: string }) {
  const reduced = useReducedMotion();

  return (
    <motion.svg
      aria-hidden="true"
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.4}
      strokeLinecap="round"
      strokeLinejoin="round"
      initial={reduced ? false : { scale: 1 }}
      animate={reduced ? undefined : { scale: [1, 1.18, 1] }}
      transition={{ duration: 0.6, ease: "easeInOut" }}
    >
      <motion.path
        d="m4 12 5 5L20 6"
        initial={reduced ? false : { pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.45, ease: "easeInOut" }}
      />
    </motion.svg>
  );
}
