import {
  getKineticGrid,
  getRevealCellTimes,
  type RevealFrom,
  revealDelay,
  shockLifetime,
  shockSpeed,
} from "./WebsiteShaderCanvas";

// Clicks per cell would blur together on the outer rings, so each ring keeps a few.
const maxClicksPerRing = 5;
const masterVolume = 0.7;
// Hover ticks reuse the ripple's clicks, much quieter, so the grid keeps one voice.
const hoverVolume = 1.5;
const hoverMinGapSeconds = 0.035;
// Long unbroken hovering softens the ticks by up to this much; a pause restores them.
const maxHoverFatigue = 0.6;
const fatiguePerTick = 0.04;
const fatigueRecoveryPerSecond = 0.25;
const fatigueResetPause = 0.6;
// How far left and right sounds travel, from 0 (centered) to 1 (hard left/right).
const stereoWidth = 0.8;

export interface PointerSounds {
  /**
   * Ticks for a cell the cursor entered. `height` runs 0 (bottom) to 1 (top) and nudges the
   * pitch up; `speed` runs 0 (slow) to 1 (fast sweep) and makes the tick lighter; `across`
   * runs 0 (left edge) to 1 (right edge) and places the tick in stereo.
   */
  tick(height: number, speed: number, across: number): void;
  /** A firm clack where the pointer pressed, then clicks spreading out with the shockwave. */
  press(height: number, across: number): void;
  /** A split-flap letter turning over; `landed` is the heavier final flap. */
  flap(across: number, landed: boolean): void;
  /**
   * Intro moments: the greeting swapping for the name, the name landing, and the avatar
   * arriving.
   */
  cue(cue: IntroCue): void;
}

export type IntroCue =
  | "swap"
  | "land"
  | "arrive"
  | "tap"
  | "shutter"
  | "insert";

export function createPointerSounds(context: AudioContext): PointerSounds {
  const output = context.createGain();
  output.gain.value = hoverVolume;
  output.connect(getOutputBus(context));
  const noise = createNoiseBuffer(context, 1);
  let lastTick = 0;
  let fatigue = 0;

  return {
    tick(height, speed, across) {
      const at = context.currentTime;
      const gap = at - lastTick;
      if (gap < hoverMinGapSeconds) return;
      lastTick = at;

      fatigue =
        gap > fatigueResetPause
          ? fatigue * 0.3
          : Math.min(
            Math.max(fatigue - gap * fatigueRecoveryPerSecond, 0) +
            fatiguePerTick,
            1,
          );

      const rested = 1 - fatigue * maxHoverFatigue;
      const weight = (1 - speed * 0.55) * rested;
      const pan = toPan(across);
      playClick(
        context,
        output,
        noise,
        at,
        1500 + height * 1400 + speed * 900,
        0.09 * weight * (0.8 + Math.random() * 0.2),
        pan,
      );
      playKnock(context, output, at, 0.12 * (1 - speed) * rested, pan * 0.5);
    },
    cue(cue) {
      const at = context.currentTime;
      if (cue === "shutter") {
        // A floppy's metal shutter: a thin slide, then the click as it stops.
        playClick(context, output, noise, at, 4800, 0.02);
        playClick(context, output, noise, at + 0.03, 4200, 0.02);
        playClick(context, output, noise, at + 0.09, 3000, 0.045);
        return;
      }
      if (cue === "insert") {
        // Opening a disk's window: a soft, rising "zwip" in the spirit of classic Mac OS
        // window sounds, a tone sliding up rather than noise, so it's clean, not crinkly.
        playChirp(context, output, at, { from: 520, to: 1560, volume: 0.06 });
        playChirp(context, output, at, { from: 260, to: 780, volume: 0.03 });
        return;
      }
      if (cue === "tap") {
        // Hovering a nav item: a light, dry tick.
        playClick(context, output, noise, at, 2600, 0.04);
        playKnock(context, output, at, 0.03, 0, 220);
        return;
      }
      if (cue === "arrive") {
        // A soft, low set-down, like a figure placed on a table.
        playKnock(context, output, at, 0.16, 0, 150);
        playClick(context, output, noise, at, 1300, 0.05);
        return;
      }
      if (cue === "swap") {
        // Two quick clicks, like a card being turned over, with a soft body under them.
        playClick(context, output, noise, at, 2600, 0.05);
        playClick(context, output, noise, at + 0.045, 1900, 0.07);
        playKnock(context, output, at + 0.045, 0.08, 0, 190);
        return;
      }
      playPress(context, output, noise, at, 0.16);
    },
    flap(across, landed) {
      const at = context.currentTime;
      const pan = toPan(across) * 0.7;
      playClick(
        context,
        output,
        noise,
        at,
        landed ? 2200 : 3400 + Math.random() * 600,
        (landed ? 0.06 : 0.018) * (0.8 + Math.random() * 0.2),
        pan,
      );
      if (landed) playKnock(context, output, at, 0.05, pan * 0.5, 210);
    },
    press(height, across) {
      const at = context.currentTime;
      playPress(context, output, noise, at, 0.22, toPan(across) * 0.6);

      // One click either side of the press per ring, timed to the shockwave's travel.
      const rings = Math.floor(shockSpeed * shockLifetime * 0.5);
      for (let ring = 1; ring <= rings; ring++) {
        const ringAt = at + ring / shockSpeed;
        const volume = 0.07 * Math.pow(1 - ring / (rings + 1), 2);
        const frequency = 1500 + height * 1400 + ring * 150;
        for (const side of [-1, 1]) {
          playClick(
            context,
            output,
            noise,
            ringAt + Math.random() * 0.01,
            frequency,
            volume,
            toPan(saturate(across + (side * ring) / currentGrid().cols)),
          );
        }
      }
    },
  };
}

