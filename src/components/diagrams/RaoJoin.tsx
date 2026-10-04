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
  clamp,
  glyph,
  touch,
  type_,
  typed,
  type Frame,
} from "./widget";

// Joining in on a usual fan site, against Rao Bahadur's, on a phone at real sizes. On a usual
// one, liking a theory sends you to make an account (an email, a password twice, then your
// inbox) and the like waits. On Rao Bahadur, the first like asks only for a nickname, and a
// face is drawn from it as you type (with FaceHash, as on the site), then the like lands.

const GOLD = "#f5c66d";
const PEACOCK = "#008288";
const NIGHT = "#010a09";
const SHEET = "#24221f";
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
      phone
      title="Join in"
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

/** The theories board, and the theory being liked (its heart filled once the like lands). */
function board(cx: number, y: number, liked: number): ReactNode {
  const L = cx + 20;
  const W = 320;
  const pop = 1 + 0.35 * Math.sin(Math.PI * clamp(liked * 2));
  return (
    <g>
      <text x={L} y={y + 92} className={type_.pHead} fill={GOLD} letterSpacing="0.08em">
        RAO BAHADUR
      </text>
      <text x={L + W} y={y + 92} textAnchor="end" className={type_.pHead} fill={INK}>
        ≡
      </text>
      <text x={L} y={y + 140} className={type_.pTitle} fill={INK}>
        Fan theories
      </text>
      {["Trending", "New", "Hidden details"].map((tab, k) => {
        const x = L + [0, 96, 166][k];
        const w = [88, 62, 126][k];
        return (
          <g key={tab}>
            <rect x={x} y={y + 160} width={w} height={34} rx={17} fill={k === 0 ? GOLD : RAISED} />
            <text x={x + w / 2} y={y + 182} textAnchor="middle" className={type_.pLabel} fill={k === 0 ? NIGHT : MUTED}>
              {tab}
            </text>
          </g>
        );
      })}

      <rect x={L} y={y + 214} width={W} height={184} rx={22} fill={RAISED} />
      <rect x={L + 20} y={y + 234} width={112} height={26} rx={13} fill={PEACOCK} />
      <text x={L + 76} y={y + 252} textAnchor="middle" className={type_.pSmall} fill="#f4ead5">
        Hidden details
      </text>
      <text x={L + 20} y={y + 296} className={type_.pHead} fill={INK}>
        The insect stands for doubt
      </text>
      <text x={L + 20} y={y + 322} className={type_.pLabel} fill={MUTED}>
        A theory from the board
      </text>
      <g transform={`translate(${L + 34} ${y + 364}) scale(${liked > 0 ? pop : 1})`}>
        {glyph(liked > 0 ? "favoriteFill" : "favorite", 0, 0, 26, liked > 0 ? GOLD : INK)}
      </g>
      <text x={L + 56} y={y + 370} className={type_.pStrong} fill={INK}>
        {liked > 0 ? "129" : "128"}
      </text>
      {glyph("comment", L + 130, y + 365, 24, INK)}
      <text x={L + 150} y={y + 370} className={type_.pLabel} fill={MUTED}>
        Reply
      </text>
    </g>
  );
}


/** A field with its label as a placeholder, or its value once typed. */
function field(x: number, y: number, w: number, label: string, value: string): ReactNode {
  return (
    <g>
      <rect x={x} y={y} width={w} height={52} rx={26} fill={TRACK} />
      <text x={x + 22} y={y + 32} className={type_.pBody} fill={value ? INK : MUTED}>
        {value || label}
      </text>
    </g>
  );
}

/** A gold button that dips when `pressed` (0 to 1 and back). */
function goldButton(x: number, y: number, w: number, label: string, pressed: number): ReactNode {
  const s = 1 - 0.05 * Math.sin(Math.PI * clamp(pressed));
  return (
    <g transform={`translate(${x + w / 2} ${y + 26}) scale(${s})`}>
      <rect x={-w / 2} y={-26} width={w} height={52} rx={26} fill={GOLD} />
      <text y={6} textAnchor="middle" className={type_.pButton} fill={NIGHT}>
        {label}
      </text>
    </g>
  );
}

