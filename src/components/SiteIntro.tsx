"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import clsx from "clsx";
import {
  WebsiteShaderBackground,
  getKineticGrid,
  revealDelay,
} from "./WebsiteShaderCanvas";
import {
  createPointerSounds,
  playRevealSound,
  type IntroCue,
  type PointerSounds,
} from "./revealSound";
import { SiteNav } from "./SiteNav";
import styles from "./SiteIntro.module.css";

const revealDuration = 1.8;
// Behind the Enter screen the grid waits turned 45° and zoomed in, a field of diamonds;
// entering unwinds it to rest while the ripple spreads.
const gridIntroPose = { degrees: 45, scale: 2, seconds: 2.2 };
// How long after Enter the page stays locked to the hero: through the headline flip.
const introLockMs = 4200;
// Pointer speed, in px per ms, that counts as a full-speed sweep for the hover ticks.
const fastPointerSpeed = 2.5;

interface SiteIntroProps {
  children: ReactNode;
}

interface IntroState {
  /** True from the Enter click; content times its entrance from this moment. */
  entered: boolean;
  /** Plays a split-flap letter sound when sound is on; silent otherwise. */
  playFlap: (across: number, landed: boolean) => void;
  /** Plays an intro text cue when sound is on; silent otherwise. */
  playCue: (cue: IntroCue) => void;
}

const IntroContext = createContext<IntroState>({
  entered: true,
  playFlap: () => {},
  playCue: () => {},
});

export function useIntro() {
  return useContext(IntroContext);
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
  const soundOnRef = useRef(false);
  const [introDone, setIntroDone] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  // Publish the grid's cell size as --grid-cell, so type can be sized in cells ("HI" fills
  // the four center cells).
  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const { cell } = getKineticGrid(window.innerWidth, window.innerHeight);
      root.style.setProperty("--grid-cell", `${cell}px`);
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  // No scrolling until the intro has played: the page stays on the hero behind the Enter
  // screen, and the intro type flies to positions measured with the page at the top.
  useEffect(() => {
    const root = document.documentElement;
    if (!entered) {
      window.scrollTo(0, 0);
      root.style.overflow = "hidden";
      return;
    }
    const timer = window.setTimeout(() => {
      root.style.removeProperty("overflow");
      setIntroDone(true);
    }, introLockMs);
    return () => {
      window.clearTimeout(timer);
      root.style.removeProperty("overflow");
    };
  }, [entered]);

  const playFlap = useCallback((across: number, landed: boolean) => {
    // A suspended context would queue these and play them all at once on resume.
    if (!soundOnRef.current) return;
    soundsRef.current?.flap(across, landed);
  }, []);

  const playCue = useCallback((cue: IntroCue) => {
    if (!soundOnRef.current) return;
    soundsRef.current?.cue(cue);
  }, []);

  const intro = useMemo(
    () => ({ entered, playFlap, playCue }),
    [entered, playFlap, playCue],
  );

  // After the ripple settles, each grid cell the cursor enters ticks (a little higher toward
  // the top of the screen, lighter on fast sweeps) and each press clacks.
  useEffect(() => {
    if (!entered || !soundOn) return;

    let lastCell = "";
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

      const point = pointOnGrid(gridRef.current, event);
      if (!point) {
        lastCell = "";
        return;
      }
      // Same cells as the shader: square, counted from the center of the grid.
      const { cols, rows } = point.grid;
      const col = Math.floor((point.across - 0.5) * cols);
      const row = Math.floor((point.height - 0.5) * rows);
      const cell = `${col},${row}`;
      if (cell === lastCell) return;
      lastCell = cell;

      if (!sounds || now < revealEndsAtRef.current) return;
      sounds.tick(point.height, speed, point.across);
    };

    // Pressing anywhere sends a shockwave through the grid; this is its sound.
    const handlePointerDown = (event: PointerEvent) => {
      const sounds = soundsRef.current;
      const point = pointOnGrid(gridRef.current, event);
      if (!sounds || !point || performance.now() < revealEndsAtRef.current) {
        return;
      }
      sounds.press(point.height, point.across);
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
      {/* The grid lives behind the hero only and scrolls away with it. */}
      <div ref={gridRef} className={styles.grid}>
        <div className={styles.gridLayer}>
          <WebsiteShaderBackground
            preset="kinetic-dots"
            tone="light"
            revealDuration={revealDuration}
            revealPaused={!entered}
            introPose={gridIntroPose}
          />
        </div>
      </div>
      <IntroContext.Provider value={intro}>{children}</IntroContext.Provider>
      <SiteNav
        visible={introDone}
        soundOn={soundOn}
        onToggleSound={toggleSound}
        onHover={() => playCue("tap")}
      />
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

// Where the pointer is on the grid, 0–1 across and 0 (bottom) to 1 (top) in height, or
// null when it's outside the grid (for example over the sections below the hero).
function pointOnGrid(grid: HTMLElement | null, event: PointerEvent) {
  const rect = grid?.getBoundingClientRect();
  if (
    !rect ||
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom
  ) {
    return null;
  }
  return {
    across: (event.clientX - rect.left) / rect.width,
    height: 1 - (event.clientY - rect.top) / rect.height,
    grid: getKineticGrid(rect.width, rect.height),
  };
}
