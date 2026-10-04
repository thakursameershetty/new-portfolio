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
  type_,
  type Frame,
} from "./widget";

// Nova's home against a typical UPI app's. In the typical one, ads and offers come first, a
// grid of services after, and your balance sits behind a link and your UPI PIN, in low
// contrast. Nova opens on your balance, your card and the people you pay most. The names and
// numbers are the ones on Nova's screens.

export const BLUE = "#0171ff";

const PEOPLE = [
  ["Praneet", "#c98b5a"],
  ["Lucy", "#b8655a"],
  ["Sam", "#6f9a5a"],
  ["Cheu", "#d9b44a"],
  ["Mark", "#5a8a9a"],
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
      title="Home"
      icon={<path d="M-8 -1 0 -8 8 -1V8H-8z" />}
      tabs={["Typical UPI app", "Nova"]}
      accent={BLUE}
      length={5}
      status={{
        1: "A typical UPI app's home: ads and offers first, then a grid of services, and the balance behind a link and the UPI PIN.",
        2: "Nova's home: your balance first, then your card and the people you pay most.",
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

/** Rows of grey bars, standing in for text that's hard to read. */
function bars(x: number, y: number, widths: number[]): ReactNode {
  return widths.map((w, k) => (
    <rect key={k} x={x} y={y + k * 14} width={w} height={7} rx={3.5} fill={TRACK} />
  ));
}

function typical({ cx, cw, y, t }: Frame): ReactNode {
  const left = cx + 28;
  const inner = cw - 56;
  const mid = cx + cw / 2;

  // Tap "Check balance", enter the PIN, and only then see it.
  const tapped = t >= 2.0;
  const pin = Math.round(6 * clamp((t - 2.5) / 0.9));
  const shown = t >= 3.7;
  const sheet = ease(clamp((t - 2.0) / 0.35));

  return (
    <g>
      {["Ad", "Offer"].map((tag, k) => (
        <g key={tag} opacity={clamp((t - 0.3 - k * 0.2) / 0.35)}>
          <rect x={left} y={y + 100 + k * 72} width={inner} height={62} rx={20} fill={RAISED} />
          <rect x={left + 14} y={y + 114 + k * 72} width={42} height={20} rx={10} fill={TRACK} />
          <text
            x={left + 35}
            y={y + 128 + k * 72}
            textAnchor="middle"
            className={type_.tag}
            fill={MUTED}
          >
            {tag}
          </text>
          {bars(left + 70, y + 116 + k * 72, [inner * 0.5, inner * 0.32])}
        </g>
      ))}

      {/* A grid of services, before anything of yours. */}
      <g opacity={clamp((t - 0.8) / 0.4)}>
        {Array.from({ length: 10 }, (_, k) => {
          const col = k % 5;
          const row = Math.floor(k / 5);
          const x = left + 22 + col * ((inner - 44) / 4);
          return (
            <g key={k}>
              <circle cx={x} cy={y + 262 + row * 46} r={14} fill={TRACK} />
              <rect x={x - 14} y={y + 281 + row * 46} width={28} height={5} rx={2.5} fill={TRACK} />
            </g>
          );
        })}
      </g>

      <g opacity={clamp((t - 1.2) / 0.4)}>
        <text x={left + 4} y={y + 364} className={type_.label} fill={MUTED}>
          Check balance ›
        </text>
        {t > 1.7 && t < 2.2 && (
          <circle
            cx={left + 50}
            cy={y + 359}
            r={10 + 8 * clamp((t - 1.7) / 0.5)}
            fill="none"
            stroke={INK}
            strokeWidth={2}
            opacity={1 - clamp((t - 1.7) / 0.5)}
          />
        )}
      </g>

      {/* The PIN sheet, then the balance at last. */}
      {tapped && (
        <g opacity={sheet} transform={`translate(0 ${(1 - sheet) * 24})`}>
          <rect x={left} y={y + 100} width={inner} height={276} rx={24} fill={RAISED} />
          {shown ? (
            <>
              <text x={mid} y={y + 210} textAnchor="middle" className={type_.label} fill={MUTED}>
                Your balance
              </text>
              <text x={mid} y={y + 256} textAnchor="middle" className={type_.balance} fill={INK}>
                ₹33,500.00
              </text>
            </>
          ) : (
            <>
              <text x={mid} y={y + 196} textAnchor="middle" className={type_.name} fill={INK}>
                Enter UPI PIN
              </text>
              {Array.from({ length: 6 }, (_, k) => (
                <circle
                  key={k}
                  cx={mid + (k - 2.5) * 30}
                  cy={y + 246}
                  r={8}
                  fill={k < pin ? INK : "none"}
                  stroke={MUTED}
                  strokeWidth={2}
                />
              ))}
            </>
          )}
        </g>
      )}
    </g>
  );
}

function nova({ cx, cw, y, uid, t }: Frame): ReactNode {
  const left = cx + 28;
  const inner = cw - 56;
  const mid = cx + cw / 2;
  const cardW = Math.min(300, inner - 24);
  const step = (inner - 8) / PEOPLE.length;

  return (
    <g>
      <defs>
        <linearGradient id={`${uid}-card`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#e9edf2" />
          <stop offset="1" stopColor="#b9c4d2" />
        </linearGradient>
      </defs>
      <g opacity={clamp((t - 0.3) / 0.4)}>
        <text x={mid} y={y + 118} textAnchor="middle" className={type_.label} fill={MUTED}>
          Total balance
        </text>
        <text x={mid} y={y + 162} textAnchor="middle" className={type_.balance} fill={INK}>
          ₹33,500.00
        </text>
      </g>

      <g
        opacity={clamp((t - 0.7) / 0.4)}
        transform={`translate(0 ${(1 - ease(clamp((t - 0.7) / 0.5))) * 14})`}
      >
        <rect x={mid - cardW / 2} y={y + 180} width={cardW} height={78} rx={18} fill={`url(#${uid}-card)`} />
        <text x={mid - cardW / 2 + 18} y={y + 230} className={type_.field} fill="#2a3442">
          **** **** **** 3507
        </text>
        <text x={mid + cardW / 2 - 18} y={y + 230} textAnchor="end" className={type_.tag} fill="#2a3442">
          02/30
        </text>
      </g>

      <g opacity={clamp((t - 1.2) / 0.4)}>
        <text x={left + 4} y={y + 292} className={type_.name} fill={INK}>
          Quick send
        </text>
        {/* Add someone: the one thing here you act on. */}
        <circle cx={left + step / 2} cy={y + 326} r={18} fill="none" stroke={BLUE} strokeWidth={2} />
        <path
          d={`M${left + step / 2 - 6} ${y + 326}h12M${left + step / 2} ${y + 320}v12`}
          stroke={BLUE}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        {PEOPLE.slice(0, 4).map(([name, tint], k) => {
          const x = left + step * (k + 1.5);
          return (
            <g key={name} opacity={clamp((t - 1.4 - k * 0.12) / 0.3)}>
              <circle cx={x} cy={y + 326} r={18} fill={tint} />
              <text x={x} y={y + 362} textAnchor="middle" className={type_.tag} fill={MUTED}>
                {name}
              </text>
            </g>
          );
        })}
        <text x={left + step / 2} y={y + 362} textAnchor="middle" className={type_.tag} fill={MUTED}>
          Add
        </text>
      </g>
    </g>
  );
}
