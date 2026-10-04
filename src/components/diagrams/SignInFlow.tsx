"use client";

import type { ReactNode } from "react";
import {
  DARK,
  INK,
  MUTED,
  RAISED,
  TRACK,
  VersionWidget,
  YELLOW,
  clamp,
  touch,
  type_,
  typed,
  type Frame,
} from "./widget";

// MutinyX's sign-in, before and after, on a phone at real sizes, after the two versions'
// screens. Version 1 asked everyone signing up for a name, email and phone before an OTP;
// version 2 asks for a phone number, then an OTP, and only a new creator goes on to add a
// name and email.

export function SignInFlow({
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
      title="Sign in"
      length={5.5}
      status={{
        1: "Before: a name, an email and a phone number, then an OTP, to sign up.",
        2: "After: a phone number, then an OTP. Only a new creator adds a name and email.",
      }}
      stats={{
        1: [
          ["3", "fields first", false],
          ["4", "steps", false],
          ["2", "ways in", false],
        ],
        2: [
          ["1", "field first", true],
          ["2", "steps if back", true],
          ["1", "way in", true],
        ],
      }}
      draw={(version, frame) => (version === 1 ? before(frame) : after(frame))}
    />
  );
}

/** A text field: its placeholder until something's typed, and a caret while it's live. */
function field(
  x: number,
  y: number,
  w: number,
  h: number,
  rx: number,
  placeholder: string,
  value: string,
  live: boolean,
  t: number,
): ReactNode {
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={rx} fill={TRACK} />
      <text x={x + 20} y={y + h / 2 + 6} className={type_.pBody} fill={value ? INK : MUTED}>
        {value || placeholder}
      </text>
      {live && Math.floor(t * 2.5) % 2 === 0 && (
        <rect
          x={value ? x + 22 + value.length * 8.6 : x + 18}
          y={y + h / 2 - 11}
          width={2}
          height={22}
          rx={1}
          fill={YELLOW}
        />
      )}
    </g>
  );
}

/** A yellow button that dips when `pressed` (0 to 1 and back). */
function press(
  x: number,
  y: number,
  w: number,
  h: number,
  rx: number,
  label: string,
  pressed: number,
): ReactNode {
  const s = 1 - 0.05 * Math.sin(Math.PI * clamp(pressed));
  return (
    <g transform={`translate(${x + w / 2} ${y + h / 2}) scale(${s})`}>
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={rx} fill={YELLOW} />
      <text y={6} textAnchor="middle" className={type_.pButton} fill={DARK}>
        {label}
      </text>
    </g>
  );
}

