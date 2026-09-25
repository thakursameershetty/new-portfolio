import * as THREE from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";
import { loadFonts, roundRect, setSpacing, wrap, type Fonts } from "./diskBox3d";
import type { ScreenItem } from "./projects";

// The case study's monitor in three.js: a beige CRT on a desk, with the project's floppy in
// the drive under its screen and a remote lying in front of it, seen from a little above.
// Each part of the case study is a channel: the screen plays that part's stills, clips and
// test cards, and the remote's number keys (or scrolling the story) change channel. The set
// can be dragged round and tipped, and eases back to where it rests when let go.

export interface CrtChannel {
  label: string;
  screen: ScreenItem[];
}

export interface CrtSet {
  /** Change channel, with a burst of static (none for `instant`). */
  setChannel(index: number, instant?: boolean): void;
  /** Narrow screens: frame the monitor alone, square on, and put the remote away. */
  setCompact(compact: boolean): void;
  /** Tip the set from a phone's tilt, from -1 to 1 across and up. */
  tilt(x: number, y: number): void;
  /** Hold the current item (no advancing on its own), while it's being looked at closely. */
  hold(on: boolean): void;
  /** Show this item of the current channel. */
  showItem(index: number): void;
  /** Where the screen is on the page. */
  screenRect(): DOMRect | null;
  /** Eject: the disk slides back out of the drive as the tube powers down. */
  eject(): Promise<void>;
  dispose(): void;
}

// Sizes in monitor widths.
const standHeight = 0.07;
const bodyHeight = 0.86;
const bodyDepth = 0.72;
const front = bodyDepth / 2;
const screenWidth = 0.78;
const screenHeight = screenWidth * 0.75;
const screenY = standHeight + bodyHeight - 0.06 - screenHeight / 2;
const chinY = standHeight + 0.1;
const diskSize = 0.3;
const diskSeatedZ = front + 0.1 - diskSize / 2;

const imageHold = 4200;
const videoLimit = 14000;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const easeInQuad = (t: number) => t * t;
const easeInOutCubic = (t: number) =>
  t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;

