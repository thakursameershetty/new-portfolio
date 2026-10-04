"use client";

import {
  useCallback,
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type Ref,
} from "react";
import { flushSync } from "react-dom";
import { useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { Reel } from "./CrtPreview";
import crt from "./CrtPreview.module.css";
import { GestureHints, type GestureHint } from "./GestureHints";
import { useIntro } from "./SiteIntro";
import { SplitFlapText } from "./SplitFlapText";
import type { DiskBoxScene, ScreenRect } from "./diskBox3d";
import { onTilt } from "./deviceTilt";
import { Marquee } from "./Marquee";
import { ProjectView } from "./ProjectView";
import {
  disciplines,
  projects,
  readingMinutes,
  stageOf,
  type Project,
} from "./projects";
import { useInView } from "./useInView";
import Image from "next/image";
import { ArrowIcon } from "./icons/ArrowIcon";
import { MATERIAL_PATHS } from "./icons/MaterialIcon";
import styles from "./Work.module.css";

const heading = [{ text: "SELECTED WORK", className: styles.headingLine }];
const workHints: GestureHint[] = [
  {
    gesture: "Hover",
    does: "a project to play it",
    device: "mouse",
  },
  { gesture: "Click", does: "to open its case study", device: "mouse" },
  { gesture: "Tap", does: "a project to open its case study", device: "touch" },
];

const shelves = [
  {
    id: "spotmies",
    title: "Spotmies",
    note: "Client work",
    projects: projects.filter((project) => project.context === "Spotmies"),
  },
  {
    id: "personal",
    title: "Personal",
    note: "Hobby & academic",
    projects: projects.filter((project) => project.context === "Project"),
  },
];
// The few marked to start with, and their count in a word for the line under the heading.
const featuredCount = projects.filter((project) => project.featured).length;
const numberWord = (count: number) =>
  ["no", "one", "two", "three", "four", "five", "six"][count] ?? String(count);

/** The star on the "featured" stickers and tags: Material Symbols Rounded's, filled. */
function StarGlyph({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 -960 960 960"
      className={clsx(styles.star, className)}
    >
      <path d={MATERIAL_PATHS.starFill} />
    </svg>
  );
}

// Disks are numbered straight through both boxes.
const firstNumbers = shelves.map((_, index) =>
  shelves
    .slice(0, index)
    .reduce((count, shelf) => count + shelf.projects.length, 1),
);
// Both boxes are framed for the fuller one, so their disks come out the same size.
const fitSlots = Math.max(...shelves.map((shelf) => shelf.projects.length));

const diskColors = (project: Project) =>
  ({ "--disk": project.disk, "--disk-ink": project.ink }) as CSSProperties;

const padNumber = (number: number) => String(number).padStart(2, "0");

/**
 * Projects as 3.5" floppy disks, kept in two clear plastic disk boxes: Spotmies client work,
 * and personal work. Opening a box deals its disks out; choosing a disk "inserts" it, which
 * morphs it into its file, full screen (and back on close). The open file has its own URL,
 * /work/<id>, pushed onto the history so Back closes it; the same path loads a standalone
 * page (src/app/work/[id]) when visited directly.
 */
export function Work() {
  const { playFlap, playCue, setHum } = useIntro();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, 0.2);
  const [open, setOpen] = useState<{
    project: Project;
    disk: HTMLElement | null;
  } | null>(null);
  const windowRef = useRef<DiskWindowHandle>(null);
  const openIdRef = useRef<string | null>(null);
  useEffect(() => {
    openIdRef.current = open?.project.id ?? null;
  }, [open]);

  // The open file follows the history: Back closes it (with the morph), Forward reopens it.
  useEffect(() => {
    const handlePop = () => {
      const id = viewedProject();
      if (!id) {
        if (openIdRef.current) windowRef.current?.close();
        return;
      }
      const project = projects.find((entry) => entry.id === id);
      if (project && id !== openIdRef.current)
        setOpen({ project, disk: findDisk(project) });
    };
    window.addEventListener("popstate", handlePop);
    return () => window.removeEventListener("popstate", handlePop);
  }, []);
  const previewIdRef = useRef<string | null>(null);
  const hideTimerRef = useRef(0);

  // A hovered card turns into a monitor and plays its project. The set hums while one is
  // on; leaving waits a beat, so sliding from one card to the next changes channel instead
  // of switching off and on.
  // The lists' how-to hints bow out once a project has been previewed or opened.
  const [hintsDone, setHintsDone] = useState(false);
  const showPreview = useCallback(
    (next: { project: Project; number: number } | null) => {
      window.clearTimeout(hideTimerRef.current);
      if (!next) {
        hideTimerRef.current = window.setTimeout(() => {
          previewIdRef.current = null;
          setHum(false);
        }, 140);
        return;
      }
      // Switching on.
      if (!previewIdRef.current) {
        playCue("crtOn");
        setHum(true);
      }
      previewIdRef.current = next.project.id;
    },
    [playCue, setHum],
  );

  useEffect(
    () => () => {
      window.clearTimeout(hideTimerRef.current);
      setHum(false);
    },
    [setHum],
  );

  return (
    <section
      ref={sectionRef}
      id="work"
      className={styles.work}
      aria-labelledby="work-heading"
    >
      <h2
        id="work-heading"
        className={styles.heading}
        aria-label="Selected work"
      >
        <span aria-hidden="true">
          <SplitFlapText lines={heading} active={inView} onFlap={playFlap} />
        </span>
      </h2>
      <p className={styles.startLine}>
        Short on time? You can go with the {numberWord(featuredCount)} marked{" "}
        <StarGlyph className={styles.startStar} />
        <span className={styles.srOnly}>(Featured)</span>.
      </p>

      <div className={styles.shelves}>
        {shelves.map((shelf, index) => (
          <DiskBox
            key={shelf.id}
            id={shelf.id}
            place={index}
            title={shelf.title}
            note={shelf.note}
            projects={shelf.projects}
            firstNumber={firstNumbers[index]}
            hintsDone={hintsDone}
            onOpen={(project, disk) => {
              setHintsDone(true);
              window.clearTimeout(hideTimerRef.current);
              previewIdRef.current = null;
              setHum(false);
              setOpen({ project, disk });
              window.history.pushState(
                { projectView: project.id },
                "",
                `/work/${project.id}`,
              );
            }}
            onPreview={(next) => {
              if (next) setHintsDone(true);
              showPreview(next);
            }}
          />
        ))}
      </div>

      <DiskWindow
        ref={windowRef}
        project={open?.project ?? null}
        disk={open?.disk ?? null}
        onClosed={() => setOpen(null)}
        onSelect={(project) => {
          // Paging to a neighbour swaps the file in place, and its URL with it.
          window.history.replaceState(
            { projectView: project.id },
            "",
            `/work/${project.id}`,
          );
          setOpen({ project, disk: findDisk(project) });
        }}
      />
    </section>
  );
}

