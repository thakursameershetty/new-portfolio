"use client";

import type { ReactNode } from "react";
import {
  INK,
  MUTED,
  RAISED,
  VersionWidget,
  YELLOW,
  button,
  clamp,
  type_,
  typed,
  type Frame,
} from "./widget";

// MutinyX's sign-in, before and after. Version 1 asked everyone signing up for a name, email
// and phone before an OTP; version 2 asks for a phone number, then an OTP, and only a new
// creator goes on to add a name and email.

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
      title="Sign in"
      icon={
        <>
          <rect x={-6.5} y={-10} width={13} height={20} rx={3} />
          <path d="M-2 6h4" />
        </>
      }
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

/** A rounded input: its placeholder until something's typed, and a caret while it's live. */
function field(
  x: number,
  y: number,
  w: number,
  h: number,
  placeholder: string,
  value: string,
  live: boolean,
  t: number,
): ReactNode {
  const caretX = x + 22 + value.length * 9.2;
  return (
    <g>
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={RAISED} />
      <text x={x + 22} y={y + h / 2 + 6} className={type_.field} fill={value ? INK : MUTED}>
        {value || placeholder}
      </text>
      {live && Math.floor(t * 2.5) % 2 === 0 && (
        <rect
          x={value ? caretX : x + 20}
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

/** A row of OTP cells, filled with `digits` so far. */
function otp(
  x: number,
  y: number,
  w: number,
  cells: number,
  size: number,
  round: boolean,
  digits: string,
  opacity = 1,
): ReactNode {
  const gap = (w - cells * size) / (cells - 1);
  return (
    <g opacity={opacity}>
      {Array.from({ length: cells }, (_, k) => {
        const cx = x + k * (size + gap);
        return (
          <g key={k}>
            <rect
              x={cx}
              y={y}
              width={size}
              height={size}
              rx={round ? size / 2 : 14}
              fill={RAISED}
            />
            <text
              x={cx + size / 2}
              y={y + size / 2 + 7}
              textAnchor="middle"
              className={type_.digit}
              fill={INK}
            >
              {digits[k] ?? ""}
            </text>
          </g>
        );
      })}
    </g>
  );
}

function before({ cx, cw, y, t }: Frame): ReactNode {
  const left = cx + 28;
  const inner = cw - 56;
  const name = typed("Tej", (t - 0.3) / 0.4);
  const email = typed("tej@mail.com", (t - 0.9) / 0.9);
  const phone = typed("98765 43210", (t - 2.0) / 0.8);
  const code = typed("24687", (t - 3.2) / 0.9);
  const done = t >= 4.8;

  // Version 1's phone field carried its own Send OTP button.
  const send = 96;
  return (
    <g>
      {field(left, y + 104, inner, 44, "Name", name, t < 0.85, t)}
      {field(left, y + 156, inner, 44, "Email", email, t >= 0.85 && t < 1.95, t)}
      {field(left, y + 208, inner, 44, "Phone", phone, t >= 1.95 && t < 3.0, t)}
      {button(left + inner - send - 4, y + 212, send, 36, "Send", clamp((t - 2.9) / 0.25))}
      {otp(left, y + 260, inner, 5, 44, true, code, clamp((t - 3.0) / 0.2))}
      {button(left, y + 316, inner, 48, done ? "You're in" : "Sign up", clamp((t - 4.4) / 0.3))}
    </g>
  );
}

function after({ cx, cw, y, t }: Frame): ReactNode {
  const left = cx + 28;
  const inner = cw - 56;
  const send = 124;
  const phone = typed("+91 98765 43210", (t - 0.3) / 0.9);
  const sent = t >= 1.5;
  const code = typed("246873", (t - 1.8) / 1.0);
  const done = t >= 3.3;
  const joinW = Math.min(240, inner);

  return (
    <g>
      <text x={left + 4} y={y + 118} className={type_.label} fill={MUTED}>
        Phone
      </text>
      {field(left, y + 130, inner - send - 10, 52, "", phone, t < 1.3, t)}
      {button(
        left + inner - send,
        y + 130,
        send,
        52,
        sent ? "Resend" : "Send OTP",
        clamp((t - 1.3) / 0.25),
      )}
      <g opacity={clamp((t - 1.5) / 0.25)}>
        <text x={left + 4} y={y + 214} className={type_.label} fill={MUTED}>
          OTP
        </text>
        {otp(left, y + 226, inner, 6, Math.min(52, (inner - 50) / 6), false, code)}
      </g>
      {button(
        cx + cw / 2 - joinW / 2,
        y + 308,
        joinW,
        52,
        done ? "You're in" : "Join",
        clamp((t - 3.0) / 0.3),
      )}
    </g>
  );
}
