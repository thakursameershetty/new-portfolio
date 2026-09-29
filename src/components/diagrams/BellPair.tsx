"use client";

import { useRef, useState } from "react";
import { useReducedMotion } from "framer-motion";
import {
  COLOR,
  ControlIcon,
  ease,
  seeded,
  useDiagramBox,
  useTicker,
} from "./shared";
import styles from "./Diagram.module.css";

// The quantum layer's circuit (quantum_layer.py), one shot at a time: an H gate puts qubit 0
// in both states at once, a CNOT ties qubit 1 to it, and measuring them always gives 00 or 11,
// never 01 or 10. Each agreeing pair is a key bit (00 → 0, 11 → 1); after 512 shots the bits
// are shuffled and the first 64 kept. The H gate can be switched off to show why it's there:
// without it every shot is 00, and the key is all zeros.

type Point = [number, number];

interface Layout {
  wide: boolean;
  width: number;
  height: number;
  /** The wires' ends, and each qubit's row and the classical register's. */
  left: number;
  right: number;
  q0: number;
  q1: number;
  c: number;
  start: number;
  h: number;
  cx: number;
  m0: number;
  m1: number;
  gate: number;
  /** The results panel: top-left corner and width. */
  panel: Point;
  panelWidth: number;
  /** Where the key's bits start. */
  key: Point;
  status: Point;
  statusWidth: number;
}

const WIDE: Layout = {
  wide: true,
  width: 1000,
  height: 560,
  left: 110,
  right: 640,
  q0: 190,
  q1: 290,
  c: 385,
  start: 140,
  h: 220,
  cx: 330,
  m0: 450,
  m1: 560,
  gate: 52,
  panel: [700, 140],
  panelWidth: 260,
  key: [700, 330],
  status: [40, 456],
  statusWidth: 920,
};

const TALL: Layout = {
  wide: false,
  width: 400,
  height: 760,
  left: 60,
  right: 380,
  q0: 140,
  q1: 220,
  c: 300,
  start: 84,
  h: 138,
  cx: 204,
  m0: 270,
  m1: 336,
  gate: 44,
  panel: [30, 370],
  panelWidth: 340,
  key: [30, 560],
  status: [20, 690],
  statusWidth: 360,
};

const SHOTS = 512;
const KEPT = 64;
// One shot, in seconds: to the H gate, through it, to the CNOT, through it, to the meters,
// the collapse, then the bits drop into the register.
const T = {
  toH: 0.4,
  atH: 0.7,
  toCx: 1.0,
  atCx: 1.3,
  toM: 1.6,
  measured: 1.9,
  end: 2.5,
};

type Outcome = "00" | "11";

// What a shot measures: with the H gate, a fair coin between 00 and 11; without it, 00.
const outcome = (shot: number, hOn: boolean): Outcome =>
  hOn && seeded(shot + 1) >= 0.5 ? "11" : "00";

// The kept key: the bits shuffled (repeatably), then the first 64.
function keptKey(results: Outcome[]) {
  const bits = results.map((result) => result[0]);
  for (let i = bits.length - 1; i > 0; i -= 1) {
    const j = Math.floor(seeded(1000 + i) * (i + 1));
    [bits[i], bits[j]] = [bits[j], bits[i]];
  }
  return bits.slice(0, KEPT);
}

const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
const within = (t: number, from: number, to: number) =>
  ease(Math.min(1, Math.max(0, (t - from) / (to - from))));