function usual({ cx, y, t }: Frame): ReactNode {
  const L = cx + 20;
  const W = 320;
  const sheet = ease(clamp((t - 0.9) / 0.4));
  const top = y + 336;
  const inbox = t >= 3.8;

  return (
    <g>
      {board(cx, y, 0)}
      {touch(L + 34, y + 364, t, 0.5)}
      {t >= 0.9 && (
        <g transform={`translate(0 ${(1 - sheet) * 420})`}>
          <rect x={cx} y={top} width={360} height={420} rx={28} fill={SHEET} />
          <rect x={cx + 160} y={top + 12} width={40} height={5} rx={2.5} fill={MUTED} />
          <text x={L} y={top + 56} className={type_.pHead} fill={INK}>
            {inbox ? "Check your inbox" : "Create an account"}
          </text>
          {inbox ? (
            <>
              <text x={L} y={top + 86} className={type_.pBody} fill={MUTED}>
                Verify your email, then come back
              </text>
              <text x={L} y={top + 110} className={type_.pBody} fill={MUTED}>
                to like it.
              </text>
            </>
          ) : (
            <>
              <text x={L} y={top + 80} className={type_.pLabel} fill={MUTED}>
                to like, reply or post a theory
              </text>
              {field(L, top + 100, W, "Email", typed("fan@mail.com", (t - 1.3) / 0.7))}
              {field(L, top + 164, W, "Password", typed("••••••••", (t - 2.1) / 0.5))}
              {field(L, top + 228, W, "Confirm password", typed("••••••••", (t - 2.7) / 0.5))}
              {goldButton(L, top + 300, W, "Sign up", (t - 3.3) / 0.3)}
              {touch(L + W / 2, top + 326, t, 3.3)}
            </>
          )}
        </g>
      )}
    </g>
  );
}

function rao({ cx, y, t }: Frame): ReactNode {
  const L = cx + 20;
  const W = 320;
  // The sheet comes up on the first like and goes once there's a name.
  const open = ease(clamp((t - 0.9) / 0.4)) * (1 - ease(clamp((t - 3.1) / 0.4)));
  const nick = typed(NICK, (t - 1.4) / 0.9);
  const liked = clamp((t - 3.4) / 0.5);
  const top = y + 456;
  const face = 64;

  return (
    <g>
      {board(cx, y, liked)}
      {touch(L + 34, y + 364, t, 0.5)}
      {open > 0.01 && (
        <g transform={`translate(0 ${(1 - open) * 300})`}>
          <rect x={cx} y={top} width={360} height={300} rx={28} fill={SHEET} />
          <rect x={cx + 160} y={top + 12} width={40} height={5} rx={2.5} fill={MUTED} />
          <text x={L} y={top + 56} className={type_.pHead} fill={INK}>
            Identify yourself
          </text>
          <text x={L} y={top + 80} className={type_.pLabel} fill={MUTED}>
            Just a nickname, the first time you join in
          </text>
          {nick ? (
            <foreignObject x={L} y={top + 98} width={face} height={face}>
              <Facehash
                name={nick}
                size={face}
                colors={[PEACOCK, GOLD, "#d6812e", "#123432"]}
                intensity3d="subtle"
                interactive={false}
                style={{ borderRadius: "50%", overflow: "hidden" }}
              />
            </foreignObject>
          ) : (
            <circle cx={L + face / 2} cy={top + 98 + face / 2} r={face / 2} fill={TRACK} />
          )}
          {field(L + face + 14, top + 104, W - face - 14, "Your nickname", nick)}
          {goldButton(L, top + 188, W, "Continue", (t - 2.7) / 0.3)}
          {touch(L + W / 2, top + 214, t, 2.7)}
        </g>
      )}
    </g>
  );
}
