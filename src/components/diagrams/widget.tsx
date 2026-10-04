"use client";

import { useId, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { useReducedMotion } from "framer-motion";
import { MATERIAL_PATHS, type MaterialIconName } from "../icons/MaterialIcon";
import { ControlIcon, useDiagramBox, useTicker } from "./shared";
import styles from "./Diagram.module.css";
import type_ from "./Widget.module.css";

// The MutinyX diagrams, drawn as the app draws things: soft dark cards on a warm grey, pill
// shapes, big sentence-case type, and its yellow only on what you can act on. Each plays
// version 1 (Before), then version 2 (After), once; either can be picked, from the switch on
// top, and replayed.

export type Version = 1 | 2;

export const STAGE = "#d3d0cb";
export const CARD = "#171614";
export const RAISED = "#262421";
export const TRACK = "#2c2a27";
export const INK = "#f4ece6";
export const MUTED = "rgba(244, 236, 230, 0.5)";
export const CREAM = "#efe4dc";
export const YELLOW = "#facb03";
export const DARK = "#1a1917";
// Status, not action: whether something's fine or needs a look, as the app itself shows it.
export const GREEN = "#5fcf7d";
export const RED = "#f05a4f";

export const clamp = (x: number) => Math.min(1, Math.max(0, x));
export const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

export { type_ };

/** Where the main card sits, and the time into the version that's playing. */
export interface Frame {
  cx: number;
  cw: number;
  y: number;
  uid: string;
  t: number;
}

/** A number and what it counts, in the card under the main one; `accent` marks what changed. */
export type Stat = [value: string, label: string, accent: boolean];

export function VersionWidget({
  className,
  onOpen,
  title,
  icon,
  length,
  status,
  stats,
  draw,
  tabs = ["Before", "After"],
  accent = YELLOW,
}: {
  className?: string;
  onOpen?: () => void;
  title: string;
  /** Drawn around (0, 0), in a 26px circle. */
  icon: ReactNode;
  /** Seconds each version plays for. */
  length: number;
  /** What each version shows, for screen readers. */
  status: Record<Version, string>;
  stats: Record<Version, Stat[]>;
  draw: (version: Version, frame: Frame) => ReactNode;
  /** What the switch on top calls the two versions. */
  tabs?: [string, string];
  /** The product's one colour, for what changed and how far it's played. */
  accent?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { wide, onScreen } = useDiagramBox(rootRef);
  const still = Boolean(useReducedMotion());
  const uid = useId().replace(/:/g, "");

  const [version, setVersion] = useState<Version>(1);
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  // Once a version is picked, it stays: version 1 no longer runs on into version 2.
  const [picked, setPicked] = useState(false);

  const running = playing && onScreen && !still;
  const t = still ? length : time;

  useTicker(running, (delta) => {
    const next = time + delta;
    if (next < length) {
      setTime(next);
    } else if (version === 1 && !picked) {
      setVersion(2);
      setTime(0);
    } else {
      setTime(length);
      setPlaying(false);
    }
  });

  const choose = (next: Version) => {
    setVersion(next);
    setPicked(true);
    setTime(0);
    setPlaying(true);
  };
  const togglePlay = () => {
    if (!playing && time >= length) setTime(0);
    setPlaying(!playing);
  };

  const W = wide ? 760 : 420;
  const H = 568;
  const cw = wide ? 560 : 380;
  const cx = (W - cw) / 2;
  const mainH = 392;
  const statsY = 24 + mainH + 16;

  const appear = clamp(t / 0.4);

  return (
    <div
      ref={rootRef}
      className={`${className ?? styles.root} ${type_.widget}`}
      style={{ "--accent": accent } as CSSProperties}
    >
      <div className={type_.top}>
        <div className={type_.tabs} role="group" aria-label="Version">
          {([1, 2] as const).map((v) => (
            <button
              key={v}
              type="button"
              className={type_.tab}
              aria-pressed={version === v}
              onClick={() => choose(v)}
            >
              {version === v && (
                <span
                  className={type_.tabFill}
                  style={{ transform: `scaleX(${clamp(t / length)})` }}
                />
              )}
              <span className={type_.tabLabel}>
                {tabs[v - 1]}
              </span>
            </button>
          ))}
        </div>
      </div>
      <svg viewBox={`0 0 ${W} ${H}`} className={styles.svg} aria-hidden="true">
        <defs>
          <filter id={`${uid}-glow`} x="-50%" y="-200%" width="200%" height="500%">
            <feGaussianBlur stdDeviation="7" />
          </filter>
        </defs>
        <rect width={W} height={H} fill={STAGE} />
        <g opacity={appear}>
          <rect x={cx} y={24} width={cw} height={mainH} rx={44} fill={CARD} />
          {header(cx, 24, cw, title, icon)}
          {draw(version, { cx, cw, y: 24, uid, t })}
          <rect x={cx} y={statsY} width={cw} height={112} rx={44} fill={CARD} />
          {statRow(stats[version], cx, statsY, cw, t, accent)}
        </g>
      </svg>

      <div className={`${styles.controls} ${type_.controls}`}>
        <div className={styles.transport}>
          {!still && (
            <button
              type="button"
              className={`${styles.control} ${type_.control}`}
              aria-label={playing ? "Pause" : "Play"}
              onClick={togglePlay}
            >
              <ControlIcon name={playing ? "pause" : "play"} />
            </button>
          )}
          <button
            type="button"
            className={`${styles.control} ${type_.control}`}
            aria-label="Start again"
            onClick={() => {
              setTime(0);
              setPlaying(true);
            }}
          >
            <ControlIcon name="reset" />
          </button>
        </div>
        {onOpen && (
          <button
            type="button"
            className={`${styles.control} ${type_.control}`}
            aria-label="Look closer"
            onClick={onOpen}
          >
            <ControlIcon name="expand" />
          </button>
        )}
      </div>
      <p className={styles.srOnly} aria-live="polite">
        {running ? "" : status[version]}
      </p>
    </div>
  );
}

/** The card's top row: an icon, its name, and the chevron. */
function header(
  cx: number,
  y: number,
  cw: number,
  title: string,
  icon: ReactNode,
): ReactNode {
  return (
    <g>
      <circle cx={cx + 56} cy={y + 56} r={26} fill={RAISED} />
      <g
        transform={`translate(${cx + 56} ${y + 56})`}
        fill="none"
        stroke={INK}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        {icon}
      </g>
      <text x={cx + 98} y={y + 64} className={type_.title} fill={MUTED}>
        {title}
      </text>
      <path
        d={`M${cx + cw - 52} ${y + 46} l10 10 -10 10`}
        fill="none"
        stroke={MUTED}
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

/** The card under the main one: three numbers that say what changed. */
function statRow(
  cells: Stat[],
  cx: number,
  y: number,
  cw: number,
  t: number,
  accent: string,
): ReactNode {
  const inset = 20;
  const column = (cw - inset * 2) / 3;
  return (
    <g>
      {cells.map(([value, label, changed], k) => (
        <g
          key={label}
          opacity={clamp((t - 0.3 - k * 0.15) / 0.4)}
          transform={`translate(${cx + inset + column * (k + 0.5)} ${y})`}
        >
          <text
            y={55}
            textAnchor="middle"
            className={type_.value}
            fill={changed ? accent : INK}
          >
            {value}
          </text>
          <text y={84} textAnchor="middle" className={type_.label} fill={MUTED}>
            {label}
          </text>
        </g>
      ))}
    </g>
  );
}

/** One pill of a progress bar, filled yellow to `fraction`, glowing while it fills. */
export function pill(
  id: string,
  x: number,
  y: number,
  w: number,
  h: number,
  fraction: number,
  uid: string,
): ReactNode {
  const live = fraction > 0 && fraction < 1;
  return (
    <g key={id}>
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={TRACK} />
      {live && (
        <rect
          x={x}
          y={y}
          width={w * fraction}
          height={h}
          fill={YELLOW}
          opacity={0.55}
          filter={`url(#${uid}-glow)`}
        />
      )}
      {fraction > 0 && (
        <>
          <clipPath id={`${uid}-${id}`}>
            <rect x={x} y={y} width={w} height={h} rx={h / 2} />
          </clipPath>
          <rect
            x={x}
            y={y}
            width={w * fraction}
            height={h}
            fill={YELLOW}
            clipPath={`url(#${uid}-${id})`}
          />
        </>
      )}
    </g>
  );
}

/** A pill button (MutinyX yellow unless given a colour) that dips when `pressed` (0 to 1 and back). */
export function button(
  x: number,
  y: number,
  w: number,
  h: number,
  label: string,
  pressed = 0,
  fill = YELLOW,
  ink = DARK,
): ReactNode {
  const s = 1 - 0.06 * Math.sin(Math.PI * clamp(pressed));
  return (
    <g transform={`translate(${x + w / 2} ${y + h / 2}) scale(${s})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={h / 2} fill={fill} />
      <text y={7} textAnchor="middle" className={type_.button} fill={ink}>
        {label}
      </text>
    </g>
  );
}

/** `text` typed out as far as `k` (0 to 1). */
export const typed = (text: string, k: number) =>
  text.slice(0, Math.round(text.length * clamp(k)));

/** A small cream badge with a letter in it, like a notification count. */
export function badge(x: number, y: number, letter: string): ReactNode {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r={15} fill={CREAM} />
      <text y={6} textAnchor="middle" className={type_.chip} fill={DARK}>
        {letter}
      </text>
    </g>
  );
}

/** A Material Symbols glyph inside an SVG, `size` across and centred on (x, y). */
export function glyph(
  name: MaterialIconName,
  x: number,
  y: number,
  size: number,
  fill: string,
): ReactNode {
  const k = size / 960;
  return (
    <path
      d={MATERIAL_PATHS[name]}
      fill={fill}
      transform={`translate(${x - size / 2} ${y + size / 2}) scale(${k})`}
    />
  );
}
