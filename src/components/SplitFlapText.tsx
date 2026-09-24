"use client";

import { Fragment, useEffect, useMemo, useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import clsx from "clsx";
import styles from "./SplitFlapText.module.css";

const flapCharset = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const flipSeconds = 0.05;
const letterStagger = 0.035;
const lineGap = 0.32;
// Mid-flip clicks from many letters at once would buzz, so they share this minimum spacing.
const flipSoundGapSeconds = 0.025;

interface SplitFlapLine {
  text: string;
  className?: string;
}

interface SplitFlapTextProps {
  lines: SplitFlapLine[];
  /** Starts the flipping; letters stay hidden until then. */
  active: boolean;
  /** Lands every letter at once, without flipping. */
  instant?: boolean;
  /** Called as letters turn over; `across` is the letter's rough 0–1 horizontal position. */
  onFlap?: (across: number, landed: boolean) => void;
  onDone?: () => void;
}

interface Letter {
  final: string;
  start: number;
  flips: number;
  seed: number;
  across: number;
}

/**
 * Text that turns over letter by letter like a departures board: each letter cycles
 * through random characters before landing, line after line.
 */
export function SplitFlapText({
  lines,
  active,
  instant = false,
  onFlap,
  onDone,
}: SplitFlapTextProps) {
  const reduceMotion = useReducedMotion();
  const letters = useMemo(() => scheduleLetters(lines), [lines]);
  // How many flips each letter has made; -1 means not started, flips means landed.
  const [steps, setSteps] = useState<number[]>(() => letters.map(() => -1));
  const onFlapRef = useRef(onFlap);
  const onDoneRef = useRef(onDone);

  useEffect(() => {
    onFlapRef.current = onFlap;
    onDoneRef.current = onDone;
  }, [onFlap, onDone]);

  useEffect(() => {
    if (!active) return;

    if (reduceMotion || instant) {
      const landed = letters.map((letter) => letter.flips);
      const frame = requestAnimationFrame(() => {
        setSteps(landed);
        onDoneRef.current?.();
      });
      return () => cancelAnimationFrame(frame);
    }

    const startedAt = performance.now();
    const played = letters.map(() => -1);
    let lastFlipSound = 0;
    let frame = 0;

    const tick = (now: number) => {
      const elapsed = (now - startedAt) / 1000;
      let allLanded = true;

      const next = letters.map((letter, index) => {
        if (elapsed < letter.start) {
          allLanded = false;
          return -1;
        }
        const step = Math.min(
          Math.floor((elapsed - letter.start) / flipSeconds),
          letter.flips,
        );
        if (step < letter.flips) allLanded = false;

        if (step > played[index] && letter.final !== " ") {
          played[index] = step;
          const landed = step === letter.flips;
          if (landed || elapsed - lastFlipSound >= flipSoundGapSeconds) {
            if (!landed) lastFlipSound = elapsed;
            onFlapRef.current?.(letter.across, landed);
          }
        }
        return step;
      });

      setSteps((previous) =>
        previous.every((step, index) => step === next[index]) ? previous : next,
      );

      if (allLanded) {
        onDoneRef.current?.();
        return;
      }
      frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame);
  }, [active, instant, letters, reduceMotion]);

  let index = 0;
  return (
    <>
      {lines.map((line, lineIndex) => (
        <span key={lineIndex} className={clsx(styles.line, line.className)}>
          {Array.from(line.text).map((_, charIndex) => {
            const letterIndex = index++;
            const letter = letters[letterIndex];
            const step = steps[letterIndex];
            const shown = displayChar(letter, step);
            return (
              <Fragment key={charIndex}>
                {/* The final character sizes the tile, so proportional letters can flip
                    through wider or narrower characters without shifting the line. */}
                <span className={styles.letter}>
                  <span className={styles.sizer}>{toVisible(letter.final)}</span>
                  <span
                    key={step}
                    className={clsx(
                      styles.face,
                      step < 0 ? styles.hidden : styles.flipping,
                    )}
                  >
                    {toVisible(shown)}
                  </span>
                </span>
              </Fragment>
            );
          })}
        </span>
      ))}
    </>
  );
}

function scheduleLetters(lines: SplitFlapLine[]): Letter[] {
  return lines.flatMap((line, lineIndex) => {
    const chars = Array.from(line.text);
    return chars.map((final, charIndex) => {
      const seed = hashIndex(lineIndex * 101 + charIndex);
      return {
        final,
        start: lineIndex * lineGap + charIndex * letterStagger,
        flips: final === " " ? 0 : 5 + Math.floor(seed * 4),
        seed,
        // Letters sit around the middle of the screen, so keep the spread modest.
        across: 0.5 + ((charIndex + 0.5) / chars.length - 0.5) * 0.6,
      };
    });
  });
}

// Spaces would collapse inside an inline-block, so they become non-breaking.
function toVisible(char: string) {
  return char === " " ? "\u00a0" : char;
}

function displayChar(letter: Letter, step: number) {
  if (step < 0 || step >= letter.flips) return letter.final;
  const offset = Math.floor(letter.seed * flapCharset.length);
  return flapCharset[(offset + step * 7) % flapCharset.length];
}

// Deterministic 0–1 value per index, so server and client schedule the same flips.
function hashIndex(value: number) {
  const x = Math.sin(value * 12.9898) * 43758.5453;
  return x - Math.floor(x);
}
