"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import clsx from "clsx";
import {
  WebsiteShaderBackground,
  kineticGrid,
  revealDelay,
} from "./WebsiteShaderCanvas";
import {
  createPointerSounds,
  playRevealSound,
  type PointerSounds,
} from "./revealSound";
import styles from "./SiteIntro.module.css";

const revealDuration = 1.8;
// Pointer speed, in px per ms, that counts as a full-speed sweep for the hover ticks.
const fastPointerSpeed = 2.5;

interface SiteIntroProps {
  children: ReactNode;
}

/**
 * Holds the page on a dark grid behind an Enter prompt. Entering is the user gesture that
 * lets the browser play sound, so the ripple and its sound start together, and the
 * cursor's hover ticks can play afterwards.
 */
export function SiteIntro({ children }: SiteIntroProps) {
  const [entered, setEntered] = useState(false);
  const [gateGone, setGateGone] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const audioRef = useRef<AudioContext | null>(null);
  const soundsRef = useRef<PointerSounds | null>(null);
  const revealEndsAtRef = useRef(0);

  // After the ripple settles, each grid cell the cursor enters ticks (a little higher toward
  // the top of the screen, lighter on fast sweeps) and each press clacks.
  useEffect(() => {
    if (!entered || !soundOn) return;

    const { cols, rows } = kineticGrid;
    let lastCell = -1;
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;

    const handlePointerMove = (event: PointerEvent) => {
      const sounds = soundsRef.current;
      const now = performance.now();
      const elapsed = Math.max(now - lastTime, 1);
      const speed = Math.min(
        Math.hypot(event.clientX - lastX, event.clientY - lastY) /
          elapsed /
          fastPointerSpeed,
        1,
      );
      lastX = event.clientX;
      lastY = event.clientY;
      lastTime = now;

      const col = Math.floor((event.clientX / window.innerWidth) * cols);
      const row = Math.floor((event.clientY / window.innerHeight) * rows);
      const cell = row * cols + col;
      if (cell === lastCell) return;
      lastCell = cell;

      if (!sounds || now < revealEndsAtRef.current) return;
      sounds.tick(
        (rows - 1 - row) / (rows - 1),
        speed,
        event.clientX / window.innerWidth,
      );
    };

    // Pressing anywhere sends a shockwave through the grid; this is its sound.
    const handlePointerDown = (event: PointerEvent) => {
      const sounds = soundsRef.current;
      if (!sounds || performance.now() < revealEndsAtRef.current) return;
      sounds.press(
        1 - event.clientY / window.innerHeight,
        event.clientX / window.innerWidth,
      );
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [entered, soundOn]);

  // Must run inside a click so the browser lets the audio start.
  const startAudio = () => {
    let context = audioRef.current;
    if (!context) {
      context = new AudioContext();
      audioRef.current = context;
      soundsRef.current = createPointerSounds(context);
    }
    void context.resume();
    return context;
  };

  const enter = (withSound: boolean) => {
    if (entered) return;
    revealEndsAtRef.current =
      performance.now() + (revealDelay + revealDuration) * 1000;

    if (withSound) {
      try {
        playRevealSound(startAudio(), revealDuration);
        setSoundOn(true);
      } catch {
        // No Web Audio support: the ripple still plays, silently.
      }
    }

    setEntered(true);
  };

  const toggleSound = () => {
    if (soundOn) {
      void audioRef.current?.suspend();
      setSoundOn(false);
      return;
    }

    try {
      startAudio();
      setSoundOn(true);
    } catch {
      // No Web Audio support: leave sound off.
    }
  };

  return (
    <>
      <WebsiteShaderBackground
        preset="kinetic-dots"
        tone="light"
        revealDuration={revealDuration}
        revealPaused={!entered}
      />
      {children}
      {entered && (
        <button
          type="button"
          className={styles.soundToggle}
          onClick={toggleSound}
          aria-pressed={soundOn}
        >
          Sound {soundOn ? "on" : "off"}
        </button>
      )}
      {!gateGone && (
        <div
          className={clsx(styles.gate, entered && styles.gateHidden)}
          onTransitionEnd={(event) => {
            // Ignore the buttons' own hover transitions bubbling up.
            if (entered && event.target === event.currentTarget) {
              setGateGone(true);
            }
          }}
        >
          <button
            type="button"
            className={styles.enter}
            onClick={() => enter(true)}
            autoFocus
          >
            Enter
          </button>
          <p className={styles.hint}>Best with sound on</p>
          <button
            type="button"
            className={styles.silent}
            onClick={() => enter(false)}
          >
            Enter without sound
          </button>
        </div>
      )}
    </>
  );
}
