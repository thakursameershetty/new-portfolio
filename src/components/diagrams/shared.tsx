"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { MaterialIcon } from "../icons/MaterialIcon";

// What the animated diagrams share: their colours, how they size and pause themselves, and
// the icons on their controls.

export const COLOR = {
  ground: "#0b0d0c",
  ink: "#f5f1ea",
  muted: "rgba(245, 241, 234, 0.55)",
  faint: "rgba(245, 241, 234, 0.16)",
  ok: "#9fe29a",
  bad: "#e54b45",
  quantum: "#b4a4f5",
  warm: "#f0c44c",
};

/** Wide (drawn left to right) once the box is 560px across; and whether it's on screen. */
export function useDiagramBox(ref: RefObject<HTMLElement | null>) {
  const [wide, setWide] = useState(true);
  const [onScreen, setOnScreen] = useState(false);
  useEffect(() => {
    const root = ref.current;
    if (!root) return;
    const resize = new ResizeObserver(([entry]) => {
      if (entry) setWide(entry.contentRect.width >= 560);
    });
    const view = new IntersectionObserver(([entry]) =>
      setOnScreen(Boolean(entry?.isIntersecting)),
    );
    resize.observe(root);
    view.observe(root);
    return () => {
      resize.disconnect();
      view.disconnect();
    };
  }, [ref]);
  return { wide, onScreen };
}

/** Calls `tick` with the seconds since the last frame, while `running`. */
export function useTicker(running: boolean, tick: (delta: number) => void) {
  const tickRef = useRef(tick);
  useEffect(() => {
    tickRef.current = tick;
  });
  useEffect(() => {
    if (!running) return;
    let frame = 0;
    let last = performance.now();
    const step = (now: number) => {
      // A long gap (a background tab) counts as one frame, not a jump.
      tickRef.current(Math.min(now - last, 100) / 1000);
      last = now;
      frame = requestAnimationFrame(step);
    };
    frame = requestAnimationFrame(step);
    return () => cancelAnimationFrame(frame);
  }, [running]);
}

/** A repeatable random number in [0, 1) for a seed, so every visit plays the same. */
export function seeded(seed: number) {
  let t = (seed * 0x9e3779b9 + 0x6d2b79f5) >>> 0;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export const ease = (x: number) =>
  x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;

// Back and forward are drawn here; the rest are Material Symbols.
const STEPS = {
  prev: <path d="M10 3.5 5.5 8l4.5 4.5" />,
  next: <path d="M6 3.5 10.5 8 6 12.5" />,
};

const MATERIAL = {
  play: "play",
  pause: "pause",
  expand: "zoom",
  reset: "replay",
} as const;

export function ControlIcon({
  name,
}: {
  name: keyof typeof STEPS | keyof typeof MATERIAL;
}) {
  if (name === "prev" || name === "next") {
    return (
      <svg viewBox="0 0 16 16" aria-hidden="true">
        {STEPS[name]}
      </svg>
    );
  }
  return <MaterialIcon name={MATERIAL[name]} size={20} />;
}
