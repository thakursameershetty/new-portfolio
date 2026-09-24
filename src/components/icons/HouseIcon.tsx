// house - from AnimateIcons / Lucide (https://animateicons.in)
// Author: Avijit Dey (@avijit07x)
// License: MIT. Source: https://github.com/Avijit07x/animateicons
// Adapted: imports from framer-motion, and animates when its parent calls the handle (the
// nav link's hover) rather than on its own hover.
"use client";

import { forwardRef, useImperativeHandle } from "react";
import {
  LazyMotion,
  domMin,
  m,
  useAnimation,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import type { AnimatedIconHandle } from "./types";

interface HouseIconProps {
  size?: number;
  duration?: number;
  className?: string;
}

const houseVariants = (duration: number): Variants => ({
  normal: { scale: 1 },
  animate: {
    scale: [0.7, 1.06, 0.98, 1],
    transition: {
      duration: 0.55 * duration,
      times: [0, 0.55, 0.8, 1],
      ease: "easeOut",
    },
  },
});

const doorVariants = (duration: number): Variants => ({
  normal: { scaleY: 1, opacity: 1 },
  animate: {
    scaleY: [0, 1],
    opacity: [0, 1],
    transition: {
      duration: 0.3 * duration,
      delay: 0.35 * duration,
      ease: "easeOut",
    },
  },
});

export const HouseIcon = forwardRef<AnimatedIconHandle, HouseIconProps>(
  ({ size = 24, duration = 1, className }, ref) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();

    useImperativeHandle(ref, () => ({
      startAnimation: () => controls.start(reduced ? "normal" : "animate"),
      stopAnimation: () => controls.start("normal"),
    }));

    return (
      <LazyMotion features={domMin} strict>
        <m.svg
          aria-hidden="true"
          className={className}
          xmlns="http://www.w3.org/2000/svg"
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          animate={controls}
          initial="normal"
        >
          <m.g
            variants={houseVariants(duration)}
            style={{ transformBox: "view-box", originX: "12px", originY: "21px" }}
          >
            <path d="M3 10a2 2 0 0 1 .709-1.528l7-5.999a2 2 0 0 1 2.582 0l7 5.999A2 2 0 0 1 21 10" />
            <path d="M21 10v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-9" />
            <m.path
              d="M15 21v-8a1 1 0 0 0-1-1h-4a1 1 0 0 0-1 1v8"
              variants={doorVariants(duration)}
              style={{ transformBox: "view-box", originX: "12px", originY: "21px" }}
            />
          </m.g>
        </m.svg>
      </LazyMotion>
    );
  },
);

HouseIcon.displayName = "HouseIcon";