export async function createCrtSet(
  canvas: HTMLCanvasElement,
  {
    channels,
    disk,
    reduceMotion = false,
    onSelect,
    onKey,
    onPower,
    onSeat,
    onScreen,
    onScreenHover,
    onItem,
  }: {
    channels: CrtChannel[];
    /** The project's floppy, in the drive. */
    disk: { color: string; ink: string; number: number; title: string };
    reduceMotion?: boolean;
    /** A number key or CH ▲/▼ on the remote chose this channel. */
    onSelect: (index: number) => void;
    /** Any key pressed, for its click. */
    onKey?: () => void;
    /** The red button. */
    onPower?: () => void;
    /** The disk latching into the drive, as the monitor powers on. */
    onSeat?: () => void;
    /** The screen was clicked or tapped, showing this item of the current channel. */
    onScreen?: (item: number) => void;
    /** The pointer went onto or off the screen. */
    onScreenHover?: (over: boolean) => void;
    /** The screen moved on to another item by itself. */
    onItem?: (item: number) => void;
  },
): Promise<CrtSet> {
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
  scene.environmentIntensity = 0.7;
  room.dispose();

  const key = new THREE.DirectionalLight(0xffffff, 1.1);
  key.position.set(-2, 5, 4);
  scene.add(key);

  const camera = new THREE.PerspectiveCamera(22, 1, 0.1, 100);
  // `pivot` turns with drags and tilt; `set` sits in it, centred on what's framed.
  const pivot = new THREE.Group();
  scene.add(pivot);
  const set = new THREE.Group();
  pivot.add(set);

  const disposables: { dispose(): void }[] = [];
  const keep = <T extends { dispose(): void }>(item: T) => {
    disposables.push(item);
    return item;
  };
  const texture = (source: HTMLCanvasElement) => {
    const map = keep(new THREE.CanvasTexture(source));
    map.colorSpace = THREE.SRGBColorSpace;
    map.anisotropy = 4;
    return map;
  };

  // ---- The monitor. ----
  const monitor = new THREE.Group();
  set.add(monitor);
  const beige = keep(new THREE.MeshStandardMaterial({ color: 0xd8d0bf, roughness: 0.55 }));
  const beigeDark = keep(new THREE.MeshStandardMaterial({ color: 0xbdb4a2, roughness: 0.6 }));
  const bezelMaterial = keep(new THREE.MeshStandardMaterial({ color: 0x2b2926, roughness: 0.7 }));
  const slotMaterial = keep(new THREE.MeshStandardMaterial({ color: 0x14120f, roughness: 0.9 }));

  const body = new THREE.Mesh(
    keep(new RoundedBoxGeometry(1, bodyHeight, bodyDepth, 4, 0.05)),
    beige,
  );
  body.position.set(0, standHeight + bodyHeight / 2, 0);
  monitor.add(body);

  // The tube's housing, narrowing to the back.
  const back = new THREE.Mesh(keep(new RoundedBoxGeometry(0.72, 0.62, 0.36, 4, 0.08)), beige);
  back.position.set(0, standHeight + 0.44, -front - 0.12);
  monitor.add(back);

  const stand = new THREE.Mesh(keep(new RoundedBoxGeometry(0.62, standHeight, 0.5, 3, 0.02)), beigeDark);
  stand.position.set(0, standHeight / 2, -0.04);
  monitor.add(stand);

  // Bezel: a dark rounded frame just proud of the front, the tube inside it.
  const bezel = new THREE.Mesh(
    keep(new THREE.ShapeGeometry(roundedRectShape(screenWidth + 0.06, screenHeight + 0.06, 0.05), 8)),
    bezelMaterial,
  );
  bezel.position.set(0, screenY, front + 0.001);
  monitor.add(bezel);

  // The tube: a plane bulging towards the viewer, drawn by the CRT shader.
  const tubeGeometry = keep(new THREE.PlaneGeometry(screenWidth, screenHeight, 32, 24));
  const positions = tubeGeometry.attributes.position;
  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i) / (screenWidth / 2);
    const y = positions.getY(i) / (screenHeight / 2);
    positions.setZ(i, 0.024 * (1 - x * x) * (1 - y * y));
  }
  tubeGeometry.computeVertexNormals();
  const blank = keep(new THREE.DataTexture(new Uint8Array([0, 0, 0, 255]), 1, 1));
  blank.needsUpdate = true;
  const tubeMaterial = keep(
    new THREE.ShaderMaterial({
      uniforms: {
        uMap: { value: blank },
        uTexAspect: { value: 4 / 3 },
        uScreenAspect: { value: screenWidth / screenHeight },
        uTime: { value: 0 },
        uStatic: { value: 0 },
        uPower: { value: reduceMotion ? 1 : 0 },
      },
      vertexShader: tubeVertex,
      fragmentShader: tubeFragment,
      toneMapped: false,
    }),
  );
  const tube = new THREE.Mesh(tubeGeometry, tubeMaterial);
  tube.position.set(0, screenY, front + 0.003);
  monitor.add(tube);

  // Glass: a faint sheen over the tube, brighter up top.
  const glassCanvas = document.createElement("canvas");
  glassCanvas.width = 256;
  glassCanvas.height = 192;
  {
    const ctx = glassCanvas.getContext("2d")!;
    const sheen = ctx.createLinearGradient(0, 0, 90, 192);
    sheen.addColorStop(0, "rgba(255,255,255,0.22)");
    sheen.addColorStop(0.35, "rgba(255,255,255,0.04)");
    sheen.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = sheen;
    ctx.fillRect(0, 0, 256, 192);
  }
  const glass = new THREE.Mesh(
    tubeGeometry,
    keep(
      new THREE.MeshBasicMaterial({
        map: texture(glassCanvas),
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    ),
  );
  glass.position.set(0, screenY, front + 0.006);
  monitor.add(glass);

  // Chin, left: the channel display.
  const displayCanvas = document.createElement("canvas");
  displayCanvas.width = 512;
  displayCanvas.height = 112;
  const displayTexture = texture(displayCanvas);
  const display = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(0.34, 0.34 * (112 / 512))),
    keep(new THREE.MeshBasicMaterial({ map: displayTexture, toneMapped: false })),
  );
  display.position.set(-0.26, chinY, front + 0.002);
  monitor.add(display);
  const drawDisplay = (text: string) => {
    const ctx = displayCanvas.getContext("2d")!;
    ctx.fillStyle = "#101510";
    roundRect(ctx, 0, 0, 512, 112, 14);
    ctx.fillStyle = "#9fe29a";
    ctx.shadowColor = "rgba(159,226,154,0.6)";
    ctx.shadowBlur = 10;
    ctx.font = `700 46px ${fonts.hero}`;
    setSpacing(ctx, 3);
    ctx.textBaseline = "middle";
    let size = 46;
    while (ctx.measureText(text).width > 470 && size > 24) {
      size -= 2;
      ctx.font = `700 ${size}px ${fonts.hero}`;
    }
    ctx.fillText(text, 22, 60);
    ctx.shadowBlur = 0;
    displayTexture.needsUpdate = true;
  };

  // Chin, right: the floppy drive, a slot with the project's disk in it, and its light.
  const slot = new THREE.Mesh(keep(new THREE.BoxGeometry(0.36, 0.03, 0.02)), slotMaterial);
  slot.position.set(0.19, chinY, front - 0.006);
  monitor.add(slot);
  const slotLip = new THREE.Mesh(keep(new THREE.BoxGeometry(0.4, 0.008, 0.012)), beigeDark);
  slotLip.position.set(0.19, chinY - 0.022, front + 0.002);
  monitor.add(slotLip);

  const diskMesh = new THREE.Mesh(
    keep(new THREE.BoxGeometry(diskSize, 0.012, diskSize)),
    [
      ...Array.from({ length: 6 }, (_, face) =>
        face === 2
          ? keep(new THREE.MeshStandardMaterial({ map: texture(drawDiskTop(disk, fonts)), roughness: 0.6 }))
          : keep(new THREE.MeshStandardMaterial({ color: disk.color, roughness: 0.6 })),
      ),
    ],
  );
  diskMesh.position.set(0.19, chinY, reduceMotion ? diskSeatedZ : diskSeatedZ + 0.34);
  monitor.add(diskMesh);

  const ledGeometry = keep(new THREE.BoxGeometry(0.024, 0.012, 0.01));
  const driveLight = keep(new THREE.MeshBasicMaterial({ color: 0x5a4a2c, toneMapped: false }));
  const driveLed = new THREE.Mesh(ledGeometry, driveLight);
  driveLed.position.set(0.19 + 0.21, chinY + 0.03, front + 0.003);
  monitor.add(driveLed);
  const powerLight = keep(new THREE.MeshBasicMaterial({ color: 0x2d4a2d, toneMapped: false }));
  const powerLed = new THREE.Mesh(ledGeometry, powerLight);
  powerLed.position.set(0.43, chinY - 0.045, front + 0.003);
  monitor.add(powerLed);

  // ---- The remote, in front and to the right, turned towards the monitor and tipped up
  // towards the viewer (as if propped on something), so its keys face you. ----
  const remoteTip = 0.55;
  const remote = new THREE.Group();
  remote.rotation.order = "YXZ";
  remote.rotation.set(remoteTip, -0.42, 0);
  remote.scale.setScalar(1.1);
  // Lifted so its near end rests on the desk.
  remote.position.set(0.66, 0.31 * Math.sin(remoteTip) * 1.1, 0.6);
  set.add(remote);
  const remoteLength = 0.62;
  const remoteWidth = 0.2;
  const remoteThick = 0.036;
  const remoteBody = new THREE.Mesh(
    keep(new RoundedBoxGeometry(remoteWidth, remoteThick, remoteLength, 4, 0.016)),
    keep(new THREE.MeshStandardMaterial({ color: 0x2b2c30, roughness: 0.45 })),
  );
  remoteBody.position.y = remoteThick / 2;
  remote.add(remoteBody);
  const face = new THREE.Mesh(
    keep(new THREE.PlaneGeometry(remoteWidth - 0.02, remoteLength - 0.02)),
    keep(
      new THREE.MeshStandardMaterial({
        map: texture(drawRemoteFace(fonts)),
        transparent: true,
        roughness: 0.6,
      }),
    ),
  );
  face.rotation.x = -Math.PI / 2;
  face.position.y = remoteThick + 0.0006;
  remote.add(face);

  type Button = {
    mesh: THREE.Group;
    kind: "power" | "up" | "down" | "channel";
    index: number;
    pressed: number;
    lit: THREE.MeshStandardMaterial;
  };
  const buttons: Button[] = [];
  const keyGeometry = keep(new RoundedBoxGeometry(0.046, 0.016, 0.036, 2, 0.006));
  const wideKeyGeometry = keep(new RoundedBoxGeometry(0.07, 0.016, 0.034, 2, 0.006));
  const powerGeometry = keep(new THREE.CylinderGeometry(0.02, 0.02, 0.016, 24));
  const capGeometry = keep(new THREE.PlaneGeometry(0.04, 0.03));
  const wideCapGeometry = keep(new THREE.PlaneGeometry(0.064, 0.03));
  const addButton = (
    kind: Button["kind"],
    index: number,
    x: number,
    z: number,
    label: string,
  ) => {
    const group = new THREE.Group();
    group.position.set(x, remoteThick, z);
    const lit = keep(
      new THREE.MeshStandardMaterial({
        color: kind === "power" ? 0xc8352b : 0x3d3f45,
        roughness: 0.5,
        emissive: kind === "power" ? 0x3a0a06 : 0x000000,
      }),
    );
    const geometry = kind === "power" ? powerGeometry : kind === "channel" ? keyGeometry : wideKeyGeometry;
    const cap = new THREE.Mesh(geometry, lit);
    cap.position.y = 0.008;
    group.add(cap);
    if (label) {
      const print = new THREE.Mesh(
        kind === "channel" ? capGeometry : wideCapGeometry,
        keep(
          new THREE.MeshBasicMaterial({
            map: texture(drawKeyCap(label, fonts, kind === "channel" ? 64 : 104)),
            transparent: true,
          }),
        ),
      );
      print.rotation.x = -Math.PI / 2;
      print.position.y = 0.0165;
      group.add(print);
    }
    group.userData.button = buttons.length;
    group.traverse((child) => (child.userData.button = buttons.length));
    remote.add(group);
    buttons.push({ mesh: group, kind, index, pressed: 0, lit });
  };
  addButton("power", -1, 0.055, -0.235, "");
  addButton("up", -1, -0.042, -0.15, "CH ▲");
  addButton("down", -1, 0.042, -0.15, "CH ▼");
  channels.slice(0, 9).forEach((_, index) => {
    const column = index % 3;
    const row = Math.floor(index / 3);
    addButton("channel", index, (column - 1) * 0.058, -0.065 + row * 0.056, String(index + 1));
  });

  // Soft shadows under the monitor and the remote.
  const shadowCanvas = document.createElement("canvas");
  shadowCanvas.width = 128;
  shadowCanvas.height = 128;
  {
    const ctx = shadowCanvas.getContext("2d")!;
    const blur = ctx.createRadialGradient(64, 64, 8, 64, 64, 64);
    blur.addColorStop(0, "rgba(0,0,0,0.42)");
    blur.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = blur;
    ctx.fillRect(0, 0, 128, 128);
  }
  const shadowMaterial = keep(
    new THREE.MeshBasicMaterial({ map: texture(shadowCanvas), transparent: true, depthWrite: false }),
  );
  const shadowGeometry = keep(new THREE.PlaneGeometry(1, 1));
  const monitorShadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
  monitorShadow.rotation.x = -Math.PI / 2;
  monitorShadow.scale.set(1.25, 1.5, 1);
  monitorShadow.position.set(0, 0.001, -0.2);
  monitor.add(monitorShadow);
  // On the desk under the remote, not tipped with it.
  const remoteShadow = new THREE.Mesh(shadowGeometry, shadowMaterial);
  remoteShadow.rotation.set(-Math.PI / 2, 0, 0.42);
  remoteShadow.scale.set(0.36, 0.62, 1);
  remoteShadow.position.set(0.66, 0.001, 0.6);
  set.add(remoteShadow);

  // ---- What's on the screen. ----
  const loader = new THREE.TextureLoader();
  const images = new Map<string, Promise<THREE.Texture>>();
  const videos = new Map<string, { video: HTMLVideoElement; texture: THREE.VideoTexture }>();
  const cards = new Map<string, THREE.Texture>();
  const imageTexture = (src: string) => {
    let pending = images.get(src);
    if (!pending) {
      pending = loader.loadAsync(src).then((loaded) => {
        loaded.colorSpace = THREE.SRGBColorSpace;
        loaded.anisotropy = renderer.capabilities.getMaxAnisotropy();
        return keep(loaded);
      });
      images.set(src, pending);
    }
    return pending;
  };
  const videoTexture = (src: string) => {
    let entry = videos.get(src);
    if (!entry) {
      const video = document.createElement("video");
      video.src = src;
      video.muted = true;
      video.playsInline = true;
      video.crossOrigin = "anonymous";
      video.preload = "auto";
      const videoMap = keep(new THREE.VideoTexture(video));
      videoMap.colorSpace = THREE.SRGBColorSpace;
      entry = { video, texture: videoMap };
      videos.set(src, entry);
    }
    return entry;
  };
  const cardTexture = (item: { title: string; note: string }, channel: number) => {
    const id = `${channel}:${item.title}`;
    let card = cards.get(id);
    if (!card) {
      card = texture(drawTestCard(item, channel, channels[channel]?.label ?? "", fonts));
      cards.set(id, card);
    }
    return card;
  };
  const aspectOf = (map: THREE.Texture) => {
    const source = map.image as { width?: number; height?: number; videoWidth?: number; videoHeight?: number };
    const width = source.videoWidth || source.width || 4;
    const height = source.videoHeight || source.height || 3;
    return width / height;
  };

  let channel = 0;
  let itemIndex = 0;
  let itemTimer = 0;
  let playing: HTMLVideoElement | null = null;
  // Bumped on every change, so a still that loads late doesn't land on the wrong channel.
  let showToken = 0;
  // While held, the current item stays put (and a clip loops) instead of moving on.
  let held = false;

  const show = (map: THREE.Texture) => {
    tubeMaterial.uniforms.uMap.value = map;
    tubeMaterial.uniforms.uTexAspect.value = aspectOf(map);
  };
  const stopItem = () => {
    window.clearTimeout(itemTimer);
    if (playing) {
      playing.onended = null;
      playing.pause();
      playing = null;
    }
  };
  const playItem = () => {
    stopItem();
    const items = channels[channel]?.screen ?? [];
    if (!items.length) {
      show(blank);
      return;
    }
    const token = ++showToken;
    const item = items[itemIndex % items.length];
    const advance = () => {
      if (token !== showToken || items.length < 2 || held) return;
      itemIndex = (itemIndex + 1) % items.length;
      flicker(0.5, 220);
      playItem();
      onItem?.(itemIndex);
    };
    drawDisplay(channelText(channel));
    if (item.type === "card") {
      show(cardTexture(item, channel));
      itemTimer = window.setTimeout(advance, imageHold);
    } else if (item.type === "image") {
      imageTexture(item.src)
        .then((map) => {
          if (token === showToken) show(map);
        })
        .catch(() => {});
      itemTimer = window.setTimeout(advance, imageHold);
    } else {
      const { video, texture: map } = videoTexture(item.src);
      show(map);
      video.currentTime = 0;
      video.loop = items.length < 2 || held;
      video.onended = advance;
      video.play().catch(() => {});
      playing = video;
      itemTimer = window.setTimeout(advance, videoLimit);
    }
  };

  // ---- Motion. ----
  let frame = 0;
  let last = performance.now();
  let staticLevel = 0;
  let staticFrom = 0;
  let staticUntil = 0;
  let staticDuration = 1;
  const flicker = (strength: number, duration: number) => {
    if (reduceMotion) return;
    staticFrom = strength;
    staticDuration = duration;
    staticUntil = performance.now() + duration;
  };

  type Tween = { update: (t: number) => void; start: number; duration: number; ease: (t: number) => number; done: () => void };
  let tweens: Tween[] = [];
  const tween = (
    update: (t: number) => void,
    duration: number,
    ease: (t: number) => number = easeOutCubic,
  ) =>
    new Promise<void>((done) => {
      if (reduceMotion) {
        update(1);
        done();
        return;
      }
      tweens.push({ update, start: performance.now(), duration, ease, done });
    });

  // Where the set rests, and how far a drag, the pointer or a tilt has moved it from there.
  let compact = false;
  // Nearly square on and only a little above, so the screen is what you look at.
  const rest = { yaw: -0.07, pitch: 0.2 };
  const turn = { yaw: 0, pitch: 0 };
  const turnGoal = { yaw: 0, pitch: 0 };
  const lean = { x: 0, y: 0 };
  let dragging: { x: number; y: number; yaw: number; pitch: number; moved: boolean } | null = null;
  let springTimer = 0;

  // Framing: the camera keeps the whole set in view, however it's turned. Each frame it
  // measures where the monitor and remote land on screen, then eases back or in, and across,
  // until they fill the stage with a margin. `view` is its distance and its sideways and
  // upward shift from the pivot.
  const view = { distance: 4, panX: 0, panY: 0 };
  const fitParts = [body, back, stand, remoteBody].map((mesh) => {
    mesh.geometry.computeBoundingBox();
    const { min, max } = mesh.geometry.boundingBox!;
    const corners = [0, 1, 2, 3, 4, 5, 6, 7].map(
      (bits) =>
        new THREE.Vector3(
          bits & 1 ? max.x : min.x,
          bits & 2 ? max.y : min.y,
          bits & 4 ? max.z : min.z,
        ),
    );
    return { mesh, corners };
  });
  const point = new THREE.Vector3();
  const placeCamera = () => {
    const pitch = compact ? 0.12 : rest.pitch;
    const up = new THREE.Vector3(0, Math.cos(pitch), -Math.sin(pitch));
    const target = new THREE.Vector3(view.panX, 0, 0).addScaledVector(up, view.panY);
    camera.position
      .set(0, Math.sin(pitch), Math.cos(pitch))
      .multiplyScalar(view.distance)
      .add(target);
    camera.lookAt(target);
    camera.near = view.distance / 10;
    camera.far = view.distance * 10;
    camera.updateProjectionMatrix();
  };
  const fit = (rate: number) => {
    scene.updateMatrixWorld();
    camera.updateMatrixWorld();
    let minX = Infinity;
    let maxX = -Infinity;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const { mesh, corners } of fitParts) {
      if (!mesh.visible || (mesh === remoteBody && !remote.visible)) continue;
      for (const corner of corners) {
        point.copy(corner).applyMatrix4(mesh.matrixWorld).project(camera);
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      }
    }
    // How much of the stage the set spans (1 is edge to edge), against how much it should.
    const fill = Math.max((maxX - minX) / 2, (maxY - minY) / 2);
    const goal = compact ? 0.84 : 0.88;
    const halfHeight = view.distance * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
    view.panX += ((minX + maxX) / 2) * halfHeight * camera.aspect * rate;
    view.panY += ((minY + maxY) / 2) * halfHeight * rate;
    view.distance *= 1 + (fill / goal - 1) * rate;
    placeCamera();
  };
  const frameCamera = () => {
    const width = canvas.clientWidth || 1;
    const height = canvas.clientHeight || 1;
    camera.aspect = width / height;
    // The pivot the set turns about: the monitor alone, or the monitor and remote together.
    const centre = compact ? new THREE.Vector3(0, 0.45, 0) : new THREE.Vector3(0.1, 0.36, 0.34);
    set.position.set(-centre.x, -centre.y, -centre.z);
    placeCamera();
    // Settle straight away, rather than zooming into place on the first frames.
    for (let step = 0; step < 40; step++) fit(0.6);
    renderer.setSize(width, height, false);
  };
  const resizeObserver = new ResizeObserver(frameCamera);
  resizeObserver.observe(canvas);

  pivot.rotation.y = -rest.yaw;
  frameCamera();

  const render = (now: number) => {
    const delta = Math.min(now - last, 64);
    last = now;

    tweens = tweens.filter((item) => {
      const t = Math.min((now - item.start) / item.duration, 1);
      item.update(item.ease(t));
      if (t < 1) return true;
      item.done();
      return false;
    });

    staticLevel = now < staticUntil ? staticFrom * ((staticUntil - now) / staticDuration) : 0;
    tubeMaterial.uniforms.uStatic.value = staticLevel;
    tubeMaterial.uniforms.uTime.value = now / 1000;

    const k = 1 - Math.exp(-delta / 140);
    turn.yaw += (turnGoal.yaw - turn.yaw) * k;
    turn.pitch += (turnGoal.pitch - turn.pitch) * k;
    const restYaw = compact ? 0 : rest.yaw;
    pivot.rotation.y = -restYaw + turn.yaw + lean.x * 0.12;
    pivot.rotation.x = turn.pitch + lean.y * 0.06;
    placeCamera();
    fit(1 - Math.exp(-delta / 110));

    for (const button of buttons) {
      button.pressed = Math.max(0, button.pressed - delta / 160);
      button.mesh.position.y = remoteThick - 0.007 * Math.sin(Math.min(button.pressed, 1) * Math.PI);
    }

    renderer.render(scene, camera);
    frame = requestAnimationFrame(render);
  };
  frame = requestAnimationFrame(render);

  // ---- Pointer: hover and press the remote's keys, drag the set round. ----
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let hovered = -1;
  const buttonAt = (event: PointerEvent) => {
    if (compact) return -1;
    const rect = canvas.getBoundingClientRect();
    ndc.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObjects(
      buttons.map((button) => button.mesh),
      true,
    )[0];
    return typeof hit?.object.userData.button === "number" ? hit.object.userData.button : -1;
  };
  const onTube = (event: PointerEvent) => {
    const rect = canvas.getBoundingClientRect();
    ndc.set(
      ((event.clientX - rect.left) / rect.width) * 2 - 1,
      -((event.clientY - rect.top) / rect.height) * 2 + 1,
    );
    raycaster.setFromCamera(ndc, camera);
    return raycaster.intersectObject(tube, false).length > 0;
  };
  let overTube = false;
  // Over the screen, the pointer's own cursor gives way to the page's "Look closer" pill.
  const setOverTube = (over: boolean) => {
    if (over === overTube) return;
    overTube = over;
    onScreenHover?.(over);
  };
  const openScreen = () => {
    const count = channels[channel]?.screen.length ?? 0;
    if (count) onScreen?.(itemIndex % count);
  };
  const setHovered = (index: number) => {
    if (index === hovered) return;
    if (hovered >= 0 && buttons[hovered].kind !== "power") {
      buttons[hovered].lit.emissive.set(buttons[hovered].index === channel ? 0x1f3a1f : 0x000000);
    }
    hovered = index;
    const button = buttons[index];
    if (button && button.kind !== "power") button.lit.emissive.set(0x2a2d33);
    canvas.style.cursor = index >= 0 ? "pointer" : dragging ? "grabbing" : overTube ? "none" : "grab";
    // The display previews where a number key goes.
    if (button?.kind === "channel") drawDisplay(channelText(button.index));
    else drawDisplay(channelText(channel));
  };
  const press = (index: number) => {
    const button = buttons[index];
    if (!button) return;
    button.pressed = 1;
    onKey?.();
    powerLight.color.set(0x7dff7d);
    window.setTimeout(() => powerLight.color.set(0x5bd35b), 90);
    if (button.kind === "power") {
      onPower?.();
      return;
    }
    const count = channels.length;
    const next =
      button.kind === "channel"
        ? button.index
        : (channel + (button.kind === "up" ? 1 : -1) + count) % count;
    onSelect(next);
  };

  const handleDown = (event: PointerEvent) => {
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") {
      // Touch: keys on tap (in pointerup), no dragging, so the page still scrolls.
      dragging = { x: event.clientX, y: event.clientY, yaw: turnGoal.yaw, pitch: turnGoal.pitch, moved: false };
      return;
    }
    const index = buttonAt(event);
    if (index >= 0) {
      press(index);
      return;
    }
    if (onTube(event)) {
      openScreen();
      return;
    }
    window.clearTimeout(springTimer);
    dragging = { x: event.clientX, y: event.clientY, yaw: turnGoal.yaw, pitch: turnGoal.pitch, moved: false };
    canvas.setPointerCapture(event.pointerId);
    canvas.style.cursor = "grabbing";
  };
  const handleMove = (event: PointerEvent) => {
    if (dragging && event.pointerType === "mouse") {
      const dx = event.clientX - dragging.x;
      const dy = event.clientY - dragging.y;
      if (Math.abs(dx) + Math.abs(dy) > 3) dragging.moved = true;
      turnGoal.yaw = THREE.MathUtils.clamp(dragging.yaw + dx * 0.006, -0.75, 0.75);
      turnGoal.pitch = THREE.MathUtils.clamp(dragging.pitch + dy * 0.004, -0.22, 0.3);
      return;
    }
    if (event.pointerType !== "mouse" || held) return;
    const rect = canvas.getBoundingClientRect();
    lean.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    lean.y = ((event.clientY - rect.top) / rect.height) * 2 - 1;
    const index = buttonAt(event);
    setOverTube(index < 0 && onTube(event));
    setHovered(index);
    if (index < 0) canvas.style.cursor = overTube ? "none" : "grab";
  };
  const handleUp = (event: PointerEvent) => {
    const wasDragging = dragging;
    dragging = null;
    if (event.pointerType !== "mouse" && event.pointerType !== "pen") {
      if (wasDragging && Math.hypot(event.clientX - wasDragging.x, event.clientY - wasDragging.y) < 8) {
        const index = buttonAt(event);
        if (index >= 0) press(index);
        else if (onTube(event)) openScreen();
      }
      return;
    }
    if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    canvas.style.cursor = hovered >= 0 ? "pointer" : overTube ? "none" : "grab";
    // Let go: a moment to look, then ease back to rest.
    springTimer = window.setTimeout(() => {
      turnGoal.yaw = 0;
      turnGoal.pitch = 0;
    }, 1600);
  };
  const handleLeave = () => {
    lean.x = 0;
    lean.y = 0;
    setOverTube(false);
    setHovered(-1);
  };
  canvas.addEventListener("pointerdown", handleDown);
  canvas.addEventListener("pointermove", handleMove);
  canvas.addEventListener("pointerup", handleUp);
  canvas.addEventListener("pointercancel", handleUp);
  canvas.addEventListener("pointerleave", handleLeave);
  canvas.style.cursor = "grab";

  // "CH 03 HOW IT WORKS", with "2/3" on the end while showing one of several items.
  const channelText = (index: number) => {
    const count = channels[index]?.screen.length ?? 0;
    const place = index === channel && count > 1 ? ` ${(itemIndex % count) + 1}/${count}` : "";
    return `CH ${String(index + 1).padStart(2, "0")} ${(channels[index]?.label ?? "").toUpperCase()}${place}`;
  };
  const lightKey = () => {
    for (const button of buttons) {
      if (button.kind === "channel") button.lit.emissive.set(button.index === channel ? 0x1f3a1f : 0x000000);
    }
  };

  // ---- Start: the disk slides into the drive, latches, and the tube warms up. ----
  drawDisplay("");
  const start = async () => {
    await tween((e) => (diskMesh.position.z = diskSeatedZ + 0.34 * (1 - e)), 520, easeInQuad);
    onSeat?.();
    driveLight.color.set(0xffb347);
    powerLight.color.set(0x5bd35b);
    await tween(
      (e) => (tubeMaterial.uniforms.uPower.value = e),
      700,
      easeInOutCubic,
    );
    driveLight.color.set(0x5a4a2c);
  };
  drawDisplay(channelText(0));
  lightKey();
  playItem();
  void start();

  return {
    setChannel(index, instant = false) {
      if (index === channel || !channels[index]) return;
      channel = index;
      itemIndex = 0;
      drawDisplay(channelText(channel));
      lightKey();
      if (!instant) flicker(1, 380);
      playItem();
    },
    setCompact(next) {
      compact = next;
      remote.visible = !next;
      remoteShadow.visible = !next;
      frameCamera();
    },
    tilt(x, y) {
      if (held) return;
      lean.x = x * 2;
      lean.y = y * 2;
    },
    hold(on) {
      if (held === on) return;
      held = on;
      // Held still, square on, while it's being looked at closely.
      if (on) {
        window.clearTimeout(springTimer);
        lean.x = 0;
        lean.y = 0;
        setOverTube(false);
      }
      if (playing) playing.loop = on || (channels[channel]?.screen.length ?? 0) < 2;
      // Let go: carry on from here.
      if (!on) playItem();
      else window.clearTimeout(itemTimer);
    },
    async eject() {
      held = true;
      stopItem();
      driveLight.color.set(0xffb347);
      await Promise.all([
        tween((e) => (diskMesh.position.z = diskSeatedZ + 0.3 * e), 360, easeOutCubic),
        tween((e) => (tubeMaterial.uniforms.uPower.value = 1 - e), 300, easeInQuad),
      ]);
      driveLight.color.set(0x5a4a2c);
      powerLight.color.set(0x2d4a2d);
    },
    screenRect() {
      const bounds = canvas.getBoundingClientRect();
      if (!bounds.width) return null;
      scene.updateMatrixWorld();
      camera.updateMatrixWorld();
      let minX = Infinity;
      let maxX = -Infinity;
      let minY = Infinity;
      let maxY = -Infinity;
      for (const [x, y] of [
        [-1, -1],
        [1, -1],
        [1, 1],
        [-1, 1],
      ]) {
        point
          .set((x * screenWidth) / 2, (y * screenHeight) / 2, 0.01)
          .applyMatrix4(tube.matrixWorld)
          .project(camera);
        minX = Math.min(minX, point.x);
        maxX = Math.max(maxX, point.x);
        minY = Math.min(minY, point.y);
        maxY = Math.max(maxY, point.y);
      }
      return new DOMRect(
        bounds.left + ((minX + 1) / 2) * bounds.width,
        bounds.top + ((1 - maxY) / 2) * bounds.height,
        ((maxX - minX) / 2) * bounds.width,
        ((maxY - minY) / 2) * bounds.height,
      );
    },
    showItem(index) {
      const count = channels[channel]?.screen.length ?? 0;
      if (!count || index % count === itemIndex % count) return;
      itemIndex = index % count;
      flicker(0.4, 200);
      playItem();
    },
    dispose() {
      cancelAnimationFrame(frame);
      window.clearTimeout(springTimer);
      stopItem();
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerdown", handleDown);
      canvas.removeEventListener("pointermove", handleMove);
      canvas.removeEventListener("pointerup", handleUp);
      canvas.removeEventListener("pointercancel", handleUp);
      canvas.removeEventListener("pointerleave", handleLeave);
      for (const item of tweens) item.done();
      tweens = [];
      for (const { video } of videos.values()) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
      for (const item of disposables) item.dispose();
      scene.environment?.dispose();
      pmrem.dispose();
      renderer.dispose();
      renderer.forceContextLoss();
    },
  };
}

