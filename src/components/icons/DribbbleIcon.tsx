// dribbble - animated Lucide-style icon, drawn from the MIT-licensed Lucide "dribbble" glyph
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

interface DribbbleIconProps {
  size?: number;
  className?: string;
}

// The ball gives a spin, like one bounced off the floor.
const spinVariants: Variants = {
  normal: { rotate: 0, transition: { duration: 0 } },
  animate: {
    rotate: [0, 360],
    transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] },
  },
};

export const DribbbleIcon = forwardRef<AnimatedIconHandle, DribbbleIconProps>(
  ({ size = 24, className }, ref) => {
    const controls = useAnimation();
    const reduced = useReducedMotion();

    useImperativeHandle(ref, () => ({
      startAnimation: () => controls.start(reduced ? "normal" : "animate"),
      stopAnimation: () => controls.start("normal"),
    }));

    return (
      <motion.svg
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
        animate={controls}
        initial="normal"
        variants={spinVariants}
      >
        <circle cx="12" cy="12" r="10" />
        <path d="M19.13 5.09C15.22 9.14 10 10.44 2.25 10.94" />
        <path d="M21.75 12.84c-6.62-1.41-12.14 1-16.38 6.32" />
        <path d="M8.56 2.75c4.37 6 6 9.42 8 17.72" />
      </motion.svg>
    );
  },
);

DribbbleIcon.displayName = "DribbbleIcon";
