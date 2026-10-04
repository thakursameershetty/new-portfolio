"use client";

import type { ReactNode } from "react";
import type { MaterialIconName } from "../icons/MaterialIcon";
import { ease } from "./shared";
import {
  INK,
  MUTED,
  RAISED,
  VersionWidget,
  clamp,
  glyph,
  touch,
  type_,
  type Frame,
} from "./widget";

// Nova's home against a typical UPI app's, on a phone at real sizes. In the typical one, an ad
// and an offer come first, a grid of services after, and your balance sits behind a link and
// your UPI PIN, in low contrast. Nova opens on your balance, your card, the people you pay
// most and your latest payments. The names and numbers are the ones on Nova's screens.

export const BLUE = "#0171ff";

// Low-contrast labels, as on the apps the brief describes: readable up close, not outdoors.
const FAINT = "rgba(244, 236, 230, 0.36)";
const SHEET = "#24221f";
const GREEN = "#4ade80";
const RED = "#f87171";

// A typical UPI home's services: each a different colour, the visual noise of the brief.
const SERVICES: [string, MaterialIconName, string][] = [
  ["To mobile", "phone", "#3b82f6"],
  ["To bank", "bank", "#22c55e"],
  ["Scan & pay", "scan", "#a855f7"],
  ["Recharge", "sim", "#f97316"],
  ["Electricity", "bolt", "#eab308"],
  ["Insurance", "shield", "#06b6d4"],
  ["Loans", "payments", "#ec4899"],
  ["Rewards", "redeem", "#6366f1"],
];

const PEOPLE = [
  ["Praneet", "#c98b5a"],
  ["Lucy", "#b8655a"],
  ["Sam", "#6f9a5a"],
  ["Cheu", "#d9b44a"],
] as const;

// Latest transactions, as on Nova's home screen.
const PAYMENTS = [
  ["Lucy", "+₹199.00", GREEN, "#b8655a"],
  ["Sam", "−₹305.00", RED, "#6f9a5a"],
  ["Apple Music", "−₹199.00", RED, "#fa2d48"],
] as const;

export function NovaHome({
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
      title="Home"
      tabs={["Typical UPI app", "Nova"]}
      accent={BLUE}
      length={5.4}
      status={{
        1: "A typical UPI app's home: an ad and an offer first, then a grid of services, and the balance behind a link and the UPI PIN.",
        2: "Nova's home: your balance first, then your card, the people you pay most and your latest payments.",
      }}
      stats={{
        1: [
          ["Ads", "on top", false],
          ["Taps", "to your balance", false],
          ["Low", "contrast", false],
        ],
        2: [
          ["0", "ads", true],
          ["Top", "your balance", true],
          ["1", "glance", true],
        ],
      }}
      draw={(version, frame) => (version === 1 ? typical(frame) : nova(frame))}
    />
  );
}