function before({ cx, y, t }: Frame): ReactNode {
  const L = cx + 20;
  const W = 320;
  const mid = cx + 180;
  const name = typed("Tej", (t - 0.3) / 0.4);
  const email = typed("tej@mail.com", (t - 0.9) / 0.9);
  const phone = typed("98765 43210", (t - 2.0) / 0.8);
  const code = typed("24687", (t - 3.2) / 0.9);
  const sent = t >= 3.0;
  const done = t >= 4.8;

  return (
    <g>
      <text x={L} y={y + 96} className={type_.pStrong} fill={INK}>
        MUTINY TALENT
      </text>
      <text x={L} y={y + 186} className={type_.pTitle} fill={INK}>
        Join the
      </text>
      <text x={L} y={y + 220} className={type_.pTitle} fill={INK}>
        movement
      </text>

      {/* Everything, for everyone, before the OTP. */}
      <rect x={L} y={y + 244} width={W} height={344} rx={28} fill={RAISED} />
      {field(L + 16, y + 262, W - 32, 52, 26, "Name", name, t < 0.85, t)}
      {field(L + 16, y + 326, W - 32, 52, 26, "Email", email, t >= 0.85 && t < 1.95, t)}
      {field(L + 16, y + 390, W - 32, 52, 26, "Phone", phone, t >= 1.95 && t < 3.0, t)}
      {press(L + W - 16 - 104, y + 396, 98, 40, 20, "Send OTP", (t - 2.9) / 0.25)}
      {touch(L + W - 16 - 55, y + 416, t, 2.9)}
      {/* The OTP: five circles and a check. */}
      <g opacity={clamp((t - 3.0) / 0.25)}>
        {Array.from({ length: 5 }, (_, k) => (
          <g key={k}>
            <circle cx={L + 46 + k * 46} cy={y + 482} r={20} fill={TRACK} />
            <text x={L + 46 + k * 46} y={y + 489} textAnchor="middle" className={type_.pDigit} fill={INK}>
              {sent ? (code[k] ?? "") : ""}
            </text>
          </g>
        ))}
        <circle cx={L + 46 + 5 * 46} cy={y + 482} r={20} fill={YELLOW} />
        <path
          d={`M${L + 270} ${y + 482}l5 5 9 -10`}
          fill="none"
          stroke={DARK}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
      {press(L + 16, y + 520, W - 32, 52, 26, done ? "You're in" : "Sign up", (t - 4.4) / 0.3)}
      {touch(mid, y + 546, t, 4.4)}

      {/* And a second door, for those who already had an account. */}
      <text x={mid} y={y + 624} textAnchor="middle" className={type_.pSmall} fill={MUTED}>
        OR CONTINUE WITH
      </text>
      {["Google", "Apple"].map((label, k) => (
        <g key={label}>
          <rect x={L + k * 166} y={y + 640} width={154} height={48} rx={24} fill={RAISED} />
          <text x={L + k * 166 + 77} y={y + 670} textAnchor="middle" className={type_.pStrong} fill={INK}>
            {label}
          </text>
        </g>
      ))}
      <text x={mid} y={y + 712} textAnchor="middle" className={type_.pSmall} fill={MUTED}>
        Already have an account?{" "}
        <tspan fill={YELLOW}>Log in</tspan>
      </text>
    </g>
  );
}

function after({ cx, y, t }: Frame): ReactNode {
  const L = cx + 20;
  const W = 320;
  const mid = cx + 180;
  const send = 112;
  const phone = typed("+91 98765 43210", (t - 0.3) / 0.9);
  const sent = t >= 1.5;
  const code = typed("246873", (t - 1.8) / 1.0);
  const done = t >= 3.3;
  const box = 46;
  const gap = (W - box * 6) / 5;

  return (
    <g>
      <text x={L} y={y + 96} className={type_.pStrong} fill={INK}>
        Mutiny<tspan fill={YELLOW}>X</tspan>
      </text>
      <text x={mid} y={y + 196} textAnchor="middle" className={type_.pTitle} fill={INK}>
        Join the movement
      </text>

      {/* One field, for everyone. */}
      <text x={L + 4} y={y + 262} className={type_.pLabel} fill={MUTED}>
        Phone No.
      </text>
      {field(L, y + 274, W - send - 10, 56, 16, "", phone, t < 1.3, t)}
      {press(L + W - send, y + 274, send, 56, 16, sent ? "Resend" : "Send OTP", (t - 1.3) / 0.25)}
      {touch(L + W - send / 2, y + 302, t, 1.3)}

      {/* Then the OTP. */}
      <g opacity={clamp((t - 1.5) / 0.25)}>
        <text x={L + 4} y={y + 370} className={type_.pLabel} fill={MUTED}>
          OTP
        </text>
        {Array.from({ length: 6 }, (_, k) => {
          const x = L + k * (box + gap);
          return (
            <g key={k}>
              <rect x={x} y={y + 382} width={box} height={56} rx={12} fill={TRACK} />
              <text x={x + box / 2} y={y + 418} textAnchor="middle" className={type_.pDigit} fill={INK}>
                {code[k] ?? ""}
              </text>
            </g>
          );
        })}
      </g>
      {press(mid - 110, y + 474, 220, 52, 26, done ? "You're in" : "Join", (t - 3.0) / 0.3)}
      {touch(mid, y + 500, t, 3.0)}
    </g>
  );
}
