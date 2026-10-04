"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { tracks } from "./about/taste";
import * as music from "./music";
import { feel } from "./SiteIntro";
import key from "./about/Keycap.module.css";
import styles from "./MiniPlayer.module.css";
import { MaterialIcon } from "./icons/MaterialIcon";

// The disc in the corner, and its gap from the edges (px).
const size = 72;
const margin = 20;
const ease = [0.22, 1, 0.36, 1] as const;

const format = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

// How far the disc sits from the big player's record, so it can fly out of it (and back).
function fromRecord() {
  const rect = music.bigRecordRect();
  if (!rect || typeof window === "undefined") return null;
  const cx = margin + size / 2;
  const cy = window.innerHeight - margin - size / 2;
  return {
    x: rect.left + rect.width / 2 - cx,
    y: rect.top + rect.height / 2 - cy,
    scale: rect.width / size,
  };
}

type Flight = { stopped: boolean; from: ReturnType<typeof fromRecord> };

const discVariants = {
  hidden: ({ from }: Flight) =>
    from
      ? { x: from.x, y: from.y, scale: from.scale, rotate: -160, opacity: 0.6 }
      : { x: 0, y: 0, scale: 0.3, rotate: -200, opacity: 0 },
  shown: { x: 0, y: 0, scale: 1, rotate: 0, opacity: 1 },
  gone: ({ stopped, from }: Flight) =>
    stopped || !from
      ? {
          scale: 0,
          rotate: 420,
          opacity: 0,
          transition: { duration: 0.55, ease },
        }
      : {
          x: from.x,
          y: from.y,
          scale: from.scale,
          rotate: 160,
          opacity: 0,
          transition: { duration: 0.6, ease },
        },
};

/**
 * The music, when it's playing somewhere the big player isn't: a small record spinning in
 * the bottom-left corner (the ID card docks bottom-right), with its progress running round
 * it. It flies out of the big player's record as the visitor scrolls away, and back into it
 * as they return; on any other page it just drops in. Clicking it opens the player as a
 * pop-up, to play, pause, skip, seek, go to the About page, or stop, and when the music
 * stops the disc spins away.
 */