/** The parts of a floppy disk, inside any element with the `disk` class. */
function DiskFace({ project, number }: { project: Project; number: number }) {
  return (
    <>
      {/* The metal shutter, over the dark disk and its hub; it slides open on hover. */}
      <span aria-hidden="true" className={styles.media}>
        <span className={styles.hub} />
      </span>
      <span aria-hidden="true" className={styles.shutter}>
        <span className={styles.shutterWindow} />
      </span>
      <span aria-hidden="true" className={styles.protect} />
      {project.featured && (
        <span aria-hidden="true" className={styles.starSticker}>
          <StarGlyph />
        </span>
      )}

      {/* The paper label. */}
      <span className={styles.labelPaper}>
        <span className={styles.labelBand}>
          <span>{padNumber(number)}</span>
          <span>{project.context === "Spotmies" ? "Spotmies" : "Project"}</span>
        </span>
        <span className={styles.labelTitle}>{project.title}</span>
        <span className={styles.labelKind}>{project.kind}</span>
        <span className={styles.labelRole}>{project.role}</span>
      </span>
    </>
  );
}

// The transform that puts `element`, as laid out now, over `rect` on screen, scaled from its
// top left.
function placeOver(element: Element, rect: ScreenRect) {
  const now = element.getBoundingClientRect();
  return `translate(${rect.left - now.left}px, ${rect.top - now.top}px) scale(${rect.width / now.width})`;
}

// Each row is its own stacking context, so a disk in flight lifts its whole row over the box.
function flyOverBox(disk: HTMLElement) {
  const row = disk.closest("li");
  row?.setAttribute("data-flying", "");
  return row;
}

const flight = { duration: 620, easing: "cubic-bezier(0.45, 0, 0.2, 1)" };
const flightBack = {
  duration: 480,
  stagger: 70,
  easing: "cubic-bezier(0.45, 0, 0.2, 1)",
};
// The list's room opening and closing, so the page below glides instead of jumping.
// An even ease in and out: an ease-out would shove the page most of the way in one frame.
const room = {
  open: 850,
  close: 620,
  easing: "cubic-bezier(0.65, 0, 0.35, 1)",
};
const copyIn = { duration: 380, easing: "cubic-bezier(0.22, 1, 0.36, 1)" };

// Grow an element from nothing to its laid-out height (margin included), or back.
function growRoom(element: HTMLElement) {
  const height = `${element.offsetHeight}px`;
  const margin = getComputedStyle(element).marginTop;
  return element.animate(
    [
      { height: "0px", marginTop: "0px" },
      { height, marginTop: margin },
    ],
    { duration: room.open, easing: room.easing },
  );
}

function shrinkRoom(element: HTMLElement) {
  const height = `${element.offsetHeight}px`;
  const margin = getComputedStyle(element).marginTop;
  return element.animate(
    [
      { height, marginTop: margin },
      { height: "0px", marginTop: "0px" },
    ],
    { duration: room.close, easing: room.easing, fill: "forwards" },
  );
}

// A project's details settling in beside its disk, or leaving before it.
function showCopy(copy: HTMLElement, delay = 0) {
  copy.style.opacity = "";
  return copy.animate(
    [
      { opacity: 0, transform: "translateY(10px)" },
      { opacity: 1, transform: "none" },
    ],
    { ...copyIn, delay, fill: "backwards" },
  );
}

// A card's cover coming up on the hero's grid as its disk lands: 8 × 5 cells laid over the
// picture go out one after another, nearest the disk's corner (top left) first; back in,
// farthest first, before the disk flies home. Each cell's place in the order is its
// --delay, a fraction of the sweep.
const cellColumns = 8;
const cellRows = 5;
const cells = Array.from({ length: cellColumns * cellRows }, (_, index) => {
  const x = index % cellColumns;
  const y = Math.floor(index / cellColumns);
  const reach =
    Math.hypot(x / (cellColumns - 1), y / (cellRows - 1)) / Math.SQRT2;
  return { key: index, delay: reach.toFixed(3) };
});
const sweep = 520;

// A card's frame (the empty dark rectangle its picture comes up in) arriving as its disk
// heads for it, rising and settling into place, and leaving the same way once its picture
// has gone back to the grid.
function showFrame(cover: HTMLElement, delay = 0) {
  cover.style.opacity = "";
  return cover.animate(
    [
      { opacity: 0, transform: "translateY(14px) scale(0.97)" },
      { opacity: 1, transform: "none" },
    ],
    {
      duration: 420,
      delay,
      easing: "cubic-bezier(0.22, 1, 0.36, 1)",
      fill: "backwards",
    },
  );
}

function hideFrame(cover: HTMLElement, delay = 0) {
  return cover.animate(
    [
      { opacity: 1, transform: "none" },
      { opacity: 0, transform: "translateY(10px) scale(0.97)" },
    ],
    { duration: 260, delay, easing: "ease-in", fill: "forwards" },
  );
}

function revealCover(cover: HTMLElement, delay = 0) {
  cover.removeAttribute("data-covered");
  return [...cover.querySelectorAll<HTMLElement>(`.${styles.cell}`)].map(
    (cell) => {
      const at = Number(cell.style.getPropertyValue("--delay"));
      return cell.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: 140,
        delay: delay + at * sweep,
        easing: "steps(2, end)",
        fill: "backwards",
      });
    },
  );
}

