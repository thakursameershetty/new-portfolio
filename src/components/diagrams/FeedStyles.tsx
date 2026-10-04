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
  glyph,
  type_,
  type Frame,
} from "./widget";

// TMN's home, as first drafted and as designed in the end. The first draft scrolled like
// Inshorts: one story fills the screen, and a swipe snaps to the next. The final one scrolls
// like Instagram: a feed of stories, each with its source, its picture and its likes and
// comments, that you react to as you go. The headlines are ones from the designs.

const RED = "#e03a3e";

const STORIES = [
  { lines: ["iPhone 17 leads,", "Android best-seller."], source: "applefans.com", tint: "#8e9a86" },
  { lines: ["CSK take their first", "win of the season."], source: "tataipl.com", tint: "#c9a23a" },
  { lines: ["Global AI rules are", "getting serious."], source: "TMN News", tint: "#6f86c9" },
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
      title="Home feed"
      icon={
        <>
          <rect x={-8} y={-9} width={16} height={8} rx={2} />
          <rect x={-8} y={2} width={16} height={8} rx={2} />
        </>
      }
      tabs={["First draft", "Final"]}
      accent={RED}
      length={4.6}
      status={{
        1: "The first draft scrolled like Inshorts: one story fills the screen, and a swipe snaps to the next.",
        2: "The final design scrolls like Instagram: a feed of stories with likes and comments, to react to as you go.",
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

/** The screen the stories scroll in, and a soft photo for a story. */
function viewport(uid: string, x: number, y: number, w: number, h: number) {
  return (
    <defs>
      <clipPath id={`${uid}-screen`}>
        <rect x={x} y={y} width={w} height={h} rx={24} />
      </clipPath>
      <linearGradient id={`${uid}-shade`} x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stopColor="#4b4744" />
        <stop offset="1" stopColor="#201e1c" />
      </linearGradient>
      <filter id={`${uid}-soft`} x="-50%" y="-50%" width="200%" height="200%">
        <feGaussianBlur stdDeviation="16" />
      </filter>
    </defs>
  );
}

function photo(uid: string, x: number, y: number, w: number, h: number, tint: string) {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={18} fill={`url(#${uid}-shade)`} />
      <circle
        cx={x + w * 0.66}
        cy={y + h * 0.42}
        r={Math.min(w, h) * 0.3}
        fill={tint}
        opacity={0.6}
        filter={`url(#${uid}-soft)`}
      />
    </g>
  );
}

function draft({ cx, cw, y, uid, t }: Frame): ReactNode {
  const left = cx + 28;
  const inner = cw - 56;
  const top = y + 96;
  const h = 272;
  // Two swipes, each snapping a whole screen.
  const page = ease(clamp((t - 1.4) / 0.5)) + ease(clamp((t - 3.0) / 0.5));
  const offset = -page * h;
  const swiping = (t > 1.1 && t < 1.4) || (t > 2.7 && t < 3.0);

  return (
    <g opacity={clamp((t - 0.2) / 0.4)}>
      {viewport(uid, left, top, inner, h)}
      <rect x={left} y={top} width={inner} height={h} rx={24} fill={RAISED} />
      <g clipPath={`url(#${uid}-screen)`}>
        {STORIES.map((story, k) => {
          const py = top + k * h + offset;
          return (
            <g key={story.source}>
              {photo(uid, left + 12, py + 12, inner - 24, 132, story.tint)}
              {story.lines.map((line, i) => (
                <text
                  key={line}
                  x={left + 22}
                  y={py + 180 + i * 28}
                  className={type_.name}
                  fill={INK}
                >
                  {line}
                </text>
              ))}
              {[0.86, 0.62].map((w, i) => (
                <rect
                  key={w}
                  x={left + 22}
                  y={py + 226 + i * 14}
                  width={(inner - 44) * w}
                  height={7}
                  rx={3.5}
                  fill={TRACK}
                />
              ))}
            </g>
          );
        })}
      </g>
      {/* A thumb's swipe up, just before each snap. */}
      {swiping && (
        <circle cx={left + inner - 40} cy={top + h - 40} r={14} fill={INK} opacity={0.25} />
      )}
    </g>
  );
}

function final({ cx, cw, y, uid, t }: Frame): ReactNode {
  const left = cx + 28;
  const inner = cw - 56;
  const top = y + 96;
  const h = 272;
  const post = 214;
  // One smooth scroll through the feed, easing to a stop.
  const offset = -ease(clamp((t - 0.9) / 3.2)) * post * 1.4;
  // A like on the first story as it goes by.
  const liked = t >= 1.5;
  const pop = 1 + 0.35 * Math.sin(Math.PI * clamp((t - 1.5) / 0.3));

  return (
    <g opacity={clamp((t - 0.2) / 0.4)}>
      {viewport(uid, left, top, inner, h)}
      <rect x={left} y={top} width={inner} height={h} rx={24} fill={RAISED} />
      <g clipPath={`url(#${uid}-screen)`}>
        {STORIES.map((story, k) => {
          const py = top + 14 + k * post + offset;
          const heart = k === 0 && liked;
          return (
            <g key={story.source}>
              <circle cx={left + 26} cy={py + 12} r={10} fill={TRACK} />
              <text x={left + 44} y={py + 17} className={type_.tag} fill={MUTED}>
                {story.source}
              </text>
              {photo(uid, left + 12, py + 32, inner - 24, 112, story.tint)}
              <text x={left + 22} y={py + 128} className={type_.headline} fill={INK}>
                {story.lines[0]}
              </text>
              <g transform={`translate(${left + 28} ${py + 166})`}>
                <g transform={heart ? `scale(${pop})` : undefined}>
                  {glyph(heart ? "favoriteFill" : "favorite", 0, 0, 22, heart ? RED : INK)}
                </g>
                <text x={18} y={6} className={type_.field} fill={INK}>
                  {k === 0 ? "12.4k" : "3.1k"}
                </text>
                {glyph("comment", 86, 1, 20, INK)}
                <text x={102} y={6} className={type_.field} fill={INK}>
                  {k === 0 ? "842" : "214"}
                </text>
                {glyph("bookmark", inner - 56, 0, 22, INK)}
              </g>
            </g>
          );
        })}
      </g>
    </g>
  );
}
