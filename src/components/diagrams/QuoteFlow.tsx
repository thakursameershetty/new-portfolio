"use client";

import type { ReactNode } from "react";
import { ease } from "./shared";
import {
  CREAM,
  DARK,
  GREEN,
  INK,
  MUTED,
  RED,
  TRACK,
  VersionWidget,
  YELLOW,
  badge,
  clamp,
  lerp,
  touch,
  hold,
  type_,
  type Frame,
} from "./widget";

// MutinyX's quoting, before and after, on a phone at real sizes, after the two versions'
// screens. In version 1 a slider nudged the price and promised better or worse odds of
// acceptance, but a brand sets one budget for the whole campaign, so those odds had nothing
// behind them. In version 2 the creator types their own quote, and the app only says whether
// it's within the brand's budget or above it.

// The slider's stops, as on version 1's screen: -$20, -$10, the asking price, +$50, +$60.
const STOPS = [480, 490, 500, 550, 560];
const TICKS = ["-$20", "-$10", "$500", "+$50", "+$60"];

// Where the knob is (a stop index) over time: down to $490, up to $550, back to $500.
const KNOB: [number, number][] = [
  [0, 2],
  [0.8, 2],
  [1.5, 1],
  [2.4, 1],
  [3.2, 3],
  [4.0, 3],
  [4.6, 2],
];

const DOUBT = 4.9;
const SHEET = "#211f1c";

export function QuoteFlow({
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
      title="Your quote"
      length={5.5}
      status={{
        1: "Before: a price slider promising better or worse odds of acceptance, with no per-creator price behind them.",
        2: "After: the creator types their own quote, and the app says only whether it's within the brand's budget or above it.",
      }}
      stats={{
        1: [
          ["1", "brand budget", false],
          ["3", "creator tiers", false],
          ["?", "real odds", false],
        ],
        2: [
          ["1", "brand budget", false],
          ["Yours", "the price", true],
          ["Clear", "budget check", true],
        ],
      }}
      draw={(version, frame) => (version === 1 ? before(frame) : after(frame))}
    />
  );
}

/** The knob's stop index at time `t`, eased between the keyframes. */
function knobAt(t: number) {
  for (let k = 1; k < KNOB.length; k++) {
    const [t1, p1] = KNOB[k];
    const [t0, p0] = KNOB[k - 1];
    if (t < t1) return lerp(p0, p1, ease(clamp((t - t0) / (t1 - t0))));
  }
  return KNOB[KNOB.length - 1][1];
}

/** The campaign at the top of the screen, and the sheet that comes up over it. */
function campaign(cx: number, y: number, uid: string, faded: boolean): ReactNode {
  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-hero`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#9b1018" />
          <stop offset="1" stopColor="#3b0507" />
        </linearGradient>
      </defs>
      <rect x={cx} y={y} width={360} height={300} fill={`url(#${uid}-hero)`} opacity={faded ? 0.55 : 1} />
      <text x={cx + 20} y={y + 100} className={type_.pHead} fill="#ffffff" opacity={faded ? 0.4 : 1}>
        ‹  Campaign details
      </text>
      <rect x={cx} y={y + 252} width={360} height={520} rx={28} fill={SHEET} />
      <rect x={cx + 160} y={y + 264} width={40} height={5} rx={2.5} fill={MUTED} />
    </g>
  );
}

function before({ cx, y, uid, t }: Frame): ReactNode {
  const L = cx + 20;
  const W = 320;
  const mid = cx + 180;

  const knob = knobAt(t);
  const low = Math.floor(knob);
  const price =
    Math.round(lerp(STOPS[low], STOPS[Math.min(low + 1, 4)], knob - low) / 10) * 10;
  const stop = Math.round(knob);
  const doubt = t >= DOUBT;
  const hint = doubt
    ? "Brands set one budget, not one per creator"
    : stop < 2
      ? "10% more chance of being accepted"
      : stop > 2
        ? "5% less chance of being accepted"
        : "Lower price, higher chance of acceptance";

  const trackX = L + 14;
  const trackW = W - 28;
  const knobX = trackX + (trackW * knob) / 4;
  const trackY = y + 560;

  return (
    <g>
      {campaign(cx, y, uid, false)}
      <text x={mid} y={y + 312} textAnchor="middle" className={type_.pHead} fill={INK}>
        Confirm acceptance
      </text>
      <text x={mid} y={y + 336} textAnchor="middle" className={type_.pLabel} fill={MUTED}>
        Set a price that works for this campaign
      </text>

      <rect x={L + 30} y={y + 360} width={W - 60} height={100} rx={24} fill={TRACK} />
      <text x={mid} y={y + 428} textAnchor="middle" className={type_.pBig} fill={INK}>
        ${price}
      </text>
      {doubt && badge(L + W - 36, y + 362, "?")}
      <text
        x={mid}
        y={y + 494}
        textAnchor="middle"
        className={type_.pLabel}
        fill={doubt ? INK : MUTED}
      >
        {hint}
      </text>

      {TICKS.map((tick, k) => (
        <text
          key={tick}
          x={trackX + (trackW * k) / 4}
          y={trackY - 18}
          textAnchor="middle"
          className={type_.pSmall}
          fill={k === stop ? INK : MUTED}
        >
          {tick}
        </text>
      ))}
      <rect x={trackX} y={trackY} width={trackW} height={8} rx={4} fill={TRACK} />
      <rect x={trackX} y={trackY} width={knobX - trackX} height={8} rx={4} fill={YELLOW} />
      <circle cx={knobX} cy={trackY + 4} r={14} fill={CREAM} />
      {/* The thumb on the knob while it drags the price around. */}
      {hold(knobX, trackY + 4, t, 0.8, 4.6)}

      <rect x={L} y={y + 640} width={W} height={56} rx={28} fill={YELLOW} />
      <text x={mid} y={y + 674} textAnchor="middle" className={type_.pButton} fill={DARK}>
        Accept campaign for ${price}
      </text>
    </g>
  );
}

