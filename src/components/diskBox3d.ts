import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";

// A clear plastic disk box in three.js: a smoky tray with a hinged hood, holding floppy disks
// that stand side by side. It only draws while something moves, so an idle box costs nothing.
// Disks leave and come back through `onOut` / `liftedRect`, which hand them to (and take them
// from) the HTML disks in the grid at the same spot on screen.

export interface BoxDisk {
  title: string;
  kind: string;
  role: string;
  /** Printed on the label band, top right. */
  tag: string;
  number: number;
  disk: string;
  ink: string;
}

export interface ScreenRect {
  left: number;
  top: number;
  width: number;
  height: number;
}

export interface DiskBoxScene {
  /** Cursor over the box, from -1 to 1 across and up. */
  pointer(x: number, y: number): void;
  leave(): void;
  /** Tip the box without hovering it (from a phone's tilt), from -1 to 1 across and up. */
  tilt(x: number, y: number): void;
  /**
   * Lid up, disks out one by one (each announced by `onLift` as it starts to rise, and
   * handed over through `onOut` once it's out), box off to rest.
   */
  open(
    onOut: (index: number, rect: ScreenRect) => void,
    onLift?: (index: number) => void,
  ): Promise<void>;
  /** Putting away, step one: the resting box comes back to the front, lid still open. */
  returnToFront(): Promise<void>;
  /** Where disk `index` hovers over its slot before dropping in, on screen. */
  liftedRect(index: number): ScreenRect;
  dropIn(index: number): Promise<void>;
  shut(): Promise<void>;
  dispose(): void;
}

// Sizes in disk widths.
const thickness = 0.035;
const spacing = 0.72;
const wall = 0.03;
const trayHeight = 0.7;
const hoodHeight = 0.42;
const depth = 0.8;
const rise = 1.12;
const lidOpen = -1.95;
const floorY = wall;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const easeInQuad = (t: number) => t * t;
const easeOutBack = (t: number) => {
  const c = 1.4;
  return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2);
};

