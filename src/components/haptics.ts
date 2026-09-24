// Haptic taps to go with the site's sounds, through the Vibration API. Only Android browsers
// support it (iOS Safari doesn't let websites vibrate), and only on touch screens: elsewhere
// this is silent. Patterns alternate buzz and pause, in ms; they're kept short and light so
// they read as mechanical ticks rather than a phone call.

export type HapticPattern = number | number[];

export function buzz(pattern: HapticPattern, delay = 0) {
  if (
    typeof navigator === "undefined" ||
    typeof navigator.vibrate !== "function" ||
    !window.matchMedia("(pointer: coarse)").matches
  ) {
    return;
  }
  // Not allowed before the visitor has touched the page: it just stays still.
  const run = () => {
    try {
      navigator.vibrate(pattern);
    } catch {}
  };
  if (delay > 0) window.setTimeout(run, delay);
  else run();
}
