"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import clsx from "clsx";
import { useReducedMotion } from "framer-motion";
import { bookmarkCount } from "./inspirations";
import { useIntro } from "./SiteIntro";
import { useInView } from "./useInView";
import key from "./about/Keycap.module.css";
import styles from "./Personality.module.css";

// Where Thakur's design taste comes from, as files on an old desktop: each opens a
// Properties window with why, in his words.
const influences = [
  {
    file: "teenage.eng",
    name: "Teenage Engineering",
    icon: "/personality/teenage-engineering.svg",
    size: [312, 157],
    why: "Hardware that's serious about being playful. It's why the buttons here are keycaps and almost everything makes a sound.",
  },
  {
    file: "lego.brk",
    name: "LEGO",
    icon: "/personality/lego.svg",
    size: [180, 180],
    why: "Small parts that click together into something bigger. I draw rectangles that way, then build them that way.",
  },
  {
    file: "apple.app",
    name: "Apple",
    icon: "/personality/apple.svg",
    size: [814, 1000],
    why: "The care in the parts nobody asks for: a spring in a toggle, a haptic tap, the 200ms most people never notice.",
  },
  {
    file: "android.apk",
    name: "Android",
    icon: "/personality/android.svg",
    size: [120, 72],
    why: "The only robot allowed in here. Material taught me that motion should show where things come from and where they go.",
  },
] as const;

type File = (typeof influences)[number]["file"];

const blocks = 20;
// The bar stalls here for a moment on its way up, like an old installer.
const stallAt = 17;

/**
 * Between the work and the footer: a line on Thakur's habits, and beside it a Windows 98
 * dialog in the site's cream and red, "Yeah! I'm not a Robot": the brands his taste comes
 * from as desktop icons, each opening its Properties, then a bar loading his bookmarks as
 * it scrolls into view, with a button through to the Inspirations page. The window pops
 * open as it comes into view and can be dragged about by its title bar (a double-click
 * puts it back), and the title bar's buttons minimise it to a taskbar. In the line beside it, the owl can be poked and "click" is a key.
 */
