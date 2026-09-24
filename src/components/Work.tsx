"use client";

import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { flushSync } from "react-dom";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { CrtPreview } from "./CrtPreview";
import { useIntro } from "./SiteIntro";
import { SplitFlapText } from "./SplitFlapText";
import type { DiskBoxScene, ScreenRect } from "./diskBox3d";
import { onTilt } from "./deviceTilt";
import { projects, type Project } from "./projects";
import { useInView } from "./useInView";
import styles from "./Work.module.css";

const heading = [{ text: "SELECTED WORK", className: styles.headingLine }];

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
// Disks are numbered straight through both boxes.
const firstNumbers = shelves.map((_, index) =>
  shelves.slice(0, index).reduce((count, shelf) => count + shelf.projects.length, 1),
);
// Both boxes are framed for the fuller one, so their disks come out the same size.
const fitSlots = Math.max(...shelves.map((shelf) => shelf.projects.length));

const diskColors = (project: Project) =>
  ({ "--disk": project.disk, "--disk-ink": project.ink }) as CSSProperties;

const padNumber = (number: number) => String(number).padStart(2, "0");

/**
 * Projects as 3.5" floppy disks, kept in two clear plastic disk boxes: Spotmies client work,
 * and personal work. Opening a box deals its disks out; choosing a disk "inserts" it, which
 * morphs it into its file window (and back on close).
 */
export function Work() {
  const { playFlap, playCue, setHum } = useIntro();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, 0.2);
  const [open, setOpen] = useState<{ project: Project; disk: HTMLElement } | null>(
    null,
  );
  const [preview, setPreview] = useState<{ project: Project; number: number } | null>(
    null,
  );
  const previewIdRef = useRef<string | null>(null);
  const hideTimerRef = useRef(0);

  // The monitor follows the hovered row. Leaving waits a beat, so sliding from one row to
  // the next changes channel instead of switching the monitor off and on.
  const showPreview = useCallback(
    (next: { project: Project; number: number } | null) => {
      window.clearTimeout(hideTimerRef.current);
      if (!next) {
        hideTimerRef.current = window.setTimeout(() => {
          previewIdRef.current = null;
          setPreview(null);
          setHum(false);
        }, 140);
        return;
      }
      // Switching on, or changing channel.
      if (!previewIdRef.current) {
        playCue("crtOn");
        setHum(true);
      } else if (next.project.id !== previewIdRef.current) {
        playCue("channel");
      }
      previewIdRef.current = next.project.id;
      setPreview(next);
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
      <p className={styles.label}>Work</p>
      <h2 id="work-heading" className={styles.heading} aria-label="Selected work">
        <span aria-hidden="true">
          <SplitFlapText lines={heading} active={inView} onFlap={playFlap} />
        </span>
      </h2>

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
            onOpen={(project, disk) => {
              window.clearTimeout(hideTimerRef.current);
              previewIdRef.current = null;
              setPreview(null);
              setHum(false);
              setOpen({ project, disk });
            }}
            onPreview={showPreview}
          />
        ))}
      </div>

      <CrtPreview project={preview?.project ?? null} number={preview?.number ?? 0} />

      <DiskWindow
        project={open?.project ?? null}
        disk={open?.disk ?? null}
        onClosed={() => setOpen(null)}
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

