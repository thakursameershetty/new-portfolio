"use client";

import type { ReactNode } from "react";
import { ease } from "./shared";
import {
  CREAM,
  DARK,
  INK,
  MUTED,
  RAISED,
  TRACK,
  VersionWidget,
  YELLOW,
  badge,
  clamp,
  lerp,
  pill,
  touch,
  type_,
  type Frame,
} from "./widget";

// MutinyX's submissions, before and after, on a phone at real sizes. A campaign asks for two
// reels and a story. In version 1 the campaign has one progress timeline and one upload
// button, so all three go through it; in version 2 each deliverable has its own card, with
// steps that fit it. Laid out after the two versions' screens.

const PIECES = [
  { name: "Reel 1", steps: ["Script", "Work", "Proof"], width: 92 },
  { name: "Reel 2", steps: ["Script", "Work", "Proof"], width: 92 },
  { name: "Story", steps: ["Post", "Proof"], width: 80 },
];

// Version 1's single timeline, as on its campaign screen.
const TIMELINE = ["Invitation accepted", "Product received", "Content in progress"];

export function SubmissionFlow({
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
      phone
      title="Submissions"
      length={5.5}
      status={{
        1: "Before: three pieces, one upload button, one timeline. Which piece moved it forward?",
        2: "After: each deliverable has its own card and always shows its next step.",
      }}
      stats={{
        1: [
          ["3", "deliverables", false],
          ["1", "timeline", false],
          ["1", "upload button", false],
        ],
        2: [
          ["3", "deliverables", false],
          ["3", "timelines", true],
          ["Clear", "next step", true],
        ],
      }}
      draw={(version, frame) => (version === 1 ? before(frame) : after(frame))}
    />
  );
}

function before({ cx, y, t }: Frame): ReactNode {
  const L = cx + 20;
  const W = 320;
  const button = { x: L + W / 2, y: y + 668 };
  const landed = [1.8, 2.7, 3.6].filter((at) => t >= at).length;
  const confused = t >= 3.9;
  const progress = clamp((t - 1.8) / 0.6);

  let chipX = L;
  return (
    <g>
      <text x={L} y={y + 100} className={type_.pHead} fill={INK}>
        ‹  Campaign details
      </text>

      {/* The campaign. */}
      <rect x={L} y={y + 120} width={W} height={84} rx={20} fill={RAISED} />
      <circle cx={L + 38} cy={y + 162} r={22} fill={INK} />
      <text x={L + 38} y={y + 168} textAnchor="middle" className={type_.pStrong} fill={DARK}>
        N
      </text>
      <text x={L + 72} y={y + 156} className={type_.pStrong} fill={INK}>
        Nike Run Club
      </text>
      <text x={L + 72} y={y + 178} className={type_.pSmall} fill={MUTED}>
        2 reels and a story
      </text>
      <rect x={L + W - 96} y={y + 148} width={80} height={28} rx={14} fill={CREAM} />
      <text x={L + W - 56} y={y + 167} textAnchor="middle" className={type_.pSmall} fill={DARK}>
        Accepted
      </text>

      {/* One timeline for the whole campaign. */}
      <text x={L} y={y + 246} className={type_.pStrong} fill={INK}>
        Campaign progress
      </text>
      {TIMELINE.map((step, k) => {
        const sy = y + 280 + k * 52;
        const done = k < 2;
        const live = k === 2;
        return (
          <g key={step}>
            {k < TIMELINE.length - 1 && (
              <rect x={L + 9} y={sy + 8} width={2} height={44} fill={done ? YELLOW : TRACK} />
            )}
            {live && progress > 0 && (
              <rect x={L + 9} y={sy + 8} width={2} height={44 * progress} fill={YELLOW} />
            )}
            <circle cx={L + 10} cy={sy} r={8} fill={done || live ? YELLOW : TRACK} />
            <text x={L + 32} y={sy + 5} className={type_.pBody} fill={done || live ? INK : MUTED}>
              {step}
            </text>
          </g>
        );
      })}

      {/* Three pieces of work, all going into the one upload button. */}
      <text x={L} y={y + 520} className={type_.pLabel} fill={MUTED}>
        To submit
      </text>
      {PIECES.map((piece, i) => {
        const x0 = chipX;
        chipX += piece.width + 10;
        const at = 1 + i * 0.9;
        const k = ease(clamp((t - at) / 0.8));
        if (k >= 1) return null;
        const x = lerp(x0 + piece.width / 2, button.x, k);
        const cy = lerp(y + 556, button.y, k);
        const scale = lerp(1, 0.5, k);
        return (
          <g
            key={piece.name}
            transform={`translate(${x} ${cy}) scale(${scale})`}
            opacity={1 - clamp((k - 0.7) / 0.3)}
          >
            <rect x={-piece.width / 2} y={-20} width={piece.width} height={40} rx={20} fill={CREAM} />
            <text y={6} textAnchor="middle" className={type_.pStrong} fill={DARK}>
              {piece.name}
            </text>
          </g>
        );
      })}
      {/* A tap on each piece sends it to the same button. */}
      {PIECES.map((piece, i) => {
        const x0 = L + PIECES.slice(0, i).reduce((sum, p) => sum + p.width + 10, 0);
        return <g key={piece.name}>{touch(x0 + piece.width / 2, y + 556, t, 1 + i * 0.9 - 0.05)}</g>;
      })}

      <g transform={`translate(${button.x} ${button.y})`}>
        <rect x={-W / 2} y={-28} width={W} height={56} rx={28} fill={YELLOW} />
        <text y={6} textAnchor="middle" className={type_.pButton} fill={DARK}>
          Upload
        </text>
        {landed > 0 && badge(W / 2 - 18, -26, confused ? "?" : String(landed))}
      </g>
    </g>
  );
}

