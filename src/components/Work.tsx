"use client";

import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useReducedMotion } from "framer-motion";
import { useIntro } from "./SiteIntro";
import { SplitFlapText } from "./SplitFlapText";
import { projects, type Project } from "./projects";
import { useInView } from "./useInView";
import styles from "./Work.module.css";

const heading = [{ text: "SELECTED WORK", className: styles.headingLine }];

/**
 * Projects as 3.5" floppy disks. Hovering one lifts it and slides its metal shutter open;
 * choosing it "inserts" the disk, which morphs into its file window (and back on close).
 */
export function Work() {
  const { playFlap } = useIntro();
  const sectionRef = useRef<HTMLElement>(null);
  const inView = useInView(sectionRef, 0.2);
  const [open, setOpen] = useState<{ project: Project; disk: HTMLElement } | null>(
    null,
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

      <ul className={styles.disks}>
        {projects.map((project, index) => (
          <li key={project.id}>
            <FloppyDisk
              project={project}
              index={index}
              onOpen={(disk) => setOpen({ project, disk })}
            />
          </li>
        ))}
      </ul>

      <DiskWindow
        project={open?.project ?? null}
        disk={open?.disk ?? null}
        onClosed={() => setOpen(null)}
      />
    </section>
  );
}

function FloppyDisk({
  project,
  index,
  onOpen,
}: {
  project: Project;
  index: number;
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
      style={{ "--disk": project.disk, "--disk-ink": project.ink } as CSSProperties}
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
          <span>{String(index + 1).padStart(2, "0")}</span>
          <span>{project.context === "Spotmies" ? "Spotmies" : "Project"}</span>
        </span>
        <span className={styles.labelTitle}>{project.title}</span>
        <span className={styles.labelKind}>{project.kind}</span>
        <span className={styles.labelRole}>{project.role}</span>
      </span>
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
