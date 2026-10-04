"use client";

import type { ReactNode } from "react";
import { ease } from "./shared";
import {
  INK,
  MUTED,
  RAISED,
  TRACK,
  VersionWidget,
  clamp,
  lerp,
  type_,
  type Frame,
} from "./widget";

// How the gym trainer counts a curl, from its app.py. MediaPipe gives the shoulder, elbow and
// wrist; the angle at the elbow, between the vector up to the shoulder and the vector out to
// the wrist, decides it. Over 160° (obtuse: the arm straight) the stage is "down"; under 30°
// (acute: the arm curled) it turns "up" and counts a rep, but only if it was "down" first. So
// a half curl, one that doesn't straighten past 160° before curling again, isn't counted.

// The live box's blue: (245, 117, 16) in OpenCV's blue-green-red order.
const BLUE = "#1075f5";
const UP = 30;
const DOWN = 160;

// The elbow's angle over time: [time, degrees] keyframes, eased between.
const FULL: [number, number][] = [
  [0, 172],
  [0.5, 172],
  [1.4, 18],
  [1.8, 18],
  [2.7, 172],
  [3.1, 172],
  [4.0, 18],
  [4.4, 18],
  [5.3, 172],
];
// A full rep, then a half one (straightening only to 120°), then a full one again.
const HALF: [number, number][] = [
  [0, 172],
  [0.4, 172],
  [1.2, 18],
  [1.5, 18],
  [2.1, 120],
  [2.4, 120],
  [3.0, 18],
  [3.3, 18],
  [4.1, 172],
  [4.4, 172],
  [5.2, 18],
  [5.5, 18],
];

const LENGTH = 6;

function angleAt(keys: [number, number][], t: number) {
  for (let k = 1; k < keys.length; k++) {
    const [t1, a1] = keys[k];
    const [t0, a0] = keys[k - 1];
    if (t < t1) return lerp(a0, a1, ease(clamp((t - t0) / (t1 - t0))));
  }
  return keys[keys.length - 1][1];
}

/** The app's own rule, run frame by frame up to `t`: the count, the stage, and when a curl
 *  under 30° was ignored because the arm hadn't straightened first. */
function run(keys: [number, number][], t: number) {
  let count = 0;
  let stage: "up" | "down" | null = null;
  let ignoredAt = -1;
  let wasCurled = false;
  for (let time = 0; time <= t; time += 1 / 60) {
    const angle = angleAt(keys, time);
    if (angle > DOWN) stage = "down";
    const curled = angle < UP;
    if (curled && stage === "down") {
      stage = "up";
      count++;
    } else if (curled && !wasCurled && stage === "up") {
      ignoredAt = time;
    }
    wasCurled = curled;
  }
  return { count, stage, ignoredAt };
}

export function CurlCount({
  className,
  onOpen,
}: {
  className?: string;
  onOpen?: () => void;
}) {
  return (
    <VersionWidget
      className={className}
      onOpen={onOpen}
      title="Bicep curls"
      tabs={["Full reps", "A half rep"]}
      accent={BLUE}
      length={LENGTH}
      status={{
        1: "Two full curls: the arm straightens past 160° (down), then curls under 30° (up), and each one counts.",
        2: "A full curl counts; a half one, straightening only to 120° before curling again, doesn't; the next full one does.",
      }}
      stats={{
        1: [
          ["2", "reps counted", false],
          [">160°", "sets down", false],
          ["<30°", "counts up", false],
        ],
        2: [
          ["3", "curls", false],
          ["2", "reps counted", true],
          ["1", "half rep ignored", true],
        ],
      }}
      draw={(version, frame) => arm(version === 1 ? FULL : HALF, frame)}
    />
  );
}

/** A point `r` from the elbow at `angle`° clockwise from straight up (toward the shoulder). */
const at = (x: number, y: number, r: number, angle: number) => {
  const a = (angle * Math.PI) / 180;
  return { x: x + r * Math.sin(a), y: y - r * Math.cos(a) };
};

/** A wedge from `from`° to `to`° around the elbow. */
function wedge(x: number, y: number, r: number, from: number, to: number) {
  const a = at(x, y, r, from);
  const b = at(x, y, r, to);
  return `M${x} ${y}L${a.x} ${a.y}A${r} ${r} 0 0 1 ${b.x} ${b.y}Z`;
}

