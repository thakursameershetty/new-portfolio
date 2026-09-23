import {
  getRevealCellTimes,
  kineticGrid,
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
}

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
            toPan(saturate(across + (side * ring) / kineticGrid.cols)),
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
export function playRevealSound(context: AudioContext, duration: number) {
  const start = context.currentTime + 0.02;
  const master = context.createGain();
  master.gain.value = masterVolume;
  master.connect(getOutputBus(context));

  const noise = createNoiseBuffer(context, 2);

  // The Enter press lands immediately, so the thump that follows feels caused by it.
  playPress(context, master, noise, start, 0.5);
  playThump(context, master, noise, start + revealDelay);
  playSwell(context, master, noise, start + revealDelay, duration);
  playRingClicks(context, master, noise, start, duration);
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
) {
  const maxRing = Math.ceil(Math.hypot(kineticGrid.cols / 2, kineticGrid.rows / 2));
  const clicksPerRing = new Map<number, number>();

  for (const cell of getRevealCellTimes(duration)) {
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
