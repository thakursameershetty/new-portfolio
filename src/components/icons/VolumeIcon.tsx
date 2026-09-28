// volume - animated Lucide-style icon (pasted without a source header; the code matches the
// MIT-licensed lucide-animated set, https://lucide-animated.com)
// Adapted: imports from framer-motion, and shows the sound state it's given (waves when on,
// a cross when muted), animating whenever that state changes, instead of reacting to hover.
"use client";

import { motion, useReducedMotion } from "framer-motion";

interface VolumeIconProps {
  /** True: speaker with sound waves. False: speaker with a cross. */
  on: boolean;
  size?: number;
  className?: string;
}

export function VolumeIcon({ on, size = 24, className }: VolumeIconProps) {
  const reduced = useReducedMotion();
  // With reduced motion the state still switches, just without the fades and drawing.
  const delay = (seconds: number) => (reduced ? 0 : seconds);

  return (
    <svg
      aria-hidden="true"
      className={className}
      fill="none"
      height={size}
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
      width={size}
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M11 4.702a.705.705 0 0 0-1.203-.498L6.413 7.587A1.4 1.4 0 0 1 5.416 8H3a1 1 0 0 0-1 1v6a1 1 0 0 0 1 1h2.416a1.4 1.4 0 0 1 .997.413l3.383 3.384A.705.705 0 0 0 11 19.298z" />
      {/* Both are always drawn, the waves for on and the cross for off, and each fades to
          its state. (Swapping them in and out with a presence animation could get stuck on
          the old one when the state changed twice in quick succession, as it does on load.) */}
      {/* The waves fade in one after the other, near to far. */}
      <motion.path
        d="M16 9a5 5 0 0 1 0 6"
        initial={false}
        animate={{ opacity: on ? 1 : 0 }}
        transition={{ delay: on ? delay(0.1) : 0, duration: delay(0.15) }}
      />
      <motion.path
        d="M19.364 18.364a9 9 0 0 0 0-12.728"
        initial={false}
        animate={{ opacity: on ? 1 : 0 }}
        transition={{ delay: on ? delay(0.2) : 0, duration: delay(0.15) }}
      />
      {/* The cross draws itself in, one stroke then the other. */}
      <motion.line
        x1="22"
        x2="16"
        y1="9"
        y2="15"
        initial={false}
        animate={{ pathLength: on ? 0 : 1, opacity: on ? 0 : 1 }}
        transition={{ delay: on ? 0 : delay(0.1), duration: delay(on ? 0.15 : 0.25) }}
      />
      <motion.line
        x1="16"
        x2="22"
        y1="9"
        y2="15"
        initial={false}
        animate={{ pathLength: on ? 0 : 1, opacity: on ? 0 : 1 }}
        transition={{ delay: on ? 0 : delay(0.2), duration: delay(on ? 0.15 : 0.25) }}
      />
    </svg>
  );
}
