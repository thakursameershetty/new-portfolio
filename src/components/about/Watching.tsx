"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useReducedMotion } from "framer-motion";
import { onTilt } from "../deviceTilt";
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

// Where poster `i` sits from the one in focus, going round: the list is a loop, so the last
// poster sits just left of the first. Each is placed on whichever side is nearer (an even
// count puts the one straight across on the right).
function offsetOf(i: number, active: number, length: number) {
  const ahead = (((i - active) % length) + length) % length;
  return ahead > length / 2 ? ahead - length : ahead;
}

/**
 * "Watching": films and series as posters on a turntable. The one in focus stands tall in
 * the middle, lit red from behind (the site's red); the rest fall back to either side.
 * Arrows, arrow keys, a swipe, or a click on a side poster turn it, round and round:
 * the last poster sits just left of the first. The posters carry a
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
  const stageRef = useRef<HTMLDivElement>(null);
  const reduced = useReducedMotion();
  const [kind, setKind] = useState<Film["kind"]>("film");
  const list = films.filter((film) => film.kind === kind);
  // The poster in focus, and the one before it (to tell which posters wrapped round).
  const [[active, previous], setTurn] = useState([0, 0]);
  const setActive = (next: number) => setTurn(([current]) => [next, current]);
  const drag = useRef<{ x: number; t: number; moved: boolean } | null>(null);
  const { playCue } = useIntro();
  // A turn by hand clicks like a detent (the arrow keys add their own press instead);
  // turns the slideshow makes itself stay silent. It goes round: past the last is the first.
  const go = (to: number, tick = true) => {
    const next = ((to % list.length) + list.length) % list.length;
    if (next === active) return;
    if (tick) playCue("detent");
    setActive(next);
  };

  // A poster that wrapped round from one end to the other would slide right across the
  // stage behind the rest; instead it's put straight in its new place (no transition, see
  // .wrapped) and fades in there.
  const reelRef = useRef<HTMLUListElement>(null);
  useLayoutEffect(() => {
    if (reduced) return;
    for (const card of reelRef.current?.querySelectorAll<HTMLElement>(
      "[data-wrapped]",
    ) ?? [])
      card.animate([{ opacity: 0 }], { duration: 420, easing: "ease-out" });
  }, [active, reduced]);

  const [hovered, setHovered] = useState(false);
  const [focused, setFocused] = useState(false);
  const [dragging, setDragging] = useState(false);
  const onScreen = useOnScreen(stageRef);
  const running = !reduced && !hovered && !focused && !dragging && onScreen;

  // On phones, tipping the phone tilts the poster in focus, gloss and all, as the mouse
  // does on a desktop (measured from however the phone's held; the permission iPhones need
  // is asked on the page's first tap). Still while a finger's on the carousel, and only
  // while it's on screen.
  const draggingRef = useRef(false);
  useEffect(() => {
    draggingRef.current = dragging;
  }, [dragging]);
  useEffect(() => {
    if (reduced || !onScreen) return;
    return onTilt((x, y) => {
      if (draggingRef.current) return;
      const stage = stageRef.current;
      const card = stage?.querySelector<HTMLElement>("li[aria-current]");
      if (!stage || !card) return;
      // A poster that's turned out of the middle settles back level.
      for (const other of stage.querySelectorAll<HTMLElement>(
        `.${styles.tilting}`,
      )) {
        if (other === card) continue;
        other.classList.remove(styles.tilting);
        other.style.setProperty("--rx", "0deg");
        other.style.setProperty("--ry", "0deg");
      }
      card.classList.add(styles.tilting);
      card.style.setProperty("--ry", `${x * 10}deg`);
      card.style.setProperty("--rx", `${-y * 8}deg`);
      card.style.setProperty("--gx", `${50 + x * 50}%`);
      card.style.setProperty("--gy", `${50 + y * 50}%`);
    });
  }, [reduced, onScreen]);

  // Each poster gets a full turn; handling the carousel restarts the count, and after the
  // last it goes round to the first.
  useEffect(() => {
    if (!running) return;
    const timer = window.setTimeout(
      () => setTurn(([a]) => [(a + 1) % list.length, a]),
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
        drag.current = {
          x: event.clientX,
          t: event.timeStamp,
          moved: false,
        };
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
      onPointerUp={(event) => {
        // A fast flick can lift off before any move event got past 40px (phones send only
        // one or two), so it's judged again here on where the finger ended up: far enough,
        // or a shorter one flicked quickly.
        const start = drag.current;
        if (start && !start.moved) {
          const dx = event.clientX - start.x;
          const speed = Math.abs(dx) / Math.max(event.timeStamp - start.t, 1);
          if (Math.abs(dx) > 40 || (Math.abs(dx) > 16 && speed > 0.4)) {
            start.moved = true;
            go(active + (dx < 0 ? 1 : -1));
          }
        }
        // Let the click that ends a swipe through without also picking a poster.
        setTimeout(() => (drag.current = null), 0);
        setDragging(false);
      }}
      onPointerCancel={() => {
        drag.current = null;
        setDragging(false);
      }}
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
                setTurn([0, 0]);
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
      <ul key={kind} ref={reelRef} className={styles.reel}>
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
          const offset = offsetOf(i, active, list.length);
          const wrapped =
            Math.abs(offset - offsetOf(i, previous, list.length)) >
            list.length / 2;
          return (
            <li
              key={film.title}
              className={clsx(
                styles.card,
                offset === 0 && styles.cardActive,
                wrapped && styles.wrapped,
              )}
              data-wrapped={wrapped || undefined}
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
              // The poster in focus tilts toward the mouse under a moving gloss, like the
              // ID card; it settles back level when the mouse leaves.
              onPointerMove={(event) => {
                if (offset !== 0 || reduced || event.pointerType !== "mouse")
                  return;
                const card = event.currentTarget;
                const rect = card.getBoundingClientRect();
                const x = (event.clientX - rect.left) / rect.width;
                const y = (event.clientY - rect.top) / rect.height;
                card.classList.add(styles.tilting);
                card.style.setProperty("--ry", `${(x - 0.5) * 16}deg`);
                card.style.setProperty("--rx", `${(0.5 - y) * 12}deg`);
                card.style.setProperty("--gx", `${x * 100}%`);
                card.style.setProperty("--gy", `${y * 100}%`);
              }}
              onPointerLeave={(event) => {
                const card = event.currentTarget;
                card.classList.remove(styles.tilting);
                card.style.setProperty("--ry", "0deg");
                card.style.setProperty("--rx", "0deg");
              }}
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
              <span aria-hidden="true" className={styles.gloss} />
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
