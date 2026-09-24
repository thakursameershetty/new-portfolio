// map pin - from Animate UI (https://animate-ui.com), "default" animation
// License: MIT. Source: https://github.com/imskyleen/animate-ui
// Adapted: imports from framer-motion instead of Animate UI's icon wrapper, and animates when
// its parent calls the handle, like the site's other icons.
"use client";

import { forwardRef, useImperativeHandle } from "react";
import {
  motion,
  useAnimation,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import type { AnimatedIconHandle } from "./types";

interface MapPinIconProps {
  size?: number;
  className?: string;
}

// The pin crouches, hops up with a tilt, and lands back on its point.
const groupVariants: Variants = {
  normal: { scale: 1, rotate: 0, y: 0 },
  animate: {
    scale: [1, 0.75, 1, 1],
    rotate: [0, 30, -15, 0],
    y: [0, -6, 0, 0],
    transition: { ease: "easeInOut", duration: 1 },
  },
};

export const MapPinIcon = forwardRef<AnimatedIconHandle, MapPinIconProps>(
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
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ overflow: "visible" }}
      >
        <motion.g
          variants={groupVariants}
          initial="normal"
          animate={controls}
          style={{ transformBox: "view-box", originX: "12px", originY: "22px" }}
        >
          <circle cx="12" cy="10" r="3" />
          <path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0" />
        </motion.g>
      </svg>
    );
  },
);

MapPinIcon.displayName = "MapPinIcon";