/**
 * Plays the opening sound in sync with the grid ripple: a low thump as the center cells
 * switch on, a click for the cells in each ring, and a noise swell underneath.
 * Must be called from a user gesture so the browser allows audio.
 */
export function playRevealSound(
  context: AudioContext,
  duration: number,
  from: RevealFrom = "center",
) {
  const start = context.currentTime + 0.02;
  const master = context.createGain();
  master.gain.value = masterVolume;
  master.connect(getOutputBus(context));

  const noise = createNoiseBuffer(context, 2);

  // The Enter press lands immediately, so the thump that follows feels caused by it.
  playPress(context, master, noise, start, 0.5);
  playThump(context, master, noise, start + revealDelay);
  playSwell(context, master, noise, start + revealDelay, duration);
  playRingClicks(context, master, noise, start, duration, from);
}

function playThump(
  context: AudioContext,
  output: AudioNode,
  noise: AudioBuffer,
  at: number,
) {
  const body = context.createOscillator();
  const bodyGain = context.createGain();
  body.type = "sine";
  body.frequency.setValueAtTime(140, at);
  body.frequency.exponentialRampToValueAtTime(42, at + 0.35);
  bodyGain.gain.setValueAtTime(0.0001, at);
  bodyGain.gain.exponentialRampToValueAtTime(0.9, at + 0.006);
  bodyGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.7);
  body.connect(bodyGain).connect(output);
  body.start(at);
  body.stop(at + 0.75);

  // A short filtered noise hit gives the thump its switch-like attack.
  const transient = context.createBufferSource();
  const transientFilter = context.createBiquadFilter();
  const transientGain = context.createGain();
  transient.buffer = noise;
  transientFilter.type = "lowpass";
  transientFilter.frequency.value = 1800;
  transientGain.gain.setValueAtTime(0.35, at);
  transientGain.gain.exponentialRampToValueAtTime(0.0001, at + 0.04);
  transient.connect(transientFilter).connect(transientGain).connect(output);
  transient.start(at);
  transient.stop(at + 0.05);
}

function playPress(
  context: AudioContext,
  output: AudioNode,
  noise: AudioBuffer,
  at: number,
  volume: number,
  pan = 0,
) {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  source.buffer = noise;
  filter.type = "bandpass";
  filter.frequency.value = 1100;
  filter.Q.value = 2.5;
  gain.gain.setValueAtTime(volume, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.045);

  source.connect(filter).connect(gain).connect(panned(context, output, pan));
  source.start(at, Math.random() * (noise.duration - 0.1));
  source.stop(at + 0.06);

  playKnock(context, output, at, volume * 0.7, pan * 0.5, 240);
}

function playSwell(
  context: AudioContext,
  output: AudioNode,
  noise: AudioBuffer,
  at: number,
  duration: number,
) {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();
  const peak = at + duration * 0.35;
  const end = at + duration + 0.4;

  source.buffer = noise;
  source.loop = true;
  filter.type = "bandpass";
  filter.Q.value = 0.8;
  filter.frequency.setValueAtTime(250, at);
  filter.frequency.exponentialRampToValueAtTime(2400, peak);
  filter.frequency.exponentialRampToValueAtTime(700, end);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(0.12, peak);
  gain.gain.exponentialRampToValueAtTime(0.0001, end);

  source.connect(filter).connect(gain).connect(output);
  source.start(at);
  source.stop(end + 0.05);
}

