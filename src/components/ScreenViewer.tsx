"use client";

import { useEffect, useLayoutEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";
import Image from "next/image";
import type { CaseSection } from "./projects";
import styles from "./ScreenViewer.module.css";

const padNumber = (number: number) => String(number).padStart(2, "0");

/**
 * A closer look at what's on the case study's monitor: it grows out of the monitor's screen
 * (scaled up from the screen's own spot on the page) to take over the window with the
 * current item, large, and shrinks back into the screen when you step back. ← and → (or a
 * swipe) step through the channel's items, ↑ and ↓ change channel, and Esc steps back out to
 * the set. Clips play here with their controls and sound.
 */
export function ScreenViewer({
  sections,
  channel,
  item,
  onItem,
  onChannel,
  screenRect,
  onLeave,
  onClose,
  onTap,
}: {
  sections: CaseSection[];
  channel: number;
  item: number;
  onItem: (item: number) => void;
  onChannel: (channel: number) => void;
  /** The monitor's screen on the page, to grow from and shrink back into. */
  screenRect: () => DOMRect | null;
  /** Stepping back has started (the camera can pull out). */
  onLeave: () => void;
  /** Stepped back: take the view away. */
  onClose: () => void;
  onTap?: () => void;
}) {
  const closeRef = useRef<HTMLButtonElement>(null);
  const viewerRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const leavingRef = useRef(false);
  const section = sections[channel];
  const items = section?.screen ?? [];
  const count = items.length;
  const current = items[item % Math.max(count, 1)];

  const step = (by: number) => {
    if (count > 1) onItem((item + by + count) % count);
  };
  const tune = (by: number) => {
    const next = channel + by;
    if (next >= 0 && next < sections.length) onChannel(next);
  };

  // The whole view scaled down onto the monitor's screen: where it grows from, and shrinks to.
  const onScreen = () => {
    const rect = screenRect();
    const { innerWidth: width, innerHeight: height } = window;
    if (!rect) return { transform: "translate(25vw, 25vh) scale(0.5)", opacity: 0, borderRadius: "0px" };
    const scale = rect.width / width;
    const top = rect.top + rect.height / 2 - (height * scale) / 2;
    return {
      transform: `translate(${rect.left}px, ${top}px) scale(${scale})`,
      opacity: 1,
      borderRadius: `${14 / scale}px`,
    };
  };
  const full = { transform: "none", opacity: 1, borderRadius: "0px" };
  useLayoutEffect(() => {
    const viewer = viewerRef.current;
    if (!viewer || reduceMotion) return;
    viewer.animate([onScreen(), full], { duration: 460, easing: "cubic-bezier(0.22, 1, 0.36, 1)" });
    // Only on opening.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  const close = () => {
    const viewer = viewerRef.current;
    if (leavingRef.current) return;
    leavingRef.current = true;
    onLeave();
    if (!viewer || reduceMotion) {
      onClose();
      return;
    }
    viewer
      .animate([full, { ...onScreen(), offset: 0.85 }, { ...onScreen(), opacity: 0 }], {
        duration: 380,
        easing: "cubic-bezier(0.5, 0, 0.75, 0)",
        fill: "forwards",
      })
      .finished.then(onClose, onClose);
  };

  // Focus comes in on opening, and goes back to wherever it was on closing.
  useEffect(() => {
    const before = document.activeElement as HTMLElement | null;
    closeRef.current?.focus({ preventScroll: true });
    return () => before?.focus?.({ preventScroll: true });
  }, []);

  // Keys go to the viewer first, so Esc closes only it (not the project behind), and the
  // arrows don't change the story's channel.
  const keysRef = useRef({ step, tune, close });
  useEffect(() => {
    keysRef.current = { step, tune, close };
  });
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      const actions: Record<string, () => void> = {
        Escape: () => keysRef.current.close(),
        ArrowLeft: () => keysRef.current.step(-1),
        ArrowRight: () => keysRef.current.step(1),
        ArrowUp: () => keysRef.current.tune(-1),
        ArrowDown: () => keysRef.current.tune(1),
      };
      const action = actions[event.key];
      if (!action) return;
      // Leave the arrows to a clip's own controls while they have focus.
      if (event.key !== "Escape" && (event.target as HTMLElement | null)?.tagName === "VIDEO") return;
      event.preventDefault();
      event.stopPropagation();
      action();
    };
    window.addEventListener("keydown", handleKey, { capture: true });
    return () => window.removeEventListener("keydown", handleKey, { capture: true });
  }, []);

  // Swipe across the picture to step through.
  const swipeRef = useRef<{ x: number; y: number } | null>(null);

  return (
    <div
      ref={viewerRef}
      className={styles.viewer}
      role="dialog"
      aria-modal="true"
      aria-label={`${section?.label ?? "Screen"}: closer look`}
    >
      <header className={styles.top}>
        <p className={styles.channel}>
          CH {padNumber(channel + 1)} · {section?.label}
        </p>
        {count > 1 && (
          <p className={styles.count} aria-live="polite">
            {(item % count) + 1} / {count}
          </p>
        )}
        <button
          ref={closeRef}
          type="button"
          className={styles.close}
          onClick={close}
          onMouseEnter={onTap}
          aria-label="Back to the monitor"
        >
          <span aria-hidden="true">✕</span>
          <span className={styles.closeLabel}>Back</span>
        </button>
      </header>

      <div
        className={styles.frame}
        onPointerDown={(event) => {
          swipeRef.current = { x: event.clientX, y: event.clientY };
        }}
        onPointerUp={(event) => {
          const start = swipeRef.current;
          swipeRef.current = null;
          if (!start) return;
          const dx = event.clientX - start.x;
          if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(event.clientY - start.y)) step(dx < 0 ? 1 : -1);
        }}
      >
        {current?.type === "image" && (
          <Image
            key={current.src}
            src={current.src}
            alt={current.alt}
            fill
            sizes="100vw"
            className={styles.media}
          />
        )}
        {current?.type === "video" && (
          <video
            key={current.src}
            src={current.src}
            poster={current.poster}
            className={styles.media}
            controls
            autoPlay
            muted
            loop
            playsInline
            aria-label={current.alt}
          />
        )}
        {current?.type === "card" && (
          <div key={current.title} className={styles.card}>
            <span className={styles.bars} aria-hidden="true" />
            <span className={styles.cardBody}>
              <span className={styles.cardChannel}>
                CH {padNumber(channel + 1)} · {section?.label}
              </span>
              <span className={styles.cardTitle}>{current.title}</span>
              <span className={styles.cardNote}>{current.note}</span>
            </span>
          </div>
        )}
        <span className={styles.glass} aria-hidden="true" />
      </div>

      <footer className={styles.bottom}>
        <p className={styles.caption}>
          {current?.type === "card" ? current.note : current?.alt}
        </p>
        <div className={styles.controls}>
          <button
            type="button"
            className={styles.key}
            onClick={() => tune(-1)}
            onMouseEnter={onTap}
            disabled={channel === 0}
            aria-label="Previous part"
          >
            CH ▲
          </button>
          <button
            type="button"
            className={styles.key}
            onClick={() => tune(1)}
            onMouseEnter={onTap}
            disabled={channel === sections.length - 1}
            aria-label="Next part"
          >
            CH ▼
          </button>
          {count > 1 && (
            <>
              <button
                type="button"
                className={styles.key}
                onClick={() => step(-1)}
                onMouseEnter={onTap}
                aria-label="Previous picture"
              >
                ←
              </button>
              <button
                type="button"
                className={styles.key}
                onClick={() => step(1)}
                onMouseEnter={onTap}
                aria-label="Next picture"
              >
                →
              </button>
            </>
          )}
        </div>
      </footer>
    </div>
  );
}
