"use client";

// The site's music: one audio element and what it's playing, kept at module level so it
// carries on while the visitor moves between pages (the About page's player and the
// floating mini disc are two views of it). Components read it with useMusic(); every action
// is a plain function, called from a click where it starts sound, so browsers allow it.

import { useSyncExternalStore } from "react";
import { tracks } from "./about/taste";

export interface MusicState {
  /** The song loaded, as an index into `tracks`, or null when nothing is. */
  track: number | null;
  playing: boolean;
  time: number;
  duration: number;
  failed: boolean;
  /** The About page's big player is on screen (the mini disc stays out of the way). */
  bigShown: boolean;
}

// Volume ramps (ms), so starting, pausing and skipping never click.
const fadeIn = 260;
const fadeOut = 160;

const initial: MusicState = {
  track: null,
  playing: false,
  time: 0,
  duration: 30,
  failed: false,
  bigShown: false,
};
let state = initial;
const listeners = new Set<() => void>();

function set(patch: Partial<MusicState>) {
  state = { ...state, ...patch };
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useMusic() {
  return useSyncExternalStore(subscribe, () => state, () => initial);
}

export const readMusic = () => state;

// ---- The audio ----

let element: HTMLAudioElement | null = null;
let ramping = 0;
let want = false;

function audio() {
  if (!element) {
    const created = new Audio();
    created.preload = "auto";
    created.addEventListener("timeupdate", () => set({ time: created.currentTime }));
    created.addEventListener("loadedmetadata", () => {
      if (Number.isFinite(created.duration)) set({ duration: created.duration });
    });
    created.addEventListener("play", () => set({ playing: true }));
    created.addEventListener("pause", () => set({ playing: false }));
    // A preview that runs out moves on to the next song.
    created.addEventListener("ended", () => step(1));
    created.addEventListener("error", () => {
      if (created.getAttribute("src")) set({ failed: true });
    });
    element = created;
  }
  return element;
}

function ramp(to: number, ms: number, then?: () => void) {
  const el = element;
  if (!el) return;
  cancelAnimationFrame(ramping);
  const from = el.volume;
  const began = performance.now();
  const tick = (now: number) => {
    const t = Math.min((now - began) / ms, 1);
    el.volume = from + (to - from) * t;
    if (t < 1) ramping = requestAnimationFrame(tick);
    else then?.();
  };
  ramping = requestAnimationFrame(tick);
}

function play() {
  const el = audio();
  want = true;
  el.volume = 0;
  el.play()
    .then(() => ramp(1, fadeIn))
    .catch(() => {
      // Interrupted by a newer track, or blocked: left paused, the play key still works.
    });
}

function load(index: number) {
  const el = audio();
  const track = tracks[index];
  set({ track: index, time: 0, failed: false });
  el.src = track.preview;
  mediaSession(index);
  if (want) play();
}

/** Start a song. Call it from the click that picks it, so the browser allows the sound. */
export function start(index: number) {
  // A stop a moment ago may still be fading out; it mustn't stop this song.
  cancelAnimationFrame(ramping);
  want = true;
  load(index);
}

/** Move through the songs, wrapping round; keeps playing if a song was. */
export function step(by: number) {
  if (state.track === null) return;
  load((state.track + by + tracks.length) % tracks.length);
}

export function toggle() {
  if (state.playing) {
    want = false;
    ramp(0, fadeOut, () => element?.pause());
  } else play();
}

export function seek(to: number) {
  const el = element;
  if (!el) return;
  el.currentTime = Math.min(Math.max(to, 0), state.duration - 0.05);
  set({ time: el.currentTime });
}

/** Stop and unload: the players go back to the shelf, and the mini disc leaves. */
export function stop() {
  want = false;
  set({ track: null, time: 0, playing: false });
  clearMediaSession();
  ramp(0, fadeOut, () => {
    const el = element;
    if (!el) return;
    el.pause();
    el.removeAttribute("src");
    el.load();
  });
}

// ---- Where the big player is ----

export const setBigShown = (bigShown: boolean) => {
  if (state.bigShown !== bigShown) set({ bigShown });
};

// The big player's record, for the mini disc to fly out of (and back into).
let recordRect: (() => DOMRect | null) | null = null;
export const registerRecord = (rect: (() => DOMRect | null) | null) => {
  recordRect = rect;
};
export const bigRecordRect = () => recordRect?.() ?? null;

// ---- Media keys and the lock screen ----

function mediaSession(index: number) {
  if (!("mediaSession" in navigator)) return;
  const track = tracks[index];
  navigator.mediaSession.metadata = new MediaMetadata({
    title: track.title,
    artist: track.artist,
    album: track.album,
    artwork: [{ src: track.artwork, sizes: "600x600", type: "image/jpeg" }],
  });
  navigator.mediaSession.setActionHandler("previoustrack", () => step(-1));
  navigator.mediaSession.setActionHandler("nexttrack", () => step(1));
}

function clearMediaSession() {
  if (!("mediaSession" in navigator)) return;
  navigator.mediaSession.metadata = null;
  navigator.mediaSession.setActionHandler("previoustrack", null);
  navigator.mediaSession.setActionHandler("nexttrack", null);
}
