"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import {
  WebsiteShaderBackground,
  getKineticGrid,
  revealDelay,
  type RevealFrom,
} from "./WebsiteShaderCanvas";
import {
  createPointerSounds,
  fadeSound,
  playRevealSound,
  playSoundSwitch,
  soundFadeOut,
  type IntroCue,
  type PointerSounds,
} from "./revealSound";
import { ClickSpark } from "./ClickSpark";
import { armTilt } from "./deviceTilt";
import { buzz } from "./haptics";
import { SiteNav } from "./SiteNav";
import { VolumeIcon } from "./icons/VolumeIcon";
import clsx from "clsx";
import nudge from "./SoundNudge.module.css";
import styles from "./SiteIntro.module.css";

const revealDuration = 1.8;
// Before the intro starts the grid waits turned 45° and zoomed in, a field of diamonds; the
// intro unwinds it to rest while the ripple spreads.
const gridIntroPose = { degrees: 45, scale: 2, seconds: 2.2 };
// How long after the intro starts the page stays locked to the hero: through the headline
// flip.
const introLockMs = 4200;
const introStartDelayMs = 300;
// Whether the intro has played in this tab (reloads then load the hero finished) is kept only
// for the session, so a fresh visit plays it again. Whether sound was left on is kept for
// good.
const seenKey = "intro-seen";
// Where the home page was last scrolled to in this tab, so coming back to it (the browser's
// back button, or another page's Home key) lands where it was left.
const scrollKey = "home-scroll";

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
  remoteKey: [[0, 6]],
  land: [[0, 12]],
  arrive: [[0, 14]],
  swap: [
    [0, 6],
    [45, 10],
  ],
  tap: [[0, 4]],
  detent: [[0, 4]],
  clink: [[0, 5]],
  switchOn: [[28, 14]],
  switchOff: [[28, 12]],
};

// The grid rippling into place: a thump as the center cells switch on, then ticks for the
// rings spreading out, lighter and further apart as the ripple slows toward the edges.
function buzzRipple(duration: number) {
  const pattern = [28];
  const rings = 6;
  for (let ring = 1; ring <= rings; ring++) {
    pattern.push(
      Math.round(((duration * 1000) / rings) * (0.6 + ring * 0.12)),
      9 - ring,
    );
  }
  buzz(pattern, revealDelay * 1000);
}
const soundKey = "sound";

// ---- Sound, shared by every page ----
// One audio engine for the whole site, kept at module level so it survives moving between
// pages (Home, About, a case study): once it's running, the next page plays straight away.
// The visitor's choice (on unless they've muted it) is what the sound keys show, from the
// first paint; the audio itself can only start at a click, tap or key press, as browsers
// require, so until then sounds are simply skipped (never queued up to burst out later).
let engine: { context: AudioContext; sounds: PointerSounds } | null = null;
const soundChange = "sound-change";
// When storage is blocked, the choice still holds for this visit.
let soundChoice: boolean | null = null;

// Whether the audio is running is read from the engine itself, whenever it changes (starting,
// suspending after a mute, resuming), rather than tracked alongside it, so what the sound
// keys show can't drift from what's actually playing.
const engineListeners = new Set<() => void>();
const notifyEngine = () => {
  for (const listener of engineListeners) listener();
};
function subscribeEngine(listener: () => void) {
  engineListeners.add(listener);
  return () => {
    engineListeners.delete(listener);
  };
}

function startEngine() {
  if (!engine) {
    const context = new AudioContext();
    context.addEventListener("statechange", notifyEngine);
    engine = { context, sounds: createPointerSounds(context) };
    notifyEngine();
  }
  void engine.context.resume();
  return engine;
}
const engineLive = () => engine?.context.state === "running";

const readSoundOn = () => soundChoice ?? readStorage(soundKey) !== "off";
function writeSoundOn(on: boolean) {
  soundChoice = on;
  writeStorage(soundKey, on ? "on" : "off");
  window.dispatchEvent(new Event(soundChange));
}
function subscribeSoundOn(onChange: () => void) {
  window.addEventListener(soundChange, onChange);
  window.addEventListener("storage", onChange);
  return () => {
    window.removeEventListener(soundChange, onChange);
    window.removeEventListener("storage", onChange);
  };
}

/**
 * The site's sound, for a page's provider: the visitor's choice (`soundOn`), whether the
 * audio is actually running yet (`live`), `active()` for "play it now", and the key's
 * `toggle`. Starts the audio at the first gesture when sound is on.
 */
