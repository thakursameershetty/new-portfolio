"use client";

import { useEffect, useState } from "react";

/**
 * True once `threshold` of the element has been on screen, and stays true, so entrances
 * (like a split-flap headline) play once.
 */
export function useInView(
  ref: React.RefObject<HTMLElement | null>,
  threshold = 0.35,
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
      { threshold },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return inView;
}
