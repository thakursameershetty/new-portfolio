"use client";

import { useTheme } from "next-themes";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from "react";
import { useReducedMotion } from "framer-motion";
import clsx from "clsx";
import styles from "./WebsiteShaderCanvas.module.css";

export type WebsiteShaderId = "aurora-veil" | "kinetic-dots";

export interface WebsiteShaderPreset {
  id: WebsiteShaderId;
  title: string;
  summary: string;
  intent: string;
  accent: string;
  interactive?: boolean;
  preview: {
    dark: string;
    light: string;
  };
  fragment: string;
}

export interface WebsiteShaderCanvasProps {
  preset?: WebsiteShaderId | string | WebsiteShaderPreset;
  className?: string;
  tone?: "dark" | "light";
  intensity?: number;
  animate?: boolean;
  maxPixelRatio?: number;
  maxCanvasPixels?: number;
  /** Follow the pointer across the whole window, even over content layered on top. */
  trackWindowPointer?: boolean;
  /** Seconds for the opening ripple that turns the grid on from the center; 0 skips it. */
  revealDuration?: number;
  /** Holds the grid dark until this turns false, then plays the ripple. */
  revealPaused?: boolean;
  /**
   * While the reveal is paused, the grid waits turned and zoomed in this pose; when it
   * starts, the grid unwinds to its resting pose over `seconds`.
   */
  introPose?: IntroPose;
  /** Rows at the top whose cells thin out at random into the dark, dissolving the edge. */
  topEdgeRows?: number;
  /** Where the reveal starts; the center by default. */
  revealFrom?: RevealFrom;
  /**
   * Drives the reveal directly (0 dark to 1 fully revealed), e.g. from scroll, instead of
   * playing it over `revealDuration`.
   */
  revealControl?: { current: number };
  children?: ReactNode;
}

interface WebsiteShaderDemoProps {
  preset: WebsiteShaderId | WebsiteShaderPreset;
  className?: string;
}

interface WebsiteShaderBackgroundProps {
  preset?: WebsiteShaderId | WebsiteShaderPreset;
  className?: string;
  intensity?: number;
  /** Fixes the tone; follows the site theme when omitted. */
  tone?: "dark" | "light";
  revealDuration?: number;
  revealPaused?: boolean;
  introPose?: IntroPose;
  topEdgeRows?: number;
  revealFrom?: RevealFrom;
  revealControl?: { current: number };
}

export interface IntroPose {
  degrees: number;
  scale: number;
  seconds: number;
}

const vertexShaderSource = `
attribute vec2 a_position;

void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const fragmentHeader = `
#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_pointer;
uniform vec4 u_trails[8];
uniform float u_intensity;
uniform float u_isLight;
uniform float u_reveal;
uniform vec4 u_shocks[4];
// Columns and rows of square cells across the canvas.
uniform vec2 u_gridSize;
// Intro pose: rotation in radians and zoom, applied around the canvas center.
uniform vec2 u_pose;
// Rows at the top that dissolve into the dark (0 for a straight edge).
uniform float u_topEdge;
// 0: the reveal rings out from the center. 1: it pours down from the top edge.
uniform float u_revealFrom;

float saturate(float value) {
  return clamp(value, 0.0, 1.0);
}

mat2 rotate2d(float angle) {
  float s = sin(angle);
  float c = cos(angle);
  return mat2(c, -s, s, c);
}

float hash21(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);

  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));

  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p = rotate2d(0.72) * p * 2.03 + 4.17;
    amplitude *= 0.5;
  }
  return value;
}