function after({ cx, y, uid, t }: Frame): ReactNode {
  const L = cx + 20;
  const W = 320;
  const mid = cx + 180;

  // Type ₹6500, see it's above the budget, clear it, type ₹5000, see it's within.
  let digits = "";
  if (t < 2.6) digits = "6500".slice(0, Math.round(4 * clamp((t - 0.4) / 0.7)));
  else if (t < 2.9) digits = "6500".slice(0, Math.round(4 * (1 - clamp((t - 2.6) / 0.3))));
  else digits = "5000".slice(0, Math.round(4 * clamp((t - 2.9) / 0.6)));

  const above = t >= 1.3 && t < 2.6;
  const within = t >= 3.7;
  const shown = above
    ? clamp((t - 1.3) / 0.25) * (1 - clamp((t - 2.45) / 0.15))
    : within
      ? clamp((t - 3.7) / 0.25)
      : 0;
  // Green when it fits the budget, red when it's over, as on version 2's screen.
  const tone = within ? GREEN : RED;

  const typing = t < 3.6;
  const caretX = mid + ((digits.length + 1) * 30) / 2 + 4;
  const sent = t >= 4.8;
  const press = 1 - 0.05 * Math.sin(Math.PI * clamp((t - 4.4) / 0.3));

  return (
    <g>
      {campaign(cx, y, uid, true)}

      {/* The quote, typed into its own field. */}
      <rect
        x={L + 30}
        y={y + 300}
        width={W - 60}
        height={100}
        rx={50}
        fill="none"
        stroke={YELLOW}
        strokeWidth={2}
      />
      <text x={mid} y={y + 368} textAnchor="middle" className={type_.pBig} fill={INK}>
        ₹{digits}
      </text>
      {typing && Math.floor(t * 2.5) % 2 === 0 && (
        <rect x={caretX} y={y + 326} width={3} height={48} rx={1.5} fill={YELLOW} />
      )}

      {/* Above the budget or within it: the only thing the app says about the price. */}
      <g opacity={shown}>
        <rect
          x={L}
          y={y + 424}
          width={W}
          height={76}
          rx={18}
          fill={tone}
          fillOpacity={0.12}
          stroke={tone}
          strokeOpacity={0.7}
          strokeWidth={1.5}
        />
        <circle cx={L + 32} cy={y + 462} r={14} fill={tone} />
        {within ? (
          <path
            d={`M${L + 25} ${y + 462}l5 5 9 -10`}
            fill="none"
            stroke={DARK}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        ) : (
          <>
            <path d={`M${L + 32} ${y + 455}v8`} stroke={DARK} strokeWidth={2.6} strokeLinecap="round" />
            <circle cx={L + 32} cy={y + 469} r={1.6} fill={DARK} />
          </>
        )}
        <text x={L + 60} y={y + 456} className={type_.pStrong} fill={INK}>
          {within ? "Great!" : "Higher than the brand budget"}
        </text>
        <text x={L + 60} y={y + 478} className={type_.pSmall} fill={MUTED}>
          {within ? "Your quote fits within the brand's budget" : "Brands usually prefer quotes within it"}
        </text>
      </g>

      {/* The confirmation, then the button. */}
      <rect x={L} y={y + 552} width={22} height={22} rx={6} fill={YELLOW} />
      <path
        d={`M${L + 5} ${y + 563}l4 4 8 -8`}
        fill="none"
        stroke={DARK}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <text x={L + 34} y={y + 562} className={type_.pSmall} fill={MUTED}>
        I confirm that I&apos;ve read the campaign&apos;s
      </text>
      <text x={L + 34} y={y + 578} className={type_.pSmall} fill={MUTED}>
        details, requirements and guidelines.
      </text>

      <g transform={`translate(${mid} ${y + 668}) scale(${press})`}>
        <rect x={-W / 2} y={-28} width={W} height={56} rx={28} fill={YELLOW} />
        <text y={6} textAnchor="middle" className={type_.pButton} fill={DARK}>
          {sent ? "Quote sent" : "Submit quote"}
        </text>
      </g>
      {touch(mid, y + 668, t, 4.4)}
    </g>
  );
}