export function MiniPlayer() {
  const player = music.useMusic();
  const reduced = useReducedMotion();
  const [open, setOpen] = useState(false);
  // Where the box was when it was clicked: the pop-up grows out of it, and shrinks back in.
  const [origin, setOrigin] = useState<{ x: number; y: number } | null>(null);
  const discRef = useRef<HTMLButtonElement>(null);

  const loaded = player.track !== null;
  const shown = loaded && (!player.bigShown || open);
  const flight: Flight = {
    stopped: !loaded,
    from: reduced ? null : fromRecord(),
  };
  const progress = player.duration ? player.time / player.duration : 0;
  const track = loaded ? tracks[player.track!] : null;

  // The song's art, fetched and decoded as soon as the box shows, so the pop-up's cover is
  // ready to draw the moment it opens (even on a first visit).
  const artwork = track?.artwork;
  useEffect(() => {
    if (!artwork) return;
    const image = new Image();
    image.src = artwork;
    image.decode().catch(() => {});
  }, [artwork]);

  // Stopped with the pop-up open: it closes, and the disc spins away.
  const modalOpen = open && loaded;

  // Esc closes the pop-up; focus goes back to the disc.
  useEffect(() => {
    if (!modalOpen) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [modalOpen]);

  const close = () => {
    setOpen(false);
    discRef.current?.focus();
  };

  return (
    <>
      <AnimatePresence custom={flight}>
        {shown && track && (
          <motion.button
            key="disc"
            ref={discRef}
            type="button"
            className={styles.disc}
            custom={flight}
            variants={discVariants}
            initial="hidden"
            animate="shown"
            exit="gone"
            transition={reduced ? { duration: 0 } : { duration: 0.7, ease }}
            whileHover={reduced ? undefined : { scale: 1.07 }}
            whileTap={{ scale: 0.94 }}
            onClick={(event) => {
              feel("diskTap");
              const box = event.currentTarget.getBoundingClientRect();
              setOrigin({
                x: box.left + box.width / 2,
                y: box.top + box.height / 2,
              });
              setOpen(true);
            }}
            aria-haspopup="dialog"
            aria-label={`${player.playing ? "Playing" : "Paused"}: ${track.title} by ${track.artist}. Open the player`}
          >
            {/* A MiniDisc: a frosted shell with screws in its corners, a black record inside
                (its sheen holding still against the light while the label, the song's art,
                turns as it plays), and a metal shutter whose foot fills in red as the
                preview runs. */}
            <span aria-hidden="true" className={styles.shell}>
              <span className={clsx(styles.screw, styles.screwTL)} />
              <span className={clsx(styles.screw, styles.screwTR)} />
              <span className={clsx(styles.screw, styles.screwBL)} />
              <span className={clsx(styles.screw, styles.screwBR)} />
              <span className={styles.cd}>
                <span
                  className={clsx(
                    styles.hub,
                    player.playing && !reduced && styles.spinning,
                  )}
                >
                  <span
                    className={styles.hubArt}
                    style={{ backgroundImage: `url("${track.artwork}")` }}
                  />
                </span>
              </span>
              <span className={styles.shutter}>
                <svg viewBox="0 0 24 12" className={styles.infinity}>
                  <path d="M12 6c-2-3-4.2-4.2-6.3-4.2A4.2 4.2 0 0 0 1.5 6a4.2 4.2 0 0 0 4.2 4.2C7.8 10.2 10 9 12 6Zm0 0c2 3 4.2 4.2 6.3 4.2A4.2 4.2 0 0 0 22.5 6a4.2 4.2 0 0 0-4.2-4.2C16.2 1.8 14 3 12 6Z" />
                </svg>
                <span className={styles.shutterMeter}>
                  <span
                    className={styles.shutterFill}
                    style={{ transform: `scaleX(${progress})` }}
                  />
                </span>
              </span>
            </span>
            <span aria-hidden="true" className={styles.name}>
              <span className={styles.nameArtist}>{track.artist}</span>
              <span className={styles.nameTitle}>{track.title}</span>
            </span>
          </motion.button>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {modalOpen && track && (
          <PopUp
            key="pop"
            origin={origin}
            track={track}
            player={player}
            onClose={close}
            onStop={() => {
              feel("diskOut");
              setOpen(false);
              music.stop();
            }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// The pop-up's width, for scaling it down to the box it grows out of.
const panelWidth = 380;

function PopUp({
  origin,
  track,
  player,
  onClose,
  onStop,
}: {
  origin: { x: number; y: number } | null;
  track: (typeof tracks)[number];
  player: music.MusicState;
  onClose: () => void;
  onStop: () => void;
}) {
  const reduced = useReducedMotion();
  const pathname = usePathname();
  const onAbout = pathname === "/about";
  const progress = player.duration ? player.time / player.duration : 0;
  const closeRef = useRef<HTMLButtonElement>(null);

  // The morph: the panel starts on the box, at its size, and springs out to the middle of
  // the screen (it's centred there), and goes back the same way. Only transform and opacity
  // move, so it stays on the GPU. Its insides wait for it: the cover settles, the record
  // rolls out from behind it, then the rest fades up, so no text is ever seen mid-stretch.
  const from =
    origin && !reduced && typeof window !== "undefined"
      ? {
          x: origin.x - window.innerWidth / 2,
          y: origin.y - window.innerHeight / 2,
          scale: size / Math.min(panelWidth, window.innerWidth - 40),
        }
      : null;
  const inside = (order: number) =>
    reduced
      ? {}
      : {
          initial: { opacity: 0, y: 8 },
          animate: { opacity: 1, y: 0 },
          transition: { delay: 0.3 + order * 0.05, duration: 0.35, ease },
        };

  useEffect(() => {
    closeRef.current?.focus();
  }, []);

  return (
    <motion.div
      className={styles.backdrop}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: reduced ? 0 : 0.22 }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <motion.div
        role="dialog"
        aria-modal="true"
        aria-label="Now playing"
        className={styles.panel}
        style={{ willChange: "transform, opacity" }}
        initial={
          reduced
            ? false
            : from
              ? { x: from.x, y: from.y, scale: from.scale, opacity: 0.85 }
              : { opacity: 0, y: 40, scale: 0.94 }
        }
        animate={{ x: 0, y: 0, scale: 1, opacity: 1 }}
        exit={
          reduced
            ? { opacity: 0 }
            : from
              ? {
                  x: from.x,
                  y: from.y,
                  scale: from.scale,
                  opacity: 0,
                  transition: { duration: 0.34, ease: [0.55, 0, 0.8, 0.4] },
                }
              : { opacity: 0, y: 30, scale: 0.96 }
        }
        transition={{
          type: "spring",
          stiffness: 200,
          damping: 25,
          opacity: { duration: 0.12 },
        }}
      >
        <div className={styles.bar}>
          <p className={styles.heading}>Now playing</p>
          <button
            ref={closeRef}
            type="button"
            className={clsx(key.key, key.square)}
            onClick={onClose}
            aria-label="Close"
          >
            <svg
              aria-hidden="true"
              width="18"
              height="18"
              viewBox="0 0 24 24"
              fill="none"
            >
              <path
                d="M6 6l12 12M18 6 6 18"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </svg>
          </button>
        </div>

        <div className={styles.deck}>
          {/* The record rolls out from behind the cover once the panel has opened, turning
              as it goes (the wrapper slides; the record inside spins while it plays). */}
          <motion.span
            aria-hidden="true"
            className={styles.recordSlot}
            initial={reduced ? false : { x: -96, rotate: -70 }}
            animate={{ x: 0, rotate: 0 }}
            transition={{ delay: reduced ? 0 : 0.26, duration: 0.7, ease }}
          >
            <span
              className={clsx(
                styles.bigRecord,
                player.playing && !reduced && styles.spinning,
              )}
            >
              <span
                className={styles.bigLabel}
                style={{ backgroundImage: `url("${track.artwork}")` }}
              />
            </span>
          </motion.span>
          <motion.img
            src={track.artwork}
            alt={`${track.album} cover`}
            className={styles.sleeve}
            initial={reduced ? false : { scale: 0.86, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: reduced ? 0 : 0.1, duration: 0.45, ease }}
          />
        </div>

        <motion.div {...inside(0)} className={styles.flipWrap}>
          <div key={track.title} className={styles.flip}>
            <p className={styles.artist}>{track.artist}</p>
            <p className={styles.title}>{track.title}</p>
          </div>
        </motion.div>

        <motion.div {...inside(1)} className={styles.stretch}>
          <div
            role="slider"
            tabIndex={0}
            aria-label="Position in the preview"
            aria-valuemin={0}
            aria-valuemax={Math.round(player.duration)}
            aria-valuenow={Math.round(player.time)}
            aria-valuetext={`${format(player.time)} of ${format(player.duration)}`}
            className={styles.readout}
            style={{ "--progress": progress } as React.CSSProperties}
            onPointerDown={(event) => {
              const bar = event.currentTarget;
              bar.setPointerCapture(event.pointerId);
              const seekTo = (x: number) => {
                const rect = bar.getBoundingClientRect();
                music.seek(((x - rect.left) / rect.width) * player.duration);
              };
              seekTo(event.clientX);
              const move = (e: PointerEvent) => seekTo(e.clientX);
              bar.addEventListener("pointermove", move);
              bar.addEventListener(
                "pointerup",
                () => bar.removeEventListener("pointermove", move),
                {
                  once: true,
                },
              );
            }}
            onKeyDown={(event) => {
              if (event.key === "ArrowRight") music.seek(player.time + 5);
              else if (event.key === "ArrowLeft") music.seek(player.time - 5);
              else return;
              event.preventDefault();
            }}
          >
            <span className={styles.digits}>
              {format(player.time)}
              <span className={styles.slash}>/</span>
              {format(player.duration)}
            </span>
            <span aria-hidden="true" className={styles.meter} />
          </div>
        </motion.div>

        <motion.div {...inside(2)} className={styles.transport}>
          <button
            type="button"
            className={clsx(key.key, key.square)}
            onClick={() => {
              feel("remoteKey");
              music.step(-1);
            }}
            aria-label="Previous song"
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
              <path d="M11 6v12L3 12zM20 6v12l-8-6z" fill="currentColor" />
            </svg>
          </button>
          <button
            type="button"
            className={clsx(key.key, key.square, key.big, key.cream)}
            onClick={() => {
              feel(player.playing ? "switchOff" : "switchOn");
              music.toggle();
            }}
            aria-label={player.playing ? "Pause" : "Play"}
          >
            {player.playing ? (
              <MaterialIcon name="pause" size={28} />
            ) : (
              <MaterialIcon name="play" size={28} />
            )}
          </button>
          <button
            type="button"
            className={clsx(key.key, key.square)}
            onClick={() => {
              feel("remoteKey");
              music.step(1);
            }}
            aria-label="Next song"
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
              <path d="M13 6v12l8-6zM4 6v12l8-6z" fill="currentColor" />
            </svg>
          </button>
        </motion.div>

        <motion.div {...inside(3)} className={styles.actions}>
          {onAbout ? (
            <button
              type="button"
              className={key.key}
              onClick={() => {
                onClose();
                document.getElementById("listening")?.scrollIntoView({
                  behavior: reduced ? "auto" : "smooth",
                  block: "center",
                });
              }}
            >
              Show player
            </button>
          ) : (
            <Link href="/about#listening" className={key.key} onClick={onClose}>
              Go to About
              <svg
                aria-hidden="true"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
          )}
          <button
            type="button"
            className={clsx(key.key, styles.stop)}
            onClick={onStop}
          >
            <svg aria-hidden="true" width="14" height="14" viewBox="0 0 24 24">
              <rect
                x="5"
                y="5"
                width="14"
                height="14"
                rx="2"
                fill="currentColor"
              />
            </svg>
            Stop
          </button>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
