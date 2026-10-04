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
  type_,
  type Frame,
} from "./widget";

// TMN's home, as first drafted and as designed in the end, on a phone at real sizes. The
// first draft scrolled like Inshorts: one story fills the screen, and a swipe snaps to the
// next. The final one scrolls like Instagram: a feed of posts, each with its source, its
// picture, its likes and comments and its headline, that you react to as you go. The stories
// and their words are the ones from the designs.

const RED = "#e03a3e";
const BAR = "#1d1b19";

const STORIES = [
  {
    lines: ["iPhone 17 leads,", "Android best-seller."],
    body: [
      "iPhone 17 dominates, but the world's best-",
      "selling Android isn't the Galaxy S25 Ultra.",
    ],
    source: "applefans.com",
    tint: "#8e9a86",
  },
  {
    lines: ["Ton-up Samson stars in", "CSK's first win."],
    body: [
      "CSK vs DC highlights, IPL 2026: a ton from",
      "Samson in CSK's first win of the season.",
    ],
    source: "tataipl.com",
    tint: "#c9a23a",
  },
  {
    lines: ["Global AI rules are", "getting serious."],
    body: [
      "Governments worldwide are stepping up",
      "efforts to regulate artificial intelligence.",
    ],
    source: "TMN News",
    tint: "#6f86c9",
  },
];

export function FeedStyles({
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
      title="Home feed"
      tabs={["First draft", "Final"]}
      accent={RED}
      length={4.8}
      status={{
        1: "The first draft scrolled like Inshorts: one story fills the screen, and a swipe snaps to the next.",
        2: "The final design scrolls like Instagram: a feed of posts with likes and comments, to react to as you go.",
      }}
      stats={{
        1: [
          ["1", "story a screen", false],
          ["Snap", "scroll", false],
          ["Read", "and swipe", false],
        ],
        2: [
          ["Feed", "of posts", true],
          ["Free", "scroll", true],
          ["React", "as you go", true],
        ],
      }}
      draw={(version, frame) => (version === 1 ? draft(frame) : final(frame))}
    />
  );
}

/** The masthead and the tab bar, the same in both. */
function chrome(cx: number, y: number): ReactNode {
  const L = cx + 20;
  return (
    <g>
      {["T", "M", "N"].map((letter, k) => (
        <g key={letter}>
          <rect x={L + k * 30} y={y + 66} width={28} height={30} fill={RED} />
          <text x={L + 14 + k * 30} y={y + 89} textAnchor="middle" className={type_.pHead} fill="#ffffff">
            {letter}
          </text>
        </g>
      ))}
      <rect x={cx} y={y + 676} width={360} height={64} fill={BAR} />
      {["Home", "Search", "People", "Saved", "You"].map((tab, k) => (
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

/** A soft photo for a story. */
function photo(uid: string, x: number, y: number, w: number, h: number, tint: string) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={18} fill={`url(#${uid}-shade)`} />
      <circle
        cx={x + w * 0.64}
        cy={y + h * 0.42}
        r={Math.min(w, h) * 0.28}
        fill={tint}
        opacity={0.6}
        filter={`url(#${uid}-soft)`}
      />
    </g>
  );
}

function defs(uid: string, cx: number, y: number) {
  return (
    <defs>
      <clipPath id={`${uid}-feed`}>
        <rect x={cx} y={y + 112} width={360} height={564} />
      </clipPath>
      <linearGradient id={`${uid}-shade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4b4744" />
        <stop offset="1" stopColor="#201e1c" />
      </linearGradient>
      <filter id={`${uid}-soft`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="22" />
      </filter>
    </defs>
  );
}

function draft({ cx, y, uid, t }: Frame): ReactNode {
  const L = cx + 20;
  const W = 320;
  // One story a screen; two swipes, each snapping a whole page.
  const page = 564;
  const turned = ease(clamp((t - 1.5) / 0.5)) + ease(clamp((t - 3.1) / 0.5));
  const offset = -turned * page;
  const swiping = (t > 1.15 && t < 1.5) || (t > 2.75 && t < 3.1);

  return (
    <g opacity={clamp((t - 0.2) / 0.4)}>
      {defs(uid, cx, y)}
      <g clipPath={`url(#${uid}-feed)`}>
        {STORIES.map((story, k) => {
          const py = y + 120 + k * page + offset;
          return (
            <g key={story.source}>
              {photo(uid, L, py, W, 250, story.tint)}
              <text x={L} y={py + 290} className={type_.pSmall} fill={MUTED}>
                {story.source}
              </text>
              {story.lines.map((line, i) => (
                <text key={line} x={L} y={py + 324 + i * 30} className={type_.pHeadline} fill={INK}>
                  {line}
                </text>
              ))}
              {story.body.map((line, i) => (
                <text key={line} x={L} y={py + 400 + i * 24} className={type_.pBody} fill={MUTED}>
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </g>
      {/* A thumb's swipe up, just before each snap. */}
      {swiping && (
        <g>
          <circle cx={L + W - 40} cy={y + 600} r={20} fill={INK} opacity={0.22} />
          <path
            d={`M${L + W - 40} ${y + 588}v-30m-8 8 8 -8 8 8`}
            fill="none"
            stroke={INK}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.6}
          />
        </g>
      )}
      {chrome(cx, y)}
    </g>
  );
}

function final({ cx, y, uid, t }: Frame): ReactNode {
  const L = cx + 20;
  const W = 320;
  const post = 470;
  // One smooth scroll through the feed, easing to a stop.
  const offset = -ease(clamp((t - 1.0) / 3.2)) * post * 1.2;
  // A like on the first post as it goes by.
  const liked = t >= 1.6;
  const pop = 1 + 0.35 * Math.sin(Math.PI * clamp((t - 1.6) / 0.3));

  return (
    <g opacity={clamp((t - 0.2) / 0.4)}>
      {defs(uid, cx, y)}
      <g clipPath={`url(#${uid}-feed)`}>
        {STORIES.map((story, k) => {
          const py = y + 124 + k * post + offset;
          const heart = k === 0 && liked;
          return (
            <g key={story.source}>
              <circle cx={L + 18} cy={py + 18} r={18} fill={RAISED} />
              <text x={L + 18} y={py + 24} textAnchor="middle" className={type_.pStrong} fill={INK}>
                {story.source[0].toUpperCase()}
              </text>
              <text x={L + 46} y={py + 15} className={type_.pStrong} fill={INK}>
                {story.source}
              </text>
              <text x={L + 46} y={py + 33} className={type_.pSmall} fill={MUTED}>
                3 mins ago
              </text>
              {photo(uid, L, py + 48, W, 300, story.tint)}
              <g transform={`translate(${L + 14} ${py + 376})`}>
                <g transform={heart ? `scale(${pop})` : undefined}>
                  {glyph(heart ? "favoriteFill" : "favorite", 0, 0, 26, heart ? RED : INK)}
                </g>
              </g>
              <text x={L + 36} y={py + 382} className={type_.pLabel} fill={INK}>
                {k === 0 ? "12.4k" : "3.1k"}
              </text>
              {glyph("comment", L + 104, py + 377, 24, INK)}
              <text x={L + 124} y={py + 382} className={type_.pLabel} fill={INK}>
                {k === 0 ? "842" : "214"}
              </text>
              {glyph("bookmark", L + W - 14, py + 376, 26, INK)}
              {story.lines.map((line, i) => (
                <text key={line} x={L} y={py + 418 + i * 24} className={type_.pStrong} fill={INK}>
                  {line}
                </text>
              ))}
            </g>
          );
        })}
      </g>
      {chrome(cx, y)}
    </g>
  );
}