export function BellPair({
  className,
  onOpen,
}: {
  className?: string;
  onOpen?: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const reduceMotion = useReducedMotion();
  const still = Boolean(reduceMotion);
  const { wide, onScreen } = useDiagramBox(rootRef);
  const [results, setResults] = useState<Outcome[]>([]);
  const [t, setT] = useState(0);
  const [playing, setPlaying] = useState(true);
  // "One shot" plays a single shot, then stops.
  const [single, setSingle] = useState(false);
  const [hOn, setHOn] = useState(true);

  const done = results.length >= SHOTS;
  const running = playing && !done && !still;

  useTicker(onScreen && running, (delta) => {
    const next = t + delta;
    if (next < T.end) {
      setT(next);
      return;
    }
    setResults((list) => [...list, outcome(list.length, hOn)]);
    setT(0);
    if (single) setPlaying(false);
  });

  const reset = (h = hOn) => {
    setHOn(h);
    setResults([]);
    setT(0);
    setSingle(false);
    setPlaying(!still);
  };
  const oneShot = () => {
    if (done) return;
    if (still) {
      setResults((list) => [...list, outcome(list.length, hOn)]);
      return;
    }
    setSingle(true);
    setPlaying(true);
  };
  const togglePlay = () => {
    if (running) {
      setPlaying(false);
      return;
    }
    setSingle(false);
    setPlaying(true);
  };
  // The rest of the 512 at once.
  const runAll = () => {
    const list = [...results];
    while (list.length < SHOTS) list.push(outcome(list.length, hOn));
    setResults(list);
    setT(0);
    setPlaying(false);
  };

  const layout = wide ? WIDE : TALL;
  const L = layout;

  // Reduced motion shows the last shot, measured; otherwise the shot under way.
  const showLast = still || done || (!running && t === 0 && results.length > 0);
  const shot = showLast ? Math.max(0, results.length - 1) : results.length;
  const time = showLast ? (results.length ? T.measured : 0) : t;
  const result = showLast && results.length ? results[shot] : outcome(shot, hOn);

  // Where the two qubits are.
  const toH = within(time, 0, T.toH);
  const toCx = within(time, T.atH, T.toCx);
  const toM = within(time, T.atCx, T.toM);
  const x0 = lerp(lerp(lerp(L.start, L.h, toH), L.cx, toCx), L.m0, toM);
  const x1 = lerp(lerp(lerp(L.start, L.h, toH), L.cx, toCx), L.m1, toM);
  const split = hOn && time >= T.toH + 0.12;
  const linked = time >= T.toCx + 0.12;
  const measured = time >= T.toM + 0.1;
  // Before measuring, a qubit in superposition flickers between 0 and 1; once they're
  // entangled, they flicker together.
  const flicker = Math.floor(time / 0.09) % 2 === 0 ? "0" : "1";
  const q0Shows = measured ? result[0] : split ? flicker : "0";
  const q1Shows = measured
    ? result[1]
    : split && linked
      ? flicker
      : "0";
  const drop = within(time, T.measured, T.end - 0.1);

  const counts = { "00": 0, "01": 0, "10": 0, "11": 0 };
  results.forEach((item) => (counts[item] += 1));
  const bits = done
    ? keptKey(results)
    : results.map((item) => item[0]).slice(-KEPT);

  const status = done
    ? hOn
      ? `${SHOTS} shots, shuffled: ${KEPT} bits kept`
      : `${SHOTS} shots, all 00: a key of zeros`
    : time < T.toH
      ? "Two qubits, both 0"
      : time < T.toCx
        ? hOn
          ? "H gate: qubit 0 is 0 and 1 at once"
          : "No H gate: qubit 0 stays 0"
        : time < T.toM + 0.1
          ? hOn
            ? "CNOT: qubit 1 is tied to qubit 0"
            : "CNOT: there's only a 0 to copy"
          : hOn
            ? `Measured ${result}: they agree, key bit ${result[0]}`
            : "Measured 00, like every time";
  const statusColor = done
    ? hOn
      ? COLOR.ok
      : COLOR.bad
    : measured
      ? hOn
        ? COLOR.ok
        : COLOR.warm
      : COLOR.ink;

  const qubit = (x: number, y: number, shows: string, live: boolean) => (
    <g transform={`translate(${x} ${y})`}>
      {live && !measured && <circle r={24} fill={COLOR.quantum} opacity={0.14} />}
      <circle
        r={16}
        fill={COLOR.ground}
        stroke={measured ? COLOR.ok : live ? COLOR.quantum : COLOR.ink}
        strokeWidth={1.5}
      />
      <text
        y={5}
        textAnchor="middle"
        className={styles.letter}
        fill={measured ? COLOR.ok : live ? COLOR.quantum : COLOR.ink}
      >
        {shows}
      </text>
    </g>
  );

  const meter = (x: number, y: number) => (
    <g transform={`translate(${x} ${y})`}>
      <rect
        x={-L.gate / 2}
        y={-L.gate / 2 + 4}
        width={L.gate}
        height={L.gate - 8}
        rx={6}
        fill={COLOR.ground}
        stroke={COLOR.muted}
        strokeWidth={1.5}
      />
      <path
        d={`M${-L.gate / 4} 6a${L.gate / 4} ${L.gate / 4} 0 0 1 ${L.gate / 2} 0M0 6l${L.gate / 6} ${-L.gate / 4}`}
        fill="none"
        stroke={COLOR.muted}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </g>
  );

  const [px, py] = L.panel;
  const [kx, ky] = L.key;
  const barLeft = px + 44;
  const barWidth = L.panelWidth - 44 - 50;
  const columns = 16;
  const cell = L.panelWidth / columns;

  return (
    <div ref={rootRef} className={className ?? styles.root}>
      <svg
        viewBox={`0 0 ${L.width} ${L.height}`}
        className={styles.svg}
        aria-hidden="true"
      >
        <rect width={L.width} height={L.height} fill={COLOR.ground} />
        <text
          x={wide ? 40 : 24}
          y={wide ? 56 : 44}
          className={styles.tag}
          fill={COLOR.muted}
        >
          ENTANGLED PAIRS → KEY BITS
        </text>

        {/* The wires: two qubits, and the classical register the results land in. */}
        {[
          ["q0", L.q0],
          ["q1", L.q1],
        ].map(([name, y]) => (
          <g key={name}>
            <text
              x={L.left - 14}
              y={Number(y) + 5}
              textAnchor="end"
              className={styles.name}
              fill={COLOR.muted}
            >
              {name}
            </text>
            <line
              x1={L.left}
              y1={y}
              x2={L.right}
              y2={y}
              stroke={COLOR.faint}
              strokeWidth={1.5}
            />
          </g>
        ))}
        <text
          x={L.left - 14}
          y={L.c + 5}
          textAnchor="end"
          className={styles.name}
          fill={COLOR.muted}
        >
          c
        </text>
        {[-2, 2].map((offset) => (
          <line
            key={offset}
            x1={L.left}
            y1={L.c + offset}
            x2={L.right}
            y2={L.c + offset}
            stroke={COLOR.faint}
            strokeWidth={1.2}
          />
        ))}

        {/* H gate (or where it was). */}
        <g transform={`translate(${L.h} ${L.q0})`} opacity={hOn ? 1 : 0.45}>
          <rect
            x={-L.gate / 2}
            y={-L.gate / 2}
            width={L.gate}
            height={L.gate}
            rx={8}
            fill={hOn ? "rgba(180, 164, 245, 0.14)" : COLOR.ground}
            stroke={hOn ? COLOR.quantum : COLOR.muted}
            strokeWidth={1.5}
            strokeDasharray={hOn ? undefined : "4 4"}
          />
          <text
            y={7}
            textAnchor="middle"
            className={styles.gate}
            fill={hOn ? COLOR.quantum : COLOR.muted}
          >
            H
          </text>
        </g>
        <text
          x={L.h}
          y={L.q0 - L.gate / 2 - 12}
          textAnchor="middle"
          className={styles.small}
          fill={COLOR.muted}
        >
          {hOn ? "Hadamard" : "H off"}
        </text>

        {/* CNOT: qubit 0 controls, qubit 1 flips. */}
        <line
          x1={L.cx}
          y1={L.q0}
          x2={L.cx}
          y2={L.q1 + 16}
          stroke={COLOR.ink}
          strokeWidth={1.5}
        />
        <circle cx={L.cx} cy={L.q0} r={6} fill={COLOR.ink} />
        <circle
          cx={L.cx}
          cy={L.q1}
          r={16}
          fill={COLOR.ground}
          stroke={COLOR.ink}
          strokeWidth={1.5}
        />
        <path
          d={`M${L.cx - 16} ${L.q1}h32M${L.cx} ${L.q1 - 16}v32`}
          stroke={COLOR.ink}
          strokeWidth={1.5}
        />
        <text
          x={L.cx}
          y={L.q0 - L.gate / 2 - 12}
          textAnchor="middle"
          className={styles.small}
          fill={COLOR.muted}
        >
          CNOT
        </text>

        {/* Meters, wired down to the register. */}
        {[
          [L.m0, L.q0, 0],
          [L.m1, L.q1, 1],
        ].map(([x, y, bit]) => (
          <g key={bit}>
            {[-2, 2].map((offset) => (
              <line
                key={offset}
                x1={x + offset}
                y1={y + L.gate / 2 - 4}
                x2={x + offset}
                y2={L.c - 6}
                stroke={COLOR.faint}
                strokeWidth={1.2}
              />
            ))}
            {meter(x, y)}
            <text
              x={x + 10}
              y={L.c - 12}
              className={styles.small}
              fill={COLOR.muted}
            >
              {bit}
            </text>
          </g>
        ))}
        <text
          x={(L.m0 + L.m1) / 2}
          y={L.q0 - L.gate / 2 - 12}
          textAnchor="middle"
          className={styles.small}
          fill={COLOR.muted}
        >
          Measure
        </text>

        {/* The pair: linked once entangled. */}
        {linked && !measured && hOn && (
          <line
            x1={x0}
            y1={L.q0 + 16}
            x2={x1}
            y2={L.q1 - 16}
            stroke={COLOR.quantum}
            strokeWidth={1.5}
            strokeDasharray="3 5"
          />
        )}
        {!(time >= T.measured && drop > 0.02) && (
          <>
            {qubit(x0, L.q0, q0Shows, split)}
            {qubit(x1, L.q1, q1Shows, split && linked)}
          </>
        )}

        {/* The results drop into the register. */}
        {time >= T.measured && drop > 0.02 && drop < 1 && (
          <>
            {[
              [L.m0, L.q0, result[0]],
              [L.m1, L.q1, result[1]],
            ].map(([x, y, bit], index) => (
              <text
                key={index}
                x={Number(x) - 14}
                y={lerp(Number(y), L.c, drop) + 5}
                textAnchor="middle"
                className={styles.letter}
                fill={COLOR.ok}
                opacity={1 - drop * 0.6}
              >
                {bit}
              </text>
            ))}
          </>
        )}

        {/* The results so far. */}
        <text x={px} y={py} className={styles.tag} fill={COLOR.muted}>
          {`RESULTS · ${results.length} OF ${SHOTS}`}
        </text>
        {(["00", "01", "10", "11"] as const).map((key, row) => {
          const y = py + 30 + row * 30;
          const share = results.length ? counts[key] / results.length : 0;
          const never = key === "01" || key === "10";
          return (
            <g key={key}>
              <text
                x={px}
                y={y + 5}
                className={styles.tag}
                fill={never ? COLOR.muted : COLOR.ink}
              >
                {key}
              </text>
              <rect
                x={barLeft}
                y={y - 6}
                width={barWidth}
                height={12}
                rx={6}
                fill="rgba(245, 241, 234, 0.05)"
              />
              <rect
                x={barLeft}
                y={y - 6}
                width={Math.max(0, barWidth * share)}
                height={12}
                rx={6}
                fill={key === "11" ? COLOR.quantum : COLOR.ok}
              />
              <text
                x={px + L.panelWidth}
                y={y + 5}
                textAnchor="end"
                className={styles.tag}
                fill={never ? COLOR.muted : COLOR.ink}
              >
                {never ? "never" : counts[key]}
              </text>
            </g>
          );
        })}

        {/* The key. */}
        <text x={kx} y={ky} className={styles.tag} fill={COLOR.muted}>
          {done ? `KEY · ${KEPT} BITS KEPT` : "KEY · 00 → 0, 11 → 1"}
        </text>
        {Array.from({ length: KEPT }, (_, index) => {
          const bit = bits[index];
          return (
            <text
              key={index}
              x={kx + (index % columns) * cell + cell / 2}
              y={ky + 30 + Math.floor(index / columns) * 24}
              textAnchor="middle"
              className={styles.letter}
              fill={
                bit === undefined
                  ? COLOR.faint
                  : done
                    ? COLOR.ok
                    : bit === "1"
                      ? COLOR.quantum
                      : COLOR.ink
              }
            >
              {bit ?? "·"}
            </text>
          );
        })}

        {/* What's happening, in words. */}
        <g transform={`translate(${L.status[0]} ${L.status[1]})`}>
          <rect
            width={L.statusWidth}
            height={52}
            rx={10}
            fill="rgba(245, 241, 234, 0.04)"
            stroke={COLOR.faint}
          />
          <text x={18} y={31} className={styles.tag} fill={COLOR.muted}>
            {`SHOT ${String(Math.min(shot + 1, SHOTS)).padStart(3, "0")}`}
          </text>
          <text
            x={wide ? 128 : 104}
            y={32}
            className={wide ? styles.status : styles.statusSmall}
            fill={statusColor}
          >
            {status}
          </text>
        </g>
      </svg>

      <div className={styles.controls}>
        <div className={styles.transport}>
          {!still && (
            <button
              type="button"
              className={styles.control}
              aria-label={running ? "Pause" : "Play"}
              onClick={togglePlay}
              disabled={done}
            >
              <ControlIcon name={running ? "pause" : "play"} />
            </button>
          )}
          <button
            type="button"
            className={styles.control}
            aria-label="One shot"
            onClick={oneShot}
            disabled={done}
          >
            <ControlIcon name="next" />
          </button>
          <button
            type="button"
            className={styles.control}
            aria-label="Start again"
            onClick={() => reset()}
          >
            <ControlIcon name="reset" />
          </button>
        </div>
        <div className={`${styles.scenarios} ${styles.wrap}`}>
          <button
            type="button"
            className={styles.scenario}
            aria-pressed={hOn}
            onClick={() => reset(!hOn)}
          >
            <span className={styles.scenarioLabel}>
              {hOn ? "H gate: on" : "H gate: off"}
            </span>
          </button>
          <button
            type="button"
            className={styles.scenario}
            onClick={runAll}
            disabled={done}
          >
            <span className={styles.scenarioLabel}>{`Run all ${SHOTS}`}</span>
          </button>
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