function playRingClicks(
  context: AudioContext,
  output: AudioNode,
  noise: AudioBuffer,
  start: number,
  duration: number,
  from: RevealFrom,
) {
  const grid = currentGrid();
  const maxRing = Math.ceil(Math.hypot(grid.cols / 2, grid.rows / 2));
  const clicksPerRing = new Map<number, number>();

  for (const cell of getRevealCellTimes(duration, grid, from)) {
    const ring = Math.round(cell.distance);
    const played = clicksPerRing.get(ring) ?? 0;
    if (ring === 0 || played >= maxClicksPerRing) continue;
    clicksPerRing.set(ring, played + 1);

    // Pitch climbs ring by ring, and clicks soften toward the edge as the swell fades.
    const ringProgress = ring / maxRing;
    playClick(
      context,
      output,
      noise,
      start + cell.time,
      1600 + ringProgress * 2600,
      (0.1 + Math.random() * 0.06) * (1 - ringProgress * 0.5),
      toPan(cell.across),
    );
  }
}

// A miniature of the opening thump, giving each tick or press a physical body.
function playKnock(
  context: AudioContext,
  output: AudioNode,
  at: number,
  volume: number,
  pan = 0,
  frequency = 170,
) {
  if (volume < 0.005) return;
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(frequency, at);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 0.47, at + 0.05);
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.003);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.06);

  oscillator.connect(gain).connect(panned(context, output, pan));
  oscillator.start(at);
  oscillator.stop(at + 0.08);
}

// A short tone gliding up in pitch, softened on top: a retro interface "zwip".
function playChirp(
  context: AudioContext,
  output: AudioNode,
  at: number,
  {
    from,
    to,
    volume,
    duration = 0.14,
  }: { from: number; to: number; volume: number; duration?: number },
) {
  const tone = context.createOscillator();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  tone.type = "triangle";
  tone.frequency.setValueAtTime(from, at);
  tone.frequency.exponentialRampToValueAtTime(to, at + duration * 0.8);
  filter.type = "lowpass";
  filter.frequency.value = 3200;
  gain.gain.setValueAtTime(0.0001, at);
  gain.gain.exponentialRampToValueAtTime(volume, at + 0.006);
  gain.gain.setValueAtTime(volume, at + duration * 0.45);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);

  tone.connect(filter).connect(gain).connect(output);
  tone.start(at);
  tone.stop(at + duration + 0.02);
}

function playClick(
  context: AudioContext,
  output: AudioNode,
  noise: AudioBuffer,
  at: number,
  frequency: number,
  volume: number,
  pan = 0,
) {
  const source = context.createBufferSource();
  const filter = context.createBiquadFilter();
  const gain = context.createGain();

  source.buffer = noise;
  filter.type = "bandpass";
  filter.frequency.value = frequency;
  filter.Q.value = 6;
  gain.gain.setValueAtTime(volume, at);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.018);

  source.connect(filter).connect(gain).connect(panned(context, output, pan));
  // Start each click at a random point in the noise so no two sound identical.
  source.start(at, Math.random() * (noise.duration - 0.05));
  source.stop(at + 0.03);
}

const outputBuses = new WeakMap<AudioContext, AudioNode>();

/**
 * Every grid sound ends in one limiter, so overlapping sweeps, presses and the ripple
 * are held back from clipping instead of distorting.
 */
function getOutputBus(context: AudioContext) {
  let bus = outputBuses.get(context);
  if (!bus) {
    const limiter = context.createDynamicsCompressor();
    limiter.threshold.value = -10;
    limiter.knee.value = 6;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.002;
    limiter.release.value = 0.15;
    limiter.connect(context.destination);
    bus = limiter;
    outputBuses.set(context, bus);
  }
  return bus;
}

// The grid fills the hero, which is the size of the window.
function currentGrid() {
  return getKineticGrid(window.innerWidth, window.innerHeight);
}

function saturate(value: number) {
  return Math.min(1, Math.max(0, value));
}

/** Maps a 0 (left) to 1 (right) screen position onto the stereo field. */
function toPan(across: number) {
  return (across * 2 - 1) * stereoWidth;
}

function panned(context: AudioContext, output: AudioNode, pan: number) {
  if (pan === 0 || !context.createStereoPanner) return output;
  const panner = context.createStereoPanner();
  panner.pan.value = pan;
  panner.connect(output);
  return panner;
}

function createNoiseBuffer(context: AudioContext, seconds: number) {
  const buffer = context.createBuffer(
    1,
    Math.floor(context.sampleRate * seconds),
    context.sampleRate,
  );
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
  return buffer;
}