function useSiteSound() {
  const soundOn = useSyncExternalStore(
    subscribeSoundOn,
    readSoundOn,
    () => false,
  );
  const soundOnRef = useRef(soundOn);
  const live = useSyncExternalStore(subscribeEngine, engineLive, () => false);
  const suspendTimerRef = useRef(0);

  useEffect(() => {
    soundOnRef.current = soundOn;
  }, [soundOn]);

  // Sound switching on: the switch's click, then everything eases in from silence, so the
  // first sounds after it (often set off by the very click that switched it on) can't burst.
  const bringIn = useCallback((context: AudioContext) => {
    window.clearTimeout(suspendTimerRef.current);
    playSoundSwitch(context, true);
    fadeSound(context, true);
    buzz(10);
  }, []);

  const toggle = useCallback(() => {
    if (soundOnRef.current) {
      // On, but still waiting for the browser to allow it: this click is what it was
      // waiting for, so it starts the sound rather than muting it.
      if (!engineLive()) {
        try {
          bringIn(startEngine().context);
        } catch {
          // No Web Audio support: nothing to start.
        }
        return;
      }
      writeSoundOn(false);
      if (!engine) return;
      const { context } = engine;
      // The switch clicks, the sound fades out, and only then does the audio stop.
      playSoundSwitch(context, false);
      fadeSound(context, false);
      window.clearTimeout(suspendTimerRef.current);
      suspendTimerRef.current = window.setTimeout(
        () => void context.suspend(),
        soundFadeOut * 1000 + 250,
      );
      return;
    }
    try {
      bringIn(startEngine().context);
      writeSoundOn(true);
    } catch {
      // No Web Audio support: leave sound off.
    }
  }, [bringIn]);

  // The first gesture starts the audio, when sound's on and it isn't running already.
  useEffect(() => {
    const gestures = [
      "pointerdown",
      "pointerup",
      "touchend",
      "keydown",
    ] as const;
    const remove = () => {
      for (const type of gestures) window.removeEventListener(type, resume);
    };
    function resume(event: Event) {
      if (!readSoundOn()) return;
      if (engineLive()) {
        return remove();
      }
      // The sound key's own click would turn it straight back off: let the key do it.
      if ((event.target as Element | null)?.closest?.("[data-sound-toggle]"))
        return;
      try {
        const { context } = startEngine();
        // A touch that starts a scroll isn't a gesture the browser accepts; keep listening
        // until one is and the audio is actually running.
        void context.resume().then(() => {
          if (context.state !== "running") return;
          bringIn(context);
          remove();
        });
      } catch {
        remove();
      }
    }
    for (const type of gestures) window.addEventListener(type, resume);
    return remove;
  }, [bringIn]);

  useEffect(() => () => window.clearTimeout(suspendTimerRef.current), []);

  const active = useCallback(() => soundOnRef.current && engineLive(), []);
  const sounds = useCallback(
    () => (active() ? (engine?.sounds ?? null) : null),
    [active],
  );
  // On, but the browser hasn't let it start yet: the sound keys nudge for a tap.
  const waiting = soundOn && !live;
  return { soundOn, live, waiting, toggle, active, sounds, soundOnRef };
}

// Pointer speed, in px per ms, that counts as a full-speed sweep for the hover ticks.
const fastPointerSpeed = 2.5;

interface SiteIntroProps {
  children: ReactNode;
}

