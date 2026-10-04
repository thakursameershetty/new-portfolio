// chart-bar-increasing - from the Lucide Animated icons, rewritten in this site's style
// (framer-motion, the shared AnimatedIconHandle, played by its key's hover): an axis with
// three bars, shortest to longest, that wipe away and draw back in one after another.
"use client";

import { forwardRef, useImperativeHandle } from "react";
import {
  motion,
  useAnimation,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import type { AnimatedIconHandle } from "./types";

interface ChartBarIncreasingIconProps {
  size?: number;
  className?: string;
}

const barVariants: Variants = {
  normal: { pathLength: 1, opacity: 1, transition: { duration: 0.2 } },
  animate: (i: number) => ({
    pathLength: [1, 0, 1],
    opacity: [1, 0, 1],
    transition: { delay: i * 0.1, duration: 0.6, times: [0, 0.5, 1] },
  }),
};

// The bars, shortest first: the order they go and come back in.
const bars = ["M7 6h3", "M7 11h8", "M7 16h12"];

export const ChartBarIncreasingIcon = forwardRef<
  AnimatedIconHandle,
  ChartBarIncreasingIconProps
>(({ size = 24, className }, ref) => {
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
      <path d="M3 3v16a2 2 0 0 0 2 2h16" />
      {bars.map((d, i) => (
        <motion.path
          key={d}
          animate={controls}
          custom={i}
          d={d}
          variants={barVariants}
        />
      ))}
    </svg>
  );
});

ChartBarIncreasingIcon.displayName = "ChartBarIncreasingIcon";