// ---- The tube: curvature, scanlines, a vignette, static, and warming up from a line. ----
const tubeVertex = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const tubeFragment = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uTexAspect;
  uniform float uScreenAspect;
  uniform float uTime;
  uniform float uStatic;
  uniform float uPower;
  varying vec2 vUv;

  float noise(vec2 p) {
    return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453);
  }

  void main() {
    vec2 centred = vUv - 0.5;
    // Barrel: the picture bows out towards the corners.
    vec2 uv = 0.5 + centred * (1.0 + 0.1 * dot(centred, centred));
    float inside = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);

    // Cover the screen with the picture, whatever its shape.
    vec2 fit = uv - 0.5;
    if (uTexAspect > uScreenAspect) fit.x *= uScreenAspect / uTexAspect;
    else fit.y *= uTexAspect / uScreenAspect;
    vec3 colour = texture2D(uMap, fit + 0.5).rgb;

    // Static between channels.
    float grain = noise(floor(uv * vec2(260.0, 200.0)) + floor(uTime * 40.0));
    colour = mix(colour, vec3(grain * 0.9), uStatic);
    colour += (noise(vec2(uTime, floor(uv.y * 90.0))) - 0.5) * 0.25 * uStatic;

    // Scanlines (fading to an even tone once they're finer than the pixels showing them, as
    // when the set is turned edge-on, so they don't shimmer into moiré), a slow rolling band,
    // and the tube's darker edges.
    float lines = uv.y * 620.0;
    float density = fwidth(lines);
    colour *= mix(0.84 + 0.16 * sin(lines), 0.9, smoothstep(0.35, 1.2, density));
    colour *= 0.96 + 0.04 * sin(uv.y * 6.0 - uTime * 1.6);
    float edge = length(centred * vec2(1.0, 1.15));
    colour *= smoothstep(0.78, 0.3, edge);
    colour *= inside;

    // Warming up: a bright line that widens, then opens out into the picture.
    float across = clamp(uPower * 2.0, 0.0, 1.0);
    float open = clamp(uPower * 2.0 - 1.0, 0.0, 1.0);
    float band = max(open * 0.5, 0.004);
    float lit = step(abs(vUv.x - 0.5), across * 0.5) * step(abs(vUv.y - 0.5), band);
    colour = colour * lit + vec3(0.9, 0.95, 1.0) * lit * (1.0 - open) * 1.4;

    gl_FragColor = vec4(colour, 1.0);
    #include <colorspace_fragment>
  }