function hideCover(cover: HTMLElement) {
  cover.setAttribute("data-covered", "");
  return [...cover.querySelectorAll<HTMLElement>(`.${styles.cell}`)].map(
    (cell) => {
      const at = Number(cell.style.getPropertyValue("--delay"));
      return cell.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: 90,
        delay: (1 - at) * 200,
        easing: "steps(2, end)",
        fill: "backwards",
      });
    },
  );
}

function hideCopy(copy: HTMLElement) {
  return copy.animate([{ opacity: 1 }, { opacity: 0 }], {
    duration: 200,
    easing: "ease-in",
    fill: "forwards",
  });
}

// One disk box: a three.js box once it has loaded (the CSS box stands in until then, and
// for good if WebGL is missing or motion is reduced), and its disks dealt out below it.
// Disks cross between the two worlds at the same spot on screen: the 3D disk hides as the
// HTML one appears, and back.
function DiskBox({
  id,
  place,
  title,
  note,
  projects,
  firstNumber,
  onOpen,
  onPreview,
  hintsDone,
}: {
  id: string;
  place: number;
  title: string;
  note: string;
  projects: Project[];
  firstNumber: number;
  onOpen: (project: Project, disk: HTMLElement) => void;
  onPreview: (preview: { project: Project; number: number } | null) => void;
  /** The visitor has previewed or opened a project, so the list's hints can go. */
  hintsDone: boolean;
}) {
  const { playCue } = useIntro();
  const reduceMotion = useReducedMotion();
  const [dealt, setDealt] = useState(false);
  const [scene, setScene] = useState<DiskBoxScene | null>(null);
  // Set when the 3D box can't be built (no WebGL): the CSS box is then the box for good.
  const [sceneFailed, setSceneFailed] = useState(false);
  const boxRef = useRef<HTMLButtonElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const diskRefs = useRef<(HTMLDivElement | null)[]>([]);
  const copyRefs = useRef<(HTMLDivElement | null)[]>([]);
  const coverRefs = useRef<(HTMLDivElement | null)[]>([]);
  // The card that's a monitor (hovered a beat), and the one whose disk has seated and is on
  // air. Each card's disk has its own run of slides, so leaving one card mid-insert while
  // entering the next can't strand either disk.
  const [playing, setPlaying] = useState<number | null>(null);
  const [onAir, setOnAir] = useState<number | null>(null);
  const playingRef = useRef<number | null>(null);
  const playTimerRef = useRef(0);
  const driveRef = useRef<
    { token: number; slide: Animation | null; mini: Animation | null }[]
  >([]);
  useEffect(() => () => window.clearTimeout(playTimerRef.current), []);
  const dealtRef = useRef(dealt);
  // The scene is built once; this lets its knocks always reach the current sound setting.
  const playCueRef = useRef(playCue);
  const movingRef = useRef(false);
  // The box opens itself once per visit, and never again after the visitor closes it.
  const openedRef = useRef(false);

  useLayoutEffect(() => {
    dealtRef.current = dealt;
    playCueRef.current = playCue;
  }, [dealt, playCue]);

  // Load three.js and build the box once it's getting close to the screen.
  useEffect(() => {
    const box = boxRef.current;
    const canvas = canvasRef.current;
    if (reduceMotion || !box || !canvas) return;
    let cancelled = false;
    let built: DiskBoxScene | null = null;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        observer.disconnect();
        import("./diskBox3d")
          .then(({ createDiskBoxScene }) =>
            createDiskBoxScene(
              canvas,
              projects.map((project, index) => ({
                title: project.title,
                kind: project.kind,
                role: project.role,
                tag: project.context === "Spotmies" ? "Spotmies" : "Project",
                number: firstNumber + index,
                disk: project.disk,
                ink: project.ink,
                featured: project.featured,
              })),
              {
                label: title,
                fitSlots,
                dealt: dealtRef.current,
                onKnock: () => playCueRef.current("diskTap"),
                onRattle: () => playCueRef.current("diskRattle"),
              },
            ),
          )
          .then((ready) => {
            if (cancelled) {
              ready.dispose();
              return;
            }
            built = ready;
            setScene(ready);
          })
          // No WebGL: the CSS box stays.
          .catch(() => {
            if (!cancelled) setSceneFailed(true);
          });
      },
      // Well ahead of it: the build is done in pieces (see diskBox3d), so it can start early
      // without holding up the page, and is ready by the time the box comes into view.
      { rootMargin: "1200px 0px" },
    );
    observer.observe(box);

    return () => {
      cancelled = true;
      observer.disconnect();
      built?.dispose();
    };
  }, [firstNumber, projects, reduceMotion, title]);

  // On phones, the box follows the phone's tilt while it's on screen.
  useEffect(() => {
    const box = boxRef.current;
    if (!scene || !box) return;
    let stopTilt: (() => void) | null = null;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry?.isIntersecting && !stopTilt) {
        stopTilt = onTilt((x, y) => {
          if (!movingRef.current) scene.tilt(x, y);
        });
      } else if (!entry?.isIntersecting && stopTilt) {
        stopTilt();
        stopTilt = null;
        scene.tilt(0, 0);
      }
    });
    observer.observe(box);
    return () => {
      observer.disconnect();
      stopTilt?.();
    };
  }, [scene]);

  const takeOut = useCallback(() => {
    playCue("boxOpen");
    // Lay the list out first so it has a height to grow to and spots for the disks.
    flushSync(() => setDealt(true));
    const list = listRef.current;
    if (reduceMotion || !list) return;
    growRoom(list);

    if (!scene) {
      // No 3D box: the entries just settle in, one after another.
      copyRefs.current.forEach((copy, index) => {
        if (copy) showCopy(copy, 200 + index * 60);
      });
      diskRefs.current.forEach((disk, index) => {
        if (disk) showCopy(disk, 200 + index * 60);
      });
      coverRefs.current.forEach((cover, index) => {
        if (!cover) return;
        cover.setAttribute("data-covered", "");
        showFrame(cover, 120 + index * 60);
        revealCover(cover, 380 + index * 60);
      });
      return;
    }

    movingRef.current = true;
    for (const disk of diskRefs.current) if (disk) disk.style.opacity = "0";
    for (const copy of copyRefs.current) if (copy) copy.style.opacity = "0";
    for (const cover of coverRefs.current) {
      if (!cover) continue;
      cover.setAttribute("data-covered", "");
      cover.style.opacity = "0";
    }

    scene
      .open(
        (index, rect) => {
          const disk = diskRefs.current[index];
          const copy = copyRefs.current[index];
          if (!disk) return;
          disk.style.opacity = "";
          const row = flyOverBox(disk);
          disk
            .animate(
              [{ transform: placeOver(disk, rect) }, { transform: "none" }],
              flight,
            )
            .finished.catch(() => {})
            .finally(() => row?.removeAttribute("data-flying"));
          // The details arrive as the disk lands, and its cover opens out from it.
          if (copy) showCopy(copy, flight.duration * 0.65);
          const cover = coverRefs.current[index];
          if (cover) {
            showFrame(cover, flight.duration * 0.25);
            revealCover(cover, flight.duration * 0.85);
          }
        },
        () => playCue("diskOut"),
      )
      .then(() => playCue("arrive"))
      .finally(() => {
        movingRef.current = false;
      });
  }, [playCue, reduceMotion, scene]);

  const putBack = useCallback(async () => {
    const list = listRef.current;
    if (reduceMotion || !list) {
      playCue("boxClose");
      setDealt(false);
      return;
    }
    movingRef.current = true;

    if (!scene) {
      playCue("boxClose");
      for (const copy of copyRefs.current) if (copy) hideCopy(copy);
      await Promise.all(
        coverRefs.current.map((cover, index) =>
          cover
            ? Promise.all(
                [...hideCover(cover), hideFrame(cover, 160 + index * 40)].map(
                  (animation) => animation.finished.catch(() => {}),
                ),
              )
            : null,
        ),
      );
      await shrinkRoom(list).finished.catch(() => {});
      setDealt(false);
      movingRef.current = false;
      return;
    }

    // The details and covers go first, then the box comes forward and each disk flies home.
    for (const copy of copyRefs.current) if (copy) hideCopy(copy);
    coverRefs.current.forEach((cover, index) => {
      if (!cover) return;
      hideCover(cover);
      hideFrame(cover, 200 + index * 40);
    });
    await scene.returnToFront();

    await Promise.all(
      projects.map(async (_, index) => {
        const disk = diskRefs.current[index];
        await new Promise((resolve) =>
          window.setTimeout(resolve, flightBack.stagger * index),
        );
        if (!disk) return;
        const over = placeOver(disk, scene.liftedRect(index));
        flyOverBox(disk);
        await disk
          .animate([{ transform: "none" }, { transform: over }], {
            duration: flightBack.duration,
            easing: flightBack.easing,
            fill: "forwards",
          })
          .finished.catch(() => {});
        disk.style.opacity = "0";
        // Timed so its seating clack lands with the disk.
        playCue("diskIn");
        await scene.dropIn(index);
      }),
    );

    // The lid shuts while the list's room closes up.
    playCue("boxClose");
    await Promise.all([
      scene.shut(),
      shrinkRoom(list).finished.catch(() => {}),
    ]);
    setDealt(false);
    movingRef.current = false;
  }, [playCue, projects, reduceMotion, scene]);

  // A card's disk into the drive in its monitor's top, and back out to its corner, done as
  // the old floating monitor did it. The card's disk lifts off its corner, turns upside down
  // (a disk goes in shutter first) and shrinks to the monitor's disk, over the slot right of
  // centre; there the monitor's own little disk takes over and slides in, leaving its label
  // end (band and number) out of the slot. Out again in reverse. Sizes are the old monitor's
  // pixels times --u (in CSS), worked out here from the cover's width.
  const driveFor = (index: number) =>
    (driveRef.current[index] ??= { token: 0, slide: null, mini: null });

  const run = (
    element: HTMLElement,
    keyframes: Keyframe[],
    timing: KeyframeAnimationOptions,
    keep: (animation: Animation) => void,
  ) => {
    const animation = element.animate(keyframes, {
      ...timing,
      duration: reduceMotion ? 0 : timing.duration,
      fill: "forwards",
    });
    keep(animation);
    return animation.finished.then(
      () => true,
      () => false,
    );
  };

  // The old monitor's measures (its pixels), and where its disk sits, out and seated.
  const monitorPixel = (cover: HTMLElement) => cover.offsetWidth / 292;
  const overSlot = (disk: HTMLElement, cover: HTMLElement) => {
    const u = monitorPixel(cover);
    const width = 84 * u;
    const left = -14 * u + 0.58 * 320 * u;
    const top = -14 * u - 92 * u;
    const dx = left + width / 2 - (disk.offsetLeft + disk.offsetWidth / 2);
    const dy = top + width / 2 - (disk.offsetTop + disk.offsetHeight / 2);
    return `translate(${dx}px, ${dy}px) rotate(180deg) scale(${width / disk.offsetWidth})`;
  };

  const insertDisk = async (index: number) => {
    const disk = diskRefs.current[index];
    const cover = coverRefs.current[index];
    const mini = cover?.querySelector<HTMLElement>(`.${styles.miniDisk}`);
    if (!disk || !cover || !mini) return;
    const drive = driveFor(index);
    const token = ++drive.token;
    const u = monitorPixel(cover);
    const at = (y: number) => `translateY(${y * u}px)`;
    drive.mini?.cancel();
    disk.setAttribute("data-lift", "");
    disk.style.transformOrigin = "50% 50%";
    disk.style.opacity = "";
    const from = getComputedStyle(disk).transform;
    drive.slide?.cancel();
    if (
      !(await run(
        disk,
        [
          { transform: from === "none" ? "none" : from },
          { transform: overSlot(disk, cover) },
        ],
        { duration: 260, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        (animation) => (drive.slide = animation),
      )) ||
      drive.token !== token
    )
      return;
    // The monitor's disk takes over where the card's is, and slides in.
    disk.style.opacity = "0";
    if (
      !(await run(
        mini,
        [
          { transform: at(-92), opacity: 1, offset: 0 },
          {
            transform: at(-92),
            opacity: 1,
            offset: 0.25,
            easing: "cubic-bezier(0.5, 0, 0.9, 0.6)",
          },
          { transform: at(-11), opacity: 1 },
        ],
        { duration: 210 },
        (animation) => (drive.mini = animation),
      )) ||
      drive.token !== token
    )
      return;
    playCue("driveLoad");
    window.setTimeout(
      () => {
        if (drive.token === token) setOnAir(index);
      },
      reduceMotion ? 0 : 110,
    );
  };

  const ejectDisk = async (index: number) => {
    const disk = diskRefs.current[index];
    const cover = coverRefs.current[index];
    const mini = cover?.querySelector<HTMLElement>(`.${styles.miniDisk}`);
    if (!disk || !cover || !mini) return;
    const drive = driveFor(index);
    const token = ++drive.token;
    const u = monitorPixel(cover);
    const at = (y: number) => `translateY(${y * u}px)`;
    setOnAir((now) => (now === index ? null : now));
    playCue("driveEject");
    const style = getComputedStyle(mini);
    drive.mini?.cancel();
    if (
      !(await run(
        mini,
        [
          { transform: style.transform, opacity: style.opacity },
          { transform: at(-92), opacity: 1, offset: 0.75 },
          { transform: at(-98), opacity: 0 },
        ],
        { duration: 120, easing: "cubic-bezier(0.2, 0.9, 0.3, 1)" },
        (animation) => (drive.mini = animation),
      )) ||
      drive.token !== token
    )
      return;
    // The card's disk is back where the monitor's left the slot, and flies home.
    disk.style.opacity = "";
    const from = getComputedStyle(disk).transform;
    drive.slide?.cancel();
    if (
      !(await run(
        disk,
        [
          { transform: from === "none" ? overSlot(disk, cover) : from },
          { transform: "none" },
        ],
        { duration: 320, easing: "cubic-bezier(0.22, 1, 0.36, 1)" },
        (animation) => (drive.slide = animation),
      )) ||
      drive.token !== token
    )
      return;
    drive.slide?.cancel();
    drive.slide = null;
    disk.style.transformOrigin = "";
    disk.removeAttribute("data-lift");
  };

  // Opens by itself once the box has settled into view: mostly on screen for a moment, so it
  // doesn't go off while someone flicks past. Side by side, the second box follows a beat
  // after the first. Waits for the 3D box (unless it won't come), so the opening plays.
  useEffect(() => {
    const box = boxRef.current;
    if (!box || openedRef.current || (!scene && !sceneFailed && !reduceMotion))
      return;
    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        window.clearTimeout(timer);
        if (!entry || entry.intersectionRatio < 0.6) return;
        timer = window.setTimeout(
          () => {
            if (openedRef.current || movingRef.current || dealtRef.current)
              return;
            openedRef.current = true;
            observer.disconnect();
            takeOut();
          },
          400 + place * 500,
        );
      },
      { threshold: [0, 0.6] },
    );
    observer.observe(box);
    return () => {
      observer.disconnect();
      window.clearTimeout(timer);
    };
  }, [place, reduceMotion, scene, sceneFailed, takeOut]);

  const hint = dealt
    ? "Click the box to put them back"
    : "Click to take them out";

  return (
    <div className={styles.shelf} data-place={place} data-dealt={dealt}>
      <div className={styles.shelfCell}>
        {/* The shelf's name, beside its box (above it on phones), with what kind of work
            it holds and, while it's shut, what's inside. */}
        <h3 className={styles.shelfTitle}>
          <span className={styles.shelfNumber}>{padNumber(place + 1)} /</span>
          {title}
        </h3>

        <button
          ref={boxRef}
          type="button"
          className={styles.box}
          data-3d={scene ? "" : undefined}
          onMouseEnter={() => playCue(dealt ? "tap" : "rattle")}
          onPointerMove={(event) => {
            if (event.pointerType !== "mouse" || !scene) return;
            const rect = event.currentTarget.getBoundingClientRect();
            scene.pointer(
              ((event.clientX - rect.left) / rect.width) * 2 - 1,
              1 - ((event.clientY - rect.top) / rect.height) * 2,
            );
          }}
          onPointerLeave={() => scene?.leave()}
          onClick={() => {
            if (movingRef.current) return;
            // Opened or closed by hand, it's the visitor's now: no more opening by itself.
            openedRef.current = true;
            if (dealt) void putBack();
            else takeOut();
          }}
          aria-expanded={dealt}
          aria-controls={`${id}-disks`}
          aria-label={
            dealt
              ? `Put the ${title} disks back in their box`
              : `Open the ${title} disk box: ${projects.length} projects`
          }
        >
          {/* The CSS box: shown until the 3D one is ready, and instead of it without WebGL. */}
          <span aria-hidden="true" className={styles.boxBody}>
            <span className={styles.lid} />
            <span className={styles.boxBack} />
            {projects.map((project, index) => (
              <span
                key={project.id}
                className={clsx(styles.disk, styles.still, styles.ghost)}
                style={
                  { ...diskColors(project), "--slot": index } as CSSProperties
                }
              >
                <DiskFace project={project} number={firstNumber + index} />
              </span>
            ))}
            <span className={styles.boxFront}>
              <span className={styles.boxLabel}>
                <span>{title}</span>
                <span>{padNumber(projects.length)} disks</span>
              </span>
            </span>
          </span>
          <canvas ref={canvasRef} aria-hidden="true" className={styles.stage} />
        </button>

        <p className={styles.shelfNote}>
          {note}
          <span className={styles.shelfHint}> · {hint}</span>
        </p>
        {/* What's inside, readable without opening anything, as the box's index: each disk
            on its own line, three to a column; once it's open, the cards say it all. */}
        {!dealt && (
          <ol className={styles.shelfIndex}>
            {projects.map((project, index) => (
              <li key={project.id}>
                <span className={styles.shelfIndexNumber}>
                  {padNumber(firstNumber + index)}
                </span>
                {project.title}
              </li>
            ))}
          </ol>
        )}
      </div>

      {dealt && (
        <div ref={listRef} className={styles.dealt}>
          {/* Which box these are from, pinned at the top while its cards scroll by, so a
              second shelf's cards never read as more of the first's. */}
          <div aria-hidden="true" className={styles.shelfTag}>
            <span className={styles.shelfTagInner}>
              <span className={styles.shelfTagBox} />
              {padNumber(place + 1)} · {title}
              <span className={styles.shelfTagCount}>
                {padNumber(projects.length)} disks
              </span>
            </span>
          </div>
          {/* The list's header: its name, and, on the right, how to use it for the device in
              hand (mice get the monitor preview on hover; touch screens don't, so they're only
              told about opening), until a project has been previewed or opened. */}
          <div className={styles.dealtHead}>
            {/* The shelf's name is beside its box, just above; this one's for screen readers. */}
            <p className={styles.srOnly}>
              {title} · {note}
            </p>
            <div
              className={styles.listHints}
              data-hidden={hintsDone || undefined}
            >
              <GestureHints hints={workHints} active />
            </div>
          </div>
          <ul id={`${id}-disks`} className={styles.entries}>
            {projects.map((project, index) => (
              <li
                key={project.id}
                className={styles.entry}
                data-playing={playing === index || undefined}
                onPointerEnter={(event) => {
                  if (event.pointerType !== "mouse") return;
                  window.clearTimeout(playTimerRef.current);
                  playTimerRef.current = window.setTimeout(() => {
                    if (movingRef.current) return;
                    playingRef.current = index;
                    setPlaying(index);
                    void insertDisk(index);
                    onPreview({ project, number: firstNumber + index });
                  }, 140);
                }}
                onPointerLeave={() => {
                  window.clearTimeout(playTimerRef.current);
                  if (playingRef.current === index) {
                    playingRef.current = null;
                    setPlaying(null);
                    void ejectDisk(index);
                  }
                  onPreview(null);
                }}
                onClick={(event) => {
                  // Anywhere on the row opens the case study, growing out of its disk; the
                  // row's own buttons and links do their own thing.
                  if ((event.target as HTMLElement).closest("a, button"))
                    return;
                  const disk = diskRefs.current[index]?.querySelector("button");
                  if (!disk) return;
                  playCue("insert");
                  onOpen(project, disk);
                }}
              >
                <EntryCover
                  ref={(cover) => {
                    coverRefs.current[index] = cover;
                  }}
                  project={project}
                  number={firstNumber + index}
                  playing={playing === index}
                  onAir={onAir === index}
                />
                <div
                  ref={(disk) => {
                    diskRefs.current[index] = disk;
                  }}
                  className={styles.entryDisk}
                >
                  <FloppyDisk
                    project={project}
                    number={firstNumber + index}
                    onOpen={(disk) => onOpen(project, disk)}
                  />
                </div>
                <div
                  ref={(copy) => {
                    copyRefs.current[index] = copy;
                  }}
                  className={styles.entryCopy}
                >
                  <EntryCopy
                    project={project}
                    number={firstNumber + index}
                    onOpen={() => {
                      // The window grows out of the disk, whichever was clicked.
                      const disk =
                        diskRefs.current[index]?.querySelector("button");
                      if (disk) onOpen(project, disk);
                    }}
                  />
                </div>
                <EntryNote project={project} />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

// The covers' width in an image's `sizes`, shared with the monitor's reel so a still it
// plays that's also the cover is the file already loaded.
const coverSizes = "(max-width: 720px) 100vw, 580px";

/** A project's first picture (a clip's poster), the cover its card leads with. */
function coverOf(project: Project) {
  if (project.cover) return project.cover;
  const first = project.media?.[0];
  if (!first) return null;
  return first.type === "video" ? first.poster : first.src;
}

// The card's cover: the project's first picture in a dark rounded frame, its disk tossed
// over the top left corner (laid over it in CSS). As the disk lands, the picture comes up
// cell by cell from that corner, on the hero's grid (the cells, laid over it, go out one by
// one, nearest the disk first).
// Hovered, the card turns into the monitor: the frame becomes its cream body, the picture
// its curved, scanlined screen, with the drive's slot in its top and the chin under it
// (channel, title, the drive's light and the power light). Snow while the disk loads, then
// a burst of static and the project's reel, as on the old monitor (its parts and styles).
function EntryCover({
  project,
  number,
  playing,
  onAir,
  ref,
}: {
  project: Project;
  number: number;
  playing: boolean;
  onAir: boolean;
  ref: React.Ref<HTMLDivElement>;
}) {
  const cover = coverOf(project);
  return (
    <div ref={ref} aria-hidden="true" className={styles.entryCover}>
      {/* The monitor: its drive (behind the body, so the body's top hides the disk inside),
          the body with the slot and chin, and the stand. */}
      <div className={styles.crtDrive}>
        <div
          className={clsx(crt.disk, styles.miniDisk)}
          style={diskColors(project)}
        >
          <span className={crt.diskShutter} />
          <span className={crt.diskLabel}>
            <span className={crt.diskBand}>{padNumber(number)}</span>
            <span className={crt.diskTitle}>{project.title}</span>
          </span>
        </div>
      </div>
      <div className={styles.crtBody}>
        <span className={styles.crtSlot} />
        <div className={styles.crtChin}>
          <span className={crt.channel}>
            {onAir ? `CH ${padNumber(number)}` : "LOAD"}
          </span>
          <span className={crt.title}>{project.title}</span>
          {/* A featured project's star, stuck on the chin by the lights. */}
          {project.featured && (
            <span className={styles.chinStar}>
              <StarGlyph />
            </span>
          )}
          <span
            className={clsx(
              crt.activity,
              playing && !onAir && styles.driveBusy,
            )}
          />
          <span className={crt.power} />
        </div>
      </div>
      <div className={styles.crtStand} />
      <div
        className={clsx(styles.entryScreen, project.boards && styles.boards)}
      >
        {cover && (
          <Image
            src={cover}
            alt=""
            fill
            sizes={coverSizes}
            className={styles.entryCoverImage}
          />
        )}
        {/* The reel starts as the monitor comes on, out of sight under the snow, so the
            clip is already loaded and running when the disk has seated and it's shown. */}
        {playing && (
          <span className={clsx(styles.reel, onAir && styles.reelOn)}>
            <Reel
              key={project.id}
              media={project.media ?? []}
              sizes={coverSizes}
            />
          </span>
        )}
        {playing && !onAir && <span className={crt.snow} />}
        {onAir && <span className={crt.static} />}
        <span className={clsx(crt.scanlines, styles.crtLayer)} />
        <span className={clsx(crt.glass, styles.crtLayer)} />
        <span className={styles.cells}>
          {cells.map(({ key, delay }) => (
            <span
              key={key}
              className={styles.cell}
              style={{ "--delay": delay } as CSSProperties}
            />
          ))}
        </span>
      </div>
    </div>
  );
}

// While its card is a monitor, the card's text gives way to the project's note, on a label
// like the disks' (ruled cream paper, a band in the disk's colour): the role, the line about
// it and the main tools, and what a click does.
function EntryNote({ project }: { project: Project }) {
  return (
    <div
      aria-hidden="true"
      className={styles.entryNote}
      style={diskColors(project)}
    >
      <span className={styles.noteBand}>{project.role}</span>
      <span className={styles.noteText}>{project.blurb}</span>
      <span className={styles.noteStack}>
        {project.stack.slice(0, 4).join(" · ")}
      </span>
      <span className={styles.noteOpen}>
        Click to open the {project.mini ? "mini project" : "case study"}
        <ArrowIcon direction="up-right" size={12} animated={false} />
      </span>
    </div>
  );
}

// A project's row beside its disk: enough to choose from at a glance. The whole story
// (highlights and all) is in its window, opened from the title or the disk.
function EntryCopy({
  project,
  number,
  onOpen,
}: {
  project: Project;
  number: number;
  onOpen: () => void;
}) {
  const { playCue } = useIntro();
  const minutes = readingMinutes(project);
  const stage = stageOf(project);

  return (
    <>
      <div className={styles.entryMain}>
        <h4 className={styles.entryTitle}>
          <span className={styles.entryNumber}>{padNumber(number)}</span>
          <button
            type="button"
            className={styles.entryOpen}
            onMouseEnter={() => playCue("tap")}
            onClick={() => {
              playCue("insert");
              onOpen();
            }}
            aria-label={`${project.title}: open the case study`}
          >
            <Marquee>{project.title}</Marquee>
          </button>
        </h4>
        <p className={styles.entryKind}>
          <Marquee>{project.kind}</Marquee>
        </p>
        {/* The tags on a row of their own, so "Featured" sits in the same place on every
            card, whatever the length of the kind before it. */}
        {(stage || project.featured) && (
          <p className={styles.entryTags}>
            {stage && <span className={styles.entryStage}>{stage}</span>}
            {project.featured && (
              <span className={styles.entryFeatured}>
                <StarGlyph />
                Featured
              </span>
            )}
          </p>
        )}
        <p className={styles.entrySummary}>{project.blurb}</p>
      </div>

      <div className={styles.entrySide}>
        <p className={styles.entryRole}>{project.role}</p>
        {/* Each tool kept whole, so a line only breaks between them. */}
        <p className={styles.entryStack}>
          {project.stack.map((item, index) => (
            <span key={item}>
              {index > 0 && " · "}
              <span className={styles.entryTool}>{item}</span>
            </span>
          ))}
        </p>
        <p className={styles.entryDisciplines}>
          {disciplines
            .filter((discipline) => project.disciplines.includes(discipline.id))
            .map((discipline) => discipline.label)
            .join(" · ")}
        </p>
      </div>

      {/* The way into the project's story: "Case study", with how long it takes to read
          under it (the same count as on the case study itself). A project without one
          opens its overview. The live sites are linked from inside each case study. */}
      <div className={styles.entryAction}>
        <button
          type="button"
          className={styles.entryLink}
          onMouseEnter={() => playCue("tap")}
          onClick={() => {
            playCue("insert");
            onOpen();
          }}
          aria-label={
            minutes > 0
              ? `${project.title}: open the ${project.mini ? "mini project" : "case study"}, a ${minutes} minute read`
              : `${project.title}: open the details`
          }
        >
          <span className={styles.entryLinkLabel}>
            {minutes > 0
              ? project.mini
                ? "Mini project"
                : "Case study"
              : "Details"}
          </span>
          <ArrowIcon direction="up-right" size={14} />
        </button>
        {minutes > 0 && (
          <span aria-hidden="true" className={styles.entryTime}>
            {minutes} min<span className={styles.entryTimeRest}> read</span>
          </span>
        )}
      </div>
    </>
  );
}

function FloppyDisk({
  project,
  number,
  onOpen,
}: {
  project: Project;
  number: number;
  onOpen: (disk: HTMLElement) => void;
}) {
  const { playCue } = useIntro();
  // The insert sound starts on press, so it leads the window (which opens on release) instead
  // of trailing it through audio output latency. Keyboard presses play it on click instead.
  const soundedRef = useRef(false);

  return (
    <button
      type="button"
      className={styles.disk}
      style={diskColors(project)}
      data-disk={project.id}
      onMouseEnter={() => playCue("shutter")}
      onFocus={() => playCue("shutter")}
      onPointerDown={() => {
        playCue("insert");
        soundedRef.current = true;
      }}
      onPointerLeave={() => {
        soundedRef.current = false;
      }}
      onClick={(event) => {
        if (!soundedRef.current) playCue("insert");
        soundedRef.current = false;
        onOpen(event.currentTarget);
      }}
      aria-label={`${project.title}: ${project.kind}. Open project details`}
    >
      <DiskFace project={project} number={number} />
    </button>
  );
}

// The project's file, full screen. Opening, the disk dissolves into a block of its colour
// that grows from the disk's exact spot to fill the screen, turning cream, and the file fades
// in as it lands; closing plays it in reverse, back into the disk (or simply fades, if that
// disk isn't on screen). A native <dialog> handles focus, Esc and the page behind.
const morphOpen = { duration: 480, easing: "cubic-bezier(0.22, 1, 0.36, 1)" };
const morphClose = { duration: 380, easing: "cubic-bezier(0.4, 0, 0.2, 1)" };
const windowColor = "#f4f0e6";

type DiskWindowHandle = { close: () => void };

// The project the current history entry shows, if it's one this page pushed.
function viewedProject(): string | null {
  const state: unknown = window.history.state;
  if (state && typeof state === "object" && "projectView" in state) {
    return typeof state.projectView === "string" ? state.projectView : null;
  }
  return null;
}

// A project's disk in the dealt-out lists, if its box is open.
function findDisk(project: Project) {
  return document.querySelector<HTMLElement>(`[data-disk="${project.id}"]`);
}

function onScreen(element: HTMLElement | null): element is HTMLElement {
  if (!element?.isConnected) return false;
  const rect = element.getBoundingClientRect();
  return rect.bottom > 0 && rect.top < window.innerHeight && rect.width > 0;
}

// Undoes the fades that hid a disk in the list while its file was open.
function restoreDisk(disk: HTMLElement) {
  for (const animation of disk.getAnimations()) animation.cancel();
}

function DiskWindow({
  project,
  disk,
  onClosed,
  onSelect,
  ref,
}: {
  project: Project | null;
  disk: HTMLElement | null;
  onClosed: () => void;
  onSelect: (project: Project) => void;
  ref: Ref<DiskWindowHandle>;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLElement>(null);
  const morphRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const shownIdRef = useRef<string | null>(null);
  // The disk in the list that's hidden while its file is open (it became the window). Paging
  // to a neighbour moves the gap to that neighbour's disk, so this one has to come back.
  const hiddenDiskRef = useRef<HTMLElement | null>(null);
  const { playCue } = useIntro();
  const reduceMotion = useReducedMotion();

  // The disk's box and the screen's, as keyframes for the morphing block.
  const boxes = useCallback(() => {
    if (!onScreen(disk)) return null;
    const from = disk.getBoundingClientRect();
    return {
      disk: {
        left: `${from.left}px`,
        top: `${from.top}px`,
        width: `${from.width}px`,
        height: `${from.height}px`,
        borderRadius: `${from.width * 0.045}px`,
        backgroundColor: project?.disk ?? windowColor,
      },
      window: {
        left: "0px",
        top: "0px",
        width: `${window.innerWidth}px`,
        height: `${window.innerHeight}px`,
        borderRadius: "0px",
        backgroundColor: windowColor,
      },
    };
  }, [disk, project]);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    const morph = morphRef.current;
    if (!dialog || !project || !panel || !morph) return;

    // Already open: paged to another project, so start it from the top and fade it in. The
    // disk it was opened from goes back in its place in the list, and the new one's disk
    // leaves a gap instead, for closing to shrink back into.
    if (dialog.open) {
      if (shownIdRef.current === project.id) return;
      shownIdRef.current = project.id;
      dialog.scrollTop = 0;
      if (hiddenDiskRef.current && hiddenDiskRef.current !== disk) {
        restoreDisk(hiddenDiskRef.current);
        hiddenDiskRef.current = null;
      }
      if (disk && !reduceMotion) {
        disk.animate({ opacity: [0, 0] }, { duration: 1, fill: "forwards" });
        hiddenDiskRef.current = disk;
      }
      if (!reduceMotion) panel.animate({ opacity: [0, 1] }, { duration: 220 });
      return;
    }

    closingRef.current = false;
    shownIdRef.current = project.id;
    dialog.showModal();
    // showModal focuses the first button inside, the first section tick, which then wears a
    // focus ring whenever the browser counts the open as keyboard-led (a key pressed last,
    // or the page loaded straight onto a case study). Focus the window itself instead: it's
    // still where Tab starts from, but nothing is ringed until someone actually tabs.
    dialog.focus({ preventScroll: true });
    dialog.scrollTop = 0;
    if (reduceMotion) return;

    const box = boxes();
    if (!box || !disk) {
      dialog.animate({ opacity: [0, 1] }, { duration: 220 });
      return;
    }
    morph.style.display = "block";
    disk.animate({ opacity: [1, 0] }, { duration: 140, fill: "forwards" });
    hiddenDiskRef.current = disk;
    const grow = morph.animate([box.disk, box.window], {
      ...morphOpen,
      fill: "forwards",
    });
    panel.animate(
      { opacity: [0, 1] },
      { duration: 200, delay: morphOpen.duration * 0.6, fill: "backwards" },
    );
    grow.finished
      .then(() => {
        morph.style.display = "none";
      })
      .catch(() => {});
  }, [boxes, disk, project, reduceMotion]);

  const close = () => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    const morph = morphRef.current;
    if (!dialog?.open || closingRef.current) return;
    closingRef.current = true;

    const finish = () => {
      dialog.close();
      dialog.classList.remove(styles.closing);
      for (const animation of dialog.getAnimations()) animation.cancel();
      if (disk) restoreDisk(disk);
      // Whichever disk is still hidden comes back too, even if it's not the one closed into.
      if (hiddenDiskRef.current) restoreDisk(hiddenDiskRef.current);
      hiddenDiskRef.current = null;
      shownIdRef.current = null;
      onClosed();
    };

    if (reduceMotion || !panel || !morph) {
      finish();
      return;
    }
    const box = boxes();
    if (!box || !disk) {
      dialog
        .animate({ opacity: [1, 0] }, { duration: 200, fill: "forwards" })
        .finished.then(finish, finish);
      return;
    }

    dialog.classList.add(styles.closing);
    morph.style.display = "block";
    panel.animate({ opacity: [1, 0] }, { duration: 120, fill: "forwards" });
    const shrink = morph.animate([box.window, box.disk], {
      ...morphClose,
      fill: "forwards",
    });
    disk.animate(
      { opacity: [0, 1] },
      { duration: 140, delay: morphClose.duration - 140, fill: "forwards" },
    );
    shrink.finished
      .then(() => {
        morph.style.display = "none";
        for (const animation of panel.getAnimations()) animation.cancel();
        finish();
      })
      .catch(finish);
  };

  useImperativeHandle(ref, () => ({ close }));

  // Closing from the file itself steps back through the history when it pushed an entry, so
  // Back and the close button agree; the popstate that follows runs the close.
  const requestClose = () => {
    if (viewedProject()) window.history.back();
    else close();
  };

  return (
    <dialog
      ref={dialogRef}
      className={styles.window}
      aria-labelledby="project-title"
      tabIndex={-1}
      onCancel={(event) => {
        // Esc: close with the morph instead of instantly.
        event.preventDefault();
        requestClose();
      }}
    >
      {/* The block that morphs between the disk and the screen. */}
      <div ref={morphRef} aria-hidden="true" className={styles.morph} />
      {project && (
        <ProjectView
          ref={panelRef}
          project={project}
          className={styles.panel}
          onClose={requestClose}
          onSelect={onSelect}
          onTap={() => playCue("tap")}
          onCue={playCue}
        />
      )}
    </dialog>
  );
}