vec3 softLight(vec3 base, vec3 glow, float amount) {
  return mix(base, glow, saturate(amount));
}
`;

// Kinetic dots grid and opening-ripple tuning, shared by the shader and the reveal sound.
// Cells are square on every screen shape, with about this many of them on screen.
const kineticCellCount = 216;

/**
 * The kinetic grid for a canvas of this size: square cells of `cell` px, `cols` × `rows` of
 * them (fractional, so the edge cells are cut). The grid is laid out from the center, so four
 * cells always meet exactly in the middle.
 */
export function getKineticGrid(width: number, height: number) {
  const cell = Math.sqrt(
    (Math.max(width, 1) * Math.max(height, 1)) / kineticCellCount,
  );
  return { cols: width / cell, rows: height / cell, cell };
}
// Pause before the ripple starts, in seconds.
export const revealDelay = 0.25;
const revealOvershoot = 3.0;
const revealJitter = 0.8;
// A top-down reveal staggers its cells more, so they tumble in one after another.
const revealFlowJitter = 1.5;

/** Where the reveal starts: rings out from the center, or pours down from the top edge. */
export type RevealFrom = "center" | "top";
const revealEdge = 1.4;
const revealBackdrop = "#060605";
// Click shockwaves: how fast the ring travels in cells per second, and how long it lives.
export const shockSpeed = 16;
export const shockLifetime = 0.9;
const maxShocks = 4;
const glslFloat = (value: number) => value.toFixed(2);

// Parked outside the canvas so no cell is lit until the visitor moves the pointer.
const idlePointer = { x: -1, y: -1 };

const fragmentFooter = `
void main() {
  vec2 uv = gl_FragCoord.xy / max(u_resolution.xy, vec2(1.0));
  vec2 p = (gl_FragCoord.xy * 2.0 - u_resolution.xy) / max(min(u_resolution.x, u_resolution.y), 1.0);
  vec2 pointer = u_pointer * 2.0 - 1.0;
  pointer.x *= u_resolution.x / max(u_resolution.y, 1.0);

  vec3 color = shaderColor(uv, p, u_time, pointer, u_intensity, u_isLight);
  color = pow(max(color, vec3(0.0)), vec3(0.92));

  gl_FragColor = vec4(color, 1.0);
}
`;

export const websiteShaderPresets: WebsiteShaderPreset[] = [
  {
    id: "aurora-veil",
    title: "Aurora veil",
    summary:
      "Soft atmospheric color fields that sit well behind editorial copy.",
    intent:
      "Use it as a low-pressure section backdrop for launch pages, portfolios, and app onboarding.",
    accent: "#7bd8c4",
    interactive: false,
    preview: {
      dark: "radial-gradient(circle at 30% 24%, rgba(89,216,190,0.5), transparent 31%), radial-gradient(circle at 80% 72%, rgba(236,92,19,0.3), transparent 34%), linear-gradient(140deg, #06110f, #151515 55%, #030303)",
      light:
        "radial-gradient(circle at 34% 22%, rgba(83,194,169,0.35), transparent 30%), radial-gradient(circle at 76% 72%, rgba(236,92,19,0.18), transparent 34%), linear-gradient(140deg, #f5faf6, #eee7dc 55%, #fffaf0)",
    },
    fragment: `
vec3 shaderColor(vec2 uv, vec2 p, float t, vec2 pointer, float intensity, float isLight) {
  vec2 q = p;
  q.x += sin(q.y * 2.0 + t * 0.18) * 0.22;
  q.y += cos(q.x * 1.7 - t * 0.14) * 0.16;

  float veilA = smoothstep(0.72, 0.04, abs(q.y + sin(q.x * 1.8 + t * 0.24) * 0.32));
  float veilB = smoothstep(0.62, 0.02, abs(q.y * 0.85 - cos(q.x * 2.4 - t * 0.2) * 0.24));
  float grain = fbm(q * 2.5 + t * 0.04);

  vec3 base = mix(vec3(0.03, 0.04, 0.038), vec3(0.86, 0.83, 0.76), isLight);
  vec3 green = vec3(0.28, 0.82, 0.72);
  vec3 ember = vec3(0.95, 0.34, 0.1);
  vec3 color = base + green * veilA * 0.46 + ember * veilB * 0.28;
  color += (grain - 0.5) * 0.036;
  return color * (0.84 + intensity * 0.22);
}
`,
  },
  {
    id: "kinetic-dots",
    title: "Kinetic dots",
    summary:
      "A hover-reactive cell field that fills the trail behind the pointer.",
    intent:
      "Use it for interactive cards, playful analytics, and hero accents where the motion should come from the visitor.",
    accent: "#f0d46a",
    interactive: true,
    preview: {
      dark: "linear-gradient(90deg, rgba(240,212,106,0.13) 1px, transparent 1px), linear-gradient(0deg, rgba(236,92,19,0.09) 1px, transparent 1px), radial-gradient(circle at 58% 44%, rgba(236,92,19,0.18), transparent 24%), #090907",
      light:
        "linear-gradient(90deg, rgba(150,32,30,0.18) 1px, transparent 1px), linear-gradient(0deg, rgba(150,32,30,0.18) 1px, transparent 1px), #e54b45",
    },
    fragment: `