export function Personality() {
  const { playCue } = useIntro();
  const sectionRef = useRef<HTMLElement>(null);
  const sectionInView = useInView(sectionRef, 0.2);
  const reduceMotion = useReducedMotion();
  const windowRef = useRef<HTMLDivElement>(null);
  const inView = useInView(windowRef, 0.4);
  const [progress, setProgress] = useState(0);
  const [minimized, setMinimized] = useState(false);
  const [maximized, setMaximized] = useState(false);
  const [open, setOpen] = useState<File | null>(null);
  // How many times "click" has been pressed: each press plays "design" and "build" again.
  const [plays, setPlays] = useState(0);
  const iconRefs = useRef<Partial<Record<File, HTMLButtonElement | null>>>({});
  const frameRef = useRef<HTMLDivElement>(null);
  // Where the window's been dragged to, from its place in the layout.
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const drag = useRef<{
    startX: number;
    startY: number;
    from: { x: number; y: number };
    min: { x: number; y: number };
    max: { x: number; y: number };
    moved: { x: number; y: number };
  } | null>(null);

  const target = inView ? 100 : 0;
  const loaded = progress === 100;

  // The bar creeps up a percent at a time, ticking as each block fills.
  useEffect(() => {
    if (progress >= target) return;
    const next = reduceMotion ? target : progress + 1;
    const delay = reduceMotion ? 0 : progress === stallAt ? 900 : 45;
    const timer = setTimeout(() => {
      setProgress(next);
      if (next === 100) playCue("arrive");
      else if (
        Math.floor((next * blocks) / 100) >
        Math.floor((progress * blocks) / 100)
      )
        playCue("detent");
    }, delay);
    return () => clearTimeout(timer);
  }, [progress, target, reduceMotion, playCue]);

  // The window's pop as it opens.
  useEffect(() => {
    if (inView) playCue("hop");
  }, [inView, playCue]);

  // Dragging by the title bar (with a mouse; on touch the bar scrolls the page as usual),
  // kept inside the section. Moved straight on the frame while dragging, then kept.
  const startDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.pointerType !== "mouse" || event.button !== 0) return;
    if ((event.target as Element).closest("button")) return;
    const frame = frameRef.current;
    const bounds = sectionRef.current?.getBoundingClientRect();
    if (!frame || !bounds) return;
    const rect = frame.getBoundingClientRect();
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = {
      startX: event.clientX,
      startY: event.clientY,
      from: offset,
      min: {
        x: offset.x - (rect.left - bounds.left - 12),
        y: offset.y - (rect.top - bounds.top - 12),
      },
      max: {
        x: offset.x + (bounds.right - 12 - rect.right),
        y: offset.y + (bounds.bottom - 12 - rect.bottom),
      },
      moved: offset,
    };
    frame.classList.add(styles.dragging);
    playCue("diskTap");
  };

  const moveDrag = (event: React.PointerEvent<HTMLDivElement>) => {
    const state = drag.current;
    const frame = frameRef.current;
    if (!state || !frame) return;
    const clamp = (value: number, low: number, high: number) =>
      Math.min(Math.max(value, low), high);
    state.moved = {
      x: clamp(
        state.from.x + event.clientX - state.startX,
        state.min.x,
        state.max.x,
      ),
      y: clamp(
        state.from.y + event.clientY - state.startY,
        state.min.y,
        state.max.y,
      ),
    };
    frame.style.translate = `${state.moved.x}px ${state.moved.y}px`;
  };

  const endDrag = () => {
    const state = drag.current;
    if (!state) return;
    drag.current = null;
    frameRef.current?.classList.remove(styles.dragging);
    setOffset(state.moved);
    playCue("land");
  };

  const filled = Math.floor((progress * blocks) / 100);
  const current = influences.find((influence) => influence.file === open);

  const closeProperties = () => {
    const file = open;
    setOpen(null);
    if (file) iconRefs.current[file]?.focus();
  };

  const minimize = () => {
    playCue("switchOff");
    setOpen(null);
    setMinimized(true);
  };

  return (
    <section
      ref={sectionRef}
      id="personality"
      className={styles.personality}
      aria-labelledby="personality-heading"
    >
      <h2 id="personality-heading" className={styles.label}>
        My design personality
      </h2>

      <div className={clsx(styles.layout, maximized && styles.wide)}>
        <p className={styles.quip}>
          I&rsquo;m a night{" "}
          <span className={styles.together}>
            owl
            <PokeOwl />,
          </span>{" "}
          my best ideas hoot after midnight.
          <span className={styles.nextLine}>
            I <DesignWord play={plays} /> and <BuildWord play={plays} />, so I
            get to make every button{" "}
            <ClickKey
              hint={sectionInView}
              onPress={() => setPlays((count) => count + 1)}
            />
            .
            <span className={styles.apology}>
              Sorry about all the sound effects.
            </span>
          </span>
        </p>

        {minimized ? (
          <div className={styles.taskbar}>
            <button
              type="button"
              className={clsx(styles.button, styles.task)}
              onMouseEnter={() => playCue("tap")}
              onClick={() => {
                playCue("switchOn");
                setMinimized(false);
              }}
            >
              <Owl className={styles.taskOwl} />
              Yeah! I&rsquo;m not a Robot
            </button>
            <Clock />
          </div>
        ) : (
          <div
            ref={frameRef}
            className={clsx(styles.frame, inView && styles.popped)}
            style={{ translate: `${offset.x}px ${offset.y}px` }}
          >
            <div ref={windowRef} className={styles.window}>
              <div
                className={clsx(styles.titleBar, styles.handle)}
                onPointerDown={startDrag}
                onPointerMove={moveDrag}
                onPointerUp={endDrag}
                onPointerCancel={endDrag}
                onDoubleClick={(event) => {
                  if ((event.target as Element).closest("button")) return;
                  playCue("diskIn");
                  setOffset({ x: 0, y: 0 });
                }}
              >
                <h3 className={styles.title}>
                  Yeah! I&rsquo;m not a Robot
                  <span aria-hidden="true" className={styles.extension}>
                    .exe
                  </span>
                </h3>
                <div className={styles.controls}>
                  <TitleButton label="Minimise" onPress={minimize}>
                    <path d="M2 8h6v2H2z" />
                  </TitleButton>
                  <TitleButton
                    label={maximized ? "Restore" : "Maximise"}
                    onPress={() => {
                      playCue("land");
                      setMaximized(!maximized);
                      setOffset({ x: 0, y: 0 });
                    }}
                  >
                    <path d="M1 1h9v9H1zM2 3v6h7V3z" fillRule="evenodd" />
                  </TitleButton>
                  <TitleButton label="Close" onPress={minimize}>
                    <path d="M1 1h2l2 2 2-2h2L6 4.5 9 8H7L5 6 3 8H1l3-3.5z" />
                  </TitleButton>
                </div>
              </div>

              <div className={styles.body}>
                <div className={styles.statusRow}>
                  <Owl className={styles.owl} />
                  <p className={styles.status}>Personality loaded from:</p>
                </div>
                <ul className={styles.icons}>
                  {influences.map((influence) => (
                    <li key={influence.file}>
                      <button
                        ref={(element) => {
                          iconRefs.current[influence.file] = element;
                        }}
                        type="button"
                        aria-haspopup="dialog"
                        aria-label={`${influence.name}: properties`}
                        className={clsx(
                          styles.icon,
                          open === influence.file && styles.iconOpen,
                        )}
                        onMouseEnter={() => playCue("tap")}
                        onClick={() => {
                          playCue("hop");
                          setOpen(influence.file);
                        }}
                      >
                        <span className={styles.iconArt}>
                          <Image
                            src={influence.icon}
                            alt=""
                            width={influence.size[0]}
                            height={influence.size[1]}
                            className={styles.iconImage}
                          />
                        </span>
                        <span className={styles.iconLabel}>
                          {influence.file}
                        </span>
                      </button>
                    </li>
                  ))}
                </ul>

                <div className={styles.verify}>
                  <p className={styles.from}>
                    {loaded
                      ? `${bookmarkCount} inspirations loaded ✓`
                      : "Loading inspirations…"}
                  </p>
                  <div className={styles.barRow}>
                    <div
                      role="progressbar"
                      aria-label="Loading inspirations"
                      aria-valuemin={0}
                      aria-valuemax={100}
                      aria-valuenow={progress}
                      className={styles.bar}
                    >
                      {Array.from({ length: blocks }, (_, i) => (
                        <span
                          key={i}
                          className={clsx(
                            styles.block,
                            i < filled && styles.blockOn,
                          )}
                        />
                      ))}
                    </div>
                    <span aria-hidden="true" className={styles.percent}>
                      {progress}%
                    </span>
                  </div>
                  <p className={styles.eta} aria-live="polite">
                    {loaded
                      ? "Collected one tab at a time."
                      : "Estimated time left: after midnight…"}
                  </p>
                </div>

                <div className={styles.buttons}>
                  <Link
                    href="/inspirations"
                    onMouseEnter={() => playCue("tap")}
                    onPointerDown={() => playCue("land")}
                    className={clsx(styles.button, styles.linkButton)}
                  >
                    Open library
                  </Link>
                </div>
              </div>

              {current && (
                <Properties
                  key={current.file}
                  influence={current}
                  onClose={() => {
                    playCue("land");
                    closeProperties();
                  }}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

/** The owl in the line: poke it and it hops and blinks. */
function PokeOwl() {
  const { playCue } = useIntro();
  const [hops, setHops] = useState(0);
  return (
    <button
      type="button"
      aria-label="Poke the owl"
      className={styles.pokeOwl}
      onMouseEnter={() => playCue("tap")}
      onPointerDown={() => playCue("hop")}
      onClick={() => setHops((count) => count + 1)}
    >
      <Owl
        key={hops}
        className={clsx(styles.lineOwl, hops > 0 && styles.hop)}
      />
    </button>
  );
}

/** "click", set as a key in the line: the cream keycap of the site's Home and Résumé keys,
 *  pressing the same way with the same sounds (the hover tick, the landing on press; the
 *  home page doesn't listen for data-feel, so they're played here). It nudges down once
 *  when the section comes into view, so it reads as something to press. */
function ClickKey({ hint, onPress }: { hint: boolean; onPress: () => void }) {
  const { playCue } = useIntro();
  return (
    <button
      type="button"
      onMouseEnter={() => playCue("tap")}
      onPointerDown={() => playCue("land")}
      onClick={onPress}
      className={clsx(
        key.key,
        key.cream,
        styles.lineKey,
        hint && styles.lineKeyHint,
      )}
    >
      click
    </button>
  );
}

/**
 * "design", pressed into action by the "click" key: a selection box with corner handles
 * snaps round it, and the dot of its "i" turns into a vector anchor, Bézier handles
 * stretching out either side, before it all settles back into the word.
 */
function DesignWord({ play }: { play: number }) {
  const { playCue } = useIntro();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!play || reduceMotion) return;
    const timer = setTimeout(() => playCue("detent"), 120);
    return () => clearTimeout(timer);
  }, [play, reduceMotion, playCue]);

  return (
    <span
      key={play}
      className={clsx(
        styles.design,
        play > 0 && !reduceMotion && styles.designOn,
      )}
    >
      des
      <span className={styles.letterI}>
        i
        <span aria-hidden="true" className={styles.anchor}>
          <span className={clsx(styles.bezier, styles.bezierLeft)} />
          <span className={clsx(styles.bezier, styles.bezierRight)} />
        </span>
      </span>
      gn
      <span aria-hidden="true" className={styles.selection}>
        <span />
        <span />
        <span />
        <span />
      </span>
    </span>
  );
}

// The hammer's strikes, in ms after the press: each one clinks and squashes the word.
const strikes = [420, 720, 1020];

/**
 * "build", pressed into action by the "click" key: a pixel hammer (drawn like the owl)
 * swings down on it three times, squashing the word with each blow, and knocks a few
 * sparks off the last.
 */
function BuildWord({ play }: { play: number }) {
  const { playCue } = useIntro();
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    if (!play || reduceMotion) return;
    const timers = strikes.map((at) => setTimeout(() => playCue("clink"), at));
    return () => timers.forEach(clearTimeout);
  }, [play, reduceMotion, playCue]);

  return (
    <span
      key={play}
      className={clsx(
        styles.build,
        play > 0 && !reduceMotion && styles.buildOn,
      )}
    >
      <span className={styles.buildText}>build</span>
      <svg
        aria-hidden="true"
        viewBox="0 0 16 10"
        shapeRendering="crispEdges"
        className={styles.hammer}
      >
        {hammerPixels.map(({ ink, x, y }) => (
          <rect
            key={`${x}-${y}`}
            x={x}
            y={y}
            width="1"
            height="1"
            fill={hammerInk[ink]}
          />
        ))}
      </svg>
      <span aria-hidden="true" className={styles.sparks}>
        <span />
        <span />
        <span />
      </span>
    </span>
  );
}

