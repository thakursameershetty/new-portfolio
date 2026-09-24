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
  type RevealFrom,
} from "./WebsiteShaderCanvas";
import {
  createPointerSounds,
  playRevealSound,
  type IntroCue,
  type PointerSounds,
} from "./revealSound";
import { ClickSpark } from "./ClickSpark";
import { requestTilt } from "./deviceTilt";
import { buzz } from "./haptics";
import { SiteNav } from "./SiteNav";
import styles from "./SiteIntro.module.css";

const revealDuration = 1.8;
// Behind the Enter screen the grid waits turned 45° and zoomed in, a field of diamonds;
// entering unwinds it to rest while the ripple spreads.
const gridIntroPose = { degrees: 45, scale: 2, seconds: 2.2 };
// How long after Enter the page stays locked to the hero: through the headline flip.
const introLockMs = 4200;
// Whether the intro has been entered in this tab (reloads then skip the Enter screen) is
// kept only for the session, so a fresh visit gets the Enter screen again. Whether sound was
// left on is kept for good.
const seenKey = "intro-seen";

// Haptic taps to go with the physical sounds (on phones that support them), each as
// [delay, length] in ms, timed to the sound's hits: the lid's thock lands 0.4s into its
// sound, the catch snaps 0.6s into the close, and a disk seats at the end of its slide in.
// Every hit is its own short buzz, since starting one cancels any still running (the disks'
// taps would otherwise cut the lid's thock short). Hover-only sounds get none.
const cueHaptics: Partial<Record<IntroCue, [number, number][]>> = {
  boxOpen: [
    [0, 8],
    [400, 22],
  ],
  boxClose: [[600, 20]],
  diskOut: [[0, 6]],
  diskIn: [[220, 12]],
  diskTap: [[0, 5]],
  insert: [[0, 10]],
  land: [[0, 12]],
  arrive: [[0, 14]],
  swap: [
    [0, 6],
    [45, 10],
  ],
  tap: [[0, 4]],
};

// The grid rippling into place: a thump as the center cells switch on, then ticks for the
// rings spreading out, lighter and further apart as the ripple slows toward the edges.
function buzzRipple(duration: number) {
  const pattern = [28];
  const rings = 6;
  for (let ring = 1; ring <= rings; ring++) {
    pattern.push(Math.round(((duration * 1000) / rings) * (0.6 + ring * 0.12)), 9 - ring);
  }
  buzz(pattern, revealDelay * 1000);
}
const soundKey = "sound";

// Pointer speed, in px per ms, that counts as a full-speed sweep for the hover ticks.
const fastPointerSpeed = 2.5;

interface SiteIntroProps {
  children: ReactNode;
}

interface IntroState {
  /** True from the Enter click; content times its entrance from this moment. */
  entered: boolean;
  /** A return visit: no intro, everything appears already in its finished state. */
  instant: boolean;
  soundOn: boolean;
  /** The pointer sounds, once audio has started (for other grids' hover ticks). */
  getSounds: () => PointerSounds | null;
  /** Plays the grid ripple's sound (thump, ring clicks, swell) when sound is on. */
  playRipple: (duration: number, from?: RevealFrom) => void;
  /** Plays a split-flap letter sound when sound is on; silent otherwise. */
  playFlap: (across: number, landed: boolean) => void;
  /** Plays an intro text cue when sound is on; silent otherwise. */
  playCue: (cue: IntroCue) => void;
  /** Fades the preview monitor's hum in or out (only heard while sound is on). */
  setHum: (on: boolean) => void;
}