function arm(keys: [number, number][], { cx, cw, y, t }: Frame): ReactNode {
  const left = cx + 28;
  const inner = cw - 56;
  const angle = angleAt(keys, t);
  const { count, stage, ignoredAt } = run(keys, t);

  // The arm, side on: the shoulder straight above the elbow, the forearm swinging.
  const ex = cx + cw / 2 - 30;
  const ey = y + 272;
  const shoulder = { x: ex, y: ey - 104 };
  const wrist = at(ex, ey, 98, angle);
  const zone = angle > DOWN ? "down" : angle < UP ? "up" : null;
  const ignored = ignoredAt >= 0 && t - ignoredAt < 1.1;

  return (
    <g>
      {/* The live box, as on the video: the count and the stage. */}
      <rect x={left} y={y + 98} width={inner} height={50} rx={18} fill={RAISED} />
      <text x={left + 18} y={y + 129} className={type_.label} fill={MUTED}>
        Reps
      </text>
      <text x={left + 64} y={y + 133} className={type_.value} fill={INK}>
        {count}
      </text>
      <text x={left + inner / 2} y={y + 129} className={type_.label} fill={MUTED}>
        Stage
      </text>
      <text
        x={left + inner / 2 + 50}
        y={y + 133}
        className={type_.value}
        fill={stage === "up" ? BLUE : INK}
      >
        {stage ?? "–"}
      </text>

      {/* The two zones: under 30° counts as up, over 160° resets to down. */}
      <path d={wedge(ex, ey, 96, 0, UP)} fill={BLUE} opacity={zone === "up" ? 0.32 : 0.12} />
      <path d={wedge(ex, ey, 96, DOWN, 180)} fill={INK} opacity={zone === "down" ? 0.22 : 0.08} />
      <text x={at(ex, ey, 112, 16).x} y={at(ex, ey, 112, 16).y} className={type_.tag} fill={BLUE}>
        Up, under 30°
      </text>
      <text
        x={ex - 14}
        y={ey + 96}
        textAnchor="end"
        className={type_.tag}
        fill={MUTED}
      >
        Down, over 160°
      </text>

      {/* The angle between the two vectors, drawn and read out. */}
      <path
        d={`M${at(ex, ey, 34, 0).x} ${at(ex, ey, 34, 0).y}A34 34 0 ${angle > 180 ? 1 : 0} 1 ${at(ex, ey, 34, angle).x} ${at(ex, ey, 34, angle).y}`}
        fill="none"
        stroke={BLUE}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <text x={ex - 16} y={ey + 6} textAnchor="end" className={type_.name} fill={INK}>
        {Math.round(angle)}°
      </text>

      {/* The skeleton: shoulder, elbow, wrist, as MediaPipe sees them. */}
      <line x1={shoulder.x} y1={shoulder.y} x2={ex} y2={ey} stroke={INK} strokeWidth={4} strokeLinecap="round" />
      <line x1={ex} y1={ey} x2={wrist.x} y2={wrist.y} stroke={INK} strokeWidth={4} strokeLinecap="round" />
      {[shoulder, { x: ex, y: ey }, wrist].map((point, k) => (
        <circle key={k} cx={point.x} cy={point.y} r={6} fill={k === 1 ? BLUE : INK} stroke={TRACK} strokeWidth={2} />
      ))}
      <text x={shoulder.x - 12} y={shoulder.y + 4} textAnchor="end" className={type_.tag} fill={MUTED}>
        Shoulder
      </text>
      <text x={wrist.x + 12} y={wrist.y + 4} className={type_.tag} fill={MUTED}>
        Wrist
      </text>

      {/* A half rep: curled again before straightening past 160°, so it doesn't count. */}
      {ignored && (
        <g opacity={1 - clamp((t - ignoredAt - 0.8) / 0.3)}>
          <rect x={left + inner - 132} y={y + 160} width={132} height={30} rx={15} fill={TRACK} />
          <text x={left + inner - 66} y={y + 180} textAnchor="middle" className={type_.tag} fill={INK}>
            Not counted
          </text>
        </g>
      )}
    </g>
  );
}
