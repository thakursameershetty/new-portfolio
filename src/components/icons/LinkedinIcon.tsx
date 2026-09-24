// linkedin - animated Lucide-style icon (pasted without a source header; the code matches
// the MIT-licensed lucide-animated set, https://lucide-animated.com)
// Adapted: imports from framer-motion, animates when its parent calls the handle (the key's
// hover), and respects reduced motion, like the site's other icons.
"use client";

import { forwardRef, useImperativeHandle } from "react";
import {
  motion,
  useAnimation,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import type { AnimatedIconHandle } from "./types";

interface LinkedinIconProps {
  size?: number;
  className?: string;
}

// Each stroke draws itself in: the "n", the stem, then the dot.
const drawVariants: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
    pathOffset: 0,
    transition: { duration: 0.4, opacity: { duration: 0.1 } },
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    pathOffset: [1, 0],
    transition: { duration: 0.6, ease: "linear", opacity: { duration: 0.1 } },
  },
};

export const LinkedinIcon = forwardRef<AnimatedIconHandle, LinkedinIconProps>(
  ({ size = 24, className }, ref) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();

    useImperativeHandle(ref, () => ({
      startAnimation: () => controls.start(reduced ? "normal" : "animate"),
      stopAnimation: () => controls.start("normal"),
    }));

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
        <motion.path
          animate={controls}
          initial="normal"
          variants={drawVariants}
          d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"
        />
        <motion.rect
          animate={controls}
          initial="normal"
          variants={drawVariants}
          height="12"
          width="4"
          x="2"
          y="9"
        />
        <motion.circle
          animate={controls}
          initial="normal"
          variants={drawVariants}
          cx="4"
          cy="4"
          r="2"
        />
      </svg>
    );
  },
);

LinkedinIcon.displayName = "LinkedinIcon";