vec3 shaderColor(vec2 uv, vec2 p, float t, vec2 pointer, float intensity, float isLight) {
  // Intro pose: turn and zoom the whole grid about the center, in pixels so squares stay
  // square. Drawn per pixel, so lines stay sharp at any angle and zoom.
  vec2 posedPx = rotate2d(u_pose.x) * ((uv - 0.5) * u_resolution) / max(u_pose.y, 0.001);
  uv = posedPx / u_resolution + 0.5;

  // Cells are counted from the canvas center (cells -1 and 0 meet there on both axes).
  vec2 gridSize = u_gridSize;
  vec2 gridUv = (uv - 0.5) * gridSize;
  vec2 cell = floor(gridUv);
  vec2 local = fract(gridUv);
  vec2 centered = local - 0.5;
  vec2 cellCenter = (cell + 0.5) / gridSize + 0.5;
  float seed = hash21(cell);

  float edge = min(min(local.x, 1.0 - local.x), min(local.y, 1.0 - local.y));
  float line = 1.0 - smoothstep(0.005, 0.032, edge);
  float box = smoothstep(0.5, 0.38, max(abs(centered.x), abs(centered.y)));
  float idle = pow(sin(seed * 6.2831 + t * 0.22) * 0.5 + 0.5, 13.0) * 0.014;
  // Distances below are in cells, so the hover and trail cover the same cells on any screen.
  float hover = smoothstep(1.5, 0.0, length((cellCenter - u_pointer) * gridSize)) * 0.42;
  float fill = hover;
  float trailAmount = 0.0;
  vec3 fillColor = vec3(0.0);
  // Dark tone lights cells up in bright reds; light tone presses them into deeper reds.
  vec3 coral = mix(vec3(1.0, 0.42, 0.36), vec3(0.774, 0.2, 0.18), isLight);
  vec3 crimson = mix(vec3(0.9, 0.1, 0.16), vec3(0.7, 0.17, 0.155), isLight);
  vec3 wine = mix(vec3(0.62, 0.06, 0.2), vec3(0.595, 0.134, 0.123), isLight);

  for (int i = 0; i < 8; i++) {
    vec4 trail = u_trails[i];
    float distanceToTrail = length((cellCenter - trail.xy) * gridSize);
    float trailFill = smoothstep(2.9, 0.0, distanceToTrail) * trail.z;
    trailFill *= 0.78 + hash21(cell + float(i) * 2.17) * 0.06;
    fill = max(fill, trailFill);
    trailAmount = max(trailAmount, trailFill);
    fillColor += mix(mix(coral, crimson, trail.w), wine, seed * 0.35) * trailFill;
  }

  fillColor = fillColor / max(trailAmount, 0.001);

  vec3 base = mix(vec3(0.022, 0.021, 0.016), vec3(0.89, 0.265, 0.24), isLight);
  vec3 lineColor = mix(vec3(0.9, 0.7, 0.25), vec3(0.55, 0.12, 0.11), isLight);
  vec3 idleColor = mix(coral, crimson, seed);
  vec3 activeColor = mix(idleColor, fillColor, step(0.001, trailAmount));

  // Click shockwaves: a ring of cells flashes outward from each click (x, y, age, strength).
  float shock = 0.0;
  for (int i = 0; i < ${maxShocks}; i++) {
    vec4 wave = u_shocks[i];
    float waveDistance = length((cellCenter - wave.xy) * gridSize);
    float ring = smoothstep(1.4, 0.0, abs(waveDistance - wave.z * ${glslFloat(shockSpeed)}));
    float fade = saturate(1.0 - wave.z / ${glslFloat(shockLifetime)});
    shock = max(shock, ring * fade * fade * wave.w);
  }

  vec3 color = mix(base, lineColor, line * mix(0.034, 0.3, isLight));
  color += idleColor * idle * box * (1.0 - isLight);
  color = mix(color, idleColor, idle * box * 18.0 * isLight);
  color = mix(color, activeColor, saturate(fill * box * (0.82 + intensity * 0.12)));
  color += activeColor * fill * smoothstep(0.64, 0.0, length(centered)) * 0.14;
  color = mix(color, coral * 1.25, shock * box * 0.6);

  // Pressed-in cells: shade the top and left inner edges, catch light on the bottom and
  // right, like a key pushed into the surface.
  float pressed = saturate(fill * 2.2 + shock);
  float bevel = 0.1;
  float shadowEdge = max(smoothstep(bevel, 0.0, 1.0 - local.y), smoothstep(bevel, 0.0, local.x));
  float lightEdge = max(smoothstep(bevel, 0.0, local.y), smoothstep(bevel, 0.0, 1.0 - local.x));
  color *= 1.0 - shadowEdge * pressed * 0.28;
  color += lightEdge * pressed * mix(0.04, 0.09, isLight);
  // Reveal. From the center: the four center cells switch on together, then the rest follow
  // outward (jitter is kept off the center four so they stay in sync). From the top: cells
  // pour down row by row from the top edge, each staggered so they tumble in one by one.
  // Either way they flash as the wavefront passes.
  float fromTop = step(0.5, u_revealFrom);
  float cellDistance = mix(length(cell + 0.5), gridSize.y * 0.5 - (cell.y + 0.5), fromTop);
  float revealSpan = mix(length(gridSize * 0.5), gridSize.y, fromTop);
  float revealJitter = seed * mix(${glslFloat(revealJitter)}, ${glslFloat(revealFlowJitter)}, fromTop)
    * mix(saturate(cellDistance - 1.0), 1.0, fromTop);
  float revealRadius = u_reveal * (revealSpan + ${glslFloat(revealOvershoot)});
  // A top-down front switches each cell on crisply, so no cell sits half-faded while the
  // front pauses (it follows the scroll); the center ripple keeps its softer edge.
  float cellOn = saturate((revealRadius - cellDistance - revealJitter) / mix(${glslFloat(revealEdge)}, 0.4, fromTop));
  // Unlit cells: a dark grid (behind the Enter screen). A grid with a dissolving top edge sits
  // against the page instead, so its unlit cells are the page's own black, without the grid
  // lines, so it begins without a seam. 0.0296 is #0a0a0a before the output curve in main().
  float lit = cellOn;
  float blendsWithPage = step(0.001, u_topEdge);
  vec3 darkColor = mix(
    mix(vec3(0.022, 0.021, 0.016), vec3(0.14, 0.035, 0.03), line * 0.5),
    vec3(0.0296),
    blendsWithPage
  );

  // Dissolving top edge: cells in the top rows switch off at random, fewer the further down,
  // so the grid breaks up into the page above instead of stopping in a line.
  if (u_topEdge > 0.0) {
    float rowsFromTop = gridSize.y * 0.5 - (cell.y + 1.0);
    lit *= step(hash21(cell + 17.3), rowsFromTop / u_topEdge);
  }

  color = mix(darkColor, color, lit);
  float flash = cellOn * (1.0 - cellOn) * 4.0 * mix(1.0, lit, blendsWithPage);
  color = mix(color, coral * 1.2, flash * box * 0.55 * isLight);

  // Grain covers the whole grid. On a page-blended grid it fades in on the unlit cells from
  // nothing at the grid's top edge to full strength below the dissolving rows, so the
  // texture carries on from the black page above without a seam.
  float rowsDown = gridSize.y * 0.5 - gridUv.y;
  float grainFadeIn = smoothstep(0.0, u_topEdge + 1.5, rowsDown);
  float grain = mix(1.0, max(lit, grainFadeIn), blendsWithPage);
  color += (fbm(uv * 3.2) - 0.5) * 0.01 * grain;
  color += (hash21(gl_FragCoord.xy) - 0.5) * 0.06 * isLight * grain;
  return color;
}
`,
  },
];

export function getWebsiteShaderPreset(
  value: WebsiteShaderId | string | undefined,
) {
  if (!value) return undefined;

  const normalized = value.replace(/^shader-/, "");
  return websiteShaderPresets.find((preset) => preset.id === normalized);
}

export function WebsiteShaderCanvas({
  preset,
  className,
  tone = "dark",
  intensity = 1,
  animate = true,
  maxPixelRatio = 1.35,
  maxCanvasPixels = 620_000,
  trackWindowPointer = false,
  revealDuration = 0,
  revealPaused = false,
  introPose,
  topEdgeRows = 0,
  revealFrom = "center",
  revealControl,
  children,
}: WebsiteShaderCanvasProps) {
  const revealStartRef = useRef<number | null>(null);
  const revealPausedRef = useRef(revealPaused);

  useEffect(() => {
    revealPausedRef.current = revealPaused;
  }, [revealPaused]);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pointerRef = useRef(idlePointer);
  const trailRef = useRef<{ x: number; y: number; createdAt: number }[]>([]);
  const shocksRef = useRef<{ x: number; y: number; createdAt: number }[]>([]);
  const shouldReduceMotion = useReducedMotion();
  const [contextEpoch, setContextEpoch] = useState(0);
  const [failed, setFailed] = useState(false);
  const activePreset = useMemo(() => resolveShaderPreset(preset), [preset]);

  const shouldAnimate = animate && !shouldReduceMotion;
  const isInteractive = activePreset.interactive !== false;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const canvasElement = canvas;

    let disposed = false;
    let visible = true;
    let frame = 0;
    let resizeObserver: ResizeObserver | undefined;
    let intersectionObserver: IntersectionObserver | undefined;
    let gl: WebGLRenderingContext | null = null;
    let program: WebGLProgram | null = null;
    let buffer: WebGLBuffer | null = null;

    const handleContextLost = (event: Event) => {
      event.preventDefault();
      setFailed(true);
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };

    const handleContextRestored = () => {
      setFailed(false);
      setContextEpoch((value) => value + 1);
    };

    canvasElement.addEventListener("webglcontextlost", handleContextLost);
    canvasElement.addEventListener(
      "webglcontextrestored",
      handleContextRestored,
    );

    try {
      gl = canvasElement.getContext("webgl", {
        alpha: true,
        antialias: false,
        depth: false,
        desynchronized: true,
        failIfMajorPerformanceCaveat: false,
        powerPreference: "low-power",
        preserveDrawingBuffer: false,
        stencil: false,
      } as WebGLContextAttributes);

      if (!gl) {
        setFailed(true);
        return cleanup;
      }

      program = createProgram(
        gl,
        vertexShaderSource,
        createFragmentSource(activePreset.fragment),
      );
      buffer = gl.createBuffer();

      if (!program || !buffer) {
        setFailed(true);
        return cleanup;
      }

      const positionLocation = gl.getAttribLocation(program, "a_position");
      const resolutionLocation = gl.getUniformLocation(program, "u_resolution");
      const timeLocation = gl.getUniformLocation(program, "u_time");
      const pointerLocation = gl.getUniformLocation(program, "u_pointer");
      const trailLocation = gl.getUniformLocation(program, "u_trails[0]");
      const intensityLocation = gl.getUniformLocation(program, "u_intensity");
      const isLightLocation = gl.getUniformLocation(program, "u_isLight");
      const revealLocation = gl.getUniformLocation(program, "u_reveal");
      const trailUniform = new Float32Array(32);
      const shocksLocation = gl.getUniformLocation(program, "u_shocks[0]");
      const gridSizeLocation = gl.getUniformLocation(program, "u_gridSize");
      const poseLocation = gl.getUniformLocation(program, "u_pose");
      const topEdgeLocation = gl.getUniformLocation(program, "u_topEdge");
      const revealFromLocation = gl.getUniformLocation(program, "u_revealFrom");
      const shocksUniform = new Float32Array(maxShocks * 4);

      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
        gl.ARRAY_BUFFER,
        new Float32Array([-1, -1, 3, -1, -1, 3]),
        gl.STATIC_DRAW,
      );
      gl.useProgram(program);
      gl.enableVertexAttribArray(positionLocation);
      gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
      setFailed(false);

      const resize = () => {
        if (!gl) return;

        const rect = canvasElement.getBoundingClientRect();
        const ratio = Math.min(window.devicePixelRatio || 1, maxPixelRatio);
        let width = Math.max(1, Math.floor(rect.width * ratio));
        let height = Math.max(1, Math.floor(rect.height * ratio));
        const pixelCount = width * height;

        if (pixelCount > maxCanvasPixels) {
          const scale = Math.sqrt(maxCanvasPixels / pixelCount);
          width = Math.max(1, Math.floor(width * scale));
          height = Math.max(1, Math.floor(height * scale));
        }

        if (canvasElement.width !== width || canvasElement.height !== height) {
          canvasElement.width = width;
          canvasElement.height = height;
        }

        gl.viewport(0, 0, width, height);
      };

      const render = (now: number) => {
        if (!gl || !program || disposed) return;

        resize();
        const nowSeconds = now * 0.001;
        const time = shouldAnimate ? nowSeconds : 18.0;
        const pointerValue = isInteractive
          ? pointerRef.current
          : { x: 0.5, y: 0.5 };
        const liveTrails = isInteractive
          ? trailRef.current.filter(
            (trail) => nowSeconds - trail.createdAt < 1.1,
          )
          : [];
        trailRef.current = liveTrails;
        trailUniform.fill(0);

        liveTrails.slice(0, 8).forEach((trail, index) => {
          const offset = index * 4;
          const strength = saturateNumber(
            1 - (nowSeconds - trail.createdAt) / 1.1,
          );

          trailUniform[offset] = trail.x;
          trailUniform[offset + 1] = trail.y;
          trailUniform[offset + 2] = strength;
          trailUniform[offset + 3] = index / 7;
        });

        gl.useProgram(program);
        gl.uniform2f(
          resolutionLocation,
          canvasElement.width,
          canvasElement.height,
        );
        gl.uniform1f(timeLocation, time);
        gl.uniform2f(pointerLocation, pointerValue.x, pointerValue.y);
        if (trailLocation) gl.uniform4fv(trailLocation, trailUniform);
        if (shocksLocation) {
          const liveShocks = shocksRef.current.filter(
            (wave) => nowSeconds - wave.createdAt < shockLifetime,
          );
          shocksRef.current = liveShocks;
          shocksUniform.fill(0);
          liveShocks.forEach((wave, index) => {
            const offset = index * 4;
            shocksUniform[offset] = wave.x;
            shocksUniform[offset + 1] = wave.y;
            shocksUniform[offset + 2] = nowSeconds - wave.createdAt;
            shocksUniform[offset + 3] = 1;
          });
          gl.uniform4fv(shocksLocation, shocksUniform);
        }
        gl.uniform1f(intensityLocation, intensity);
        gl.uniform1f(isLightLocation, tone === "light" ? 1 : 0);
        gl.uniform1f(revealLocation, getRevealProgress(nowSeconds));
        if (topEdgeLocation) gl.uniform1f(topEdgeLocation, topEdgeRows);
        if (revealFromLocation) {
          gl.uniform1f(revealFromLocation, revealFrom === "top" ? 1 : 0);
        }
        if (poseLocation) {
          const pose = getPose(nowSeconds);
          gl.uniform2f(poseLocation, pose.radians, pose.scale);
        }
        if (gridSizeLocation) {
          const grid = getKineticGrid(canvasElement.width, canvasElement.height);
          gl.uniform2f(gridSizeLocation, grid.cols, grid.rows);
        }
        gl.drawArrays(gl.TRIANGLES, 0, 3);
      };

      // The intro pose eases out (exponentially) from the reveal's start; call after
      // getRevealProgress, which records that start.
      function getPose(nowSeconds: number) {
        const rest = { radians: 0, scale: 1 };
        if (!introPose || !shouldAnimate) return rest;
        const waiting = {
          radians: (introPose.degrees * Math.PI) / 180,
          scale: introPose.scale,
        };
        if (revealPausedRef.current || revealStartRef.current === null) {
          return waiting;
        }
        const t = saturateNumber(
          (nowSeconds - revealStartRef.current) / introPose.seconds,
        );
        const eased = t >= 1 ? 1 : 1 - Math.pow(2, -10 * t);
        return {
          radians: waiting.radians * (1 - eased),
          scale: waiting.scale + (1 - waiting.scale) * eased,
        };
      }

      function getRevealProgress(nowSeconds: number) {
        if (!shouldAnimate || revealDuration <= 0) return 1;
        if (revealControl) return saturateNumber(revealControl.current);
        if (revealPausedRef.current) return 0;
        revealStartRef.current ??= nowSeconds;
        const elapsed =
          nowSeconds - (revealStartRef.current ?? nowSeconds) - revealDelay;
        const progress = saturateNumber(elapsed / revealDuration);
        return 1 - Math.pow(1 - progress, 3);
      }

      const tick = (now: number) => {
        if (disposed || !visible) {
          frame = 0;
          return;
        }

        render(now);
        frame = requestAnimationFrame(tick);
      };

      const start = () => {
        if (frame || disposed) return;
        frame = requestAnimationFrame(tick);
      };

      resizeObserver = new ResizeObserver(() => render(performance.now()));
      resizeObserver.observe(canvasElement);

      intersectionObserver = new IntersectionObserver(
        ([entry]) => {
          visible = Boolean(entry?.isIntersecting);

          if (visible && shouldAnimate) {
            start();
            return;
          }

          if (frame) {
            cancelAnimationFrame(frame);
            frame = 0;
          }

          if (visible) render(performance.now());
        },
        { threshold: 0.01 },
      );
      intersectionObserver.observe(canvasElement);

      render(performance.now());
      if (shouldAnimate) start();
    } catch {
      setFailed(true);
    }

    return cleanup;

    function cleanup() {
      disposed = true;
      if (frame) cancelAnimationFrame(frame);
      resizeObserver?.disconnect();
      intersectionObserver?.disconnect();
      canvasElement.removeEventListener("webglcontextlost", handleContextLost);
      canvasElement.removeEventListener(
        "webglcontextrestored",
        handleContextRestored,
      );

      if (gl) {
        if (buffer) gl.deleteBuffer(buffer);
        if (program) gl.deleteProgram(program);
      }
    }
  }, [
    activePreset.fragment,
    contextEpoch,
    intensity,
    isInteractive,
    maxCanvasPixels,
    maxPixelRatio,
    introPose,
    revealControl,
    revealDuration,
    revealFrom,
    topEdgeRows,
    shouldAnimate,
    tone,
  ]);

  const updatePointer = useCallback(
    (clientX: number, clientY: number, rect: DOMRect) => {
      const nextPointer = toCanvasPoint(clientX, clientY, rect);
      const now = performance.now() * 0.001;
      const lastTrail = trailRef.current[0];

      pointerRef.current = nextPointer;

      if (
        !lastTrail ||
        Math.hypot(nextPointer.x - lastTrail.x, nextPointer.y - lastTrail.y) >
        0.018 ||
        now - lastTrail.createdAt > 0.045
      ) {
        trailRef.current = [
          { ...nextPointer, createdAt: now },
          ...trailRef.current,
        ].slice(0, 8);
      }
    },
    [],
  );

  const addShock = useCallback(
    (clientX: number, clientY: number, rect: DOMRect) => {
      shocksRef.current = [
        {
          ...toCanvasPoint(clientX, clientY, rect),
          createdAt: performance.now() * 0.001,
        },
        ...shocksRef.current,
      ].slice(0, maxShocks);
    },
    [],
  );

  const resetPointer = useCallback(() => {
    pointerRef.current = idlePointer;
  }, []);

  useEffect(() => {
    if (!isInteractive || !trackWindowPointer) return;

    // The canvas may cover only part of the page (the hero), so a pointer outside it
    // leaves the grid alone instead of being clamped onto its nearest edge.
    const containerRectAt = (event: PointerEvent) => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (!rect) return null;
      const inside =
        event.clientX >= rect.left &&
        event.clientX <= rect.right &&
        event.clientY >= rect.top &&
        event.clientY <= rect.bottom;
      return inside ? rect : null;
    };

    const handlePointerMove = (event: PointerEvent) => {
      const rect = containerRectAt(event);
      if (!rect) {
        resetPointer();
        return;
      }
      updatePointer(event.clientX, event.clientY, rect);
    };

    const handlePointerDown = (event: PointerEvent) => {
      const rect = containerRectAt(event);
      if (rect) addShock(event.clientX, event.clientY, rect);
    };

    window.addEventListener("pointermove", handlePointerMove, {
      passive: true,
    });
    window.addEventListener("pointerdown", handlePointerDown, {
      passive: true,
    });
    document.documentElement.addEventListener("pointerleave", resetPointer);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerdown", handlePointerDown);
      document.documentElement.removeEventListener(
        "pointerleave",
        resetPointer,
      );
    };
  }, [addShock, isInteractive, resetPointer, trackWindowPointer, updatePointer]);

  const handleElementPointerMove = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    updatePointer(
      event.clientX,
      event.clientY,
      event.currentTarget.getBoundingClientRect(),
    );
  };
  const handleElementPointerDown = (
    event: ReactPointerEvent<HTMLDivElement>,
  ) => {
    addShock(
      event.clientX,
      event.clientY,
      event.currentTarget.getBoundingClientRect(),
    );
  };
  const trackElementPointer = isInteractive && !trackWindowPointer;

  // Start dark on the server-rendered frame so the ripple has something to light up;
  // show the static preview only if WebGL never takes over.
  const revealing = revealDuration > 0 && shouldAnimate && !failed;
  const fallback = revealing
    ? revealBackdrop
    : tone === "light"
      ? activePreset.preview.light
      : activePreset.preview.dark;

  return (
    <div
      ref={containerRef}
      className={clsx(styles.shaderCanvas, className)}
      style={{ background: fallback }}
      onPointerMove={trackElementPointer ? handleElementPointerMove : undefined}
      onPointerDown={trackElementPointer ? handleElementPointerDown : undefined}
      onPointerLeave={trackElementPointer ? resetPointer : undefined}
    >
      <canvas
        ref={canvasRef}
        aria-hidden="true"
        className={clsx(
          styles.canvasElement,
          failed ? styles.canvasElementHidden : styles.canvasElementVisible
        )}
      />
      <div className={styles.overlayGradient} />
      <div className={styles.contentWrapper}>{children}</div>
    </div>
  );
}

export function WebsiteShaderBackground({
  preset = "kinetic-dots",
  className,
  intensity,
  tone: toneOverride,
  revealDuration = 1.8,
  revealPaused,
  introPose,
  topEdgeRows,
  revealFrom,
  revealControl,
}: WebsiteShaderBackgroundProps) {
  const themeTone = useShaderTone();
  const tone = toneOverride ?? themeTone;

  return (
    <div aria-hidden="true" className={clsx(styles.background, className)}>
      <WebsiteShaderCanvas
        preset={preset}
        tone={tone}
        intensity={intensity}
        trackWindowPointer
        revealDuration={revealDuration}
        revealPaused={revealPaused}
        introPose={introPose}
        topEdgeRows={topEdgeRows}
        revealFrom={revealFrom}
        revealControl={revealControl}
        className={styles.backgroundCanvas}
      />
    </div>
  );
}

export function WebsiteShaderDemo({
  preset,
  className,
}: WebsiteShaderDemoProps) {
  const activePreset = resolveShaderPreset(preset);
  const tone = useShaderTone();

  return (
    <div className={clsx(styles.container, className)}>
      <div className={styles.canvasWrapper}>
        <WebsiteShaderCanvas
          preset={activePreset}
          tone={tone}
          className={styles.shaderCanvas}
        />
      </div>

      <div className={styles.infoSection}>
        <div>
          <h2 className={styles.title}>
            {activePreset.title}
          </h2>
          <p className={styles.summary}>
            {activePreset.summary}
          </p>
        </div>
        <div className={styles.statsGrid}>
          {["1 draw", "No assets", "Auto pause"].map((item) => (
            <div key={item} className={styles.statItem}>
              {item}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/**
 * When each grid cell switches on during the opening ripple, in seconds from the reveal start,
 * using the same easing and radius as the shader. Jitter is random, so it matches the look
 * of the shader's per-cell stagger rather than each exact cell.
 */
export function getRevealCellTimes(
  duration: number,
  grid: { cols: number; rows: number },
  from: RevealFrom = "center",
) {
  const { cols, rows } = grid;
  const fromTop = from === "top";
  const maxRadius =
    (fromTop ? rows : Math.hypot(cols / 2, rows / 2)) + revealOvershoot;
  const times: { time: number; distance: number; across: number }[] = [];
  const halfCols = Math.ceil(cols / 2);
  const halfRows = Math.ceil(rows / 2);

  // Cells counted from the center, like the shader: -1 and 0 meet in the middle.
  for (let y = -halfRows; y < halfRows; y++) {
    for (let x = -halfCols; x < halfCols; x++) {
      const distance = fromTop
        ? rows / 2 - (y + 0.5)
        : Math.hypot(x + 0.5, y + 0.5);
      const jitter = fromTop
        ? Math.random() * revealFlowJitter
        : Math.random() * revealJitter * saturateNumber(distance - 1);
      const progress = saturateNumber(
        (distance + jitter + revealEdge / 2) / maxRadius,
      );
      // Inverse of the ease-out cubic applied to the reveal progress.
      const t = 1 - Math.cbrt(1 - progress);
      times.push({
        time: revealDelay + t * duration,
        distance,
        across: saturateNumber(0.5 + (x + 0.5) / cols),
      });
    }
  }

  return times.sort((a, b) => a.time - b.time);
}

function useShaderTone(): "dark" | "light" {
  const [mounted, setMounted] = useState(false);
  const { resolvedTheme, theme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  return mounted && (theme === "system" ? resolvedTheme : theme) === "light"
    ? "light"
    : "dark";
}

function resolveShaderPreset(
  preset: WebsiteShaderId | string | WebsiteShaderPreset | undefined,
) {
  if (typeof preset === "object" && preset) return preset;
  return getWebsiteShaderPreset(preset) ?? websiteShaderPresets[0];
}

function createFragmentSource(fragmentBody: string) {
  return `${fragmentHeader}
${fragmentBody}
${fragmentFooter}`;
}

function createProgram(
  gl: WebGLRenderingContext,
  vertexSource: string,
  fragmentSource: string,
) {
  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, vertexSource);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, fragmentSource);

  if (!vertexShader || !fragmentShader) return null;

  const program = gl.createProgram();
  if (!program) return null;

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    gl.deleteProgram(program);
    return null;
  }

  return program;
}

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
) {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

/** Converts a client position to canvas uv: 0–1 across, 0 at the bottom to 1 at the top. */
function toCanvasPoint(clientX: number, clientY: number, rect: DOMRect) {
  return {
    x: saturateNumber((clientX - rect.left) / Math.max(rect.width, 1)),
    y: 1 - saturateNumber((clientY - rect.top) / Math.max(rect.height, 1)),
  };
}

function saturateNumber(value: number) {
  return Math.min(1, Math.max(0, value));
}

export function getShaderPreviewStyle(
  itemSlug: string,
  isLight: boolean,
): CSSProperties {
  const preset = getWebsiteShaderPreset(itemSlug) ?? websiteShaderPresets[0];
  return {
    background: isLight ? preset.preview.light : preset.preview.dark,
  };
}

export default WebsiteShaderCanvas;
