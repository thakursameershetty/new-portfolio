"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import styles from "./Marquee.module.css";

// The gap between the text and its copy that follows it round, and how the loop runs: a
// rest at the start (so it can be read), then a steady scroll, as music apps do.
const gap = 40;
const pixelsPerSecond = 36;
const restSeconds = 1.8;

/**
 * Text kept on one line on phones: if it's too long for the line, it rests, then scrolls
 * left with a copy following it round, like a song title in a music app, faded at the edges.
 * Wider screens, and visitors who'd rather not have motion, see it wrap as usual (the whole
 * text, never cut short with "…").
 */
export function Marquee({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const boxRef = useRef<HTMLSpanElement>(null);
  const textRef = useRef<HTMLSpanElement>(null);
  const trackRef = useRef<HTMLSpanElement>(null);
  // How far one loop scrolls (the text and the gap), while it's too long for its line.
  const [loop, setLoop] = useState<number | null>(null);

  useEffect(() => {
    const box = boxRef.current;
    const text = textRef.current;
    if (!box || !text) return;
    const measure = () => {
      const over = text.offsetWidth - box.clientWidth > 1;
      setLoop(over ? Math.ceil(text.offsetWidth) + gap : null);
    };
    const observer = new ResizeObserver(measure);
    observer.observe(box);
    observer.observe(text);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const track = trackRef.current;
    if (!track || loop === null) return;
    const duration = restSeconds + loop / pixelsPerSecond;
    const animation = track.animate(
      [
        { transform: "translateX(0)" },
        { transform: "translateX(0)", offset: restSeconds / duration },
        { transform: `translateX(${-loop}px)` },
      ],
      { duration: duration * 1000, iterations: Infinity, easing: "linear" },
    );
    return () => animation.cancel();
  }, [loop]);

  return (
    <span
      ref={boxRef}
      className={clsx(styles.marquee, loop !== null && styles.moving, className)}
    >
      <span ref={trackRef} className={styles.track}>
        <span ref={textRef} className={styles.text}>
          {children}
        </span>
        {loop !== null && (
          <span aria-hidden="true" className={styles.text} style={{ marginLeft: gap }}>
            {children}
          </span>
        )}
      </span>
    </span>
  );
}