// A 16×10 pixel hammer lying on its side, head on the left: D outline, M the steel head,
// S its shine, H the wooden handle, G the grip.
const hammerRows = [
  "DDDDD...........",
  "DSSMD...........",
  "DSMMD...........",
  "DMMMDDDDDDDDDDD.",
  "DMMMHHHHHHHGGGGD",
  "DMMMHHHHHHHGGGGD",
  "DMMMDDDDDDDDDDD.",
  "DMMMD...........",
  "DMMMD...........",
  "DDDDD...........",
];
const hammerInk: Record<string, string> = {
  D: "#1a0605",
  M: "#9aa1a6",
  S: "#eef0f1",
  H: "#a0673a",
  G: "#d63f39",
};
const hammerPixels = hammerRows.flatMap((row, y) =>
  Array.from(row)
    .map((ink, x) => ({ ink, x, y }))
    .filter((pixel) => pixel.ink !== "."),
);

/** A file's Properties: a smaller window over the dialog, with why it's on the desktop. */
function Properties({
  influence,
  onClose,
}: {
  influence: (typeof influences)[number];
  onClose: () => void;
}) {
  const okRef = useRef<HTMLButtonElement>(null);
  const titleId = `properties-${influence.file.replace(".", "-")}`;

  useEffect(() => okRef.current?.focus(), []);

  return (
    <div
      role="dialog"
      aria-labelledby={titleId}
      className={clsx(styles.window, styles.properties)}
      onKeyDown={(event) => {
        if (event.key === "Escape") onClose();
      }}
    >
      <div className={styles.titleBar}>
        <p id={titleId} className={styles.title}>
          {influence.file} Properties
        </p>
        <div className={styles.controls}>
          <TitleButton label="Close" onPress={onClose}>
            <path d="M1 1h2l2 2 2-2h2L6 4.5 9 8H7L5 6 3 8H1l3-3.5z" />
          </TitleButton>
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.fileHead}>
          <span className={styles.iconArt}>
            <Image
              src={influence.icon}
              alt=""
              width={influence.size[0]}
              height={influence.size[1]}
              className={styles.iconImage}
            />
          </span>
          <span className={styles.fileName}>{influence.name}</span>
        </div>
        <dl className={styles.fields}>
          <dt>Type:</dt>
          <dd>Design influence</dd>
          <dt>Location:</dt>
          <dd>C:\Thakur\Taste</dd>
        </dl>
        <p className={styles.why}>{influence.why}</p>
        <div className={styles.buttons}>
          <button
            ref={okRef}
            type="button"
            className={styles.button}
            onClick={onClose}
          >
            OK
          </button>
        </div>
      </div>
    </div>
  );
}

