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
  clamp,
  hold,
  touch,
  type_,
  typed,
  type Frame,
} from "./widget";

// Adding your money to a UPI app, against Nova's idea of it, on a phone at real sizes. A
// typical app takes your number, then has you search a list for your bank and pick your
// account. Nova (a concept) fetches every card linked to the number at once, stacked like a
// wallet, and you pull one down to add it.

const NUMBER = "+91 98765 43210";
const FAINT = "rgba(244, 236, 230, 0.36)";

// The list a typical app makes you search: banks, then that bank's accounts (numbers masked).
const BANKS = [
  ["S", "State Bank of India"],
  ["H", "HDFC Bank"],
  ["I", "ICICI Bank"],
  ["A", "Axis Bank"],
  ["K", "Kotak Mahindra Bank"],
  ["B", "Bank of Baroda"],
  ["C", "Canara Bank"],
  ["P", "Punjab National Bank"],
] as const;
const ACCOUNTS = [
  ["₹", "Savings account", "••••4521"],
  ["₹", "Current account", "••••0937"],
] as const;

// The cards Nova finds: the front one is the card on Nova's screens.
const CARDS = [
  { from: "#7b3fe4", to: "#1b1033", digits: "3507", brand: "VISA" },
  { from: "#2f6bff", to: "#1238b8", digits: "8812", brand: "RuPay" },
  { from: "#3a3a40", to: "#151518", digits: "4410", brand: "VISA" },
];

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
      phone
      title="Add money"
      tabs={["Typical UPI app", "Nova"]}
      accent={BLUE}
      length={5}
      status={{
        1: "A typical UPI app: enter your number, then search a list for your bank, then pick your account.",
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

/** The screen's title, and the phone number typed into its field. */
function top(L: number, y: number, t: number, title: string, note: string): ReactNode {
  return (
    <g>
      <text x={L} y={y + 112} className={type_.pTitle} fill={INK}>
        {title}
      </text>
      <text x={L} y={y + 138} className={type_.pLabel} fill={MUTED}>
        {note}
      </text>
      <text x={L + 4} y={y + 182} className={type_.pLabel} fill={MUTED}>
        Mobile number
      </text>
      <rect x={L} y={y + 192} width={320} height={56} rx={28} fill={RAISED} />
      <text x={L + 22} y={y + 226} className={type_.pBody} fill={INK}>
        {typed(NUMBER, (t - 0.3) / 0.7)}
      </text>
    </g>
  );
}


function typical({ cx, y, uid, t }: Frame): ReactNode {
  const L = cx + 20;
  const W = 320;
  const accounts = t >= 3.4;
  // Scrolling the list of banks to find yours.
  const scroll = -ease(clamp((t - 1.6) / 1.2)) * 136;
  const picked = 5;
  const listTop = y + 372;
  const row = (k: number) => listTop + k * 68 + (accounts ? 0 : scroll);

  return (
    <g>
      {top(L, y, t, "Add bank account", "Link your bank to start paying")}
      <g opacity={clamp((t - 1.1) / 0.3)}>
        <text x={L} y={y + 296} className={type_.pHead} fill={INK}>
          {accounts ? "Select your account" : "Select your bank"}
        </text>
        {!accounts && (
          <g>
            <rect x={L} y={y + 312} width={W} height={44} rx={22} fill={TRACK} />
            <text x={L + 20} y={y + 339} className={type_.pBody} fill={FAINT}>
              Search bank
            </text>
          </g>
        )}
        <defs>
          <clipPath id={`${uid}-list`}>
            <rect x={L} y={listTop - 4} width={W} height={y + 720 - listTop} />
          </clipPath>
        </defs>
        <g clipPath={`url(#${uid}-list)`}>
          {(accounts ? ACCOUNTS : BANKS).map((entry, k) => {
            const ry = accounts ? y + 316 + k * 68 : row(k);
            const chosen =
              (!accounts && k === picked && t >= 3.0) || (accounts && k === 0 && t >= 4.2);
            return (
              <g key={`${accounts}${k}`}>
                <rect
                  x={L}
                  y={ry}
                  width={W}
                  height={60}
                  rx={16}
                  fill={RAISED}
                  stroke={chosen ? BLUE : "none"}
                  strokeWidth={2}
                />
                <circle cx={L + 34} cy={ry + 30} r={18} fill={TRACK} />
                <text x={L + 34} y={ry + 36} textAnchor="middle" className={type_.pStrong} fill={INK}>
                  {entry[0]}
                </text>
                <text x={L + 66} y={ry + 36} className={type_.pBody} fill={INK}>
                  {entry[1]}
                </text>
                <text x={L + W - 20} y={ry + 36} textAnchor="end" className={type_.pLabel} fill={MUTED}>
                  {accounts ? entry[2] : "›"}
                </text>
              </g>
            );
          })}
        </g>
        {touch(L + W / 2, row(picked) + 30, t, 2.9)}
        {touch(L + W / 2, y + 346, t, 4.1)}
      </g>
    </g>
  );
}

function nova({ cx, y, uid, t }: Frame): ReactNode {
  const L = cx + 20;
  const W = 320;
  // The front card is pulled down onto the button, and added.
  const pull = ease(clamp((t - 2.8) / 0.6));
  const added = t >= 3.4;
  const found = Math.min(3, [1.3, 1.6, 1.9].filter((at) => t >= at).length);

  return (
    <g>
      {top(L, y, t, "Add your cards", "Every card linked to your number")}
      <defs>
        {CARDS.map((card, k) => (
          <linearGradient key={k} id={`${uid}-c${k}`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={card.from} />
            <stop offset="1" stopColor={card.to} />
          </linearGradient>
        ))}
      </defs>
      <g opacity={clamp((t - 1.1) / 0.3)}>
        <text x={L} y={y + 296} className={type_.pHead} fill={INK}>
          Fetched from your number
        </text>
        <text x={L + W} y={y + 296} textAnchor="end" className={type_.pLabel} fill={MUTED}>
          {found} of 3
        </text>
      </g>

      {/* A wallet's stack: later cards behind, so the first sits in front. */}
      {[2, 1, 0].map((k) => {
        const card = CARDS[k];
        const k0 = ease(clamp((t - 1.3 - k * 0.3) / 0.45));
        const front = k === 0;
        if (front && added) return null;
        const top = y + 316 + (2 - k) * 30;
        // Onto the button: from the stack's centre to the button's.
        const dy = front ? pull * 192 : 0;
        const scale = front ? 1 - pull * 0.5 : 1;
        return (
          <g
            key={k}
            opacity={k0 * (front ? 1 - clamp((pull - 0.7) / 0.3) : 1)}
            transform={`translate(${L + W / 2} ${top + 100 + dy + (1 - k0) * 40}) scale(${scale})`}
          >
            <rect x={-W / 2} y={-100} width={W} height={200} rx={20} fill={`url(#${uid}-c${k})`} />
            <rect x={-W / 2 + 22} y={-74} width={40} height={30} rx={6} fill="rgba(255,255,255,0.35)" />
            <text x={W / 2 - 22} y={-52} textAnchor="end" className={type_.pStrong} fill="#ffffff">
              {card.brand}
            </text>
            <text x={-W / 2 + 22} y={40} className={type_.pHead} fill="#ffffff">
              ••••  {card.digits}
            </text>
            <text x={-W / 2 + 22} y={78} className={type_.pSmall} fill="rgba(255,255,255,0.8)">
              Thakur Sameer
            </text>
            <text x={W / 2 - 22} y={78} textAnchor="end" className={type_.pSmall} fill="rgba(255,255,255,0.8)">
              02/30
            </text>
          </g>
        );
      })}

      {/* The thumb on the front card, pulling it down onto the button. */}
      {hold(L + W / 2, y + 476 + pull * 192, t, 2.75, 3.35)}
      <g opacity={clamp((t - 2.2) / 0.3)}>
        {(() => {
          const press = 1 - 0.05 * Math.sin(Math.PI * clamp((t - 3.3) / 0.3));
          return (
            <g transform={`translate(${L + W / 2} ${y + 668}) scale(${press})`}>
              <rect x={-W / 2} y={-28} width={W} height={56} rx={28} fill={BLUE} />
              <text y={6} textAnchor="middle" className={type_.pButton} fill="#ffffff">
                {added ? "Card added" : "Pull to add"}
              </text>
            </g>
          );
        })()}
      </g>
    </g>
  );
}
