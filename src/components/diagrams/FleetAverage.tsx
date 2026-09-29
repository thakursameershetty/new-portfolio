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

// The privacy layer (CKKS, with TenSEAL): each drone encrypts its depth on board, the cloud
// adds the three ciphertexts and multiplies by ⅓ without being able to read them, and only
// the naval command centre decrypts, getting the fleet's average and nothing else. The depths
// are sliders: nudge one and its ciphertext becomes entirely different noise, while the
// decrypted average moves by exactly what it should.

type Point = [number, number];

interface Layout {
  wide: boolean;
  width: number;
  height: number;
  phones: Point[];
  /** Where each drone's ciphertext first appears, and its size. */
  waveFrom: Point[];
  waveSize: Point;
  /** The cloud's box (x, y, width, height), where the ciphertexts land, and their sum. */
  cloud: [number, number, number, number];
  cloudIn: Point[];
  inSize: Point;
  sumAt: Point;
  sumSize: Point;
  /** The command centre: its screen, and where the answer is written. */
  command: Point;
  answer: Point;
  status: Point;
  statusWidth: number;
}

const WIDE: Layout = {
  wide: true,
  width: 1000,
  height: 560,
  phones: [
    [70, 190],
    [70, 280],
    [70, 370],
  ],
  waveFrom: [
    [262, 190],
    [262, 280],
    [262, 370],
  ],
  waveSize: [80, 30],
  cloud: [360, 130, 290, 290],
  cloudIn: [
    [505, 225],
    [505, 275],
    [505, 325],
  ],
  inSize: [210, 36],
  sumAt: [505, 275],
  sumSize: [230, 76],
  command: [840, 215],
  answer: [840, 320],
  status: [40, 456],
  statusWidth: 920,
};

const TALL: Layout = {
  wide: false,
  width: 400,
  height: 820,
  phones: [
    [80, 115],
    [200, 115],
    [320, 115],
  ],
  waveFrom: [
    [80, 220],
    [200, 220],
    [320, 220],
  ],
  waveSize: [84, 28],
  cloud: [30, 270, 340, 200],
  cloudIn: [
    [200, 335],
    [200, 375],
    [200, 415],
  ],
  inSize: [240, 30],
  sumAt: [200, 380],
  sumSize: [260, 70],
  command: [200, 560],
  answer: [200, 660],
  status: [20, 750],
  statusWidth: 360,
};

// Seconds: encrypt, send, add, send on, decrypt, then a pause on the answer.
const STAGES = [
  { until: 1.3, text: "Each drone encrypts its depth" },
  { until: 2.3, text: "Only ciphertext leaves the drones" },
  { until: 3.6, text: "The cloud adds them, blind" },
  { until: 4.6, text: "Still encrypted, on to command" },
  { until: 7.6, text: "Command decrypts the average" },
];
const CYCLE = STAGES[STAGES.length - 1].until;
const DECRYPT = STAGES[3].until;

const DRONES = ["A", "B", "C"];
const START = [498.5, 502.1, 499.8];
const TONES = [COLOR.ok, "#8fb8f0", COLOR.quantum];

const lerp = (a: number, b: number, x: number) => a + (b - a) * x;
const mix = (a: Point, b: Point, x: number): Point => [
  lerp(a[0], b[0], x),
  lerp(a[1], b[1], x),
];
const within = (t: number, from: number, to: number) =>
  ease(Math.min(1, Math.max(0, (t - from) / (to - from))));

// A ciphertext, drawn as noise: its shape comes from the value it hides, so the smallest
// change to the value gives a completely different line.
function wave(seed: number, [cx, cy]: Point, [w, h]: Point, drawn = 1) {
  const points = 48;
  const shown = Math.max(2, Math.round(points * drawn));
  let d = "";
  for (let i = 0; i < shown; i += 1) {
    const x = cx - w / 2 + (w * i) / (points - 1);
    const noise =
      Math.sin(i * (0.7 + seeded(seed) * 0.9) + seeded(seed + 1) * 6) * 0.55 +
      (seeded(seed * 31 + i) - 0.5) * 0.9;
    const y = cy + (noise * h) / 2;
    d += `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`;
  }
  return d;
}

