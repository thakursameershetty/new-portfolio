"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useReducedMotion } from "framer-motion";
import { useIntro } from "../SiteIntro";
import { films, type Film } from "./taste";
import key from "./Keycap.module.css";
import styles from "./Watching.module.css";

// Each step out from the poster in focus shrinks a poster to this fraction of full size
// (1 is the focused one); further out stays at the last.
const scales = [1, 0.8, 0.7, 0.62];
const scaleAt = (distance: number) =>
  scales[Math.min(distance, scales.length - 1)];

// How far a poster's centre sits from the focused one's, in poster widths: half of each
// poster between them on either side, so with the fixed gap added (in CSS) every pair of
// neighbours is exactly one gap apart, however much they've shrunk.
function reach(distance: number) {
  let widths = 0;
  for (let d = 0; d < distance; d++)
    widths += (scaleAt(d) + scaleAt(d + 1)) / 2;
  return widths;
}

/**
 * "Watching": films and series as posters on a turntable. The one in focus stands tall in
 * the middle, lit red from behind (the site's red); the rest fall back to either side.
 * Arrows, arrow keys, a swipe, or a click on a side poster turn it. The posters carry a
 * faint set of scanlines, a nod to the CRT on the home page. Two keys switch between the
 * films and the series. It plays on its own from the first poster, one every few seconds
 * with a line filling under the counter, and holds still while it's being handled (hovered,
 * focused or dragged), when it's off screen or in a background tab, and always with
 * reduced motion.
 */
const kinds = [
  { kind: "film", label: "Films" },
  { kind: "series", label: "Series" },
] as const;

// How long each poster holds the middle while it plays (ms); the line under the counter
// fills over the same time (--dwell in the CSS).
const dwell = 4000;

