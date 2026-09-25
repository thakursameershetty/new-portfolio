"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import type { Project, ProjectMedia } from "./projects";
import { useIntro } from "./SiteIntro";
import styles from "./CrtPreview.module.css";

const width = 320;
const gap = 28;
const imageHold = 1800;

type Shown = { project: Project; number: number };

// The disk drive in the monitor's top. Positions are the mini disk's offset from the top edge
// of the monitor: out sits wholly above the slot, seated leaves the label's end showing, its
// coloured band and number.
const diskOut = -92;
const diskSeated = -11;
const eject = { duration: 120, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)" };
const insert = { duration: 210 };
// The drive's head seeking once the disk latches, before the picture comes up.
const seekMs = 110;
// How long the monitor stays off before its drive is emptied, so a quick slide off and back
// onto the list keeps the disk in.
const resetMs = 320;

/**
 * A little CRT monitor that floats beside the cursor while a project row is hovered, playing
 * that project's screenshots and clips. It trails the cursor and leans with its speed.
 * Each project is a floppy that drops into the drive in the monitor's top; moving to another
 * project ejects the disk, loads the new one and changes channel with a burst of static.
 * Moving on mid-load reverses the disk out from wherever it is, so fast scanning only ever
 * loads the latest one. Mouse only: on touch screens the same media is in the project window.
 */
