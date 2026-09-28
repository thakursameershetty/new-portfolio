"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { AnimatePresence, LayoutGroup, motion, useReducedMotion } from "framer-motion";
import { tracks, type Track } from "./taste";
import key from "./Keycap.module.css";
import styles from "./ListeningTo.module.css";

// How many covers the shelf fans out at once, and how long the volume ramps take (ms), so
// starting, pausing and skipping never click.
const shelfSize = 9;
const fadeIn = 260;
const fadeOut = 160;
// How far (px) the covers either side of the one picked part to make room for it, the
// nearest most.
const part = 22;
const spring = { type: "spring", stiffness: 380, damping: 34 } as const;
const ease = [0.22, 1, 0.36, 1] as const;

const format = (seconds: number) => {
  const s = Math.max(0, Math.floor(seconds));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

function shuffled(count: number) {
  const order = Array.from({ length: count }, (_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
}

/**
 * "Listening to…": a crate of records. Sliding across the shelf flips through them, one
 * lifting clear while its neighbours part; pick one to open the player, where the sleeve
 * slides over, the record rolls out and spins, and its 30-second preview plays (media keys
 * and the lock screen work too, through the Media Session API).
 */
export function ListeningTo() {
  const reduced = useReducedMotion();
  const [order, setOrder] = useState(() => tracks.map((_, i) => i).slice(0, shelfSize));
  const [spins, setSpins] = useState(0);
  const [open, setOpen] = useState<number | null>(null);
  const step = useCallback(
    (by: number) =>
      setOpen((current) =>
        current === null ? current : (current + by + tracks.length) % tracks.length,
      ),
    [],
  );
  // A preview that runs out moves on to the next song.
  const player = usePreview(open === null ? null : tracks[open], () => step(1));

  // Media keys and the lock screen's controls.
  useEffect(() => {
    if (open === null || !("mediaSession" in navigator)) return;
    const track = tracks[open];
    navigator.mediaSession.metadata = new MediaMetadata({
      title: track.title,
      artist: track.artist,
      album: track.album,
      artwork: [{ src: track.artwork, sizes: "600x600", type: "image/jpeg" }],
    });
    navigator.mediaSession.setActionHandler("previoustrack", () => step(-1));
    navigator.mediaSession.setActionHandler("nexttrack", () => step(1));
    return () => {
      navigator.mediaSession.setActionHandler("previoustrack", null);
      navigator.mediaSession.setActionHandler("nexttrack", null);
    };
  }, [open, step]);

  return (
    <LayoutGroup>
      <motion.div layout transition={spring} className={styles.card}>
        <AnimatePresence mode="popLayout" initial={false}>
          {open === null ? (
            <motion.div
              key="shelf"
              className={styles.view}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className={styles.bar}>
                <h3 className={styles.heading}>Listening to…</h3>
                <button
                  type="button"
                  className={key.key}
                  onClick={() => {
                    setOrder(shuffled(tracks.length).slice(0, shelfSize));
                    setSpins((n) => n + 1);
                  }}
                >
                  <motion.svg
                    aria-hidden="true"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    animate={{ rotate: reduced ? 0 : spins * 360 }}
                    transition={{ duration: 0.6, ease }}
                  >
                    <path
                      d="M20 11a8 8 0 0 0-14.8-4.2M4 13a8 8 0 0 0 14.8 4.2M20 4v5h-5M4 20v-5h5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </motion.svg>
                  Shuffle
                </button>
              </div>

              <Shelf
                order={order}
                onOpen={(index) => {
                  player.start(tracks[index]);
                  setOpen(index);
                }}
              />
            </motion.div>
          ) : (
            <motion.div
              key="player"
              className={styles.view}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <div className={styles.bar}>
                <button
                  type="button"
                  className={key.key}
                  onClick={() => {
                    player.stop();
                    setOpen(null);
                  }}
                >
                  <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
                    <path d="m15 18-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Back
                </button>
                <a className={key.key} href={tracks[open].link} target="_blank" rel="noreferrer noopener">
                  <AppleMusicIcon />
                  Apple Music
                  <svg aria-hidden="true" width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M7 17 17 7M8 7h9v9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span className={styles.srOnly}> (opens in a new tab)</span>
                </a>
              </div>

              <Player
                track={tracks[open]}
                index={open}
                player={player}
                onPrevious={() => step(-1)}
                onNext={() => step(1)}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </LayoutGroup>
  );
}

/**
 * The covers, overlapping like records in a crate. Which one is picked follows the
 * pointer's position along the shelf (each cover owns an equal strip of it), not whichever
 * cover happens to be on top, so every record can be reached, even the ones a lifted cover
 * is hiding. The picked cover lifts clear and its neighbours part around it.
 */
function Shelf({ order, onOpen }: { order: number[]; onOpen: (index: number) => void }) {
  const [picked, setPicked] = useState<number | null>(null);
  const count = order.length;

  const pickAt = (event: React.PointerEvent<HTMLUListElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const slot = Math.floor(((event.clientX - rect.left) / rect.width) * count);
    setPicked(Math.min(Math.max(slot, 0), count - 1));
  };

  return (
    <ul
      className={styles.shelf}
      style={{ "--count": count } as React.CSSProperties}
      aria-label="Songs"
      onPointerMove={pickAt}
      onPointerDown={pickAt}
      onPointerLeave={() => setPicked(null)}
    >
      {order.map((index, slot) => {
        const track = tracks[index];
        const offset = picked === null ? 0 : slot - picked;
        const isPicked = picked === slot;
        return (
          <motion.li
            key={index}
            layout
            transition={spring}
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            className={clsx(styles.slot, isPicked && styles.slotPicked)}
            style={
              {
                "--slot": slot,
                // The nearest neighbours part the most; the ones further off, less.
                "--part": offset === 0 ? "0px" : `${Math.sign(offset) * (part / Math.abs(offset))}px`,
                zIndex: isPicked ? 100 : count - slot,
              } as React.CSSProperties
            }
          >
            <button
              type="button"
              className={styles.cover}
              onClick={() => onOpen(order[picked ?? slot])}
              onFocus={() => setPicked(slot)}
              onBlur={() => setPicked(null)}
              aria-label={`Play ${track.title} by ${track.artist}`}
            >
              <motion.img
                layoutId={`cover-${index}`}
                transition={spring}
                src={track.artwork}
                alt=""
                className={styles.art}
                draggable={false}
              />
              {/* On the right half of the shelf the label opens leftwards, so it stays inside. */}
              <span
                aria-hidden="true"
                className={clsx(styles.tip, slot > (count - 1) / 2 && styles.tipLeft)}
              >
                <span className={styles.tipArtist}>{track.artist}</span>
                <span className={styles.tipTitle}>{track.title}</span>
              </span>
            </button>
          </motion.li>
        );
      })}
    </ul>
  );
}

function Player({
  track,
  index,
  player,
  onPrevious,
  onNext,
}: {
  track: Track;
  index: number;
  player: ReturnType<typeof usePreview>;
  onPrevious: () => void;
  onNext: () => void;
}) {
  const reduced = useReducedMotion();
  const progress = player.duration ? player.time / player.duration : 0;

  return (
    <div className={styles.player}>
      <div className={styles.deck}>
        {/* The record rolls out from behind the sleeve once it lands, and spins while the
            song plays. Its label is the album art. */}
        <motion.div
          key={`record-${index}`}
          aria-hidden="true"
          className={clsx(styles.record, player.playing && !reduced && styles.recordSpinning)}
          initial={{ x: "0%", rotate: -30 }}
          animate={{ x: "66%", rotate: 0 }}
          transition={{ delay: reduced ? 0 : 0.28, duration: reduced ? 0 : 0.7, ease }}
        >
          <span className={styles.recordLabel} style={{ backgroundImage: `url("${track.artwork}")` }} />
        </motion.div>
        <motion.img
          layoutId={`cover-${index}`}
          transition={spring}
          src={track.artwork}
          alt={`${track.album} cover`}
          className={clsx(styles.art, styles.sleeve)}
          draggable={false}
        />
      </div>

      <div className={styles.info}>
        {/* The artist and title flip in like the Contact key's label with each new song. */}
        <div key={`title-${index}`} className={styles.flip}>
          <p className={styles.artist}>{track.artist}</p>
          <p className={styles.title}>{track.title}</p>
        </div>

        {/* A little readout: the time in the site's display type over a meter that fills
            as the preview plays. Drag or click along it (or use the arrow keys) to seek. */}
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
              player.seek(((x - rect.left) / rect.width) * player.duration);
            };
            seekTo(event.clientX);
            const move = (e: PointerEvent) => seekTo(e.clientX);
            bar.addEventListener("pointermove", move);
            bar.addEventListener("pointerup", () => bar.removeEventListener("pointermove", move), { once: true });
          }}
          onKeyDown={(event) => {
            if (event.key === "ArrowRight") player.seek(player.time + 5);
            else if (event.key === "ArrowLeft") player.seek(player.time - 5);
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

        {player.failed ? (
          <p className={styles.failed}>This preview won’t play here. Try Apple Music.</p>
        ) : (
          <div className={styles.transport}>
            <button
              type="button"
              className={clsx(key.key, key.square)}
              onClick={onPrevious}
              aria-label="Previous song"
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
                <path d="M11 6v12L3 12zM20 6v12l-8-6z" fill="currentColor" />
              </svg>
            </button>
            <button
              type="button"
              className={clsx(key.key, key.square, key.big, key.cream)}
              onClick={player.toggle}
              aria-label={player.playing ? "Pause" : "Play"}
            >
              {player.playing ? (
                <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24">
                  <rect x="6" y="5" width="4" height="14" rx="1" fill="currentColor" />
                  <rect x="14" y="5" width="4" height="14" rx="1" fill="currentColor" />
                </svg>
              ) : (
                <svg aria-hidden="true" width="22" height="22" viewBox="0 0 24 24">
                  <path d="M7 5v14l12-7z" fill="currentColor" />
                </svg>
              )}
            </button>
            <button
              type="button"
              className={clsx(key.key, key.square)}
              onClick={onNext}
              aria-label="Next song"
            >
              <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
                <path d="M13 6v12l8-6zM4 6v12l8-6z" fill="currentColor" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * One audio element for the page. `start` is called in the click that opens the player, so
 * browsers allow the sound; changing `track` after that keeps playing. Volume ramps in and
 * out so nothing clicks.
 */
function usePreview(track: Track | null, onEnded: () => void) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const onEndedRef = useRef(onEnded);
  useEffect(() => {
    onEndedRef.current = onEnded;
  }, [onEnded]);
  const rampRef = useRef(0);
  const wantRef = useRef(false);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [duration, setDuration] = useState(30);
  const [failed, setFailed] = useState(false);

  const audio = useCallback(() => {
    if (!audioRef.current) {
      const element = new Audio();
      element.preload = "auto";
      element.addEventListener("timeupdate", () => setTime(element.currentTime));
      element.addEventListener("loadedmetadata", () => {
        if (Number.isFinite(element.duration)) setDuration(element.duration);
      });
      element.addEventListener("play", () => setPlaying(true));
      element.addEventListener("pause", () => setPlaying(false));
      element.addEventListener("ended", () => onEndedRef.current());
      element.addEventListener("error", () => setFailed(true));
      audioRef.current = element;
    }
    return audioRef.current;
  }, []);

  const ramp = useCallback((to: number, ms: number, then?: () => void) => {
    const element = audioRef.current;
    if (!element) return;
    cancelAnimationFrame(rampRef.current);
    const from = element.volume;
    const began = performance.now();
    const tick = (now: number) => {
      const t = Math.min((now - began) / ms, 1);
      element.volume = from + (to - from) * t;
      if (t < 1) rampRef.current = requestAnimationFrame(tick);
      else then?.();
    };
    rampRef.current = requestAnimationFrame(tick);
  }, []);

  const play = useCallback(() => {
    const element = audio();
    wantRef.current = true;
    element.volume = 0;
    element
      .play()
      .then(() => ramp(1, fadeIn))
      .catch(() => {
        // Interrupted by a newer track, or blocked: leave it paused, the button still works.
      });
  }, [audio, ramp]);

  const pause = useCallback(() => {
    wantRef.current = false;
    ramp(0, fadeOut, () => audioRef.current?.pause());
  }, [ramp]);

  // Load each new track, and carry on playing if a song was playing.
  const src = track?.preview;
  useEffect(() => {
    if (!src) return;
    const element = audio();
    if (element.src === src) return;
    setFailed(false);
    setTime(0);
    element.src = src;
    if (wantRef.current) play();
  }, [src, audio, play]);

  useEffect(
    () => () => {
      cancelAnimationFrame(rampRef.current);
      audioRef.current?.pause();
    },
    [],
  );

  return {
    playing,
    time,
    duration,
    failed,
    // Called in the click that opens the player, so the browser (Safari especially) counts
    // it as the visitor's own play; the track effect then finds the song already loaded.
    start: (first: Track) => {
      // A Back pressed a moment ago may still be fading out; it mustn't stop this song.
      cancelAnimationFrame(rampRef.current);
      const element = audio();
      setFailed(false);
      setTime(0);
      element.src = first.preview;
      play();
    },
    stop: () => {
      wantRef.current = false;
      ramp(0, fadeOut, () => {
        const element = audioRef.current;
        if (!element) return;
        element.pause();
        element.removeAttribute("src");
        element.load();
      });
      setTime(0);
    },
    toggle: () => (playing ? pause() : play()),
    seek: (to: number) => {
      const element = audioRef.current;
      if (!element) return;
      element.currentTime = Math.min(Math.max(to, 0), duration - 0.05);
      setTime(element.currentTime);
    },
  };
}

function AppleMusicIcon() {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M9 18V6l11-2v12"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="6.5" cy="18" r="2.5" stroke="currentColor" strokeWidth="2" />
      <circle cx="17.5" cy="16" r="2.5" stroke="currentColor" strokeWidth="2" />
    </svg>
  );
}