export async function createDiskBoxScene(
  canvas: HTMLCanvasElement,
  disks: BoxDisk[],
  {
    label,
    fitSlots = disks.length,
    dealt = false,
    onKnock,
    onRattle,
  }: {
    /** The sticker on the front. */
    label: string;
    /** Frame the camera for this many disks, so boxes of different sizes share one scale. */
    fitSlots?: number;
    /** A disk knocking against a neighbour or the wall, from 0 (a tap) to 1 (a clack). */
    onKnock?: (strength: number) => void;
    /**
     * The disks shifting about while they move, called often while the motion is lively
     * and less often as it dies down; `intensity` runs from 0 to 1.
     */
    onRattle?: (intensity: number) => void;
    /** Start with the disks already out and the box resting. */
    dealt?: boolean;
  },
): Promise<DiskBoxScene> {
  const fonts = await loadFonts(canvas);

  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.NeutralToneMapping;
  renderer.setClearColor(0x000000, 0);

  const scene = new THREE.Scene();
  const pmrem = new THREE.PMREMGenerator(renderer);
  const room = new RoomEnvironment();
  scene.environment = pmrem.fromScene(room, 0.04).texture;
  scene.environmentIntensity = 0.6;
  room.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 0.8);
  key.position.set(-2, 4, 5);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(24, 1, 0.1, 100);
  const root = new THREE.Group();
  scene.add(root);

  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(item: T) => {
    disposables.push(item);
    return item;
  };

  // ---- The box. ----
  // Room either side for the end disks to lean and slide without touching the walls.
  const width = (disks.length - 1) * spacing + 1 + 0.34;
  const plastic = keep(
    new THREE.MeshPhysicalMaterial({
      color: 0x6b7682,
      roughness: 0.08,
      metalness: 0,
      clearcoat: 1,
      clearcoatRoughness: 0.08,
      transparent: true,
      opacity: 0.12,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  const floorPlastic = keep(plastic.clone());
  floorPlastic.color.set(0x1c2126);
  floorPlastic.opacity = 0.5;
  const edgeMaterial = keep(
    new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.22 }),
  );

  const panel = (
    parent: THREE.Object3D,
    size: [number, number, number],
    at: [number, number, number],
    material: THREE.Material = plastic,
  ) => {
    const geometry = keep(new THREE.BoxGeometry(...size));
    const mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(...at);
    mesh.add(new THREE.LineSegments(keep(new THREE.EdgesGeometry(geometry)), edgeMaterial));
    parent.add(mesh);
    return mesh;
  };

  panel(root, [width, wall, depth], [0, wall / 2, 0], floorPlastic);
  panel(root, [width, trayHeight, wall], [0, trayHeight / 2, depth / 2]);
  panel(root, [width, trayHeight, wall], [0, trayHeight / 2, -depth / 2]);
  panel(root, [wall, trayHeight, depth], [-width / 2, trayHeight / 2, 0]);
  panel(root, [wall, trayHeight, depth], [width / 2, trayHeight / 2, 0]);

  // The hood hinges on the tray's back top edge.
  const lid = new THREE.Group();
  lid.position.set(0, trayHeight, -depth / 2);
  root.add(lid);
  panel(lid, [width, wall, depth], [0, hoodHeight, depth / 2]);
  panel(lid, [width, hoodHeight, wall], [0, hoodHeight / 2, depth]);
  panel(lid, [width, hoodHeight, wall], [0, hoodHeight / 2, 0]);
  panel(lid, [wall, hoodHeight, depth], [-width / 2, hoodHeight / 2, depth / 2]);
  panel(lid, [wall, hoodHeight, depth], [width / 2, hoodHeight / 2, depth / 2]);
  const latchMaterial = keep(
    new THREE.MeshStandardMaterial({ color: 0x6f7880, roughness: 0.4, transparent: true, opacity: 0.8 }),
  );
  panel(lid, [0.34, 0.06, 0.05], [0, 0.02, depth + 0.02], latchMaterial);

  // The paper sticker on the front.
  const stickerTexture = keep(drawSticker(`${label} · ${pad(disks.length)} disks`, fonts));
  const sticker = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(1.1, 1.1 / 5.33)),
    keep(new THREE.MeshStandardMaterial({ map: stickerTexture, roughness: 0.8 })),
  );
  sticker.position.set(0, 0.16, depth / 2 + wall / 2 + 0.002);
  sticker.rotation.z = -0.015;
  root.add(sticker);

  // ---- The disks: a chamfered slab, with the drawn face on both caps. ----
  const shape = new THREE.Shape();
  shape.moveTo(0, 0);
  shape.lineTo(1, 0);
  shape.lineTo(1, 0.91);
  shape.lineTo(0.91, 1);
  shape.lineTo(0, 1);
  shape.closePath();
  // Extruded caps take their UVs from the shape's own 0–1 coordinates, so the face drawing
  // maps straight on.
  const diskGeometry = keep(
    new THREE.ExtrudeGeometry(shape, { depth: thickness, bevelEnabled: false }),
  );
  diskGeometry.translate(-0.5, -0.5, -thickness / 2);

  const maxAnisotropy = renderer.capabilities.getMaxAnisotropy();
  const tilts = [-0.035, 0.025, -0.015, 0.03, -0.025, 0.02];
  const slots = disks.map((disk, index) => {
    const texture = keep(drawDisk(disk, fonts));
    texture.anisotropy = maxAnisotropy;
    const mesh = new THREE.Mesh(diskGeometry, [
      keep(new THREE.MeshStandardMaterial({ map: texture, roughness: 0.55 })),
      keep(new THREE.MeshStandardMaterial({ color: disk.disk, roughness: 0.6 })),
    ]);
    root.add(mesh);
    // Left to right, each a little further forward, so every label's left edge (where its
    // text starts) stays in view. Each is also turned so its right edge sits back, away
    // from the next disk where the two overlap.
    return {
      mesh,
      x: (index - (disks.length - 1) / 2) * spacing,
      z: -0.2 + index * 0.08,
      tilt: tilts[index % tilts.length],
      rise: 0,
      straighten: 0,
      bob: 0,
      // Loose in its slot: leaning side to side and sliding a little, each with its own
      // springiness so they don't move in lockstep. (Rocking front to back is shared: the
      // disks stand against each other, so they rock as one stack.)
      lean: { value: 0, velocity: 0 },
      slide: { value: 0, velocity: 0 },
      stiffness: 15 + ((index * 37) % 7),
      damping: 0.16 + ((index * 13) % 5) * 0.03,
    };
  });

  // ---- State, eased toward targets or tweened, then composed into the scene each frame. ----
  const state = {
    lid: 0,
    peek: 0,
    rest: 0,
    tiltX: 0,
    tiltY: 0,
  };
  const target = { tiltX: 0, tiltY: 0, hovered: false };
  let busy = false;
  let isDealt = dealt;

  if (dealt) {
    state.lid = lidOpen;
    state.rest = 1;
    for (const slot of slots) {
      slot.rise = rise;
      slot.straighten = 1;
      slot.mesh.visible = false;
    }
  }

  const stackRock = { value: 0, velocity: 0 };
  const boxRoll = () => -state.tiltX * 0.07;
  const boxPitch = () => state.tiltY * 0.08;

  const compose = () => {
    root.rotation.y = state.tiltX * 0.22;
    root.rotation.x = boxPitch() - state.rest * 0.14;
    root.rotation.z = boxRoll();
    root.position.set(0, -state.rest * 0.04, -state.rest * 0.9);
    lid.rotation.x = state.lid - state.peek;
    for (const slot of slots) {
      const bend = 1 - slot.straighten;
      // Leaning and rocking pivot on the disk's bottom edge, not its middle.
      const lean = slot.lean.value * bend;
      const rock = stackRock.value * bend;
      // Rising out or dropping in, a disk keeps its depth and its turn, so it moves straight
      // up and down its own slot, clear of its neighbours; only its lean straightens, to
      // meet the flat HTML disk.
      slot.mesh.position.set(
        slot.x + (slot.slide.value - lean * 0.5) * bend,
        floorY + 0.5 + slot.rise + slot.bob,
        slot.z + rock * 0.5,
      );
      slot.mesh.rotation.set(rock, 0.1, slot.tilt * bend + lean);
    }
  };

  // Frame the camera on the box's width; the canvas runs taller than the box so the disks
  // have room to rise, with the box sitting at its bottom.
  const fitWidth = (fitSlots - 1) * spacing + 1 + 0.34;
  const elevation = 0.3;
  const fit = () => {
    const { clientWidth, clientHeight } = canvas;
    if (!clientWidth || !clientHeight) return;
    renderer.setSize(clientWidth, clientHeight, false);
    const aspect = clientWidth / clientHeight;
    camera.aspect = aspect;
    const halfWidth = (fitWidth / 2) * 1.17;
    const halfFov = THREE.MathUtils.degToRad(camera.fov / 2);
    const distance = halfWidth / (Math.tan(halfFov) * aspect);
    const halfHeight = halfWidth / aspect;
    const center = new THREE.Vector3(0, halfHeight * 0.9, 0);
    camera.position.set(
      0,
      center.y + Math.sin(elevation) * distance,
      Math.cos(elevation) * distance,
    );
    camera.lookAt(center);
    camera.updateProjectionMatrix();
  };

  // ---- A small tween runner; frames run only while something is moving. ----
  type Tween = {
    start: number;
    duration: number;
    ease: (t: number) => number;
    apply: (eased: number) => void;
    resolve: () => void;
  };
  let tweens: Tween[] = [];
  let frame = 0;
  let last = 0;

  const tween = (
    apply: (eased: number) => void,
    duration: number,
    { delay = 0, ease = easeOutCubic }: { delay?: number; ease?: (t: number) => number } = {},
  ) =>
    new Promise<void>((resolve) => {
      tweens.push({ start: performance.now() + delay, duration, ease, apply, resolve });
      wake();
    });

  const lerpTo = (from: number, to: number) => (eased: number) => from + (to - from) * eased;

  const settle = (delta: number) => {
    // Hover easing: frame-rate independent, about 150ms to settle.
    const k = 1 - Math.exp(-delta / 90);
    let moving = false;
    const approach = (value: number, goal: number) => {
      const next = value + (goal - value) * k;
      if (Math.abs(goal - next) > 0.0005) moving = true;
      return Math.abs(goal - next) > 0.0005 ? next : goal;
    };
    const quiet = busy || isDealt;
    state.tiltX = approach(state.tiltX, busy ? 0 : target.tiltX);
    state.tiltY = approach(state.tiltY, busy ? 0 : target.tiltY);
    state.peek = approach(state.peek, target.hovered && !quiet ? 0.2 : 0);
    slots.forEach((slot, index) => {
      const lifted = target.hovered && !quiet ? 0.035 + (index % 2) * 0.015 : 0;
      slot.bob = approach(slot.bob, lifted);
    });
    if (shake(delta)) moving = true;
    return moving;
  };

  // The disks' loose motion. Tipping the box lets gravity lean them and slide them toward the
  // low side; turning it quickly leaves them behind for a moment (they keep their own
  // orientation while the box moves under them), and springs bring them back, overshooting a
  // little. Leaning too far, they knock against a neighbour or the wall and bounce.
  const limits = { lean: 0.08, slide: 0.035, rock: 0.05 };
  let lastRoll = boxRoll();
  let lastPitch = boxPitch();
  let lastKnock = 0;
  let lastRattle = 0;
  const shake = (delta: number) => {
    const roll = boxRoll();
    const pitch = boxPitch();
    const turnedRoll = roll - lastRoll;
    const turnedPitch = pitch - lastPitch;
    lastRoll = roll;
    lastPitch = pitch;

    let moving = false;
    let hardest = 0;
    // Small steps, so the springs stay stable when a frame runs long.
    const steps = Math.ceil(delta / 8);
    const dt = delta / 1000 / steps;

    // Springs one motion toward its goal; bounces it off its limit (a knock), and reports
    // whether it's still moving.
    const spring = (
      motion: { value: number; velocity: number },
      goal: number,
      limit: number,
      stiffness: number,
      damping: number,
      knocks: boolean,
    ) => {
      for (let step = 0; step < steps; step++) {
        const pull =
          -(stiffness ** 2) * (motion.value - goal) - 2 * damping * stiffness * motion.velocity;
        motion.velocity += pull * dt;
        motion.value += motion.velocity * dt;
      }
      if (Math.abs(motion.value) > limit) {
        if (knocks) hardest = Math.max(hardest, Math.abs(motion.velocity));
        motion.value = Math.sign(motion.value) * limit;
        motion.velocity *= -0.35;
      }
      if (Math.abs(motion.velocity) > 0.002 || Math.abs(motion.value - goal) > 0.0005) {
        return true;
      }
      motion.value = goal;
      motion.velocity = 0;
      return false;
    };
    const clamp = (value: number, limit: number) => Math.max(-limit, Math.min(limit, value));

    const inBox = slots.some((slot) => slot.mesh.visible && slot.straighten < 1);
    if (inBox) {
      stackRock.value -= turnedPitch * 0.8;
      if (spring(stackRock, clamp(pitch * 1.2, limits.rock), limits.rock, 17, 0.2, true)) {
        moving = true;
      }
    }
    for (const slot of slots) {
      if (!slot.mesh.visible || slot.straighten >= 1) continue;
      slot.lean.value -= turnedRoll * 0.8;
      const lean = clamp(roll * 1.3, limits.lean);
      const slide = clamp(-roll * 0.6, limits.slide);
      if (spring(slot.lean, lean, limits.lean, slot.stiffness, slot.damping, true)) moving = true;
      if (spring(slot.slide, slide, limits.slide, slot.stiffness, slot.damping, false)) {
        moving = true;
      }
    }

    const now = performance.now();
    if (onKnock && hardest > 0.5 && now - lastKnock > 60) {
      lastKnock = now;
      onKnock(Math.min(hardest / 3, 1));
    }

    // How lively the disks are, for the rattle: the more they move, the closer the ticks.
    if (onRattle && inBox) {
      let energy = Math.abs(stackRock.velocity) * 0.5;
      for (const slot of slots) {
        if (!slot.mesh.visible || slot.straighten >= 1) continue;
        energy += Math.abs(slot.lean.velocity) + Math.abs(slot.slide.velocity) * 4;
      }
      const intensity = Math.min(energy / 1.5, 1);
      if (energy > 0.12 && now - lastRattle > 150 - 90 * intensity) {
        lastRattle = now;
        onRattle(intensity);
      }
    }
    return moving;
  };

  const tick = (now: number) => {
    frame = 0;
    const delta = last ? Math.min(now - last, 64) : 16;
    last = now;

    const running = tweens;
    tweens = [];
    for (const item of running) {
      const t = Math.min(Math.max((now - item.start) / item.duration, 0), 1);
      if (now >= item.start) item.apply(item.ease(t));
      if (t >= 1 && now >= item.start) item.resolve();
      else tweens.push(item);
    }

    const easing = settle(delta);
    compose();
    renderer.render(scene, camera);
    if (tweens.length || easing) wake();
    else last = 0;
  };

  const wake = () => {
    if (!frame) frame = requestAnimationFrame(tick);
  };

  const resizeObserver = new ResizeObserver(() => {
    fit();
    compose();
    renderer.render(scene, camera);
  });
  resizeObserver.observe(canvas);
  fit();
  compose();
  renderer.render(scene, camera);

  // The on-screen box around a disk's front face.
  const rectOf = (index: number): ScreenRect => {
    compose();
    root.updateMatrixWorld(true);
    camera.updateMatrixWorld();
    const mesh = slots[index].mesh;
    const bounds = canvas.getBoundingClientRect();
    let left = Infinity;
    let top = Infinity;
    let right = -Infinity;
    let bottom = -Infinity;
    for (const [x, y] of [
      [-0.5, -0.5],
      [0.5, -0.5],
      [0.5, 0.5],
      [-0.5, 0.5],
    ]) {
      const point = mesh.localToWorld(new THREE.Vector3(x, y, thickness / 2)).project(camera);
      const px = bounds.left + ((point.x + 1) / 2) * bounds.width;
      const py = bounds.top + ((1 - point.y) / 2) * bounds.height;
      left = Math.min(left, px);
      right = Math.max(right, px);
      top = Math.min(top, py);
      bottom = Math.max(bottom, py);
    }
    // The HTML disk is square: centre a square the size of the face's width.
    const size = right - left;
    return { left, top: (top + bottom) / 2 - size / 2, width: size, height: size };
  };

  const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms));

  return {
    pointer(x, y) {
      target.tiltX = x;
      target.tiltY = y;
      target.hovered = true;
      wake();
    },
    tilt(x, y) {
      target.tiltX = x;
      target.tiltY = y;
      wake();
    },
    leave() {
      target.tiltX = 0;
      target.tiltY = 0;
      target.hovered = false;
      wake();
    },
    async open(onOut, onLift) {
      busy = true;
      isDealt = true;
      const lidFrom = state.lid - state.peek;
      state.peek = 0;
      const lidUp = tween((e) => (state.lid = lerpTo(lidFrom, lidOpen)(e)), 380, {
        ease: easeOutBack,
      });
      const outs = slots.map((slot, index) => {
        const bob = slot.bob;
        const liftAt = 200 + index * 90;
        if (onLift) window.setTimeout(() => onLift(index), liftAt);
        return tween(
          (e) => {
            slot.rise = lerpTo(bob, rise)(e);
            slot.bob = 0;
            slot.straighten = e;
          },
          380,
          { delay: liftAt, ease: easeOutCubic },
        ).then(() => {
          const rect = rectOf(index);
          slot.mesh.visible = false;
          wake();
          onOut(index, rect);
        });
      });
      await Promise.all([lidUp, ...outs]);
      await tween((e) => (state.rest = e), 520, { ease: easeOutBack });
      busy = false;
      wake();
    },
    async returnToFront() {
      busy = true;
      const from = state.rest;
      await tween((e) => (state.rest = lerpTo(from, 0)(e)), 420, { ease: easeInOutCubic });
      // Let the hover tilt finish settling to level, so lifted spots are measured square on.
      while (Math.abs(state.tiltX) > 0.002 || Math.abs(state.tiltY) > 0.002) await wait(16);
    },
    liftedRect(index) {
      return rectOf(index);
    },
    async dropIn(index) {
      const slot = slots[index];
      slot.mesh.visible = true;
      await tween(
        (e) => {
          slot.rise = lerpTo(rise, 0)(e);
          slot.straighten = 1 - e;
        },
        280,
        { ease: easeInQuad },
      );
    },
    async shut() {
      isDealt = false;
      // Slow enough to match its sound (opening's creak in reverse), falling faster as it
      // goes, so it seats as the catch snaps.
      await tween((e) => (state.lid = lerpTo(lidOpen, 0)(e)), 580, { ease: easeInQuad });
      busy = false;
      wake();
    },
    dispose() {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      for (const item of tweens) item.resolve();
      tweens = [];
      for (const item of disposables) item.dispose();
      scene.environment?.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

// ---- Drawing the disk faces and the sticker, in the site's own fonts. ----

type Fonts = { hero: string; sans: string; display: string };

async function loadFonts(element: Element): Promise<Fonts> {
  const style = getComputedStyle(element);
  const read = (name: string, fallback: string) =>
    style.getPropertyValue(name).trim() || fallback;
  const fonts = {
    hero: read("--font-hero", "monospace"),
    sans: read("--font-sans", "sans-serif"),
    display: read("--font-display", "sans-serif"),
  };
  await Promise.all([
    document.fonts.load(`700 40px ${fonts.hero}`),
    document.fonts.load(`400 24px ${fonts.sans}`),
    document.fonts.load(`400 18px ${fonts.display}`),
  ]).catch(() => {});
  return fonts;
}

const pad = (value: number) => String(value).padStart(2, "0");

// The same disk as the HTML one in Work.module.css, drawn at 512px: body, shutter,
// write-protect hole, and the ruled paper label with its coloured band.
function drawDisk(disk: BoxDisk, fonts: Fonts) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const u = size / 100;

  ctx.fillStyle = disk.disk;
  ctx.fillRect(0, 0, size, size);
  const sheen = ctx.createLinearGradient(0, 0, size * 0.34, size);
  sheen.addColorStop(0, "rgba(255,255,255,0.14)");
  sheen.addColorStop(0.38, "rgba(255,255,255,0)");
  ctx.fillStyle = sheen;
  ctx.fillRect(0, 0, size, size);
  const shade = ctx.createLinearGradient(0, size, 0, size * 0.7);
  shade.addColorStop(0, "rgba(0,0,0,0.14)");
  shade.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = shade;
  ctx.fillRect(0, 0, size, size);

  // Shutter.
  const metal = ctx.createLinearGradient(22 * u, 0, 74 * u, 0);
  metal.addColorStop(0, "#a9afb3");
  metal.addColorStop(0.42, "#eef0f1");
  metal.addColorStop(0.7, "#c2c7ca");
  metal.addColorStop(1, "#a4aaae");
  ctx.fillStyle = metal;
  roundRect(ctx, 22 * u, 0, 52 * u, 34 * u, [0, 0, 1.8 * u, 1.8 * u]);
  ctx.fillStyle = "rgba(0,0,0,0.22)";
  roundRect(ctx, 28.2 * u, 5.4 * u, 10.4 * u, 21.8 * u, u);

  // Write-protect hole.
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  roundRect(ctx, 88 * u, 89 * u, 7 * u, 7 * u, u);

  // Label paper with ruled lines.
  const labelX = 9 * u;
  const labelY = 42 * u;
  const labelW = 82 * u;
  ctx.fillStyle = "#f4f0e6";
  roundRect(ctx, labelX, labelY, labelW, size - labelY, [2 * u, 2 * u, 0, 0]);
  ctx.strokeStyle = "rgba(40,60,120,0.12)";
  ctx.lineWidth = 1;
  for (let y = labelY + 8 * u; y < size; y += 8 * u) {
    ctx.beginPath();
    ctx.moveTo(labelX, Math.round(y) + 0.5);
    ctx.lineTo(labelX + labelW, Math.round(y) + 0.5);
    ctx.stroke();
  }

  // Band: number and tag.
  const bandH = 8.4 * u;
  ctx.fillStyle = disk.disk;
  roundRect(ctx, labelX, labelY, labelW, bandH, [2 * u, 2 * u, 0, 0]);
  ctx.fillStyle = disk.ink;
  ctx.font = `700 ${3.6 * u}px ${fonts.hero}`;
  ctx.textBaseline = "middle";
  setSpacing(ctx, 0.06 * 3.6 * u);
  ctx.textAlign = "left";
  ctx.fillText(pad(disk.number), labelX + 5 * u, labelY + bandH / 2);
  ctx.textAlign = "right";
  ctx.fillText(disk.tag.toUpperCase(), labelX + labelW - 5 * u, labelY + bandH / 2);

  // Title, wrapped.
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#1a1a1a";
  ctx.font = `700 ${7.2 * u}px ${fonts.hero}`;
  setSpacing(ctx, -0.04 * 7.2 * u);
  let y = labelY + bandH + 4 * u;
  for (const line of wrap(ctx, disk.title.toUpperCase(), labelW - 10 * u)) {
    ctx.fillText(line, labelX + 5 * u, y);
    y += 7.4 * u;
  }

  ctx.font = `400 ${4.6 * u}px ${fonts.sans}`;
  setSpacing(ctx, 0);
  ctx.fillText(disk.kind, labelX + 5 * u, y + 1.5 * u);

  ctx.font = `400 ${3.4 * u}px ${fonts.display}`;
  setSpacing(ctx, 0.12 * 3.4 * u);
  ctx.fillStyle = "rgba(26,26,26,0.6)";
  ctx.textBaseline = "bottom";
  ctx.fillText(disk.role.toUpperCase(), labelX + 5 * u, size - 4 * u);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function drawSticker(text: string, fonts: Fonts) {
  const canvas = document.createElement("canvas");
  canvas.width = 640;
  canvas.height = 120;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f4f0e6";
  roundRect(ctx, 0, 0, 640, 120, 8);
  ctx.fillStyle = "#1a1a1a";
  // Shrink the type until the text fits the sticker.
  setSpacing(ctx, 3);
  let fontSize = 46;
  do {
    ctx.font = `700 ${fontSize}px ${fonts.hero}`;
    fontSize -= 2;
  } while (ctx.measureText(text.toUpperCase()).width > 580 && fontSize > 20);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(text.toUpperCase(), 320, 62);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  radius: number | number[],
) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, radius);
  ctx.fill();
}

function setSpacing(ctx: CanvasRenderingContext2D, px: number) {
  // letterSpacing is newer than the rest of canvas text; without it, text is just tighter.
  if ("letterSpacing" in ctx) ctx.letterSpacing = `${px}px`;
}

function wrap(ctx: CanvasRenderingContext2D, text: string, maxWidth: number) {
  const lines: string[] = [];
  let line = "";
  for (const word of text.split(/\s+/)) {
    const next = line ? `${line} ${word}` : word;
    if (line && ctx.measureText(next).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines;
}
