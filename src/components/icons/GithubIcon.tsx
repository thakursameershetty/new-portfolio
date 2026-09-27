// github - animated Lucide-style icon, drawn from the MIT-licensed Lucide "github" glyph
// (https://lucide.dev), animated like LinkedinIcon: the parent calls the handle (the key's
// hover), and it respects reduced motion, like the site's other icons.
"use client";

import { forwardRef, useImperativeHandle } from "react";
import {
  motion,
  useAnimation,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import type { AnimatedIconHandle } from "./types";

interface GithubIconProps {
  size?: number;
  className?: string;
}

// The cat draws itself in, then its tail.
const drawVariants: Variants = {
  normal: {
    opacity: 1,
    pathLength: 1,
    pathOffset: 0,
    transition: { duration: 0.4, opacity: { duration: 0.1 } },
  },
  animate: (delay: number = 0) => ({
    opacity: [0, 1],
    pathLength: [0, 1],
    pathOffset: [1, 0],
    transition: { duration: 0.6, delay, ease: "linear", opacity: { duration: 0.1, delay } },
  }),
};

export const GithubIcon = forwardRef<AnimatedIconHandle, GithubIconProps>(
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
          custom={0}
          d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"
        />
        <motion.path
          animate={controls}
          initial="normal"
          variants={drawVariants}
          custom={0.4}
          d="M9 18c-4.51 2-5-2-7-2"
        />
      </svg>
    );
  },
);

GithubIcon.displayName = "GithubIcon";
