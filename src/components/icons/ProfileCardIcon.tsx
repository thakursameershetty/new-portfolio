// Profile card icon, drawn for this site in the style of the Lucide-based nav icons: a card
// with an avatar on the left and lines of text on the right. When played, the card pops in,
// the avatar rises into place, then the text lines draw in one after another.
"use client";

import { forwardRef, useImperativeHandle } from "react";
import {
  motion,
  useAnimation,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import type { AnimatedIconHandle } from "./types";

interface ProfileCardIconProps {
  size?: number;
  className?: string;
}

const cardVariants: Variants = {
  normal: { scale: 1 },
  animate: {
    scale: [0.85, 1.06, 0.98, 1],
    transition: { duration: 0.5, times: [0, 0.55, 0.8, 1], ease: "easeOut" },
  },
};

const avatarVariants: Variants = {
  normal: { opacity: 1, y: 0 },
  animate: {
    opacity: [0, 1],
    y: [2, 0],
    transition: { duration: 0.3, delay: 0.15, ease: "easeOut" },
  },
};

const lineVariants: Variants = {
  normal: { pathLength: 1, opacity: 1 },
  animate: (i: number) => ({
    pathLength: [0, 1],
    opacity: [0, 1],
    transition: {
      duration: 0.25,
      delay: 0.3 + i * 0.08,
      ease: "easeOut",
      opacity: { duration: 0.05, delay: 0.3 + i * 0.08 },
    },
  }),
};

const textLines = ["M13.5 9h5", "M13.5 12h5", "M13.5 15h3"];

export const ProfileCardIcon = forwardRef<AnimatedIconHandle, ProfileCardIconProps>(
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
      >
        <motion.g
          animate={controls}
          initial="normal"
          variants={cardVariants}
          style={{ transformBox: "view-box", originX: "12px", originY: "12px" }}
        >
          <rect x="2" y="4" width="20" height="16" rx="3" />
          <motion.g animate={controls} initial="normal" variants={avatarVariants}>
            <circle cx="8" cy="10" r="2.4" />
            <path d="M4.5 16.5a3.5 3.5 0 0 1 7 0" />
          </motion.g>
          {textLines.map((d, index) => (
            <motion.path
              key={d}
              d={d}
              animate={controls}
              initial="normal"
              variants={lineVariants}
              custom={index}
            />
          ))}
        </motion.g>
      </svg>
    );
  },
);

ProfileCardIcon.displayName = "ProfileCardIcon";
