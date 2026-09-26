"use client";

import { useEffect, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { onTilt } from "./deviceTilt";
import { GestureHints, HintsToggle } from "./GestureHints";
import type { CrtSet } from "./crtSet3d";
import type { CaseSection, Project } from "./projects";
import styles from "./ProjectView.module.css";

// Below this width the monitor sits alone above the story, and the remote becomes a strip of
// keys along the bottom of the screen.
const compactQuery = "(max-width: 999px)";

/**
 * The case study's monitor: loads the three.js set (crtSet3d.ts) and keeps it on the current
 * channel. Without WebGL it falls back to a flat screen showing the channel's first still.
 */
export function CaseMonitor({
  project,
  number,
  sections,
  channel,
  closer,
  onSelect,
  onPower,
  onCue,
  onLookCloser,
  hintsShown,
  onToggleHints,
  onUsed,
  screenRectRef,
  ejectRef,
}: {
  project: Project;
  number: number;
  sections: CaseSection[];
  channel: number;
  /** The item being looked at closely, or null. */
  closer: number | null;
  onSelect: (index: number) => void;
  onPower?: () => void;
  onCue?: (cue: "remoteKey" | "driveLoad") => void;
  /** Look closer at the screen, starting from this item of the current channel. */
  onLookCloser: (item: number) => void;
  /** Whether the how-to caption under the set shows. */
  hintsShown: boolean;
  /** Its switch, kept with it: hides the hints, or brings them back. */
  onToggleHints: () => void;
  /** The set was pressed (dragged, or its screen or a key clicked). */
  onUsed: () => void;
  /** Filled with a way to find the screen on the page, for the closer look to grow from. */
  screenRectRef?: { current: (() => DOMRect | null) | null };
  /** Filled with the set's eject (the disk out, the tube off), to play before closing. */
  ejectRef?: { current: (() => Promise<void>) | null };
}) {
  const holderRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const [set, setSet] = useState<CrtSet | null>(null);
  const [failed, setFailed] = useState(false);
  const [overScreen, setOverScreen] = useState(false);
  const monitorRef = useRef<HTMLDivElement>(null);
  // How to work the set, as one caption under it (wide screens with a mouse); whether it
  // shows is the case study's call (the hints key, and whether the set's been used).
  const captionRef = useRef<HTMLDivElement>(null);
  // The "Look closer" pill that stands in for the cursor over the screen, and where it's
  // heading (the pointer, inside the monitor's box).
  const pillRef = useRef<HTMLSpanElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  // Which of the channel's items the screen is on, for opening the closer look at it.
  const itemRef = useRef(0);
  // The scene is built once per project; these keep its callbacks current.
  const handlers = useRef({ onSelect, onPower, onCue, onLookCloser });
  useEffect(() => {
    handlers.current = { onSelect, onPower, onCue, onLookCloser };
  }, [onSelect, onPower, onCue, onLookCloser]);
  const channelRef = useRef(channel);
  useEffect(() => {
    channelRef.current = channel;
  }, [channel]);

  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;
    // A fresh canvas for every build: a disposed set loses its WebGL context on purpose, and
    // a canvas keeps the context it first gave out.
    const canvas = document.createElement("canvas");
    canvas.className = styles.monitorCanvas;
    canvas.setAttribute("aria-hidden", "true");
    holder.appendChild(canvas);
    let cancelled = false;
    let built: CrtSet | null = null;
    import("./crtSet3d")
      .then(({ createCrtSet }) =>
        createCrtSet(canvas, {
          channels: sections.map((section) => ({ label: section.label, screen: section.screen })),
          disk: { color: project.disk, ink: project.ink, number, title: project.title },
          reduceMotion: Boolean(reduceMotion),
          onSelect: (index) => handlers.current.onSelect(index),
          onKey: () => handlers.current.onCue?.("remoteKey"),
          onPower: () => handlers.current.onPower?.(),
          onSeat: () => handlers.current.onCue?.("driveLoad"),
          onScreen: (item) => handlers.current.onLookCloser(item),
          onScreenHover: setOverScreen,
          onItem: (item) => (itemRef.current = item),
        }),
      )
      .then((ready) => {
        if (cancelled) {
          ready.dispose();
          return;
        }
        built = ready;
        ready.setChannel(channelRef.current, true);
        setSet(ready);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });
    return () => {
      cancelled = true;
      built?.dispose();
      canvas.remove();
      setSet(null);
    };
  }, [number, project, reduceMotion, sections]);

  useEffect(() => {
    itemRef.current = 0;
    set?.setChannel(channel);
  }, [channel, set]);

  useEffect(() => {
    if (!screenRectRef) return;
    screenRectRef.current = set ? () => set.screenRect() : null;
    return () => {
      screenRectRef.current = null;
    };
  }, [screenRectRef, set]);

  useEffect(() => {
    if (!ejectRef) return;
    ejectRef.current = set ? () => set.eject() : null;
    return () => {
      ejectRef.current = null;
    };
  }, [ejectRef, set]);

  // Looking closer: the screen holds still on the item being looked at.
  const looking = closer !== null;
  useEffect(() => {
    set?.hold(looking);
  }, [looking, set]);
  useEffect(() => {
    if (closer === null) return;
    itemRef.current = closer;
    set?.showItem(closer);
  }, [closer, set]);

  // Narrow screens frame the monitor alone.
  useEffect(() => {
    if (!set) return;
    const query = window.matchMedia(compactQuery);
    const apply = () => set.setCompact(query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, [set]);

  // Phones tip it with their tilt.
  useEffect(() => {
    if (!set) return;
    return onTilt((x, y) => set.tilt(x, y));
  }, [set]);

  // The pill trails the pointer a touch, and starts right under it on arriving.
  useEffect(() => {
    const pill = pillRef.current;
    if (!overScreen || !pill) return;
    let frame = 0;
    let last = performance.now();
    const at = { ...pointerRef.current };
    const move = (now: number) => {
      const k = reduceMotion ? 1 : 1 - Math.exp(-Math.min(now - last, 64) / 60);
      last = now;
      at.x += (pointerRef.current.x - at.x) * k;
      at.y += (pointerRef.current.y - at.y) * k;
      pill.style.transform = `translate(${at.x}px, ${at.y}px) translate(-50%, -50%)`;
      frame = requestAnimationFrame(move);
    };
    frame = requestAnimationFrame(move);
    return () => cancelAnimationFrame(frame);
  }, [overScreen, reduceMotion]);

  // The caption follows the set each frame, so it stays under it while it's dragged round
  // and eases back: left-aligned with the set, a little below its foot.
  useEffect(() => {
    const monitor = monitorRef.current;
    const caption = captionRef.current;
    if (!set || !monitor || !caption) return;
    let frame = 0;
    const follow = () => {
      frame = requestAnimationFrame(follow);
      // Only drawn where there's room for it (see the CSS); skip the work otherwise.
      if (!caption.offsetParent) return;
      const whole = set.partRect("set");
      if (!whole) return;
      const box = monitor.getBoundingClientRect();
      const left = Math.max(whole.left - box.left, 0);
      const top = Math.min(whole.bottom - box.top + 24, box.height - caption.offsetHeight - 16);
      caption.style.transform = `translate(${left}px, ${top}px)`;
    };
    frame = requestAnimationFrame(follow);
    return () => cancelAnimationFrame(frame);
  }, [set]);

  const fallback = sections[channel]?.screen.find((item) => item.type === "image");

  return (
    <div
      ref={monitorRef}
      className={styles.monitor}
      // Any press on the set (a drag, the screen, a key) shows it's been found.
      onPointerDown={onUsed}
      onPointerMove={(event) => {
        const bounds = event.currentTarget.getBoundingClientRect();
        pointerRef.current = { x: event.clientX - bounds.left, y: event.clientY - bounds.top };
        // Hidden, it waits right under the pointer, so it appears there.
        if (!overScreen && pillRef.current) {
          pillRef.current.style.transform = `translate(${pointerRef.current.x}px, ${pointerRef.current.y}px) translate(-50%, -50%)`;
        }
      }}
    >
      <div ref={holderRef} className={styles.monitorHolder} />
      <div
        ref={captionRef}
        className={styles.setCaption}
        data-looking={looking || undefined}
      >
        <HintsToggle shown={hintsShown} onToggle={onToggleHints} />
        <div aria-hidden="true" className={styles.captionList} data-hidden={!hintsShown || undefined}>
          <GestureHints
            hints={[
              { gesture: "Drag", does: "to turn it" },
              { gesture: "Click", does: "the screen to look closer" },
              { gesture: "Click", does: "a key to change the channel" },
              // The remote's red key; only on the wide set, where the remote is out.
              { gesture: "Click", does: "the power button to eject and leave" },
            ]}
            active={Boolean(set)}
          />
        </div>
      </div>
      <span
        ref={pillRef}
        className={styles.cursorPill}
        data-shown={overScreen || undefined}
        aria-hidden="true"
      >
        <span className={styles.cursorPillLabel}>Look closer</span>
      </span>
      {/* For the keyboard, and for touch screens (no pointer to follow): a real button. */}
      <button
        type="button"
        className={styles.lookCloser}
        onClick={() => onLookCloser(itemRef.current)}
      >
        <span aria-hidden="true">⤢</span> Look closer
      </button>
      {failed && (
        <div className={styles.flatScreen} aria-hidden="true">
          {fallback?.type === "image" ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={fallback.src} alt="" />
          ) : (
            <span>{sections[channel]?.label}</span>
          )}
        </div>
      )}
    </div>
  );
}