function TitleButton({
  label,
  onPress,
  children,
}: {
  label: string;
  onPress: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-label={label}
      className={clsx(styles.button, styles.control)}
      onClick={onPress}
    >
      <svg aria-hidden="true" viewBox="0 0 10 10" className={styles.glyph}>
        {children}
      </svg>
    </button>
  );
}

// The taskbar's clock, in the visitor's own time. Blank until mounted, so the server and
// the first render agree.
function Clock() {
  const [time, setTime] = useState("");

  useEffect(() => {
    const tick = () =>
      setTime(
        new Date().toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        }),
      );
    const first = setTimeout(tick, 0);
    const timer = setInterval(tick, 15_000);
    return () => {
      clearTimeout(first);
      clearInterval(timer);
    };
  }, []);

  return <span className={styles.clock}>{time}</span>;
}

// A 16×16 pixel owl, drawn from rows of its left half and mirrored: D outline, B feathers,
// L belly, W eye, Y iris, K pupil, O beak and feet. Its eyes blink now and then.
const owlHalf = [
  "........",
  "..D.....",
  "..DD....",
  "..DBBBBB",
  ".DBBBBBB",
  ".DBWWWWB",
  ".DWWYYWB",
  ".DWYKKYO",
  ".DWWYYWO",
  ".DBWWWWB",
  ".DBLLLLL",
  ".DBLBLBL",
  ".DBLLLLL",
  "..DBLBLB",
  "...DBBBB",
  "....O.O.",
];
const owlInk: Record<string, string> = {
  D: "#2a1a0e",
  B: "#7a4b2a",
  L: "#d9b48a",
  W: "#fff8ec",
  Y: "#f0c44c",
  K: "#111",
  O: "#e8862a",
};
const owlPixels = owlHalf.flatMap((half, y) =>
  Array.from(half + Array.from(half).reverse().join(""))
    .map((ink, x) => ({ ink, x, y }))
    .filter((pixel) => pixel.ink !== "."),
);

function Owl({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 16 16"
      shapeRendering="crispEdges"
      className={className}
    >
      {owlPixels.map(({ ink, x, y }) => (
        <rect
          key={`${x}-${y}`}
          x={x}
          y={y}
          width="1"
          height="1"
          fill={owlInk[ink]}
        />
      ))}
      {/* Lids that drop over both eyes for a blink. */}
      <g className={styles.lids} fill={owlInk.B}>
        <rect x="2" y="5" width="5" height="5" />
        <rect x="9" y="5" width="5" height="5" />
      </g>
    </svg>
  );
}