export function CrtPreview({
  project,
  number,
}: {
  project: Project | null;
  number: number;
}) {
  const reduceMotion = useReducedMotion();
  const { playCue } = useIntro();
  const monitorRef = useRef<HTMLDivElement>(null);
  const diskRef = useRef<HTMLDivElement>(null);
  const pointerRef = useRef({ x: 0, y: 0 });
  // Keep showing the last project while the monitor fades out.
  const [shown, setShown] = useState<Shown | null>(null);
  if (project && (project !== shown?.project || number !== shown.number)) {
    setShown({ project, number });
  }
  const visible = Boolean(project);
  // What's in the drive (the mini disk's face), and what's playing on the screen.
  const [disk, setDisk] = useState<Shown | null>(null);
  const [loaded, setLoaded] = useState<Shown | null>(null);
  const loading = Boolean(shown) && loaded?.project !== shown?.project;

  const drive = useRef({
    target: null as Shown | null,
    inDrive: null as Shown | null,
    running: false,
    inserting: false,
    // Bumped to abandon a load in progress (the drive being emptied).
    generation: 0,
    slide: null as Animation | null,
  });

  // Load the shown project: eject what's in, insert the new disk, seek, then play. Runs one
  // load at a time; a newer target cancels an insert mid-slide and the loop catches up.
  useEffect(() => {
    const state = drive.current;
    if (!visible || !shown) return;
    state.target = shown;
    if (state.inDrive?.project === shown.project) return;
    // Mid-insert: stop the disk where it is (committed, as cancelling alone would snap it
    // back), and the running load ejects it from there.
    if (state.inserting && state.slide) {
      state.slide.commitStyles();
      state.slide.cancel();
    }
    if (state.running) return;

    const element = diskRef.current;
    if (!element) return;
    // Slide from wherever the disk is now (mid-animation included) to `keyframes`' end.
    const slide = (keyframes: Keyframe[], timing: KeyframeAnimationOptions) => {
      const style = getComputedStyle(element);
      const from = { transform: style.transform, opacity: style.opacity };
      state.slide?.cancel();
      const animation = element.animate([from, ...keyframes], { ...timing, fill: "forwards" });
      state.slide = animation;
      return animation.finished.then(
        () => true,
        () => false,
      );
    };
    const wait = (ms: number) => new Promise((done) => window.setTimeout(done, ms));
    const at = (y: number) => `translateY(${y}px)`;

    const run = async () => {
      const generation = state.generation;
      const current = () => state.generation === generation;
      state.running = true;
      try {
        // Out of the effect first: flushSync (to swap the disk's face) can't run inside one.
        await Promise.resolve();
        while (current() && state.target && state.inDrive?.project !== state.target.project) {
          if (state.inDrive) {
            playCue("driveEject");
            if (reduceMotion) {
              await slide([{ transform: at(diskOut), opacity: 0 }], { duration: 0 });
            } else {
              await slide(
                [
                  { transform: at(diskOut), opacity: 1, offset: 0.75 },
                  { transform: at(diskOut - 6), opacity: 0 },
                ],
                eject,
              );
            }
            state.inDrive = null;
          }
          const next = state.target;
          if (!current() || !next) break;
          state.inDrive = next;
          flushSync(() => setDisk(next));
          state.inserting = true;
          const seated = reduceMotion
            ? await slide([{ transform: at(diskSeated), opacity: 1 }], { duration: 0 })
            : await slide(
                [
                  { transform: at(diskOut - 14), opacity: 0, offset: 0, easing: "ease-out" },
                  { transform: at(diskOut), opacity: 1, offset: 0.25, easing: "cubic-bezier(0.5, 0, 0.9, 0.6)" },
                  { transform: at(diskSeated), opacity: 1 },
                ],
                insert,
              );
          state.inserting = false;
          // Cancelled mid-slide: the loop ejects it from where it stopped.
          if (!seated || !current()) continue;
          playCue("driveLoad");
          await wait(reduceMotion ? 0 : seekMs);
          if (current() && state.target?.project === next.project) setLoaded(next);
        }
      } finally {
        if (current()) state.running = false;
      }
    };
    void run();
  }, [playCue, reduceMotion, shown, visible]);

  // Switched off for a moment: empty the drive, so the next project loads fresh.
  useEffect(() => {
    if (visible) return;
    const state = drive.current;
    const timer = window.setTimeout(() => {
      state.generation++;
      state.running = false;
      state.inserting = false;
      state.slide?.cancel();
      state.slide = null;
      diskRef.current?.style.removeProperty("transform");
      diskRef.current?.style.removeProperty("opacity");
      state.inDrive = null;
      state.target = null;
      setDisk(null);
      setLoaded(null);
    }, resetMs);
    return () => window.clearTimeout(timer);
  }, [visible]);

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
      data-loading={loading || undefined}
      aria-hidden="true"
    >
      {/* Behind the body, so the monitor's top hides whatever is inside the drive. */}
      <div className={styles.drive}>
        <div ref={diskRef} className={styles.disk} style={disk ? diskColors(disk.project) : undefined}>
          <span className={styles.diskShutter} />
          <span className={styles.diskLabel}>
            <span className={styles.diskBand}>{String(disk?.number ?? 0).padStart(2, "0")}</span>
            <span className={styles.diskTitle}>{disk?.project.title}</span>
          </span>
        </div>
      </div>
      <div className={styles.body}>
        <span className={styles.slot} />
        <div className={styles.screen}>
          {loaded && !loading && (
            <Reel key={`reel-${loaded.project.id}`} media={loaded.project.media ?? []} />
          )}
          {loaded && !loading && !loaded.project.media?.length && (
            <span className={styles.noSignal}>No signal</span>
          )}
          {/* Snow while the disk loads, then a burst as the picture comes up (replayed on
              every channel change by its key). */}
          {loading ? (
            <span className={styles.snow} />
          ) : (
            <span key={`static-${loaded?.project.id}`} className={styles.static} />
          )}
          <span className={styles.scanlines} />
          <span className={styles.glass} />
        </div>
        <div className={styles.chin}>
          <span className={styles.channel}>
            {loading ? "LOAD" : `CH ${String(loaded?.number ?? 0).padStart(2, "0")}`}
          </span>
          <span className={styles.title}>{(disk ?? shown)?.project.title}</span>
          <span className={styles.activity} />
          <span className={styles.power} />
        </div>
      </div>
      <div className={styles.stand} />
    </div>
  );
}

const diskColors = (project: Project) =>
  ({ "--disk": project.disk, "--disk-ink": project.ink }) as CSSProperties;

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