function typical({ cx, y, uid, t }: Frame): ReactNode {
  const L = cx + 20;
  const W = 320;
  const mid = cx + 180;

  // Tap "Check balance", enter the PIN, and only then see it.
  const sheet = ease(clamp((t - 2.1) / 0.4));
  const pin = Math.round(6 * clamp((t - 2.7) / 1.0));
  const shown = t >= 4.0;

  return (
    <g>
      {/* The greeting, and the scanner. */}
      <g opacity={clamp((t - 0.1) / 0.3)}>
        <circle cx={L + 20} cy={y + 88} r={20} fill="#3b3a5c" />
        <text x={L + 20} y={y + 94} textAnchor="middle" className={type_.pStrong} fill={INK}>
          T
        </text>
        <text x={L + 52} y={y + 84} className={type_.pStrong} fill={INK}>
          Hi, Thakur
        </text>
        <text x={L + 52} y={y + 102} className={type_.pSmall} fill={FAINT}>
          thakur@upi
        </text>
        <circle cx={L + W - 20} cy={y + 88} r={20} fill={RAISED} />
        {glyph("scan", L + W - 20, y + 88, 20, INK)}
      </g>

      {/* A loud ad first: the biggest thing on the screen isn't yours. */}
      <g opacity={clamp((t - 0.3) / 0.35)}>
        <defs>
          <linearGradient id={`${uid}-ad`} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#6d28d9" />
            <stop offset="1" stopColor="#f97316" />
          </linearGradient>
        </defs>
        <rect x={L} y={y + 124} width={W} height={150} rx={20} fill={`url(#${uid}-ad)`} />
        <rect x={L + 16} y={y + 140} width={34} height={20} rx={10} fill="rgba(255,255,255,0.25)" />
        <text x={L + 33} y={y + 154} textAnchor="middle" className={type_.pSmall} fill="#ffffff">
          Ad
        </text>
        <text x={L + 16} y={y + 196} className={type_.pHead} fill="#ffffff">
          Insurance from ₹1/day
        </text>
        <text x={L + 16} y={y + 218} className={type_.pLabel} fill="rgba(255,255,255,0.8)">
          Cover for your whole family
        </text>
        <rect x={L + 16} y={y + 230} width={104} height={32} rx={16} fill="#ffffff" />
        <text x={L + 68} y={y + 251} textAnchor="middle" className={type_.pLabel} fill="#3b0764">
          Buy now
        </text>
      </g>

      {/* Then an offer strip. */}
      <g opacity={clamp((t - 0.5) / 0.35)}>
        <rect x={L} y={y + 288} width={W} height={48} rx={14} fill="#3a2a10" />
        <text x={L + 16} y={y + 317} className={type_.pLabel} fill="#f5b84a">
          Cashback up to ₹100 on recharge ›
        </text>
      </g>

      {/* Then services, each in its own colour, labelled in low-contrast grey. */}
      <g opacity={clamp((t - 0.8) / 0.4)}>
        <text x={L} y={y + 374} className={type_.pStrong} fill={MUTED}>
          Transfer and pay
        </text>
        {SERVICES.map(([label, icon, colour], k) => {
          const col = k % 4;
          const row = Math.floor(k / 4);
          const x = L + (W / 4) * (col + 0.5);
          const cy = y + 416 + row * 86;
          return (
            <g key={label}>
              <circle cx={x} cy={cy} r={26} fill={colour} opacity={0.22} />
              {glyph(icon, x, cy, 24, colour)}
              <text x={x} y={cy + 46} textAnchor="middle" className={type_.pSmall} fill={FAINT}>
                {label}
              </text>
            </g>
          );
        })}
      </g>

      {/* And the balance, last, behind a link. */}
      <g opacity={clamp((t - 1.2) / 0.4)}>
        <rect x={L} y={y + 600} width={W} height={56} rx={16} fill={RAISED} />
        {glyph("bank", L + 30, y + 628, 22, FAINT)}
        <text x={L + 56} y={y + 634} className={type_.pBody} fill={FAINT}>
          Check balance
        </text>
        <text x={L + W - 20} y={y + 634} textAnchor="end" className={type_.pBody} fill={FAINT}>
          ›
        </text>
        {touch(L + 110, y + 628, t, 1.7)}
      </g>

      {/* The PIN sheet, with its keypad, then the balance at last. */}
      {t >= 2.1 && (
        <g transform={`translate(0 ${(1 - sheet) * 420})`}>
          <rect x={cx} y={y + 290} width={360} height={470} rx={28} fill={SHEET} />
          <rect x={mid - 20} y={y + 300} width={40} height={5} rx={2.5} fill={MUTED} />
          {shown ? (
            <>
              <text x={mid} y={y + 372} textAnchor="middle" className={type_.pLabel} fill={MUTED}>
                Your balance
              </text>
              <text x={mid} y={y + 420} textAnchor="middle" className={type_.pBalance} fill={INK}>
                ₹33,500.00
              </text>
              <text x={mid} y={y + 448} textAnchor="middle" className={type_.pSmall} fill={FAINT}>
                State Bank of India ••••4521
              </text>
            </>
          ) : (
            <>
              <text x={mid} y={y + 350} textAnchor="middle" className={type_.pHead} fill={INK}>
                Enter UPI PIN
              </text>
              <text x={mid} y={y + 374} textAnchor="middle" className={type_.pLabel} fill={MUTED}>
                State Bank of India ••••4521
              </text>
              {Array.from({ length: 6 }, (_, k) => (
                <circle
                  key={k}
                  cx={mid + (k - 2.5) * 36}
                  cy={y + 418}
                  r={9}
                  fill={k < pin ? INK : "none"}
                  stroke={MUTED}
                  strokeWidth={2}
                />
              ))}
              {["1", "2", "3", "4", "5", "6", "7", "8", "9", "", "0", "⌫"].map((key, k) => {
                const col = k % 3;
                const row = Math.floor(k / 3);
                const kx = cx + 20 + col * 110;
                const ky = y + 456 + row * 62;
                return key ? (
                  <g key={k}>
                    <rect x={kx} y={ky} width={100} height={52} rx={14} fill={RAISED} />
                    <text x={kx + 50} y={ky + 34} textAnchor="middle" className={type_.pDigit} fill={INK}>
                      {key}
                    </text>
                  </g>
                ) : null;
              })}
            </>
          )}
        </g>
      )}
    </g>
  );
}

