// layout dashboard - from AnimateIcons / Lucide (https://animateicons.in)
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

interface LayoutDashboardIconProps {
  size?: number;
  duration?: number;
  className?: string;
}

const iconVariants = (duration: number): Variants => ({
  normal: { scale: 1, rotate: 0 },
  animate: {
    scale: [1, 1.06, 0.98, 1],
    rotate: [0, -1.5, 1.5, 0],
    transition: { duration: 1.1 * duration, ease: "easeInOut" },
  },
});

const tileVariants = (duration: number): Variants => ({
  normal: { opacity: 1, scale: 1, y: 0 },
  animate: (i: number) => ({
    opacity: [0.6, 1],
    scale: [0.95, 1.04, 1],
    y: [3, -2, 0],
    transition: { duration: 0.9 * duration, ease: "easeInOut", delay: i * 0.08 },
  }),
});

const tiles = [
  { width: 7, height: 9, x: 3, y: 3 },
  { width: 7, height: 5, x: 14, y: 3 },
  { width: 7, height: 9, x: 14, y: 12 },
  { width: 7, height: 5, x: 3, y: 16 },
];

export const LayoutDashboardIcon = forwardRef<
  AnimatedIconHandle,
  LayoutDashboardIconProps
>(({ size = 24, duration = 0.6, className }, ref) => {
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
        variants={iconVariants(duration)}
      >
        {tiles.map((tile, index) => (
          <m.rect
            key={index}
            {...tile}
            rx="1"
            variants={tileVariants(duration)}
            custom={index}
            initial="normal"
            animate={controls}
          />
        ))}
      </m.svg>
    </LazyMotion>
  );
});

LayoutDashboardIcon.displayName = "LayoutDashboardIcon";