export function FleetAverage({
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
  const [depths, setDepths] = useState(START);
  const [clock, setClock] = useState(0);
  const [playing, setPlaying] = useState(true);

  const running = playing && !still;
  useTicker(onScreen && running, (delta) =>
    setClock((value) => (value + delta) % CYCLE),
  );

  // Reduced motion shows the answer.
  const t = still ? CYCLE - 0.5 : clock;
  const stage = STAGES.findIndex((item) => t < item.until);
  const next = () => {
    setClock(STAGES[stage]?.until ?? 0);
    setPlaying(false);
  };

  const L = wide ? WIDE : TALL;
  const average = depths.reduce((sum, depth) => sum + depth, 0) / depths.length;
  const seeds = depths.map((depth, drone) => Math.round(depth * 10) * 7 + drone * 7919);
  const sumSeed = Math.round(average * 100) * 13 + 101;

  const drawn = within(t, 0.2, STAGES[0].until);
  const sent = within(t, STAGES[0].until, STAGES[1].until);
  const merged = within(t, STAGES[1].until + 0.2, STAGES[2].until - 0.2);
  const onward = within(t, STAGES[2].until, STAGES[3].until);
  const opened = within(t, DECRYPT, DECRYPT + 0.8);

  const [bx, by, bw, bh] = L.cloud;
  const commandWave: Point = [L.command[0], L.command[1] - 2];

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
          AVERAGING WHAT NO ONE CAN READ
        </text>

        {/* The drones, each with its depth and a lock. */}
        <text
          x={wide ? 40 : 200}
          y={wide ? 130 : 76}
          textAnchor={wide ? "start" : "middle"}
          className={styles.tag}
          fill={COLOR.muted}
        >
          DRONES · ENCRYPT ON BOARD
        </text>
        {L.phones.map(([x, y], drone) => {
          const locked = drawn > 0.05;
          return (
            <g key={DRONES[drone]}>
              <rect
                x={x - 13}
                y={y - 21}
                width={26}
                height={42}
                rx={5}
                fill={COLOR.ground}
                stroke={COLOR.ink}
                strokeWidth={1.5}
              />
              <text
                x={x}
                y={y + 5}
                textAnchor="middle"
                className={styles.letter}
                fill={COLOR.ink}
              >
                {DRONES[drone]}
              </text>
              <text
                x={wide ? x + 30 : x}
                y={wide ? y + 6 : y + 50}
                textAnchor={wide ? "start" : "middle"}
                className={styles.name}
                fill={TONES[drone]}
              >
                {`${depths[drone].toFixed(1)} m`}
              </text>
              {/* The lock, closing as it encrypts. */}
              <g
                transform={
                  wide
                    ? `translate(${x + 134} ${y})`
                    : `translate(${x} ${y + 74})`
                }
              >
                <rect
                  x={-7}
                  y={-2}
                  width={14}
                  height={11}
                  rx={2}
                  fill="none"
                  stroke={locked ? COLOR.ink : COLOR.muted}
                  strokeWidth={1.4}
                />
                <path
                  d={`M-4.5 -2v-3a4.5 4.5 0 0 1 9 0v${locked ? 3 : -1}`}
                  fill="none"
                  stroke={locked ? COLOR.ink : COLOR.muted}
                  strokeWidth={1.4}
                />
              </g>
            </g>
          );
        })}

        {/* The untrusted cloud. */}
        <rect
          x={bx}
          y={by}
          width={bw}
          height={bh}
          rx={14}
          fill="rgba(245, 241, 234, 0.025)"
          stroke={COLOR.faint}
          strokeDasharray="4 6"
        />
        <text
          x={bx + 18}
          y={by + 26}
          className={styles.tag}
          fill={COLOR.muted}
        >
          UNTRUSTED CLOUD
        </text>
        <text
          x={bx + bw - 18}
          y={by + bh - 18}
          textAnchor="end"
          className={styles.small}
          fill={COLOR.muted}
        >
          Sees only noise
        </text>
        {merged > 0 && merged < 1 && (
          <text
            x={L.sumAt[0]}
            y={L.sumAt[1] - L.sumSize[1] / 2 - 10}
            textAnchor="middle"
            className={styles.tag}
            fill={COLOR.ink}
          >
            A + B + C, × ⅓
          </text>
        )}

        {/* Each drone's ciphertext: drawn on board, sent, then summed. */}
        {merged < 1 &&
          depths.map((_, drone) => {
            const at = mix(L.waveFrom[drone], L.cloudIn[drone], sent);
            const into = mix(at, L.sumAt, merged);
            const size = mix(L.waveSize, L.inSize, sent);
            return (
              <path
                key={DRONES[drone]}
                d={wave(seeds[drone], into, size, drawn)}
                fill="none"
                stroke={TONES[drone]}
                strokeWidth={1.4}
                strokeLinejoin="round"
                opacity={drawn > 0 ? 1 - merged * 0.7 : 0}
              />
            );
          })}

        {/* Their encrypted average, on to the command centre. */}
        {merged > 0 && opened < 1 && (
          <path
            d={wave(
              sumSeed,
              mix(L.sumAt, commandWave, onward),
              mix(L.sumSize, [44, 22], onward),
            )}
            fill="none"
            stroke={COLOR.warm}
            strokeWidth={1.6}
            strokeLinejoin="round"
            opacity={merged * (1 - opened)}
          />
        )}

        {/* The naval command centre, which alone can decrypt. */}
        <g>
          <text
            x={L.command[0]}
            y={L.command[1] - 48}
            textAnchor="middle"
            className={styles.name}
            fill={COLOR.ink}
          >
            Naval command centre
          </text>
          <rect
            x={L.command[0] - 34}
            y={L.command[1] - 24}
            width={68}
            height={44}
            rx={5}
            fill={COLOR.ground}
            stroke={opened > 0 ? COLOR.ok : COLOR.muted}
            strokeWidth={1.5}
          />
          <path
            d={`M${L.command[0]} ${L.command[1] + 20}v12M${L.command[0] - 14} ${L.command[1] + 32}h28`}
            stroke={COLOR.muted}
            strokeWidth={1.5}
          />
          <g opacity={opened}>
            <text
              x={L.answer[0]}
              y={L.answer[1]}
              textAnchor="middle"
              className={styles.big}
              fill={COLOR.ok}
            >
              {`${average.toFixed(2)} m`}
            </text>
            <text
              x={L.answer[0]}
              y={L.answer[1] + 28}
              textAnchor="middle"
              className={styles.small}
              fill={COLOR.muted}
            >
              Fleet average, decrypted
            </text>
          </g>
        </g>

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
            {`STEP ${stage + 1}/${STAGES.length}`}
          </text>
          <text
            x={wide ? 128 : 104}
            y={32}
            className={wide ? styles.status : styles.statusSmall}
            fill={stage === STAGES.length - 1 ? COLOR.ok : COLOR.ink}
          >
            {STAGES[stage]?.text}
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
              onClick={() => setPlaying(!running)}
            >
              <ControlIcon name={running ? "pause" : "play"} />
            </button>
          )}
          {!still && (
            <button
              type="button"
              className={styles.control}
              aria-label="Next step"
              onClick={next}
            >
              <ControlIcon name="next" />
            </button>
          )}
          <button
            type="button"
            className={styles.control}
            aria-label="Reset the depths"
            onClick={() => setDepths(START)}
          >
            <ControlIcon name="reset" />
          </button>
        </div>
        <div className={styles.sliders}>
          {depths.map((depth, drone) => (
            <label key={DRONES[drone]} className={styles.slider}>
              <span>{DRONES[drone]}</span>
              <input
                type="range"
                min={480}
                max={520}
                step={0.1}
                value={depth}
                aria-label={`Drone ${DRONES[drone]}'s depth, in metres`}
                style={{ accentColor: TONES[drone] }}
                onChange={(event) =>
                  setDepths((list) =>
                    list.map((item, index) =>
                      index === drone ? Number(event.target.value) : item,
                    ),
                  )
                }
              />
            </label>
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
        {running ? "" : `${STAGES[stage]?.text}. Fleet average ${average.toFixed(2)} metres.`}
      </p>
    </div>
  );
}