const flight = { duration: 620, easing: "cubic-bezier(0.45, 0, 0.2, 1)" };
const flightBack = { duration: 480, stagger: 70, easing: "cubic-bezier(0.45, 0, 0.2, 1)" };
// The list's room opening and closing, so the page below glides instead of jumping.
// An even ease in and out: an ease-out would shove the page most of the way in one frame.
const room = { open: 850, close: 620, easing: "cubic-bezier(0.65, 0, 0.35, 1)" };
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
}: {
  id: string;
  place: number;
  title: string;
  note: string;
  projects: Project[];
  firstNumber: number;
  onOpen: (project: Project, disk: HTMLElement) => void;
  onPreview: (preview: { project: Project; number: number } | null) => void;
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
      { rootMargin: "600px 0px" },
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
      return;
    }

    movingRef.current = true;
    for (const disk of diskRefs.current) if (disk) disk.style.opacity = "0";
    for (const copy of copyRefs.current) if (copy) copy.style.opacity = "0";

    scene
      .open((index, rect) => {
        const disk = diskRefs.current[index];
        const copy = copyRefs.current[index];
        if (!disk) return;
        disk.style.opacity = "";
        disk.animate([{ transform: placeOver(disk, rect) }, { transform: "none" }], flight);
        // The details arrive as the disk lands.
        if (copy) showCopy(copy, flight.duration * 0.65);
      }, () => playCue("diskOut"))
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
      await shrinkRoom(list).finished.catch(() => {});
      setDealt(false);
      movingRef.current = false;
      return;
    }

    // The details go first, then the box comes forward and each disk flies home.
    for (const copy of copyRefs.current) if (copy) hideCopy(copy);
    await scene.returnToFront();

    await Promise.all(
      projects.map(async (_, index) => {
        const disk = diskRefs.current[index];
        await new Promise((resolve) => window.setTimeout(resolve, flightBack.stagger * index));
        if (!disk) return;
        const over = placeOver(disk, scene.liftedRect(index));
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
    await Promise.all([scene.shut(), shrinkRoom(list).finished.catch(() => {})]);
    setDealt(false);
    movingRef.current = false;
  }, [playCue, projects, reduceMotion, scene]);

  // Opens by itself once the box has settled into view: mostly on screen for a moment, so it
  // doesn't go off while someone flicks past. Side by side, the second box follows a beat
  // after the first. Waits for the 3D box (unless it won't come), so the opening plays.
  useEffect(() => {
    const box = boxRef.current;
    if (!box || openedRef.current || (!scene && !sceneFailed && !reduceMotion)) return;
    let timer = 0;
    const observer = new IntersectionObserver(
      ([entry]) => {
        window.clearTimeout(timer);
        if (!entry || entry.intersectionRatio < 0.6) return;
        timer = window.setTimeout(
          () => {
            if (openedRef.current || movingRef.current || dealtRef.current) return;
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

  const hint = dealt ? "Click the box to put them back." : "Click the box to take them out.";

  return (
    <div className={styles.shelf} data-place={place} data-dealt={dealt}>
      <div className={styles.shelfCell}>
        <div className={styles.shelfHead}>
          <h3 className={styles.shelfTitle}>{title}</h3>
          <p className={styles.shelfNote}>
            {note} · {padNumber(projects.length)} disks
          </p>
        </div>

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
                style={{ ...diskColors(project), "--slot": index } as CSSProperties}
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

        {/* What's inside, readable without opening anything. */}
        <p className={styles.shelfIndex}>
          {projects.map((project) => project.title).join(" · ")}
        </p>
        <p className={styles.shelfHint}>{hint}</p>
      </div>

      {dealt && (
        <div ref={listRef} className={styles.dealt}>
          <p className={styles.dealtLabel}>
            {title} · {note}
          </p>
          <ul id={`${id}-disks`} className={styles.entries}>
            {projects.map((project, index) => (
              <li
                key={project.id}
                className={styles.entry}
                onPointerEnter={(event) => {
                  if (event.pointerType === "mouse") {
                    onPreview({ project, number: firstNumber + index });
                  }
                }}
                onPointerLeave={() => onPreview(null)}
              >
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
                      const disk = diskRefs.current[index]?.querySelector("button");
                      if (disk) onOpen(project, disk);
                    }}
                  />
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
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

  return (
    <>
      <div className={styles.entryMain}>
        <h4 className={styles.entryTitle}>
          <span className={styles.entryNumber}>{padNumber(number)}</span>
          <button
            type="button"
            className={styles.entryOpen}
            onMouseEnter={() => playCue("tap")}
            onClick={onOpen}
          >
            {project.title}
          </button>
        </h4>
        <p className={styles.entryKind}>{project.kind}</p>
        <p className={styles.entrySummary}>{project.summary}</p>
      </div>

      <div className={styles.entrySide}>
        <p className={styles.entryRole}>{project.role}</p>
        <p className={styles.entryStack}>{project.stack.join(" · ")}</p>
      </div>

      <div className={styles.entryAction}>
        {project.link && (
          <a
            href={project.link.href}
            target="_blank"
            rel="noreferrer noopener"
            className={styles.entryLink}
            onMouseEnter={() => playCue("tap")}
            aria-label={`Visit ${project.link.label} (opens in a new tab)`}
          >
            <span className={styles.entryLinkLabel}>{project.link.label}</span> ↗
          </a>
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

// The project's file, in a small retro window. Opening, the disk dissolves into a block of
// its colour that grows from the disk's exact spot into the window, turning cream and rounding
// its corners, and the contents fade in as it lands; closing plays it in reverse, back into
// the disk. A native <dialog> handles focus, Esc and the backdrop.
const morphOpen = { duration: 480, easing: "cubic-bezier(0.22, 1, 0.36, 1)" };
const morphClose = { duration: 380, easing: "cubic-bezier(0.4, 0, 0.2, 1)" };
const windowColor = "#f4f0e6";

function DiskWindow({
  project,
  disk,
  onClosed,
}: {
  project: Project | null;
  disk: HTMLElement | null;
  onClosed: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const morphRef = useRef<HTMLDivElement>(null);
  const closingRef = useRef(false);
  const { playCue } = useIntro();
  const reduceMotion = useReducedMotion();

  // The disk's box and the window's box, as keyframes for the morphing block.
  const boxes = useCallback(() => {
    const panel = panelRef.current;
    if (!disk || !panel) return null;
    const from = disk.getBoundingClientRect();
    const to = panel.getBoundingClientRect();
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
        left: `${to.left}px`,
        top: `${to.top}px`,
        width: `${to.width}px`,
        height: `${to.height}px`,
        borderRadius: "10px",
        backgroundColor: windowColor,
      },
    };
  }, [disk, project]);

  useLayoutEffect(() => {
    const dialog = dialogRef.current;
    const panel = panelRef.current;
    const morph = morphRef.current;
    if (!dialog || !project || !disk || !panel || !morph || dialog.open) return;

    closingRef.current = false;
    dialog.showModal();
    if (reduceMotion) return;

    const box = boxes();
    if (!box) return;
    morph.style.display = "block";
    disk.animate({ opacity: [1, 0] }, { duration: 140, fill: "forwards" });
    const grow = morph.animate([box.disk, box.window], { ...morphOpen, fill: "forwards" });
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
    if (!dialog || closingRef.current) return;
    closingRef.current = true;

    const finish = () => {
      dialog.close();
      dialog.classList.remove(styles.closing);
      if (disk) {
        for (const animation of disk.getAnimations()) animation.cancel();
      }
      onClosed();
    };

    const box = boxes();
    if (reduceMotion || !panel || !morph || !disk || !box) {
      finish();
      return;
    }

    dialog.classList.add(styles.closing);
    morph.style.display = "block";
    panel.animate({ opacity: [1, 0] }, { duration: 120, fill: "forwards" });
    const shrink = morph.animate([box.window, box.disk], { ...morphClose, fill: "forwards" });
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

  const fileName = project
    ? `${project.title.toUpperCase().replace(/[^A-Z0-9]+/g, "_").replace(/^_|_$/g, "")}.DSK`
    : "";

  return (
    <dialog
      ref={dialogRef}
      className={styles.window}
      aria-labelledby="disk-window-title"
      onCancel={(event) => {
        // Esc: close with the morph instead of instantly.
        event.preventDefault();
        close();
      }}
      onClick={(event) => {
        // A click on the backdrop (the dialog element itself, outside the panel) closes it.
        if (event.target === event.currentTarget) close();
      }}
    >
      {/* The block that morphs between the disk and the window. */}
      <div ref={morphRef} aria-hidden="true" className={styles.morph} />
      {project && (
        <div
          ref={panelRef}
          className={styles.panel}
          style={{ "--disk": project.disk, "--disk-ink": project.ink } as CSSProperties}
        >
          <div className={styles.titleBar}>
            <span className={styles.titleDisk} aria-hidden="true" />
            <span className={styles.fileName}>{fileName}</span>
            <button
              type="button"
              className={styles.close}
              onClick={close}
              onMouseEnter={() => playCue("tap")}
              aria-label="Close project"
            >
              ✕
            </button>
          </div>

          <div className={styles.body}>
            <p className={styles.meta}>
              {project.context === "Spotmies" ? "At Spotmies" : "Project"} · {project.role}
            </p>
            <h3 id="disk-window-title" className={styles.title}>
              {project.title}
            </h3>
            {project.media && project.media.length > 0 && (
              <MediaStrip media={project.media} />
            )}
            <p className={styles.summary}>{project.summary}</p>

            <ul className={styles.highlights}>
              {project.highlights.map((highlight) => (
                <li key={highlight}>{highlight}</li>
              ))}
            </ul>

            <ul className={styles.stack} aria-label="Tools">
              {project.stack.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>

            {project.link && (
              <a
                href={project.link.href}
                target="_blank"
                rel="noreferrer noopener"
                className={styles.visit}
                onMouseEnter={() => playCue("tap")}
              >
                Visit {project.link.label} ↗
                <span className={styles.srOnly}> (opens in a new tab)</span>
              </a>
            )}
          </div>
        </div>
      )}
    </dialog>
  );
}

// The project's screenshots and clips in the window, as a strip to swipe through. Clips only
// load once played.
function MediaStrip({ media }: { media: NonNullable<Project["media"]> }) {
  return (
    <ul className={styles.mediaStrip} aria-label="Screenshots and clips">
      {media.map((item) => (
        <li key={item.src} className={styles.mediaItem}>
          {item.type === "video" ? (
            <video
              src={item.src}
              poster={item.poster}
              controls
              muted
              playsInline
              preload="none"
              aria-label={item.alt}
            />
          ) : (
            <Image src={item.src} alt={item.alt} fill sizes="(min-width: 700px) 520px, 85vw" />
          )}
        </li>
      ))}
    </ul>
  );
}
