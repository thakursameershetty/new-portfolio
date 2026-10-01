// threads - the Threads "@" glyph (from its brand mark). On the key's hover it traces its
// outline and the fill floods back in; it respects reduced motion, like the site's other icons.
"use client";

import { forwardRef, useImperativeHandle } from "react";
import {
  motion,
  useAnimation,
  useReducedMotion,
  type Variants,
} from "framer-motion";
import type { AnimatedIconHandle } from "./types";

interface ThreadsIconProps {
  size?: number;
  className?: string;
}

const traceVariants: Variants = {
  normal: {
    pathLength: 1,
    fillOpacity: 1,
    strokeOpacity: 0,
  },
  animate: {
    pathLength: [0, 1],
    fillOpacity: [0, 0, 1],
    strokeOpacity: [1, 1, 0],
    transition: { duration: 0.9, ease: "easeInOut", times: [0, 0.6, 1] },
  },
};

export const ThreadsIcon = forwardRef<AnimatedIconHandle, ThreadsIconProps>(
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
        height={size}
        viewBox="-12 -12 346 400"
        width={size}
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          animate={controls}
          initial="normal"
          variants={traceVariants}
          fill="currentColor"
          stroke="currentColor"
          strokeWidth="16"
          strokeLinejoin="round"
          d="M267.149,173.742c-.469-54.261-29.885-86.958-79.575-86.958-33.166,0-61.058,15.001-75.708,38.909l32.111,22.384c8.321-13.126,19.806-24.025,40.901-24.025,23.791,0,36.096,13.243,39.612,37.854-11.485-1.758-22.97-2.695-34.807-2.695-64.223,0-94.459,29.064-94.459,67.504,0,39.143,30.236,62.113,74.77,62.113,48.87,0,78.052-32.932,90.005-73.715,12.423,5.625,20.978,18.751,20.978,38.44,0,52.738-60.824,81.45-112.39,81.45-76.059,0-125.75-49.925-125.75-131.141,0-99.498,65.746-163.252,154.111-163.252,59.301,0,88.599,26.017,108.522,60.941l32.815-22.97C316.605,33.342,268.204.997,195.543.997,79.755.997,1,83.15,1,202.337c0,108.991,77.114,172.276,168.995,172.276,75.942,0,152.705-44.3,152.705-120.125,0-39.612-22.736-65.863-55.55-80.747ZM168.588,249.332c-16.759,0-31.525-7.969-31.525-22.619,0-23.087,28.361-30.119,56.136-30.119,10.548,0,20.861.703,30.002,2.696-6.563,30.002-26.017,50.042-54.613,50.042Z"
        />
      </svg>
    );
  },
);

ThreadsIcon.displayName = "ThreadsIcon";
