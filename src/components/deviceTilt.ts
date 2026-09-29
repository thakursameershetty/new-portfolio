// A phone's tilt, for tipping the disk boxes by hand. Measured from however the phone is
// being held: that resting angle is learned from the first reading and then follows slowly,
// so holding the phone still at any angle settles the box level again, and only a tilt moves
// it. Touch screens only. iOS asks the visitor first, and only allows the question from a
// tap, so `armTilt` asks on every tap until there's an answer.

type Listener = (x: number, y: number) => void;

// How far a tilt goes, in degrees, to tip the box all the way.
const fullTilt = 18;
// How quickly the resting angle follows the phone, per reading (about 60 a second).
const settleRate = 0.006;

const listeners = new Set<Listener>();
let started = false;
// Declined: don't ask again.
let refused = false;
let asking = false;
let rest: { across: number; up: number } | null = null;

type Permission = () => Promise<"granted" | "denied">;

function permissionFor(): Permission | undefined {
  const permission = (
    DeviceOrientationEvent as unknown as { requestPermission?: Permission }
  ).requestPermission;
  return typeof permission === "function" ? permission : undefined;
}

export function requestTilt() {
  if (started || refused || asking) return;
  if (typeof window === "undefined" || !("DeviceOrientationEvent" in window)) return;
  if (!window.matchMedia("(pointer: coarse)").matches) return;

  const permission = permissionFor();
  if (!permission) {
    start();
    return;
  }
  asking = true;
  permission()
    .then((answer) => {
      if (answer === "granted") start();
      else refused = true;
    })
    // Not asked from a tap (iOS won't show the prompt): the next tap asks again.
    .catch(() => {})
    .finally(() => (asking = false));
}

/**
 * Starts the tilt as soon as it can. Android needs no permission, and an iPhone that was
 * already asked this visit answers without a prompt, so it starts right away there. Otherwise
 * iOS only asks from a tap, and Safari sends no `click` for a tap on plain page content (only
 * on links, buttons and the like), so it asks on every touch that ends, until answered.
 * Returns a cleanup.
 */
export function armTilt() {
  requestTilt();
  const ask = () => {
    requestTilt();
    if (started || refused) disarm();
  };
  const disarm = () => {
    window.removeEventListener("touchend", ask, true);
    window.removeEventListener("click", ask, true);
  };
  window.addEventListener("touchend", ask, { capture: true, passive: true });
  window.addEventListener("click", ask, true);
  return disarm;
}

/** Follow the tilt, from -1 to 1 across (right is positive) and up. Returns an unsubscribe. */
export function onTilt(listener: Listener) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function start() {
  started = true;
  window.addEventListener("deviceorientation", handleOrientation);
}

function handleOrientation(event: DeviceOrientationEvent) {
  if (event.beta === null || event.gamma === null || !listeners.size) return;

  // Turn the device's axes into the screen's, whichever way up it's being held.
  const angle = window.screen.orientation?.angle ?? 0;
  const { beta, gamma } = event;
  const [across, up] =
    angle === 90
      ? [beta, -gamma]
      : angle === 270 || angle === -90
        ? [-beta, gamma]
        : angle === 180
          ? [-gamma, -beta]
          : [gamma, beta];

  if (!rest) rest = { across, up };
  rest.across += (across - rest.across) * settleRate;
  rest.up += (up - rest.up) * settleRate;

  const clamp = (value: number) => Math.max(-1, Math.min(1, value / fullTilt));
  const x = clamp(across - rest.across);
  // Tipping the top of the phone away from you tips the box's front down.
  const y = clamp(rest.up - up);
  for (const listener of listeners) listener(x, y);
}