interface IntroState {
  /** True from the moment the intro starts; content times its entrance from it. */
  entered: boolean;
  /** A return visit: no intro, everything appears already in its finished state. */
  instant: boolean;
  soundOn: boolean;
  /** The pointer sounds, once audio has started (for other grids' hover ticks). */
  getSounds: () => PointerSounds | null;
  /** Plays the grid ripple's sound (thump, ring clicks, swell) when sound is on. */
  playRipple: (duration: number, from?: RevealFrom) => void;
  /** Plays a split-flap letter sound when sound is on; silent otherwise. */
  playFlap: (across: number, landed: boolean, level?: number) => void;
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

/** Plays a cue's haptic taps alone, without its sound. */
export function feel(cue: IntroCue) {
  for (const [delay, length] of cueHaptics[cue] ?? []) buzz(length, delay);
}

// The sound key for pages without the intro, which have no nav to carry one.
const SoundKeyContext = createContext<{
  on: boolean;
  waiting: boolean;
  toggle: () => void;
} | null>(null);

/**
 * For pages without the intro (the About page): no grid, scroll lock or entrance, but the
 * same sounds and haptics as the home page, so the same components sound and feel the same
 * there. Sound follows the visitor's choice from the home page (on unless they muted it),
 * starting at the first click, tap or key press, as browsers require; SoundKey switches it.
 * Haptics play whether or not sound is on. Anything marked data-feel="<cue>" (even in a
 * server component, like the page's keys) plays that cue when pressed, and ticks on hover.
 */
export function PageSound({ children }: { children: ReactNode }) {
  const { soundOn, live, waiting, toggle, active, sounds } = useSiteSound();

  const playCue = useCallback(
    (cue: IntroCue) => {
      if (active()) sounds()?.cue(cue);
      feel(cue);
    },
    [active, sounds],
  );
  const playFlap = useCallback(
    (across: number, landed: boolean, level?: number) =>
      sounds()?.flap(across, landed, level),
    [sounds],
  );
  // A case study's monitor hums while lit. Remembered, so turning sound on while it's up
  // brings the hum in too.
  const humWantedRef = useRef(false);
  const setHum = useCallback(
    (on: boolean) => {
      humWantedRef.current = on;
      engine?.sounds.hum(on && active());
    },
    [active],
  );

  useEffect(() => {
    engine?.sounds.hum(soundOn && live && humWantedRef.current);
  }, [soundOn, live]);

  const getSounds = sounds;

  const value = useMemo<IntroState>(
    () => ({
      entered: true,
      instant: false,
      soundOn,
      getSounds,
      playRipple: () => {},
      playFlap,
      playCue,
      setHum,
    }),
    [soundOn, getSounds, playFlap, playCue, setHum],
  );
  const key = useMemo(
    () => ({ on: soundOn, waiting, toggle }),
    [soundOn, waiting, toggle],
  );

  // Phones that ask before sharing their tilt (iOS) only may from a tap: ask on each until
  // answered, for the ID card.
  useEffect(() => armTilt(), []);

  // data-feel: the cue on press, and the home keys' hover tick on the way in.
  useEffect(() => {
    const marked = (target: EventTarget | null) =>
      (target as Element | null)?.closest?.<HTMLElement>("[data-feel]") ?? null;
    const press = (event: PointerEvent) => {
      const element = marked(event.target);
      if (element) playCue(element.dataset.feel as IntroCue);
    };
    const over = (event: PointerEvent) => {
      if (event.pointerType !== "mouse") return;
      const element = marked(event.target);
      if (element && !element.contains(event.relatedTarget as Node | null)) {
        sounds()?.cue("tap");
      }
    };
    document.addEventListener("pointerdown", press);
    document.addEventListener("pointerover", over);
    return () => {
      document.removeEventListener("pointerdown", press);
      document.removeEventListener("pointerover", over);
    };
  }, [playCue, sounds]);

  return (
    <IntroContext.Provider value={value}>
      <SoundKeyContext.Provider value={key}>
        {children}
      </SoundKeyContext.Provider>
    </IntroContext.Provider>
  );
}

/** Switches PageSound's sound on and off, showing which it is. */
export function SoundKey({ className }: { className?: string }) {
  const key = useContext(SoundKeyContext);
  if (!key) return null;
  return (
    <button
      type="button"
      className={clsx(className, key.waiting && nudge.waiting)}
      data-sound-toggle=""
      aria-pressed={key.on && !key.waiting}
      aria-label={
        key.waiting
          ? "Start sound"
          : key.on
            ? "Turn sound off"
            : "Turn sound on"
      }
      onClick={key.toggle}
    >
      {/* What can be heard right now: muted until the browser lets it start. */}
      <VolumeIcon on={key.on && !key.waiting} size={18} />
      {key.waiting && (
        <span aria-hidden="true" className={nudge.label}>
          Tap for sound
        </span>
      )}
    </button>
  );
}

/**
 * Plays the intro on its own as the page loads: the dark grid unwinds and ripples red, and
 * the hero's type takes its cue from `entered`. There's no gate to click through, so it
 * plays silently; browsers only allow sound after a gesture, which the nav's sound key (or,
 * if sound was left on last time, the first click or key press) provides.
 */
export function SiteIntro({ children }: SiteIntroProps) {
  const [entered, setEntered] = useState(false);
  const {
    soundOn,
    live,
    waiting,
    toggle: toggleSound,
    active,
    sounds,
  } = useSiteSound();
  const revealEndsAtRef = useRef(0);
  const [introDone, setIntroDone] = useState(false);
  const [instant, setInstant] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

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

  // No scrolling until the intro has played: the intro type flies to positions measured with
  // the page at the top. Coming back once it's been seen, there's no intro to wait for, so
  // the page is left where it is (and put back where it was, below).
  useEffect(() => {
    const root = document.documentElement;
    if (!entered) {
      if (readStorage(seenKey, "session") === "1") return;
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

  // Keeps a note of how far down the page is, once the intro's done with it.
  useEffect(() => {
    if (!introDone) return;
    let frame = 0;
    const note = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // Not the jump to the top that opens the next page, while this one's on its way out.
        if (window.location.pathname !== "/") return;
        writeStorage(scrollKey, String(Math.round(window.scrollY)), "session");
      });
    };
    window.addEventListener("scroll", note, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", note);
    };
  }, [introDone]);

  // Sounds only while the audio is actually running (a suspended one would queue them and
  // play them all at once on resume); on the home page the haptics go with the sound.
  const playFlap = useCallback(
    (across: number, landed: boolean, level?: number) =>
      sounds()?.flap(across, landed, level),
    [sounds],
  );

  const playCue = useCallback(
    (cue: IntroCue) => {
      if (!active()) return;
      sounds()?.cue(cue);
      feel(cue);
    },
    [active, sounds],
  );

  const playRipple = useCallback(
    (duration: number, from?: RevealFrom) => {
      if (!active() || !engine) return;
      playRevealSound(engine.context, duration, from);
      buzzRipple(duration);
    },
    [active],
  );

  // Remembered, so turning sound on while the monitor is up brings its hum in too.
  const humWantedRef = useRef(false);
  const setHum = useCallback(
    (on: boolean) => {
      humWantedRef.current = on;
      engine?.sounds.hum(on && active());
    },
    [active],
  );

  useEffect(() => {
    engine?.sounds.hum(soundOn && live && humWantedRef.current);
  }, [soundOn, live]);

  const getSounds = sounds;

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
    [
      entered,
      instant,
      soundOn,
      getSounds,
      playRipple,
      playFlap,
      playCue,
      setHum,
    ],
  );

