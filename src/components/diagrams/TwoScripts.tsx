"use client";

import type { ReactNode } from "react";
import { ease } from "./shared";
import {
  INK,
  MUTED,
  RAISED,
  VersionWidget,
  clamp,
  glyph,
  lerp,
  type_,
  type Frame,
} from "./widget";

// TMN and Satara Today share one layout. The same top story, in English and then in Marathi:
// the Marathi headline runs to a third line, and the card grows to hold it while everything
// under it moves down, so nothing is cut off and nothing else changes. The story is the one
// on the app's screens.

const RED = "#e03a3e";

const SCRIPTS = {
  1: {
    chips: [
      ["Politics", 84],
      ["Sports", 74],
      ["Local", 64],
      ["Technology", 110],
    ],
    tag: "TRENDING",
    tagW: 86,
    lines: ["iPhone 17 leads,", "Android best-seller."],
  },
  2: {
    chips: [
      ["राजकारण", 92],
      ["खेळ", 56],
      ["स्थानिक", 78],
      ["तंत्रज्ञान", 92],
    ],
    tag: "ट्रेंडिंग",
    tagW: 74,
    lines: ["आयफोन 17 आघाडीवर,", "अँड्रॉइडचा सर्वाधिक विक्री", "होणारा फोन."],
  },
} as const;

const LINE = 32;
const SHORT = 150;

export function TwoScripts({
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
      title="Top story"
      icon={
        <text y={6} textAnchor="middle" fontSize={17} fill={INK} stroke="none">
          अ
        </text>
      }
      tabs={["English", "मराठी"]}
      accent={RED}
      length={4.5}
      status={{
        1: "The story in English: a two-line headline on the card.",
        2: "The same story in Marathi: the headline runs to three lines, and the card grows to hold it, in the same layout.",
      }}
      stats={{
        1: [
          ["Aa", "Latin script", false],
          ["2", "headline lines", false],
          ["1", "layout", false],
        ],
        2: [
          ["अ", "Devanagari", true],
          ["3", "headline lines", true],
          ["1", "layout", false],
        ],
      }}
      draw={(version, frame) => story(version, frame)}
    />
  );
}

function story(version: 1 | 2, { cx, cw, y, uid, t }: Frame): ReactNode {
  const script = SCRIPTS[version];
  const left = cx + 28;
  const inner = cw - 56;

  // Each headline line arrives in turn; a third one makes the card grow to hold it.
  const lineAt = (k: number) => 1 + k * 0.4;
  const grow = script.lines.length > 2 ? ease(clamp((t - lineAt(2)) / 0.5)) : 0;
  const height = lerp(SHORT, SHORT + LINE + 4, grow);
  const top = y + 142;
  const bottom = top + height;
  const lastBaseline = bottom - 22;
  // Lines sit on the card's foot, so earlier ones rise as a third one comes in.
  const count = 2 + grow;
  const baseline = (k: number) => lastBaseline - (count - 1 - k) * LINE;
  const tagY = baseline(0) - 46;

  let chipX = left;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}-row`}>
          <rect x={left} y={y + 96} width={inner} height={40} />
        </clipPath>
        <linearGradient id={`${uid}-photo`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#4b4744" />
          <stop offset="1" stopColor="#201e1c" />
        </linearGradient>
        <filter id={`${uid}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="18" />
        </filter>
        <clipPath id={`${uid}-card`}>
          <rect x={left} y={top} width={inner} height={height} rx={24} />
        </clipPath>
      </defs>

      {/* The category row; the first is the one you're in. */}
      <g clipPath={`url(#${uid}-row)`}>
        {script.chips.map(([name, width], k) => {
          const x = chipX;
          chipX += width + 8;
          const k0 = clamp((t - 0.25 - k * 0.08) / 0.35);
          return (
            <g key={name} opacity={k0} transform={`translate(${(1 - k0) * 12} 0)`}>
              <rect
                x={x}
                y={y + 100}
                width={width}
                height={30}
                rx={15}
                fill={k === 0 ? RED : RAISED}
              />
              <text
                x={x + width / 2}
                y={y + 120}
                textAnchor="middle"
                className={type_.tag}
                fill={k === 0 ? INK : MUTED}
              >
                {name}
              </text>
            </g>
          );
        })}
      </g>

      {/* The story's card: its picture, the tag and the headline on it. */}
      <g opacity={clamp((t - 0.5) / 0.4)}>
        <g clipPath={`url(#${uid}-card)`}>
          <rect x={left} y={top} width={inner} height={height} fill={`url(#${uid}-photo)`} />
          <circle
            cx={left + inner * 0.68}
            cy={top + 52}
            r={46}
            fill="#8e9a86"
            opacity={0.55}
            filter={`url(#${uid}-soft)`}
          />
          <rect
            x={left}
            y={top + height * 0.35}
            width={inner}
            height={height * 0.65}
            fill="#151413"
            opacity={0.55}
            filter={`url(#${uid}-soft)`}
          />
        </g>
        <text x={left + 20} y={top + 28} className={type_.tag} fill={MUTED}>
          applefans.com · 3 mins ago
        </text>
        {glyph("bookmarkFill", left + inner - 24, top + 23, 24, RED)}
        <g transform={`translate(${left + 20} ${tagY})`} opacity={clamp((t - 0.8) / 0.3)}>
          <rect width={script.tagW} height={22} rx={11} fill={RED} />
          <text x={script.tagW / 2} y={15.5} textAnchor="middle" className={type_.tag} fill={INK}>
            {script.tag}
          </text>
        </g>
        {script.lines.map((line, k) => {
          const k0 = ease(clamp((t - lineAt(k)) / 0.35));
          return (
            <text
              key={line}
              x={left + 20}
              y={baseline(k) + (1 - k0) * 8}
              opacity={k0}
              className={type_.headline}
              fill={INK}
            >
              {line}
            </text>
          );
        })}
      </g>

      {/* Under the card: likes and comments, pushed down when the card grows. */}
      <g
        transform={`translate(${left + 6} ${bottom + 30})`}
        opacity={clamp((t - 0.9) / 0.4)}
      >
        {glyph("favorite", 0, 0, 22, INK)}
        <text x={18} y={6} className={type_.field} fill={INK}>
          12.4k
        </text>
        {glyph("comment", 86, 1, 20, INK)}
        <text x={102} y={6} className={type_.field} fill={INK}>
          842
        </text>
      </g>
    </g>
  );
}
