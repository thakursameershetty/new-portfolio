// document - drawn for this site, in the style of the Heroicons Animated nav icons: a page
// with a folded corner whose lines of text write themselves in, one after another.
"use client";

import { forwardRef, useImperativeHandle } from "react";
import {
  motion,
  useAnimation,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import type { AnimatedIconHandle } from "./types";

interface DocumentIconProps {
  size?: number;
  className?: string;
}

const lineVariants: Variants = {
  normal: { pathLength: 1, opacity: 1, transition: { duration: 0.2 } },
  animate: (i: number) => ({
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: {
      delay: 0.1 + i * 0.12,
      duration: 0.25,
      opacity: { duration: 0.05, delay: 0.1 + i * 0.12 },
    },
  }),
};

export const DocumentIcon = forwardRef<AnimatedIconHandle, DocumentIconProps>(
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
        <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
        <path d="M14 3v5h5" />
        {["M9 11h6", "M9 14.5h6", "M9 18h3.5"].map((d, i) => (
          <motion.path
            key={d}
            animate={controls}
            custom={i}
            d={d}
            variants={lineVariants}
          />
        ))}
      </svg>
    );
  },
);

DocumentIcon.displayName = "DocumentIcon";
