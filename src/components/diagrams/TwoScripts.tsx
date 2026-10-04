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

// TMN and Satara Today share one layout, shown on a phone at real sizes, after the two apps'
// home screens. The same top story, in English and then in Marathi: the Marathi headline runs
// to a third line, and the card grows to hold it while everything under it moves down, so
// nothing is cut off and nothing else changes. The story and its words are the ones on the
// apps' screens.

const RED = "#e03a3e";
const BAR = "#1d1b19";

const SCRIPTS = {
  1: {
    chips: [
      ["Politics", 78],
      ["Sports", 68],
      ["Local", 60],
      ["Technology", 104],
    ],
    breaking: "Peace talks begin in Pakistan, Donald Trump calls Iran “failing nation”",
    tag: "TRENDING",
    tagW: 82,
    lines: ["iPhone 17 leads,", "Android best-seller."],
    summary: ["iPhone 17 dominates, but the world's best-", "selling Android isn't Galaxy S25 Ultra…more"],
    tabs: ["Home", "Search", "People", "Saved", "You"],
  },
  2: {
    chips: [
      ["राजकारण", 84],
      ["खेळ", 52],
      ["स्थानिक", 72],
      ["तंत्रज्ञान", 86],
    ],
    breaking: "सुप्रसिद्ध गायिका आशा भोसले यांना मुंबईत रुग्णालयात दाखल",
    tag: "ट्रेंडिंग",
    tagW: 70,
    lines: ["आयफोन 17 आघाडीवर,", "अँड्रॉइडचा सर्वाधिक विक्री", "होणारा फोन."],
    summary: ["आयफोन 17 चे वर्चस्व आहे, पण जगातील सर्वाधिक", "विकला जाणारा अँड्रॉइड फोन…अधिक"],
    tabs: ["घर", "शोध", "लोक", "बुकमार्क", "आपण"],
  },
} as const;

const LINE = 30;
const SHORT = 300;

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
      phone
      title="Top story"
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