`;

function roundedRectShape(width: number, height: number, radius: number) {
  const shape = new THREE.Shape();
  const x = -width / 2;
  const y = -height / 2;
  shape.moveTo(x + radius, y);
  shape.lineTo(x + width - radius, y);
  shape.quadraticCurveTo(x + width, y, x + width, y + radius);
  shape.lineTo(x + width, y + height - radius);
  shape.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  shape.lineTo(x + radius, y + height);
  shape.quadraticCurveTo(x, y + height, x, y + height - radius);
  shape.lineTo(x, y + radius);
  shape.quadraticCurveTo(x, y, x + radius, y);
  return shape;
}

// The disk's top as it sits in the drive: shutter end in, so the visible end is the label's
// foot, with the number and title written along it (turned to read from the front).
function drawDiskTop(disk: { color: string; ink: string; number: number; title: string }, fonts: Fonts) {
  const size = 512;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;
  const u = size / 100;
  ctx.fillStyle = disk.color;
  ctx.fillRect(0, 0, size, size);
  // Box top faces map v from the back (top of the canvas) to the front (bottom).
  ctx.fillStyle = "#f4f0e6";
  roundRect(ctx, 9 * u, 48 * u, 82 * u, 52 * u, [0, 0, 2 * u, 2 * u]);
  ctx.fillStyle = disk.color;
  roundRect(ctx, 9 * u, 88 * u, 82 * u, 12 * u, 0);
  ctx.fillStyle = disk.ink;
  ctx.font = `700 ${6.4 * u}px ${fonts.hero}`;
  setSpacing(ctx, 0.4 * u);
  ctx.textBaseline = "middle";
  ctx.fillText(String(disk.number).padStart(2, "0"), 13 * u, 94.4 * u);
  ctx.fillStyle = "#1a1a1a";
  ctx.font = `700 ${7 * u}px ${fonts.hero}`;
  setSpacing(ctx, -0.2 * u);
  ctx.fillText(disk.title.toUpperCase(), 13 * u, 80 * u, 74 * u);
  ctx.fillStyle = "rgba(0,0,0,0.55)";
  roundRect(ctx, 91.5 * u, 91 * u, 5 * u, 5 * u, u);
  return canvas;
}

function drawRemoteFace(fonts: Fonts) {
  const canvas = document.createElement("canvas");
  canvas.width = 180;
  canvas.height = 600;
  const ctx = canvas.getContext("2d")!;
  ctx.clearRect(0, 0, 180, 600);
  // The IR window at the top, the maker's name at the foot, a few printed marks.
  ctx.fillStyle = "#551a14";
  roundRect(ctx, 60, 6, 60, 12, 6);
  ctx.fillStyle = "rgba(245,241,234,0.55)";
  ctx.font = `700 13px ${fonts.hero}`;
  setSpacing(ctx, 2);
  ctx.textAlign = "center";
  ctx.fillText("POWER", 56, 62);
  ctx.fillStyle = "rgba(245,241,234,0.35)";
  ctx.font = `700 16px ${fonts.hero}`;
  setSpacing(ctx, 4);
  ctx.fillText("THAKUR", 90, 560);
  ctx.fillRect(40, 572, 100, 2);
  return canvas;
}

function drawKeyCap(label: string, fonts: Fonts, width: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = 48;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = "#f5f1ea";
  ctx.font = `700 ${label.length > 2 ? 18 : 26}px ${fonts.hero}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(label, width / 2, 26);
  return canvas;
}