export function Watching() {
  const [kind, setKind] = useState<Film["kind"]>("film");
  const list = films.filter((film) => film.kind === kind);
  const [active, setActive] = useState(0);
  const drag = useRef<{ x: number; moved: boolean } | null>(null);
  const { playCue } = useIntro();
  // A turn by hand clicks like a detent (the arrow keys add their own press instead);
  // turns the slideshow makes itself stay silent.
  const go = (to: number, tick = true) => {
    const next = Math.min(Math.max(to, 0), list.length - 1);
    if (next === active) return;
    if (tick) playCue("detent");
    setActive(next);
  };

  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const onScreen = useOnScreen(stageRef);
  const running = !reduced && !hovered && !focused && !dragging && onScreen;

  // Each poster gets a full turn; handling the carousel restarts the count, and after the
  // last it goes back to the first.
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(
      () => setActive((a) => (a + 1) % list.length),
      dwell,
    );
    return () => window.clearTimeout(timer);
  }, [running, active, kind, list.length]);

  return (
    <div
      ref={stageRef}
      className={styles.stage}
      style={{ "--dwell": `${dwell}ms` } as React.CSSProperties}
      role="group"
      aria-roledescription="carousel"
      aria-label="Films and series"
      tabIndex={0}
      onKeyDown={(event) => {
        if (event.key === "ArrowRight") go(active + 1);
        else if (event.key === "ArrowLeft") go(active - 1);
        else return;
        event.preventDefault();
      }}
      onPointerEnter={(event) => {
        if (event.pointerType === "mouse") setHovered(true);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") setHovered(false);
      }}
      // Only keyboard focus holds it: a mouse click also focuses the button it
      // presses, which would otherwise hold it still until something else is clicked.
      onFocus={(event) => setFocused(event.target.matches(":focus-visible"))}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node | null))
          setFocused(false);
      }}
      onPointerDown={(event) => {
        drag.current = { x: event.clientX, moved: false };
        setDragging(true);
      }}
      onPointerMove={(event) => {
        const start = drag.current;
        if (!start || start.moved) return;
        const dx = event.clientX - start.x;
        if (Math.abs(dx) > 40) {
          start.moved = true;
          go(active + (dx < 0 ? 1 : -1));
        }
      }}
      onPointerUp={() => {
        // Let the click that ends a swipe through without also picking a poster.
        setTimeout(() => (drag.current = null), 0);
        setDragging(false);
      }}
      onPointerCancel={() => setDragging(false)}
    >
      <div className={styles.kinds}>
        {kinds.map((option) => {
          const count = films.filter(
            (film) => film.kind === option.kind,
          ).length;
          return (
            <button
              key={option.kind}
              type="button"
              className={clsx(key.key, option.kind === kind && key.cream)}
              aria-pressed={option.kind === kind}
              data-feel="switchOn"
              onClick={() => {
                if (option.kind === kind) return;
                setKind(option.kind);
                setActive(0);
              }}
            >
              {option.label}
              <span className={styles.kindCount}>
                {String(count).padStart(2, "0")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Keyed by kind, so switching deals the other set in fresh. */}
      <ul key={kind} className={styles.reel}>
        {/* Ambient light: a blurred copy of each poster sits behind the focused spot, lit
            only for the poster in focus, so turning cross-fades one poster's light into the
            next. Without a poster, its glow colour stands in. */}
        {list.map((film, i) => (
          <li
            key={`ambient-${film.title}`}
            aria-hidden="true"
            className={clsx(styles.ambient, i === active && styles.ambientOn)}
            style={
              film.poster
                ? { backgroundImage: `url("${film.poster}")` }
                : { backgroundColor: film.glow }
            }
          />
        ))}
        {list.map((film, i) => {
          const offset = i - active;
          return (
            <li
              key={film.title}
              className={clsx(styles.card, offset === 0 && styles.cardActive)}
              style={
                {
                  "--side": Math.sign(offset),
                  "--reach": reach(Math.abs(offset)),
                  "--gaps": Math.abs(offset),
                  "--scale": scaleAt(Math.abs(offset)),
                  "--distance": Math.abs(offset),
                  zIndex: list.length - Math.abs(offset),
                } as React.CSSProperties
              }
              aria-current={offset === 0 ? "true" : undefined}
              aria-hidden={Math.abs(offset) > 2 ? true : undefined}
              onClick={() => {
                if (!drag.current?.moved && offset !== 0) go(i);
              }}
            >
              <div
                className={styles.poster}
                style={
                  film.poster
                    ? { backgroundImage: `url("${film.poster}")` }
                    : ({ "--tint": film.tint } as React.CSSProperties)
                }
              />
              {film.rating !== undefined && (
                <span
                  className={styles.rating}
                  aria-label={`My rating: ${film.rating} out of 10`}
                >
                  {film.rating.toFixed(1)}
                  <span aria-hidden="true">★</span>
                </span>
              )}
              {/* The poster already carries its title; this names it for screen readers. */}
              <span className={styles.srOnly}>
                {film.title}, {film.year}, {film.length}
              </span>
            </li>
          );
        })}
      </ul>

      {/* What's in focus, under the posters: flips in with each turn, like the Contact
          key's label. It also reads out titles printed in other scripts, like Athadu's. */}
      {list[active] && (
        <div
          key={`${kind}-${active}`}
          className={styles.showing}
          aria-hidden="true"
        >
          <p className={styles.title}>{list[active].title}</p>
          <p className={styles.meta}>
            <span className={styles.chip}>{list[active].year}</span>
            <span className={styles.chip}>{list[active].length}</span>
          </p>
        </div>
      )}

      <div className={styles.controls}>
        <button
          type="button"
          className={clsx(key.key, key.square)}
          data-feel="remoteKey"
          onClick={() => go(active - 1, false)}
          disabled={active === 0}
          aria-label="Previous"
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="m15 18-6-6 6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
        {/* The counter, with a line under it filling while the poster in focus has its
            turn. Keyed to the poster, and the fill only runs while playing, so it starts
            over whenever the timer does. Screen readers hear it only when it's still. */}
        <span className={styles.counter}>
          <span className={styles.count} aria-live={running ? "off" : "polite"}>
            {String(active + 1).padStart(2, "0")} /{" "}
            {String(list.length).padStart(2, "0")}
          </span>
          <span aria-hidden="true" className={styles.progress}>
            <span
              key={`${kind}-${active}`}
              className={clsx(
                styles.progressFill,
                running && styles.progressRunning,
              )}
            />
          </span>
        </span>
        <button
          type="button"
          className={clsx(key.key, key.square)}
          data-feel="remoteKey"
          onClick={() => go(active + 1, false)}
          disabled={active === list.length - 1}
          aria-label="Next"
        >
          <svg
            aria-hidden="true"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="m9 18 6-6-6-6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}

/** Whether the element is on screen right now, and the tab is showing (unlike useInView,
 *  which fires once): the slideshow only plays while someone could be watching it. */
function useOnScreen(ref: React.RefObject<HTMLElement | null>) {
  const [intersecting, setIntersecting] = useState(false);
  const [tabShown, setTabShown] = useState(true);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIntersecting(entry.isIntersecting),
      {
        threshold: 0.4,
      },
    );
    observer.observe(element);
    const onVisibility = () =>
      setTabShown(document.visibilityState === "visible");
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      observer.disconnect();
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [ref]);

  return intersecting && tabShown;
}
