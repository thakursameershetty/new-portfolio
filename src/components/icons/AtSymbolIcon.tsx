// at symbol - from Heroicons Animated (https://heroicons-animated.com)
// Author: Aniket Pawar (@aniket-508)
// License: MIT. Source: https://github.com/Aniket-508/heroicons-animated
// Adapted: imports from framer-motion, animates when its parent calls the handle (the nav
// link's hover) rather than on its own hover, respects reduced motion, and uses a 2px
// stroke to match the site's other nav icons.
"use client";

import { forwardRef, useImperativeHandle } from "react";
import {
  motion,
  useAnimation,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import type { AnimatedIconHandle } from "./types";

interface AtSymbolIconProps {
  size?: number;
  className?: string;
}

const circleVariants: Variants = {
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
    transition: { duration: 0.3, opacity: { duration: 0.1 } },
  },
};

const pathVariants: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
    transition: { delay: 0.3, duration: 0.3, opacity: { duration: 0.1, delay: 0.3 } },
  },
  animate: {
    opacity: [0, 1],
    pathLength: [0, 1],
    transition: { delay: 0.3, duration: 0.3, opacity: { duration: 0.1, delay: 0.3 } },
  },
};

export const AtSymbolIcon = forwardRef<AnimatedIconHandle, AtSymbolIconProps>(
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
        <motion.circle
          animate={controls}
          cx="12"
          cy="12"
          r="4.5"
          variants={circleVariants}
        />
        <motion.path
          animate={controls}
          d="M16.5 12c0 1.657 1.007 3 2.25 3S21 13.657 21 12a9 9 0 1 0-2.636 6.364M16.5 12V8.25"
          variants={pathVariants}
        />
      </svg>
    );
  },
);

AtSymbolIcon.displayName = "AtSymbolIcon";
