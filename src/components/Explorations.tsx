"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import clsx from "clsx";
import { useReducedMotion } from "framer-motion";
import { ArrowIcon } from "./icons/ArrowIcon";
import { useIntro } from "./SiteIntro";
import key from "./about/Keycap.module.css";
import styles from "./Explorations.module.css";

// Figma prototypes from teaching myself to design, recorded and cut down in
// public/work/figma, favourites first. `fit` is how a clip sits in its 4:3 frame: the 4:3
// recordings fill it; square and phone ones stand in it, on `ground`, their own background.
export const clips: {
  id: string;
  name: string;
  fit?: "contain";
  ground?: string;
}[] = [
  { id: "note", name: "New note", fit: "contain", ground: "#000" },
  { id: "gallery", name: "Gallery expand" },
  { id: "music", name: "Music app landing", fit: "contain", ground: "#000" },
  { id: "fruit-menu", name: "Menu scroll", fit: "contain", ground: "#000" },
  { id: "popup-stack", name: "Pop-up stack" },
  // The three yellow ones are spread out, so no two sit side by side or one above the
  // other in the grid, and stand on black rather than their yellow.
  { id: "card-stack", name: "3D card stack", fit: "contain", ground: "#000" },
  { id: "folder", name: "Move to folder", fit: "contain", ground: "#fff" },
  { id: "swipe-stack", name: "Swipe stack", fit: "contain", ground: "#000" },
  { id: "add-cash", name: "Add cash" },
  { id: "carousel", name: "Card carousel", fit: "contain", ground: "#000" },
  { id: "create-new", name: "Create new" },
  { id: "loading", name: "Loading into the app" },
  { id: "glass-profile", name: "Glass profile card" },
  { id: "counter", name: "Counter", fit: "contain", ground: "#fff" },
];

/**
 * The practice page's board: every prototype in a frame of the same shape, numbered like
 * the case studies' parts, in the About page's raised panel. Each clip loops while it's on
 * screen and rests on its first frame otherwise; with reduced motion, none plays until
 * asked to.
 */
export function PracticeBoard() {
  return (
    <section className={styles.card} aria-labelledby="prototypes-heading">
      <div className={styles.bar}>
        <h2 id="prototypes-heading" className={styles.heading}>
          Prototypes
        </h2>
        <span className={styles.count}>
          {String(clips.length).padStart(2, "0")}
        </span>
      </div>
      <ol className={styles.board}>
        {clips.map((clip, i) => (
          <Shot key={clip.id} clip={clip} index={i} />
        ))}
      </ol>
    </section>
  );
}

function Shot({
  clip,
  index,
}: {
  clip: (typeof clips)[number];
  index: number;
}) {
  const ref = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const video = ref.current;
    if (!video || reduceMotion) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { threshold: 0.3 },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reduceMotion]);

  return (
    <li className={styles.shot}>
      <div
        className={clsx(styles.frame, clip.fit === "contain" && styles.contain)}
        style={{ background: clip.ground }}
      >
        <video
          ref={ref}
          src={`/work/figma/${clip.id}.mp4`}
          poster={`/work/figma/${clip.id}.jpg`}
          preload="none"
          muted
          loop
          playsInline
          controls={reduceMotion ?? false}
          aria-label={clip.name}
        />
      </div>
      <p className={styles.name}>
        <span className={styles.index}>
          {String(index + 1).padStart(2, "0")}
        </span>
        {clip.name}
      </p>
    </li>
  );
}

/**
 * The way to /playground, the same wherever it's offered (the home page's list, the About
 * page's milestones): mono capitals and the lavender arrow of the Figma practice line.
 */
export function PrototypesLink({ className }: { className?: string }) {
  // Its own sounds, like the Résumé key's: data-feel only sounds inside PageSound (/about),
  // and this key sits on the home page too.
  const { playCue } = useIntro();
  return (
    <Link
      href="/playground"
      className={clsx(key.key, key.cream, styles.prototypesLink, className)}
      onMouseEnter={() => playCue("tap")}
      onPointerDown={() => playCue("land")}
    >
      Go to my playground
      <PracticeArrow size={14} />
    </Link>
  );
}

/** The lavender arrow that leads to the Figma practice, on its links and its ruler label. */
export function PracticeArrow({ size }: { size: number }) {
  return (
    <span className={styles.arrow}>
      <ArrowIcon size={size} animated={false} />
    </span>
  );
}

/** Figma's mark, in its own colours. */
export function FigmaLogo({ size = 12 }: { size?: number }) {
  return (
    <svg
      aria-hidden="true"
      width={(size * 2) / 3}
      height={size}
      viewBox="0 0 32 48"
      fill="none"
      style={{ flex: "none" }}
    >
      <path
        fill="#00B6FF"
        d="M16 23.059A7.06 7.06 0 0 1 23.06 16H24a8 8 0 1 1 0 16h-.941A7.06 7.06 0 0 1 16 24.941z"
      />
      <path fill="#24CB71" d="M0 40a8 8 0 0 1 8-8h8v8a8 8 0 1 1-16 0" />
      <path fill="#FF7237" d="M16 0v16h8a8 8 0 1 0 0-16z" />
      <path fill="#FF3737" d="M0 8a8 8 0 0 0 8 8h8V0H8a8 8 0 0 0-8 8" />
      <path fill="#874FFF" d="M0 24a8 8 0 0 0 8 8h8V16H8a8 8 0 0 0-8 8" />
    </svg>
  );
}
