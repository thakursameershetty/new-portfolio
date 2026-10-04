"use client";

import type { ReactNode } from "react";
import { ease } from "./shared";
import { BLUE } from "./NovaHome";
import {
  INK,
  MUTED,
  RAISED,
  TRACK,
  VersionWidget,
  button,
  clamp,
  type_,
  typed,
  type Frame,
} from "./widget";

// Adding your money to a UPI app, against Nova's idea of it. A typical app takes your number,
// then has you find your bank in a list and pick your account. Nova (a concept) fetches every
// card linked to the number at once, and you pull one down to add it.

const NUMBER = "+91 98765 43210";

const CARDS = [
  ["#7b3fe4", "#1b1033"],
  ["#2f6bff", "#1238b8"],
  ["#3a3a40", "#151518"],
] as const;

export function NovaCards({
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
      title="Add money"
      icon={
        <>
          <rect x={-9} y={-6.5} width={18} height={13} rx={3} />
          <path d="M-9 -1.5h18" />
        </>
      }
      tabs={["Typical UPI app", "Nova"]}
      accent={BLUE}
      length={5}
      status={{
        1: "A typical UPI app: enter your number, then find your bank in a list, then pick your account.",
        2: "Nova, a concept: enter your number, and every card linked to it is fetched at once; pull one down to add it.",
      }}
      stats={{
        1: [
          ["Pick", "your bank", false],
          ["Then", "your account", false],
          ["You", "do the looking", false],
        ],
        2: [
          ["0", "banks to pick", true],
          ["All", "cards fetched", true],
          ["Pull", "to add", true],
        ],
      }}
      draw={(version, frame) => (version === 1 ? typical(frame) : nova(frame))}
    />
  );
}

/** The phone number field, typed out. */
function number(left: number, inner: number, y: number, t: number): ReactNode {
  return (
    <g>
      <text x={left + 4} y={y + 112} className={type_.label} fill={MUTED}>
        Mobile number
      </text>
      <rect x={left} y={y + 122} width={inner} height={46} rx={23} fill={RAISED} />
      <text x={left + 20} y={y + 151} className={type_.field} fill={INK}>
        {typed(NUMBER, (t - 0.3) / 0.7)}
      </text>
    </g>
  );
}

/** A tap: a ring that grows and fades from `at`. */
function tap(x: number, y: number, t: number, at: number): ReactNode {
  const k = clamp((t - at) / 0.45);
  if (k <= 0 || k >= 1) return null;
  return (
    <circle cx={x} cy={y} r={10 + 10 * k} fill="none" stroke={INK} strokeWidth={2} opacity={1 - k} />
  );
}

function typical({ cx, cw, y, uid, t }: Frame): ReactNode {
  const left = cx + 28;
  const inner = cw - 56;
  const accounts = t >= 3.4;
  // Scrolling the list of banks to find yours.
  const scroll = -ease(clamp((t - 1.6) / 1.2)) * 96;
  const picked = 5;
  const listTop = y + 214;

  return (
    <g>
      {number(left, inner, y, t)}
      <defs>
        <clipPath id={`${uid}-list`}>
          <rect x={left} y={listTop} width={inner} height={162} />
        </clipPath>
      </defs>
      <g opacity={clamp((t - 1.1) / 0.3)}>
        <text x={left + 4} y={y + 202} className={type_.name} fill={INK}>
          {accounts ? "Select your account" : "Select your bank"}
        </text>
        <g clipPath={`url(#${uid}-list)`}>
          {(accounts ? [0, 1] : [0, 1, 2, 3, 4, 5, 6, 7]).map((k) => {
            const ry = listTop + 6 + k * 40 + (accounts ? 0 : scroll);
            const chosen = (!accounts && k === picked && t >= 3.0) || (accounts && k === 0 && t >= 4.2);
            return (
              <g key={`${accounts}${k}`}>
                <rect
                  x={left}
                  y={ry}
                  width={inner}
                  height={34}
                  rx={17}
                  fill={RAISED}
                  stroke={chosen ? BLUE : "none"}
                  strokeWidth={2}
                />
                <circle cx={left + 20} cy={ry + 17} r={9} fill={TRACK} />
                <rect
                  x={left + 38}
                  y={ry + 13}
                  width={inner * [0.42, 0.3, 0.5, 0.36, 0.46, 0.34, 0.4, 0.28][k]}
                  height={8}
                  rx={4}
                  fill={TRACK}
                />
              </g>
            );
          })}
        </g>
        {tap(left + inner / 2, listTop + 6 + picked * 40 + 17 - 96, t, 2.9)}
        {tap(left + inner / 2, listTop + 6 + 17, t, 4.1)}
      </g>
    </g>
  );
}

function nova({ cx, cw, y, uid, t }: Frame): ReactNode {
  const left = cx + 28;
  const inner = cw - 56;
  const cardW = Math.min(170, inner * 0.5);
  const spread = (inner - cardW) / 2;
  // The first card is pulled down onto the button, and added.
  const pull = ease(clamp((t - 2.8) / 0.6));
  const added = t >= 3.4;

  return (
    <g>
      {number(left, inner, y, t)}
      <defs>
        {CARDS.map(([from, to], k) => (
          <linearGradient key={k} id={`${uid}-c${k}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={from} />
            <stop offset="1" stopColor={to} />
          </linearGradient>
        ))}
      </defs>
      <text
        x={left + 4}
        y={y + 202}
        className={type_.label}
        fill={MUTED}
        opacity={clamp((t - 1.1) / 0.3)}
      >
        Fetched from your mobile number
      </text>
      {/* Later cards first, so the first sits on top. */}
      {[2, 1, 0].map((k) => {
        const k0 = ease(clamp((t - 1.3 - k * 0.3) / 0.4));
        const first = k === 0;
        const dy = first ? pull * 104 : 0;
        const scale = first ? 1 - pull * 0.45 : 1;
        const x = left + k * spread + (1 - k0) * 30;
        const top = y + 214;
        if (first && added) return null;
        return (
          <g
            key={k}
            opacity={k0 * (first ? 1 - clamp((pull - 0.7) / 0.3) : 1)}
            transform={`translate(${x + cardW / 2} ${top + 48 + dy}) scale(${scale})`}
          >
            <rect x={-cardW / 2} y={-48} width={cardW} height={96} rx={16} fill={`url(#${uid}-c${k})`} />
            <rect x={-cardW / 2 + 14} y={-34} width={22} height={16} rx={4} fill="rgba(255,255,255,0.35)" />
            <text x={-cardW / 2 + 14} y={34} className={type_.tag} fill="rgba(255,255,255,0.85)">
              •••• {["3507", "8812", "4410"][k]}
            </text>
          </g>
        );
      })}
      <g opacity={clamp((t - 2.2) / 0.3)}>
        {button(left, y + 326, inner, 46, added ? "Card added" : "Pull to add", clamp((t - 3.3) / 0.3), BLUE, "#ffffff")}
      </g>
    </g>
  );
}
