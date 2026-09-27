"use client";

import { useEffect, useState } from "react";

/**
 * True once `threshold` of the element has been on screen, and stays true, so entrances
 * (like a split-flap headline) play once. `rootMargin` shrinks the screen it counts (e.g.
 * "0px 0px -25% 0px" leaves out the bottom quarter, so an element has to scroll up into
 * view, not just peek in at the bottom edge).
 */
export function useInView(
  ref: React.RefObject<HTMLElement | null>,
  threshold = 0.35,
  rootMargin = "0px",
) {
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, threshold, rootMargin]);

  return inView;
}
