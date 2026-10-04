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
  button,
  clamp,
  lerp,
  type_,
  type Frame,
} from "./widget";

// MutinyX's quoting, before and after. In version 1 a slider nudged the price and promised
// better or worse odds of acceptance, but a brand sets one budget for the whole campaign, so
// those odds had nothing behind them. In version 2 the creator types their own quote, and the
// app only says whether it's within the brand's budget or above it.

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
      title="Your quote"
      icon={
        <>
          <path d="M-9 -9h8l10 10-8 8-10-10z" />
          <circle cx={-4.5} cy={-4.5} r={1.4} fill={INK} stroke="none" />
        </>
      }
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

function before({ cx, cw, y, t }: Frame): ReactNode {
  const left = cx + 28;
  const inner = cw - 56;
  const mid = cx + cw / 2;

  const knob = knobAt(t);
  const low = Math.floor(knob);
  const price =
    Math.round(lerp(STOPS[low], STOPS[Math.min(low + 1, 4)], knob - low) / 10) * 10;

  const stop = Math.round(knob);
  const doubt = t >= DOUBT;
  const hint = doubt
    ? "One budget per campaign, not per creator"
    : stop < 2
      ? "10% more chance of being accepted"
      : stop > 2
        ? "5% less chance of being accepted"
        : "Lower price, higher chance of acceptance";

  const trackX = left + 18;
  const trackW = inner - 36;
  const knobX = trackX + (trackW * knob) / 4;
  const trackY = y + 244;

  return (
    <g>
      <text x={mid} y={y + 168} textAnchor="middle" className={type_.big} fill={INK}>
        ${price}
      </text>
      {doubt && badge(mid + 96, y + 118, "?")}
      <text
        x={mid}
        y={y + 208}
        textAnchor="middle"
        className={type_.label}
        fill={doubt ? INK : MUTED}
      >
        {hint}
      </text>

      <rect x={trackX} y={trackY} width={trackW} height={10} rx={5} fill={TRACK} />
      <rect x={trackX} y={trackY} width={knobX - trackX} height={10} rx={5} fill={YELLOW} />
      <circle cx={knobX} cy={trackY + 5} r={14} fill={CREAM} />
      {TICKS.map((tick, k) => (
        <text
          key={tick}
          x={trackX + (trackW * k) / 4}
          y={trackY + 42}
          textAnchor="middle"
          className={type_.label}
          fill={k === stop ? INK : MUTED}
        >
          {tick}
        </text>
      ))}

      {button(left, y + 308, inner, 52, `Accept for $${price}`)}
    </g>
  );
}

function after({ cx, cw, y, t }: Frame): ReactNode {
  const left = cx + 28;
  const inner = cw - 56;
  const mid = cx + cw / 2;

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

  const fieldW = Math.min(340, inner);
  const typing = t < 3.6;
  const caretX = mid + ((digits.length + 1) * 34) / 2 + 4;
  const sent = t >= 4.8;

  // Green when it fits the budget, red when it's over, as on version 2's screen.
  const tone = within ? GREEN : RED;
  const chipW = Math.min(300, inner);
  const chipX = mid - chipW / 2;
  const chipY = y + 216;

  return (
    <g>
      <rect
        x={mid - fieldW / 2}
        y={y + 100}
        width={fieldW}
        height={92}
        rx={46}
        fill="none"
        stroke={YELLOW}
        strokeWidth={2}
      />
      <text x={mid} y={y + 167} textAnchor="middle" className={type_.big} fill={INK}>
        ₹{digits}
      </text>
      {typing && Math.floor(t * 2.5) % 2 === 0 && (
        <rect x={caretX} y={y + 124} width={3} height={46} rx={1.5} fill={YELLOW} />
      )}

      <g opacity={shown}>
        <rect
          x={chipX}
          y={chipY}
          width={chipW}
          height={52}
          rx={26}
          fill={tone}
          fillOpacity={0.14}
          stroke={tone}
          strokeOpacity={0.6}
          strokeWidth={1.5}
        />
        <g transform={`translate(${chipX + 30} ${chipY + 26})`}>
          <circle r={11} fill={tone} />
          {within ? (
            <path
              d="M-5 0l3.5 3.5L5 -4"
              fill="none"
              stroke={DARK}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : (
            <>
              <path d="M0 -5v5" stroke={DARK} strokeWidth={2.2} strokeLinecap="round" />
              <circle cy={4.5} r={1.3} fill={DARK} />
            </>
          )}
        </g>
        <text x={chipX + 52} y={chipY + 32} className={type_.field} fill={INK}>
          {within ? "Within the brand's budget" : "Above the brand's budget"}
        </text>
      </g>

      {button(
        left,
        y + 308,
        inner,
        52,
        sent ? "Quote sent" : "Submit quote",
        clamp((t - 4.4) / 0.3),
      )}
    </g>
  );
}