function story(version: 1 | 2, { cx, y, uid, t }: Frame): ReactNode {
  const script = SCRIPTS[version];
  const L = cx + 20;
  const W = 320;

  // Each headline line arrives in turn; a third one makes the card grow to hold it.
  const lineAt = (k: number) => 1 + k * 0.4;
  const grow = script.lines.length > 2 ? ease(clamp((t - lineAt(2)) / 0.5)) : 0;
  const height = lerp(SHORT, SHORT + LINE + 6, grow);
  const top = y + 214;
  const bottom = top + height;
  const lastBaseline = bottom - 24;
  // Lines sit on the card's foot, so earlier ones rise as a third one comes in.
  const count = 2 + grow;
  const baseline = (k: number) => lastBaseline - (count - 1 - k) * LINE;
  const tagY = baseline(0) - 50;
  // The breaking news runs along its strip.
  const ticker = -((t * 40) % 420);

  let chipX = L;
  return (
    <g>
      <defs>
        <clipPath id={`${uid}-row`}>
          <rect x={L} y={y + 160} width={W} height={44} />
        </clipPath>
        <clipPath id={`${uid}-strip`}>
          <rect x={cx} y={y + 112} width={360} height={36} />
        </clipPath>
        <linearGradient id={`${uid}-photo`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#5b6a72" />
          <stop offset="1" stopColor="#1c1f21" />
        </linearGradient>
        <filter id={`${uid}-soft`} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur stdDeviation="22" />
        </filter>
        <clipPath id={`${uid}-card`}>
          <rect x={L} y={top} width={W} height={height} rx={22} />
        </clipPath>
      </defs>

      {/* The masthead: TMN's red blocks, or Satara Today's name. */}
      {version === 1 ? (
        <g>
          {["T", "M", "N"].map((letter, k) => (
            <g key={letter}>
              <rect x={L + k * 30} y={y + 66} width={28} height={30} fill={RED} />
              <text x={L + 14 + k * 30} y={y + 89} textAnchor="middle" className={type_.pHead} fill="#ffffff">
                {letter}
              </text>
            </g>
          ))}
        </g>
      ) : (
        <text x={L} y={y + 92} className={type_.pTitle} fill={RED}>
          सातारा टुडे
        </text>
      )}
      <text x={L + W} y={y + 90} textAnchor="end" className={type_.pHead} fill={INK}>
        ≡
      </text>

      {/* Breaking news, in a red strip across the screen. */}
      <rect x={cx} y={y + 112} width={360} height={36} fill={RED} />
      <g clipPath={`url(#${uid}-strip)`}>
        {[0, 1].map((loop) => (
          <text
            key={loop}
            x={L + ticker + loop * 420}
            y={y + 135}
            className={type_.pLabel}
            fill="#ffffff"
          >
            {script.breaking}
          </text>
        ))}
      </g>

      {/* The category row; the first is the one you're in. */}
      <g clipPath={`url(#${uid}-row)`}>
        {script.chips.map(([name, width], k) => {
          const x = chipX;
          chipX += width + 8;
          const k0 = clamp((t - 0.25 - k * 0.08) / 0.35);
          return (
            <g key={name} opacity={k0} transform={`translate(${(1 - k0) * 12} 0)`}>
              <rect x={x} y={y + 166} width={width} height={32} rx={16} fill={k === 0 ? RED : RAISED} />
              <text x={x + width / 2} y={y + 187} textAnchor="middle" className={type_.pLabel} fill={k === 0 ? "#ffffff" : MUTED}>
                {name}
              </text>
            </g>
          );
        })}
      </g>

      {/* The story's card: its picture, the tag and the headline on it. */}
      <g opacity={clamp((t - 0.5) / 0.4)}>
        <g clipPath={`url(#${uid}-card)`}>
          <rect x={L} y={top} width={W} height={height} fill={`url(#${uid}-photo)`} />
          <circle cx={L + W * 0.62} cy={top + 110} r={70} fill="#9fb59a" opacity={0.6} filter={`url(#${uid}-soft)`} />
          <rect x={L} y={top + height * 0.4} width={W} height={height * 0.6} fill="#0d0e0f" opacity={0.6} filter={`url(#${uid}-soft)`} />
        </g>
        <circle cx={L + 26} cy={top + 26} r={10} fill="#ffffff" />
        <text x={L + 44} y={top + 31} className={type_.pSmall} fill="#ffffff">
          applefans.com · 3 mins ago
        </text>
        {glyph("bookmarkFill", L + W - 26, top + 26, 24, RED)}
        <g transform={`translate(${L + 20} ${tagY})`} opacity={clamp((t - 0.8) / 0.3)}>
          <rect width={script.tagW} height={24} rx={12} fill={RED} />
          <text x={script.tagW / 2} y={17} textAnchor="middle" className={type_.pSmall} fill="#ffffff">
            {script.tag}
          </text>
        </g>
        {script.lines.map((line, k) => {
          const k0 = ease(clamp((t - lineAt(k)) / 0.35));
          return (
            <text
              key={line}
              x={L + 20}
              y={baseline(k) + (1 - k0) * 8}
              opacity={k0}
              className={type_.pHeadline}
              fill="#ffffff"
            >
              {line}
            </text>
          );
        })}
      </g>

      {/* Under the card, pushed down when it grows: reactions, then the summary. */}
      <g opacity={clamp((t - 0.9) / 0.4)}>
        {glyph("favorite", L + 12, bottom + 30, 24, INK)}
        <text x={L + 32} y={bottom + 36} className={type_.pLabel} fill={INK}>
          12.4k
        </text>
        {glyph("comment", L + 104, bottom + 31, 22, INK)}
        <text x={L + 122} y={bottom + 36} className={type_.pLabel} fill={INK}>
          842
        </text>
        {glyph("bookmark", L + W - 12, bottom + 30, 24, INK)}
        {script.summary.map((line, k) => (
          <text key={line} x={L} y={bottom + 70 + k * 22} className={type_.pBody} fill={MUTED}>
            {line}
          </text>
        ))}
      </g>

      {/* The tab bar. */}
      <rect x={cx} y={y + 676} width={360} height={64} fill={BAR} />
      {script.tabs.map((tab, k) => (
        <text
          key={tab}
          x={cx + 36 + k * 72}
          y={y + 706}
          textAnchor="middle"
          className={type_.pSmall}
          fill={k === 0 ? RED : MUTED}
        >
          {tab}
        </text>
      ))}
    </g>
  );
}