function after({ cx, y, uid, t }: Frame): ReactNode {
  const L = cx + 20;
  const W = 320;

  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-campaign`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8a0f14" />
          <stop offset="1" stopColor="#3a0608" />
        </linearGradient>
      </defs>
      {/* The campaign, as version 2 heads it. */}
      <rect x={L} y={y + 72} width={W} height={120} rx={22} fill={`url(#${uid}-campaign)`} />
      <text x={L + 20} y={y + 126} className={type_.pHead} fill="#ffffff">
        Coca-Cola campaign
      </text>
      <text x={L + 20} y={y + 150} className={type_.pSmall} fill="rgba(255,255,255,0.75)">
        2 Instagram reels · 1 story
      </text>
      <text x={L} y={y + 232} className={type_.pStrong} fill={INK}>
        Your deliverables
      </text>

      {/* A card per deliverable, each with its own steps. */}
      {PIECES.map((piece, i) => {
        const n = piece.steps.length;
        const ry = y + 252 + i * 140;
        const start = 0.4 + i * 0.5;
        const progress = clamp((t - start) / (0.9 * n)) * n;
        const done = progress >= n;
        const gap = 8;
        const segment = (W - 40 - gap * (n - 1)) / n;
        const current = piece.steps[Math.min(Math.floor(progress), n - 1)];
        return (
          <g key={piece.name}>
            <rect x={L} y={ry} width={W} height={124} rx={22} fill={RAISED} />
            <text x={L + 20} y={ry + 38} className={type_.pHead} fill={INK}>
              {piece.name}
            </text>
            <text
              x={L + W - 20}
              y={ry + 38}
              textAnchor="end"
              className={type_.pStrong}
              fill={done ? INK : progress > 0 ? YELLOW : MUTED}
            >
              {done ? "Approved" : progress > 0 ? `${current} upload` : "Up next"}
            </text>
            {piece.steps.map((step, k) => (
              <g key={step}>
                {pill(
                  `a${i}${k}`,
                  L + 20 + k * (segment + gap),
                  ry + 60,
                  segment,
                  10,
                  clamp(progress - k),
                  uid,
                )}
                <text
                  x={L + 20 + k * (segment + gap)}
                  y={ry + 96}
                  className={type_.pSmall}
                  fill={MUTED}
                >
                  {step}
                </text>
              </g>
            ))}
          </g>
        );
      })}
    </g>
  );
}
