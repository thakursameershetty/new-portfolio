"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import clsx from "clsx";
import { useReducedMotion } from "framer-motion";
import { clips, PracticeArrow } from "./Explorations";
import { useIntro } from "./SiteIntro";
import key from "./about/Keycap.module.css";
import styles from "./Playground.module.css";

// The prototypes on the home page's moodboard, in three columns of the same height: a tall
// tile (the phone recordings) and a wide one (4:3) in each of the first two, a square and
// a wide one in the third, its last tile stretching to fill. The two yellow clips are kept
// apart, as on the playground page.
type Shape = "tall" | "square" | "wide";
const columns: { id: string; shape: Shape }[][] = [
  [
    { id: "note", shape: "tall" },
    { id: "gallery", shape: "wide" },
  ],
  [
    { id: "popup-stack", shape: "wide" },
    { id: "music", shape: "tall" },
  ],
  [
    { id: "card-stack", shape: "square" },
    { id: "folder", shape: "wide" },
  ],
];

const withClip = (pick: { id: string; shape: Shape }) => ({
  ...pick,
  ...clips.find((clip) => clip.id === pick.id)!,
});

/**
 * Before the footer: a moodboard of the Figma prototypes, each tile looping while it's on
 * screen, and a key through to the playground with the rest.
 */
export function Playground() {
  const { playCue } = useIntro();

  return (
    <section
      id="playground"
      className={styles.playground}
      aria-labelledby="playground-heading"
    >
      <div className={styles.head}>
        <div>
          <h2 id="playground-heading" className={styles.label}>
            Playground
          </h2>
          <p className={styles.line}>
            If my Figma files were a moodboard.{" "}
            <span className={styles.muted}>
              Small ideas, tried out to see how they feel.
            </span>
          </p>
        </div>
        <Link
          href="/playground"
          className={clsx(key.key, key.cream, styles.viewAll)}
          onMouseEnter={() => playCue("tap")}
          onPointerDown={() => playCue("land")}
        >
          View all {clips.length}
          <PracticeArrow size={14} />
        </Link>
      </div>

      <div className={styles.board}>
        {columns.map((column, i) => (
          <ul key={i} className={styles.column}>
            {column.map((pick) => (
              <Tile key={pick.id} tile={withClip(pick)} />
            ))}
          </ul>
        ))}
      </div>
    </section>
  );
}

function Tile({ tile }: { tile: ReturnType<typeof withClip> }) {
  const { playCue } = useIntro();
  const ref = useRef<HTMLVideoElement>(null);
  const reduceMotion = useReducedMotion();

  // Plays while it's on screen, rests on its first frame otherwise.
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
    <li className={clsx(styles.tile, styles[tile.shape])}>
      <Link
        href="/playground"
        className={clsx(styles.frame, tile.fit === "contain" && styles.contain)}
        style={{ background: tile.ground }}
        onMouseEnter={() => playCue("tap")}
        onPointerDown={() => playCue("land")}
      >
        <video
          ref={ref}
          src={`/work/figma/${tile.id}.mp4`}
          poster={`/work/figma/${tile.id}.jpg`}
          preload="none"
          muted
          loop
          playsInline
          aria-hidden="true"
        />
        <span className={styles.caption}>{tile.name}</span>
      </Link>
    </li>
  );
}