  // After the ripple settles, each grid cell the cursor enters ticks and each press clacks.
  const heroGridReady = useCallback(
    () => performance.now() >= revealEndsAtRef.current,
    [],
  );
  useGridPointerSounds(
    gridRef,
    entered && soundOn && live,
    getSounds,
    heroGridReady,
  );

  const enter = () => {
    if (entered) return;
    writeStorage(seenKey, "1", "session");
    revealEndsAtRef.current =
      performance.now() + (revealDelay + revealDuration) * 1000;
    setEntered(true);
  };

  // A first visit plays the intro; a reload in the same tab skips it and the hero loads
  // already finished. (Sound starts at the first gesture, in useSiteSound.)
  const enterRef = useRef(enter);
  useEffect(() => {
    enterRef.current = enter;
  });

  useEffect(() => {
    let frame = 0;
    let wait = 0;
    let cancelled = false;
    if (readStorage(seenKey, "session") === "1") {
      frame = requestAnimationFrame(() => {
        setInstant(true);
        setIntroDone(true);
        enterRef.current();
        revealEndsAtRef.current = 0;
        // Back where it was left, unless the link asked for a section (/#work).
        const saved = Number(readStorage(scrollKey, "session"));
        if (!window.location.hash && saved > 0)
          frame = requestAnimationFrame(() =>
            window.scrollTo({ top: saved, behavior: "instant" }),
          );
      });
    } else {
      // Once the fonts are in (the intro type is measured in them), and a beat after the
      // waiting grid has painted, so the unwind is seen from the start.
      void document.fonts.ready.then(() => {
        if (cancelled) return;
        wait = window.setTimeout(() => enterRef.current(), introStartDelayMs);
      });
    }
    const stop = () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      window.clearTimeout(wait);
    };

    // Phones that ask before sharing their tilt (iOS) only may from a tap.
    const disarmTilt = armTilt();

    return () => {
      stop();
      disarmTilt();
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
        soundWaiting={waiting}
        onToggleSound={toggleSound}
        onHover={() => playCue("tap")}
      />
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

function writeStorage(
  key: string,
  value: string,
  lifetime: Lifetime = "lasting",
) {
  try {
    storage(lifetime).setItem(key, value);
  } catch {
    // Storage blocked (private mode): the intro just plays again next time.
  }
}
