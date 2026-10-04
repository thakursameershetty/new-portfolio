"use client";

import type { ReactNode } from "react";
import { Facehash } from "facehash";
import { ease } from "./shared";
import {
  INK,
  MUTED,
  RAISED,
  TRACK,
  VersionWidget,
  button,
  clamp,
  glyph,
  type_,
  typed,
  type Frame,
} from "./widget";

// Joining in on a usual fan site, against Rao Bahadur's. On a usual one, liking a theory sends
// you to make an account (an email, a password twice, then your inbox) and the like waits. On
// Rao Bahadur, the first like asks only for a nickname, and a face is drawn from it as you type
// (with FaceHash, as on the site), then the like lands.

const GOLD = "#f5c66d";
const NIGHT = "#010a09";
const NICK = "Peacock";

export function RaoJoin({
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
      title="Join in"
      icon={glyph("favorite", 0, 0, 20, INK)}
      tabs={["Usual fan site", "Rao Bahadur"]}
      accent={GOLD}
      length={5}
      status={{
        1: "A usual fan site: liking a theory sends you to make an account with an email and a password, then to your inbox, and the like waits.",
        2: "Rao Bahadur: the first like asks only for a nickname, a face is drawn from it as you type, and the like lands.",
      }}
      stats={{
        1: [
          ["3", "fields first", false],
          ["1", "inbox to check", false],
          ["0", "likes yet", false],
        ],
        2: [
          ["1", "field, once", true],
          ["0", "passwords", true],
          ["Like", "lands at once", true],
        ],
      }}
      draw={(version, frame) => (version === 1 ? usual(frame) : rao(frame))}
    />
  );
}

/** The theory being liked, its heart filled once the like lands. */
function theory(left: number, inner: number, y: number, liked: number): ReactNode {
  const pop = 1 + 0.35 * Math.sin(Math.PI * clamp(liked * 2));
  return (
    <g>
      <rect x={left} y={y + 100} width={inner} height={104} rx={22} fill={RAISED} />
      <text x={left + 20} y={y + 132} className={type_.tag} fill={MUTED}>
        Theory · Hidden details
      </text>
      <text x={left + 20} y={y + 162} className={type_.name} fill={INK}>
        The insect stands for doubt
      </text>
      <g transform={`translate(${left + 32} ${y + 184}) scale(${liked > 0 ? pop : 1})`}>
        {glyph(liked > 0 ? "favoriteFill" : "favorite", 0, 0, 22, liked > 0 ? GOLD : INK)}
      </g>
      <text x={left + 50} y={y + 190} className={type_.field} fill={INK}>
        {liked > 0 ? "129" : "128"}
      </text>
    </g>
  );
}

function tap(x: number, y: number, t: number, at: number): ReactNode {
  const k = clamp((t - at) / 0.45);
  if (k <= 0 || k >= 1) return null;
  return (
    <circle cx={x} cy={y} r={10 + 10 * k} fill="none" stroke={INK} strokeWidth={2} opacity={1 - k} />
  );
}

/** A rounded input with its label, or its value once typed. */
function field(x: number, y: number, w: number, label: string, value: string): ReactNode {
  return (
    <g>
      <rect x={x} y={y} width={w} height={40} rx={20} fill={TRACK} />
      <text x={x + 18} y={y + 26} className={type_.field} fill={value ? INK : MUTED}>
        {value || label}
      </text>
    </g>
  );
}

function usual({ cx, cw, y, t }: Frame): ReactNode {
  const left = cx + 28;
  const inner = cw - 56;
  const sheet = ease(clamp((t - 0.9) / 0.4));
  const top = y + 140;

  return (
    <g>
      {theory(left, inner, y, 0)}
      {tap(left + 32, y + 184, t, 0.5)}
      {t >= 0.9 && (
        <g transform={`translate(0 ${(1 - sheet) * 60})`} opacity={sheet}>
          <rect x={left - 8} y={top} width={inner + 16} height={236} rx={26} fill="#24221f" />
          <text x={left + 12} y={top + 34} className={type_.name} fill={INK}>
            {t >= 3.8 ? "Check your inbox" : "Create an account"}
          </text>
          {t < 3.8 ? (
            <>
              {field(left + 8, top + 50, inner - 16, "Email", typed("fan@mail.com", (t - 1.3) / 0.7))}
              {field(left + 8, top + 98, inner - 16, "Password", typed("••••••••", (t - 2.1) / 0.5))}
              {field(left + 8, top + 146, inner - 16, "Confirm password", typed("••••••••", (t - 2.7) / 0.5))}
              {button(left + 8, top + 192, inner - 16, 36, "Sign up", clamp((t - 3.3) / 0.3), GOLD, NIGHT)}
            </>
          ) : (
            <text x={left + 12} y={top + 70} className={type_.label} fill={MUTED}>
              Verify your email, then come back to like it.
            </text>
          )}
        </g>
      )}
    </g>
  );
}

function rao({ cx, cw, y, t }: Frame): ReactNode {
  const left = cx + 28;
  const inner = cw - 56;
  // The sheet comes up on the first like and goes once there's a name.
  const open = ease(clamp((t - 0.9) / 0.4)) * (1 - ease(clamp((t - 3.1) / 0.4)));
  const nick = typed(NICK, (t - 1.4) / 0.9);
  const liked = clamp((t - 3.4) / 0.5);
  const top = y + 224;
  const face = 56;

  return (
    <g>
      {theory(left, inner, y, liked)}
      {tap(left + 32, y + 184, t, 0.5)}
      {open > 0.01 && (
        <g transform={`translate(0 ${(1 - open) * 60})`} opacity={open}>
          <rect x={left - 8} y={top} width={inner + 16} height={152} rx={26} fill="#24221f" />
          <text x={left + 12} y={top + 32} className={type_.name} fill={INK}>
            Identify yourself
          </text>
          {nick ? (
            <foreignObject x={left + 8} y={top + 48} width={face} height={face}>
              <Facehash
                name={nick}
                size={face}
                colors={["#008288", GOLD, "#d6812e", "#123432"]}
                intensity3d="subtle"
                interactive={false}
                style={{ borderRadius: "50%", overflow: "hidden" }}
              />
            </foreignObject>
          ) : (
            <circle cx={left + 8 + face / 2} cy={top + 48 + face / 2} r={face / 2} fill={TRACK} />
          )}
          {field(left + 76, top + 56, inner - 84, "Your nickname", nick)}
          {button(left + 8, top + 110, inner - 16, 34, "Continue", clamp((t - 2.7) / 0.3), GOLD, NIGHT)}
        </g>
      )}
    </g>
  );
}
