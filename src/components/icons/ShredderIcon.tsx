"use client";

import { useEffect } from "react";
import { motion, useAnimation, useReducedMotion, type Variants } from "framer-motion";

// A page going through a shredder: the paper shakes and its strips fall, again and again
// while it's active. From Lucide Animated (https://lucide-animated.com, by dmytro, MIT:
// github.com/pqoqubbw/icons), adapted: framer-motion in place of motion/react, no Tailwind,
// and played from outside (`active`) instead of on its own hover.

const paper: Variants = {
  normal: { x: 0 },
  animate: {
    x: [0, 1.5, -1.5, 1, -1, 0.5, -0.5, 0],
    transition: { duration: 1.5, ease: "easeInOut", repeat: Number.POSITIVE_INFINITY },
  },
};

const shred: Variants = {
  normal: { y: 0, opacity: 1 },
  animate: (delay: number) => ({
    y: 3,
    opacity: [0, 1, 0],
    transition: {
      repeat: Number.POSITIVE_INFINITY,
      duration: 1.5,
      ease: "easeInOut",
      delay: 0.2 * delay,
    },
  }),
};

export function ShredderIcon({ size = 24, active = false }: { size?: number; active?: boolean }) {
  const controls = useAnimation();
  const reduced = useReducedMotion();
  useEffect(() => {
    void controls.start(active && !reduced ? "animate" : "normal");
  }, [active, controls, reduced]);

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ overflow: "visible" }}
      aria-hidden="true"
    >
      <motion.g animate={controls} initial="normal" variants={paper}>
        <path d="M4 13V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.706.706l3.588 3.588A2.4 2.4 0 0 1 20 8v5" />
        <path d="M14 2v5a1 1 0 0 0 1 1h5" />
      </motion.g>
      <motion.path d="M10 22v-5" animate={controls} custom={0.2} initial="normal" variants={shred} />
      <motion.path d="M14 19v-2" animate={controls} custom={0.4} initial="normal" variants={shred} />
      <motion.path d="M18 20v-3" animate={controls} custom={0.6} initial="normal" variants={shred} />
      <path d="M2 13h20" />
      <motion.path d="M6 20v-3" animate={controls} custom={0} initial="normal" variants={shred} />
    </svg>
  );
}