// A test card for a channel whose footage isn't in yet: colour bars over the channel's name.
function drawTestCard(
  item: { title: string; note: string },
  channel: number,
  label: string,
  fonts: Fonts,
) {
  const width = 1024;
  const height = 768;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d")!;
  const bars = ["#c0c0c0", "#c0c000", "#00c0c0", "#00c000", "#c000c0", "#c00000", "#0000c0"];
  bars.forEach((colour, index) => {
    ctx.fillStyle = colour;
    ctx.fillRect((index * width) / bars.length, 0, width / bars.length + 1, height * 0.36);
  });
  ctx.fillStyle = "#111";
  ctx.fillRect(0, height * 0.36, width, height * 0.64);

  ctx.fillStyle = "#9fe29a";
  ctx.font = `700 34px ${fonts.hero}`;
  setSpacing(ctx, 4);
  ctx.textBaseline = "top";
  ctx.fillText(`CH ${String(channel + 1).padStart(2, "0")} · ${label.toUpperCase()}`, 64, height * 0.36 + 56);

  ctx.fillStyle = "#f5f1ea";
  ctx.font = `700 70px ${fonts.hero}`;
  setSpacing(ctx, -2);
  let y = height * 0.36 + 120;
  for (const line of wrap(ctx, item.title.toUpperCase(), width - 128).slice(0, 3)) {
    ctx.fillText(line, 64, y);
    y += 76;
  }
  ctx.fillStyle = "rgba(245,241,234,0.6)";
  ctx.font = `400 30px ${fonts.sans}`;
  setSpacing(ctx, 0);
  ctx.fillText(item.note, 64, y + 18);
  return canvas;
}