function nova({ cx, y, uid, t }: Frame): ReactNode {
  const L = cx + 20;
  const W = 320;
  const mid = cx + 180;
  const rise = (at: number) => ({
    opacity: clamp((t - at) / 0.4),
    transform: `translate(0 ${(1 - ease(clamp((t - at) / 0.5))) * 12})`,
  });

  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-card`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#eef1f5" />
          <stop offset="1" stopColor="#c3ccd8" />
        </linearGradient>
      </defs>

      {/* The greeting. */}
      <g {...rise(0.1)}>
        <circle cx={L + 22} cy={y + 92} r={22} fill="#c98b5a" />
        <text x={L + 22} y={y + 98} textAnchor="middle" className={type_.pStrong} fill="#ffffff">
          T
        </text>
        <text x={L + 56} y={y + 86} className={type_.pSmall} fill={MUTED}>
          Good Morning
        </text>
        <text x={L + 56} y={y + 108} className={type_.pHead} fill={INK}>
          Thakur Sameer
        </text>
      </g>

      {/* Your balance, and your card under it: the first thing you see. */}
      <g {...rise(0.3)}>
        <rect x={L} y={y + 136} width={W} height={272} rx={28} fill={RAISED} />
        <text x={mid} y={y + 170} textAnchor="middle" className={type_.pLabel} fill={MUTED}>
          Total balance
        </text>
        <text x={mid} y={y + 212} textAnchor="middle" className={type_.pBalance} fill={INK}>
          ₹33,500.00
        </text>
        <rect x={L + 20} y={y + 232} width={W - 40} height={160} rx={18} fill={`url(#${uid}-card)`} />
        <text x={L + 40} y={y + 336} className={type_.pStrong} fill="#2a3442">
          ****  ****  ****  3507
        </text>
        <text x={L + 40} y={y + 372} className={type_.pSmall} fill="#2a3442">
          Thakur Sameer
        </text>
        <text x={L + W - 40} y={y + 372} textAnchor="end" className={type_.pSmall} fill="#2a3442">
          02/30
        </text>
      </g>

      {/* The people you pay most. */}
      <g {...rise(0.9)}>
        <rect x={L} y={y + 424} width={W} height={132} rx={24} fill={RAISED} />
        <text x={L + 20} y={y + 456} className={type_.pStrong} fill={INK}>
          Quick send
        </text>
        <text x={L + W - 20} y={y + 456} textAnchor="end" className={type_.pLabel} fill={BLUE}>
          See all ›
        </text>
        <circle cx={L + 44} cy={y + 500} r={24} fill="none" stroke={BLUE} strokeWidth={2} />
        <path
          d={`M${L + 36} ${y + 500}h16M${L + 44} ${y + 492}v16`}
          stroke={BLUE}
          strokeWidth={2.4}
          strokeLinecap="round"
        />
        <text x={L + 44} y={y + 540} textAnchor="middle" className={type_.pSmall} fill={MUTED}>
          Add
        </text>
        {PEOPLE.map(([name, tint], k) => {
          const x = L + 44 + (k + 1) * 58;
          return (
            <g key={name}>
              <circle cx={x} cy={y + 500} r={24} fill={tint} />
              <text x={x} y={y + 506} textAnchor="middle" className={type_.pStrong} fill="#ffffff">
                {name[0]}
              </text>
              <text x={x} y={y + 540} textAnchor="middle" className={type_.pSmall} fill={MUTED}>
                {name}
              </text>
            </g>
          );
        })}
      </g>

      {/* And your latest payments. */}
      <g {...rise(1.4)}>
        <text x={L} y={y + 590} className={type_.pStrong} fill={INK}>
          Latest transactions
        </text>
        {PAYMENTS.map(([name, amount, colour, tint], k) => {
          const w = (W - 16) / 3;
          const x = L + k * (w + 8);
          return (
            <g key={name}>
              <rect x={x} y={y + 604} width={w} height={100} rx={18} fill={RAISED} />
              <circle cx={x + w / 2} cy={y + 634} r={16} fill={tint} />
              <text x={x + w / 2} y={y + 668} textAnchor="middle" className={type_.pSmall} fill={INK}>
                {name}
              </text>
              <text x={x + w / 2} y={y + 688} textAnchor="middle" className={type_.pLabel} fill={colour}>
                {amount}
              </text>
            </g>
          );
        })}
      </g>
    </g>
  );
}
