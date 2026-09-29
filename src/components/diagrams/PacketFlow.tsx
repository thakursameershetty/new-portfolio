"use client";

import { useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import { COLOR, ControlIcon, ease, useDiagramBox, useTicker } from "./shared";
import styles from "./Diagram.module.css";

// SamudraGupt-Q's pipeline, played out: packets leave the phones (the drones), pass the
// Node.js relay and the backend's four checks in turn, and reach the naval command centre's
// dashboard, until one is stopped at the check that catches it. Drawn wide (left to right) or
// tall (top to bottom) to fit its box, so the labels stay readable on a phone. Under it, the
// controls: play or pause the loop, or pick one scenario to play on its own.

type Point = [number, number];

interface Layout {
  wide: boolean;
  width: number;
  height: number;
  /** Drones A, B and C, then the rogue node. */
  drones: Point[];
  relay: Point;
  gates: Point[];
  dash: Point;
}

const WIDE: Layout = {
  wide: true,
  width: 1000,
  height: 560,
  drones: [
    [90, 170],
    [90, 270],
    [90, 370],
    [90, 470],
  ],
  relay: [250, 270],
  gates: [
    [410, 270],
    [520, 270],
    [630, 270],
    [740, 270],
  ],
  dash: [920, 270],
};

const TALL: Layout = {
  wide: false,
  width: 400,
  height: 820,
  drones: [
    [70, 125],
    [160, 125],
    [250, 125],
    [340, 125],
  ],
  relay: [200, 215],
  gates: [
    [200, 350],
    [200, 430],
    [200, 510],
    [200, 590],
  ],
  dash: [200, 690],
};

const GATES = [
  { name: "Quantum key", note: "E91 · Qiskit" },
  { name: "Signature", note: "Every packet" },
  { name: "Encrypted avg", note: "CKKS · TenSEAL" },
  { name: "AI agent", note: "PPO" },
];

const DRONES = ["A", "B", "C", "?"];

// What happens, in order, then again. `stop` is the check that catches the packet.
interface Beat {
  /** Its tab in the controls. */
  label: string;
  source: number;
  stop?: number;
  travel: string;
  verdict: string;
  omega?: boolean;
}

const BEATS: Beat[] = [
  {
    label: "Drone A",
    source: 0,
    travel: "Drone A · telemetry",
    verdict: "Passed all four checks",
  },
  {
    label: "Drone B",
    source: 1,
    travel: "Drone B · telemetry", verdict: "Passed all four checks" },
  {
    label: "Stripped key",
    source: 2,
    stop: 0,
    travel: "Drone C · key stripped",
    verdict: "No quantum key: blocked",
  },
  {
    label: "Rogue node",
    source: 3,
    stop: 1,
    travel: "Unknown node · spoofed MAC",
    verdict: "Unknown signer: locked out",
  },
  {
    label: "Drone A again",
    source: 0,
    travel: "Drone A · telemetry",
    verdict: "Passed all four checks",
  },
  {
    label: "Kinetic strike",
    source: 2,
    stop: 3,
    travel: "Drone C · g-force 25 m/s²",
    verdict: "Protocol Omega: C cut off",
    omega: true,
  },
];

// Seconds. Stops: -1 is the drone, 0 the relay, 1–4 the checks, 5 the dashboard.
const FLY_IN = 0.8;
const HOP = 0.42;
const CHECK = 0.38;
const BLOCKED = 1.9;
const OMEGA = 3.2;
const DELIVERED = 0.7;
const GAP = 0.3;

type Phase = "travel" | "check" | "block" | "done";

interface Step {
  from: number;
  to: number;
  duration: number;
  phase: Phase;
}

const plan = (beat: Beat): Step[] => {
  const steps: Step[] = [
    { from: -1, to: 0, duration: FLY_IN, phase: "travel" },
    { from: 0, to: 0, duration: 0.12, phase: "travel" },
  ];
  for (let gate = 1; gate <= 4; gate += 1) {
    steps.push({ from: gate - 1, to: gate, duration: HOP, phase: "travel" });
    steps.push({ from: gate, to: gate, duration: CHECK, phase: "check" });
    if (beat.stop === gate - 1) {
      steps.push({
        from: gate,
        to: gate,
        duration: beat.omega ? OMEGA : BLOCKED,
        phase: "block",
      });
      return steps;
    }
  }
  steps.push({ from: 4, to: 5, duration: HOP, phase: "travel" });
  steps.push({ from: 5, to: 5, duration: DELIVERED, phase: "done" });
  return steps;
};

const PLANS = BEATS.map(plan);
const LENGTHS = PLANS.map(
  (steps) => steps.reduce((sum, step) => sum + step.duration, 0) + GAP,
);
const CYCLE = LENGTHS.reduce((sum, length) => sum + length, 0);

interface Frame {
  beat: number;
  round: number;
  from: number;
  to: number;
  /** 0–1 along the current step, eased. */
  along: number;
  phase: Phase;
  /** Seconds into the current step. */
  into: number;
  /** Checks this packet has cleared. */
  cleared: number;
  hidden: boolean;
}

function frameAt(time: number): Frame {
  const round = Math.floor(time / CYCLE);
  let t = time - round * CYCLE;
  let beat = 0;
  while (t >= LENGTHS[beat]) {
    t -= LENGTHS[beat];
    beat += 1;
  }
  let cleared = 0;
  for (const step of PLANS[beat]) {
    if (t < step.duration) {
      return {
        beat,
        round,
        from: step.from,
        to: step.to,
        along: ease(t / step.duration),
        phase: step.phase,
        into: t,
        cleared,
        hidden: false,
      };
    }
    t -= step.duration;
    if (step.phase === "check") cleared += 1;
  }
  // The pause between packets.
  const last = PLANS[beat][PLANS[beat].length - 1];
  return {
    beat,
    round,
    from: last.to,
    to: last.to,
    along: 1,
    phase: last.phase,
    into: last.duration,
    cleared,
    hidden: true,
  };
}

// Where each scenario starts in the loop, and the moment it ends on (its verdict, before the
// packet goes).
const STARTS = LENGTHS.map((_, beat) =>
  LENGTHS.slice(0, beat).reduce((sum, length) => sum + length, 0),
);
const ENDS = STARTS.map((start, beat) => start + LENGTHS[beat] - GAP - 0.01);

// For reduced motion: the first packet, mid-way through the checks.
const STILL = FLY_IN + 0.12 + 3 * (HOP + CHECK) - CHECK / 2;


export function PacketFlow({
  className,
  onOpen,
}: {
  className?: string;
  /** Opens the closer look (in the story; the closer look itself has none). */
  onOpen?: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const { wide, onScreen } = useDiagramBox(rootRef);
  const [clock, setTime] = useState(0);
  const [playing, setPlaying] = useState(true);
  // A scenario picked on its own: it plays, then holds on its verdict.
  const [solo, setSolo] = useState<number | null>(null);

  // Reduced motion starts on a still, and only moves when asked to (a picked scenario jumps
  // straight to its verdict).
  const still = Boolean(reduceMotion);
  const time = still && clock === 0 ? STILL : clock;

  const f = frameAt(time);
  const round = Math.floor(time / CYCLE) * CYCLE;

  // A picked scenario stops once it reaches its verdict.
  const held = solo !== null && time >= round + ENDS[solo];
  const running = playing && !held && !still;

  // Runs only while it's playing and can be seen, and picks up where it left off.
  useTicker(onScreen && running, (delta) =>
    setTime((value) => {
      const next = value + delta;
      if (solo === null) return next;
      return Math.min(next, Math.floor(value / CYCLE) * CYCLE + ENDS[solo]);
    }),
  );


  // Plays one scenario from its start (or, for reduced motion, shows its verdict).
  const pick = (index: number) => {
    const next = (index + BEATS.length) % BEATS.length;
    setSolo(next);
    if (still) {
      setTime(round + ENDS[next]);
      return;
    }
    setTime(round + STARTS[next]);
    setPlaying(true);
  };
  const togglePlay = () => {
    if (running) {
      setPlaying(false);
      return;
    }
    // Back to the loop; a scenario held on its verdict moves on to the next.
    if (held && solo !== null) {
      setTime(round + STARTS[(solo + 1) % BEATS.length]);
    }
    setSolo(null);
    setPlaying(true);
  };

  const layout = wide ? WIDE : TALL;
  const beat = BEATS[f.beat];

  const stopPoint = (stop: number): Point =>
    stop < 0
      ? layout.drones[beat.source]
      : stop === 0
        ? layout.relay
        : stop <= 4
          ? layout.gates[stop - 1]
          : layout.dash;
  const [x1, y1] = stopPoint(f.from);
  const [x2, y2] = stopPoint(f.to);
  const packet: Point = [x1 + (x2 - x1) * f.along, y1 + (y2 - y1) * f.along];

  const blockedAt = f.phase === "block" ? beat.stop : undefined;
  const checking = f.phase === "check" ? f.to - 1 : undefined;
  const cutOff = beat.omega && f.phase === "block" && f.into > 0.5;
  const packetColor =
    f.phase === "block" ? COLOR.bad : f.phase === "done" ? COLOR.ok : COLOR.ink;
  const status =
    f.phase === "block" || f.phase === "done" ? beat.verdict : beat.travel;
  const statusColor =
    f.phase === "block" ? COLOR.bad : f.phase === "done" ? COLOR.ok : COLOR.ink;
  const packetNumber = 140 + f.round * BEATS.length + f.beat;

  const gateColor = (gate: number) =>
    blockedAt === gate
      ? COLOR.bad
      : checking === gate
        ? gate === 0
          ? COLOR.quantum
          : COLOR.ink
        : gate < f.cleared
          ? COLOR.ok
          : COLOR.faint;

  const [rx, ry] = layout.relay;
  const [dx, dy] = layout.dash;
  const first = layout.gates[0];
  const lastGate = layout.gates[3];

  return (
    <div ref={rootRef} className={className ?? styles.root}>
      <svg
        viewBox={`0 0 ${layout.width} ${layout.height}`}
        className={styles.svg}
        aria-hidden="true"
      >
        <rect width={layout.width} height={layout.height} fill="#0b0d0c" />

        <text
          x={wide ? 40 : 24}
          y={wide ? 56 : 44}
          className={styles.tag}
          fill={COLOR.muted}
        >
          ONE PACKET, FOUR CHECKS
        </text>

        {/* Links: each drone to the relay, then one line through the checks. */}
        {layout.drones.map(([x, y], drone) => {
          const rogue = drone === 3;
          const active = beat.source === drone && f.from === -1;
          const cut = drone === 2 && cutOff;
          if (rogue && beat.source !== 3) return null;
          return (
            <line
              key={DRONES[drone]}
              x1={wide ? x + 22 : x}
              y1={wide ? y : y + 34}
              x2={rx}
              y2={ry}
              stroke={cut || rogue ? COLOR.bad : active ? COLOR.muted : COLOR.faint}
              strokeWidth={1.5}
              strokeDasharray={cut || rogue ? "5 6" : undefined}
            />
          );
        })}
        <line
          x1={rx}
          y1={ry}
          x2={dx}
          y2={dy}
          stroke={COLOR.faint}
          strokeWidth={1.5}
        />

        {/* The quantum engine (the Python backend) around the checks. */}
        <rect
          x={wide ? first[0] - 80 : 24}
          y={wide ? 158 : first[1] - 62}
          width={wide ? lastGate[0] - first[0] + 175 : 352}
          height={wide ? 237 : lastGate[1] - first[1] + 110}
          rx={14}
          fill="rgba(245, 241, 234, 0.025)"
          stroke={COLOR.faint}
          strokeDasharray="4 6"
        />
        <text
          x={wide ? first[0] - 62 : 42}
          y={wide ? 184 : first[1] - 38}
          className={styles.tag}
          fill={COLOR.muted}
        >
          QUANTUM ENGINE
        </text>

        <text
          x={wide ? layout.drones[0][0] : layout.drones[1][0]}
          y={wide ? layout.drones[0][1] - 44 : layout.drones[0][1] - 40}
          textAnchor="middle"
          className={styles.tag}
          fill={COLOR.muted}
        >
          DRONES
        </text>

        {/* The drones: phones, plus the rogue node when it tries to join. */}
        {layout.drones.map(([x, y], drone) => {
          const rogue = drone === 3;
          if (rogue && beat.source !== 3) return null;
          const cut = drone === 2 && cutOff;
          const tone = rogue || cut ? COLOR.bad : COLOR.ink;
          return (
            <g key={DRONES[drone]} opacity={cut ? 0.45 : 1}>
              <rect
                x={x - 15}
                y={y - 25}
                width={30}
                height={50}
                rx={6}
                fill="#0b0d0c"
                stroke={tone}
                strokeWidth={1.5}
                strokeDasharray={rogue ? "4 4" : undefined}
              />
              <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                className={styles.letter}
                fill={tone}
              >
                {DRONES[drone]}
              </text>
              {(rogue || cut) && (
                <text
                  x={wide ? x - 26 : x + 24}
                  y={y + 4}
                  textAnchor={wide ? "end" : "start"}
                  className={styles.small}
                  fill={COLOR.bad}
                >
                  {rogue ? "Rogue" : "Cut off"}
                </text>
              )}
            </g>
          );
        })}

        {/* The relay. */}
        <circle
          cx={rx}
          cy={ry}
          r={wide ? 28 : 24}
          fill="#0b0d0c"
          stroke={f.to === 0 && !f.hidden ? COLOR.ink : COLOR.muted}
          strokeWidth={1.5}
        />
        <text
          x={wide ? rx : rx + 40}
          y={wide ? ry + 52 : ry - 4}
          textAnchor={wide ? "middle" : "start"}
          className={styles.name}
          fill={COLOR.ink}
        >
          Relay
        </text>
        <text
          x={wide ? rx : rx + 40}
          y={wide ? ry + 70 : ry + 14}
          textAnchor={wide ? "middle" : "start"}
          className={styles.small}
          fill={COLOR.muted}
        >
          Node.js
        </text>

        {/* The checks: a bar the packet has to pass. */}
        {layout.gates.map(([x, y], gate) => {
          const tone = gateColor(gate);
          return (
            <g key={GATES[gate].name}>
              {wide ? (
                <rect x={x - 3} y={y - 40} width={6} height={80} rx={3} fill={tone} />
              ) : (
                <rect x={x - 32} y={y - 3} width={64} height={6} rx={3} fill={tone} />
              )}
              <text
                x={wide ? x : x - 46}
                y={wide ? y - 54 : y + 4}
                textAnchor={wide ? "middle" : "end"}
                className={styles.tag}
                fill={tone === COLOR.faint ? COLOR.muted : tone}
              >
                {`0${gate + 1}`}
              </text>
              <text
                x={wide ? x : x + 46}
                y={wide ? y + 66 : y - 2}
                textAnchor={wide ? "middle" : "start"}
                className={styles.name}
                fill={COLOR.ink}
              >
                {GATES[gate].name}
              </text>
              <text
                x={wide ? x : x + 46}
                y={wide ? y + 86 : y + 16}
                textAnchor={wide ? "middle" : "start"}
                className={styles.small}
                fill={COLOR.muted}
              >
                {GATES[gate].note}
              </text>
            </g>
          );
        })}

        {/* The dashboard. */}
        <g>
          <rect
            x={dx - 34}
            y={dy - 24}
            width={68}
            height={44}
            rx={5}
            fill="#0b0d0c"
            stroke={f.phase === "done" && !f.hidden ? COLOR.ok : COLOR.muted}
            strokeWidth={1.5}
          />
          <line
            x1={dx}
            y1={dy + 20}
            x2={dx}
            y2={dy + 32}
            stroke={COLOR.muted}
            strokeWidth={1.5}
          />
          <line
            x1={dx - 14}
            y1={dy + 32}
            x2={dx + 14}
            y2={dy + 32}
            stroke={COLOR.muted}
            strokeWidth={1.5}
          />
          <text
            x={wide ? dx : dx + 50}
            y={wide ? dy + 66 : dy - 2}
            textAnchor={wide ? "middle" : "start"}
            className={styles.name}
            fill={COLOR.ink}
          >
            Command centre
          </text>
          <text
            x={wide ? dx : dx + 50}
            y={wide ? dy + 86 : dy + 16}
            textAnchor={wide ? "middle" : "start"}
            className={styles.small}
            fill={COLOR.muted}
          >
            Naval base · dashboard
          </text>
        </g>

        {/* The packet. */}
        {!f.hidden && (
          <g transform={`translate(${packet[0]} ${packet[1]})`}>
            <circle r={14} fill={packetColor} opacity={0.14} />
            <rect
              x={-6}
              y={-6}
              width={12}
              height={12}
              rx={3}
              fill={packetColor}
            />
          </g>
        )}

        {/* What's happening, in words. */}
        <g
          transform={
            wide ? "translate(330 456)" : `translate(20 ${layout.height - 70})`
          }
        >
          <rect
            width={wide ? 630 : 360}
            height={52}
            rx={10}
            fill="rgba(245, 241, 234, 0.04)"
            stroke={COLOR.faint}
          />
          <text x={18} y={31} className={styles.tag} fill={COLOR.muted}>
            {`PKT ${String(packetNumber).padStart(4, "0")}`}
          </text>
          <text
            x={wide ? 128 : 112}
            y={32}
            className={styles.status}
            fill={statusColor}
          >
            {status}
          </text>
        </g>
      </svg>

      <div className={styles.controls}>
        <div className={styles.transport}>
          <button
            type="button"
            className={styles.control}
            aria-label="Previous scenario"
            onClick={() => pick(f.beat - 1)}
          >
            <ControlIcon name="prev" />
          </button>
          {!still && (
            <button
              type="button"
              className={styles.control}
              aria-label={running ? "Pause" : "Play"}
              onClick={togglePlay}
            >
              <ControlIcon name={running ? "pause" : "play"} />
            </button>
          )}
          <button
            type="button"
            className={styles.control}
            aria-label="Next scenario"
            onClick={() => pick(f.beat + 1)}
          >
            <ControlIcon name="next" />
          </button>
        </div>
        <div className={styles.scenarios} role="group" aria-label="Scenarios">
          {BEATS.map((item, index) => (
            <button
              key={item.label}
              type="button"
              className={styles.scenario}
              aria-pressed={f.beat === index}
              data-tone={item.stop === undefined ? "ok" : "bad"}
              onClick={() => pick(index)}
            >
              <span
                className={styles.scenarioFill}
                aria-hidden="true"
                style={{
                  transform: `scaleX(${
                    f.beat === index
                      ? Math.min(1, (time - round - STARTS[index]) / (ENDS[index] - STARTS[index]))
                      : 0
                  })`,
                }}
              />
              <span className={styles.scenarioLabel}>
                {`0${index + 1}`} {item.label}
              </span>
            </button>
          ))}
        </div>
        {onOpen && (
          <button
            type="button"
            className={styles.control}
            aria-label="Look closer"
            onClick={onOpen}
          >
            <ControlIcon name="expand" />
          </button>
        )}
      </div>
      <p className={styles.srOnly} aria-live="polite">
        {running ? "" : status}
      </p>
    </div>
  );
}