const IntroContext = createContext<IntroState>({
  entered: true,
  instant: false,
  soundOn: false,
  getSounds: () => null,
  playRipple: () => {},
  playFlap: () => {},
  playCue: () => {},
  setHum: () => {},
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
  const [instant, setInstant] = useState(false);
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
    if (instant) {
      root.style.removeProperty("overflow");
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
  }, [entered, instant]);

  const playFlap = useCallback((across: number, landed: boolean) => {
    // A suspended context would queue these and play them all at once on resume.
    if (!soundOnRef.current) return;
    soundsRef.current?.flap(across, landed);
  }, []);

  const playCue = useCallback((cue: IntroCue) => {
    if (!soundOnRef.current) return;
    soundsRef.current?.cue(cue);
    for (const [delay, length] of cueHaptics[cue] ?? []) buzz(length, delay);
  }, []);

  const playRipple = useCallback((duration: number, from?: RevealFrom) => {
    const context = audioRef.current;
    if (!soundOnRef.current || !context) return;
    playRevealSound(context, duration, from);
    buzzRipple(duration);
  }, []);

  // Remembered, so turning sound on while the monitor is up brings its hum in too.
  const humWantedRef = useRef(false);
  const setHum = useCallback((on: boolean) => {
    humWantedRef.current = on;
    soundsRef.current?.hum(on && soundOnRef.current);
  }, []);

  useEffect(() => {
    soundsRef.current?.hum(soundOn && humWantedRef.current);
  }, [soundOn]);

  const getSounds = useCallback(() => soundsRef.current, []);

  const intro = useMemo(
    () => ({
      entered,
      instant,
      soundOn,
      getSounds,
      playRipple,
      playFlap,
      playCue,
      setHum,
    }),
    [entered, instant, soundOn, getSounds, playRipple, playFlap, playCue, setHum],
  );

  // After the ripple settles, each grid cell the cursor enters ticks and each press clacks.
  const heroGridReady = useCallback(
    () => performance.now() >= revealEndsAtRef.current,
    [],
  );
  useGridPointerSounds(gridRef, entered && soundOn, getSounds, heroGridReady);

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
    // A tap, so phones that ask before sharing their tilt (iOS) can ask now.
    requestTilt();
    writeStorage(seenKey, "1", "session");
    revealEndsAtRef.current =
      performance.now() + (revealDelay + revealDuration) * 1000;

    if (withSound) {
      try {
        playRevealSound(startAudio(), revealDuration);
        buzzRipple(revealDuration);
        setSoundOn(true);
        writeStorage(soundKey, "on");
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
      writeStorage(soundKey, "off");
      return;
    }

    try {
      startAudio();
      setSoundOn(true);
      writeStorage(soundKey, "on");
    } catch {
      // No Web Audio support: leave sound off.
    }
  };

  // Return visits skip the Enter screen (hidden before paint by the script in the layout)
  // and the whole intro: the hero loads already finished. Browsers only allow sound after a
  // gesture, so if it was left on, it comes back on the visitor's first click or key press.
  const enterRef = useRef(enter);
  const startAudioRef = useRef(startAudio);
  useEffect(() => {
    enterRef.current = enter;
    startAudioRef.current = startAudio;
  });

  useEffect(() => {
    if (readStorage(seenKey, "session") !== "1") return;
    const frame = requestAnimationFrame(() => {
      setInstant(true);
      setGateGone(true);
      setIntroDone(true);
      enterRef.current(false);
      revealEndsAtRef.current = 0;
    });

    // No Enter tap on a reload, so the first tap anywhere asks for the phone's tilt instead.
    const askTilt = () => requestTilt();
    window.addEventListener("click", askTilt, { once: true });

    if (readStorage(soundKey) !== "on") {
      return () => {
        cancelAnimationFrame(frame);
        window.removeEventListener("click", askTilt);
      };
    }
    const resumeSound = () => {
      try {
        startAudioRef.current();
        setSoundOn(true);
      } catch {
        // No Web Audio support: stay silent.
      }
      removeListeners();
    };
    const removeListeners = () => {
      window.removeEventListener("pointerdown", resumeSound);
      window.removeEventListener("keydown", resumeSound);
    };
    window.addEventListener("pointerdown", resumeSound);
    window.addEventListener("keydown", resumeSound);
    return () => {
      cancelAnimationFrame(frame);
      removeListeners();
      window.removeEventListener("click", askTilt);
    };
  }, []);

  return (
    <>
      {/* The grid lives behind the hero only and scrolls away with it. */}
      <div ref={gridRef} className={styles.grid}>
        <div className={styles.gridLayer}>
          <WebsiteShaderBackground
            preset="kinetic-dots"
            tone="light"
            revealDuration={instant ? 0 : revealDuration}
            revealPaused={!entered}
            introPose={instant ? undefined : gridIntroPose}
          />
        </div>
      </div>
      <IntroContext.Provider value={intro}>{children}</IntroContext.Provider>
      <ClickSpark />
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

/**
 * Hover ticks and press clacks for a kinetic grid: each cell the cursor enters ticks (a
 * little higher toward the top, lighter on fast sweeps) and each press clacks, using the
 * same square cells the shader draws. `isReady` can hold them back, e.g. until a ripple ends.
 */
export function useGridPointerSounds(
  gridRef: React.RefObject<HTMLElement | null>,
  enabled: boolean,
  getSounds: () => PointerSounds | null,
  isReady: () => boolean = () => true,
) {
  useEffect(() => {
    if (!enabled) return;

    let lastCell = "";
    let lastX = 0;
    let lastY = 0;
    let lastTime = 0;

    const handlePointerMove = (event: PointerEvent) => {
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
      const { cols, rows } = point.grid;
      const cell = `${Math.floor((point.across - 0.5) * cols)},${Math.floor((point.height - 0.5) * rows)}`;
      if (cell === lastCell) return;
      lastCell = cell;

      const sounds = getSounds();
      if (!sounds || !isReady()) return;
      sounds.tick(point.height, speed, point.across);
    };

    const handlePointerDown = (event: PointerEvent) => {
      const sounds = getSounds();
      const point = pointOnGrid(gridRef.current, event);
      if (!sounds || !point || !isReady()) return;
      sounds.press(point.height, point.across);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerdown", handlePointerDown);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [enabled, getSounds, gridRef, isReady]);
}

type Lifetime = "session" | "lasting";

const storage = (lifetime: Lifetime) =>
  lifetime === "session" ? window.sessionStorage : window.localStorage;

function readStorage(key: string, lifetime: Lifetime = "lasting") {
  try {
    return storage(lifetime).getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string, lifetime: Lifetime = "lasting") {
  try {
    storage(lifetime).setItem(key, value);
  } catch {
    // Storage blocked (private mode): the Enter screen just shows again next time.
  }
}
