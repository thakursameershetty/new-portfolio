"use client";

import type { ReactNode } from "react";
import { ease } from "./shared";
import {
  CREAM,
  DARK,
  INK,
  MUTED,
  VersionWidget,
  YELLOW,
  badge,
  clamp,
  lerp,
  pill,
  type_,
  type Frame,
} from "./widget";

// MutinyX's submissions, before and after. A campaign asks for two reels and a story. In
// version 1 all three go through one upload button under one timeline; in version 2 each
// deliverable has its own track, with steps that fit it.

const PIECES = [
  { name: "Reel 1", steps: ["Script", "Work", "Proof"], width: 96 },
  { name: "Reel 2", steps: ["Script", "Work", "Proof"], width: 96 },
  { name: "Story", steps: ["Post", "Proof"], width: 84 },
];

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
      title="Submissions"
      icon={<path d="M0 7V-8M-7 -1 0 -8 7 -1" />}
      length={5.5}
      status={{
        1: "Before: three pieces, one upload button, one timeline. Which piece moved it forward?",
        2: "After: each deliverable has its own track and always shows its next step.",
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

function before({ cx, cw, y, uid, t }: Frame): ReactNode {
  const left = cx + 28;
  const inner = cw - 56;
  const gap = 8;
  const steps = ["Script", "Work", "Proof", "Done"];
  const segment = (inner - gap * 3) / 4;
  const progress = clamp((t - 1.8) / 0.6);

  const button = { x: cx + cw / 2, y: y + 328 };
  const landed = [1.8, 2.7, 3.6].filter((at) => t >= at).length;
  const confused = t >= 3.9;

  let chipX = left;
  return (
    <g>
      {steps.map((name, k) => {
        const x = left + k * (segment + gap);
        return (
          <g key={name}>
            {pill(`b${k}`, x, y + 132, segment, 18, k === 0 ? progress : 0, uid)}
            <text
              x={x + segment / 2}
              y={y + 182}
              textAnchor="middle"
              className={type_.label}
              fill={MUTED}
            >
              {name}
            </text>
          </g>
        );
      })}

      {PIECES.map((piece, i) => {
        const x0 = chipX;
        chipX += piece.width + 12;
        const start = 1 + i * 0.9;
        const k = ease(clamp((t - start) / 0.8));
        const x = lerp(x0 + piece.width / 2, button.x, k);
        const cy = lerp(y + 252, button.y, k);
        const scale = lerp(1, 0.5, k);
        if (k >= 1) return null;
        return (
          <g
            key={piece.name}
            transform={`translate(${x} ${cy}) scale(${scale})`}
            opacity={1 - clamp((k - 0.7) / 0.3)}
          >
            <rect
              x={-piece.width / 2}
              y={-20}
              width={piece.width}
              height={40}
              rx={20}
              fill={CREAM}
            />
            <text
              y={6}
              textAnchor="middle"
              className={type_.chip}
              fill={DARK}
            >
              {piece.name}
            </text>
          </g>
        );
      })}

      <g transform={`translate(${button.x} ${button.y})`}>
        <rect x={-104} y={-28} width={208} height={56} rx={28} fill={YELLOW} />
        <text
          y={7}
          textAnchor="middle"
          className={type_.button}
          fill={DARK}
        >
          Upload
        </text>
        {landed > 0 && badge(96, -30, confused ? "?" : String(landed))}
      </g>
    </g>
  );
}

function after({ cx, cw, y, uid, t }: Frame): ReactNode {
  const left = cx + 28;
  const inner = cw - 56;
  const gap = 8;
  return (
    <g>
      {PIECES.map((piece, i) => {
        const n = piece.steps.length;
        const ry = y + 118 + i * 86;
        const start = 0.4 + i * 0.5;
        const progress = clamp((t - start) / (0.9 * n)) * n;
        const done = progress >= n;
        const segment = (inner - gap * (n - 1)) / n;
        const current = piece.steps[Math.min(Math.floor(progress), n - 1)];
        return (
          <g key={piece.name}>
            <text x={left} y={ry + 20} className={type_.name} fill={INK}>
              {piece.name}
            </text>
            <text
              x={left + inner}
              y={ry + 20}
              textAnchor="end"
              className={type_.step}
              fill={done ? INK : progress > 0 ? YELLOW : MUTED}
            >
              {done ? "Done" : progress > 0 ? current : "Up next"}
            </text>
            {piece.steps.map((step, k) =>
              pill(
                `a${i}${k}`,
                left + k * (segment + gap),
                ry + 38,
                segment,
                16,
                clamp(progress - k),
                uid,
              ),
            )}
          </g>
        );
      })}
    </g>
  );
}
