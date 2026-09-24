"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import type { Project, ProjectMedia } from "./projects";
import styles from "./CrtPreview.module.css";

const width = 320;
const gap = 28;
const imageHold = 1800;

/**
 * A little CRT monitor that floats beside the cursor while a project row is hovered, playing
 * that project's screenshots and clips. It trails the cursor and leans with its speed;
 * moving to another project changes channel with a burst of static. Mouse only: on touch
 * screens the same media is in the project window.
 */
export function CrtPreview({
  project,
  number,
}: {
  project: Project | null;
  number: number;
}) {
  const reduceMotion = useReducedMotion();
  const monitorRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  // Keep showing the last project while the monitor fades out.
  const [shown, setShown] = useState<{ project: Project; number: number } | null>(null);
  if (project && (project !== shown?.project || number !== shown.number)) {
    setShown({ project, number });
  }
  const visible = Boolean(project);

  useEffect(() => {
    const track = (event: PointerEvent) => {
      pointerRef.current = { x: event.clientX, y: event.clientY };
    };
    window.addEventListener("pointermove", track, { passive: true });
    return () => window.removeEventListener("pointermove", track);
  }, []);

  // Trail the cursor while visible: ease toward a spot beside it (flipped to the other side
  // near the screen's edges) and lean into the motion.
  useEffect(() => {
    const monitor = monitorRef.current;
    if (!visible || !monitor) return;
    const place = () => {
      const { x, y } = pointerRef.current;
      const height = monitor.offsetHeight;
      const left = x + gap + width > window.innerWidth - 12 ? x - gap - width : x + gap;
      const top = Math.min(Math.max(y - height * 0.35, 12), window.innerHeight - height - 12);
      return { left, top };
    };

    let position = place();
    let lean = 0;
    let frame = 0;
    let last = performance.now();
    const render = () => {
      monitor.style.transform = `translate3d(${position.left}px, ${position.top}px, 0) rotate(${lean}deg)`;
    };
    render();
    if (reduceMotion) {
      const follow = () => {
        position = place();
        render();
      };
      window.addEventListener("pointermove", follow, { passive: true });
      return () => window.removeEventListener("pointermove", follow);
    }

    const tick = (now: number) => {
      const delta = Math.min(now - last, 64);
      last = now;
      const goal = place();
      const k = 1 - Math.exp(-delta / 90);
      const moveX = (goal.left - position.left) * k;
      position = {
        left: position.left + moveX,
        top: position.top + (goal.top - position.top) * k,
      };
      const leanGoal = Math.max(-7, Math.min(7, (moveX / Math.max(delta, 1)) * 2.4));
      lean += (leanGoal - lean) * (1 - Math.exp(-delta / 120));
      render();
      frame = requestAnimationFrame(tick);
    };
    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [reduceMotion, visible]);

  return (
    <div
      ref={monitorRef}
      className={styles.monitor}
      data-visible={visible || undefined}
      aria-hidden="true"
    >
      <div className={styles.body}>
        <div className={styles.screen}>
          {shown && <Reel key={`reel-${shown.project.id}`} media={shown.project.media ?? []} />}
          {!shown?.project.media?.length && <span className={styles.noSignal}>No signal</span>}
          {/* Replayed on every channel change by its key. */}
          <span key={`static-${shown?.project.id}`} className={styles.static} />
          <span className={styles.scanlines} />
          <span className={styles.glass} />
        </div>
        <div className={styles.chin}>
          <span className={styles.channel}>
            CH {String(shown?.number ?? 0).padStart(2, "0")}
          </span>
          <span className={styles.title}>{shown?.project.title}</span>
          <span className={styles.power} />
        </div>
      </div>
      <div className={styles.stand} />
    </div>
  );
}

// Plays a project's media in turn: clips to their end, stills for a moment each.
function Reel({ media }: { media: ProjectMedia[] }) {
  const [index, setIndex] = useState(0);
  const current = media[index];
  const next = () => setIndex((value) => (value + 1) % media.length);

  useEffect(() => {
    if (!current || current.type !== "image" || media.length < 2) return;
    const timer = window.setTimeout(
      () => setIndex((value) => (value + 1) % media.length),
      imageHold,
    );
    return () => window.clearTimeout(timer);
  }, [current, media.length]);

  if (!current) return null;
  return current.type === "video" ? (
    <video
      key={current.src}
      className={styles.media}
      src={current.src}
      poster={current.poster}
      muted
      autoPlay
      playsInline
      loop={media.length < 2}
      onEnded={next}
    />
  ) : (
    <Image
      key={current.src}
      className={styles.media}
      src={current.src}
      alt=""
      fill
      sizes={`${width}px`}
    />
  );
}
