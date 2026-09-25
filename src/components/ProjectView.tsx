"use client";

import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties, type Ref } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { CaseMonitor } from "./CaseMonitor";
import { ScreenViewer } from "./ScreenViewer";
import { useIntro } from "./SiteIntro";
import { SplitFlapText } from "./SplitFlapText";
import { caseSections, diskNumber, diskOrder, type Project } from "./projects";
import styles from "./ProjectView.module.css";

const padNumber = (number: number) => String(number).padStart(2, "0");

// A part becomes the current channel once its top passes this far down the screen (or, when
// the monitor is pinned above the story, a little below the monitor).
const readingLine = 0.38;

/**
 * A project's case study, full screen: a floating pill at the top (the project's disk and
 * name, a tick per part, and Eject), then the story, part by part, beside a CRT
 * (CaseMonitor) that plays each part's screens as its own channel. Reading changes the
 * channel; the remote's keys (on the set, the strip of keys on narrow screens, or the ticks)
 * scroll to their part. The neighbouring disks come last.
 *
 * The text arrives as it's reached: the title and each part's heading flip in on the
 * split-flap board, paragraphs and points rise in after them, and the parts you're not on
 * dim a little, so reading follows the channel.
 *
 * Shared by the overlay the disks open into (Work.tsx passes `onClose` and `onSelect`, so
 * closing and paging stay in place) and the standalone /work/[id] page (no handlers: they
 * become links).
 */
export function ProjectView({
  project,
  onClose,
  onSelect,
  onTap,
  onCue,
  className,
  ref,
}: {
  project: Project;
  onClose?: () => void;
  onSelect?: (project: Project) => void;
  /** Hover tick for the controls (the overlay's sound). */
  onTap?: () => void;
  /** The monitor's own sounds: its keys, the disk going in and out, and looking closer. */
  onCue?: (cue: "remoteKey" | "driveLoad" | "driveEject" | "insert") => void;
  className?: string;
  ref?: Ref<HTMLElement>;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { playFlap } = useIntro();
  const sections = useMemo(() => caseSections(project), [project]);
  const number = diskNumber(project);
  const index = diskOrder.findIndex((entry) => entry.id === project.id);
  const previous = diskOrder[(index - 1 + diskOrder.length) % diskOrder.length];
  const next = diskOrder[(index + 1) % diskOrder.length];

  const [channel, setChannel] = useState(0);
  // The item on the monitor being looked at closely, or null.
  const [closer, setCloser] = useState<number | null>(null);
  // Stepping back out of the closer look: the screen can move on again as the view shrinks.
  const [leaving, setLeaving] = useState(false);
  const screenRectRef = useRef<(() => DOMRect | null) | null>(null);
  const ejectRef = useRef<(() => Promise<void>) | null>(null);
  // Which parts have come into view (their text has arrived), and whether the title has.
  const [seen, setSeen] = useState<ReadonlySet<number>>(() => new Set());
  const [titleShown, setTitleShown] = useState(false);
  const [shownId, setShownId] = useState(project.id);
  if (shownId !== project.id) {
    setShownId(project.id);
    setChannel(0);
    setCloser(null);
    setLeaving(false);
    setSeen(new Set());
    setTitleShown(false);
  }

  // The text only waits to arrive once this has run, so it's all there without JavaScript.
  const viewRef = useRef<HTMLElement | null>(null);
  const setViewRef = useCallback(
    (node: HTMLElement | null) => {
      viewRef.current = node;
      if (typeof ref === "function") ref(node);
      else if (ref) ref.current = node;
    },
    [ref],
  );
  useEffect(() => {
    viewRef.current?.setAttribute("data-arriving", "");
  }, []);

  // The title flips in as the project opens (after the disk has grown into the page).
  useEffect(() => {
    const timer = window.setTimeout(() => setTitleShown(true), reduceMotion ? 0 : 320);
    return () => window.clearTimeout(timer);
  }, [project.id, reduceMotion]);

  // Reading drives the channel: the last part whose top has passed the reading line. While a
  // key's scroll is under way, it holds the key's channel instead.
  const partRefs = useRef<(HTMLElement | null)[]>([]);
  const stageRef = useRef<HTMLDivElement>(null);
  const heldRef = useRef(false);
  useEffect(() => {
    let frame = 0;
    let release = 0;
    const update = () => {
      frame = 0;
      if (heldRef.current) return;
      const stage = stageRef.current?.getBoundingClientRect();
      const pinnedAbove = stage && stage.width > window.innerWidth * 0.8 ? stage.bottom + 48 : 0;
      const line = Math.max(window.innerHeight * readingLine, pinnedAbove);
      let current = 0;
      partRefs.current.forEach((part, position) => {
        if (part && part.getBoundingClientRect().top <= line) current = position;
      });
      setChannel(current);
    };
    const handleScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };
    const handleScrollEnd = () => {
      window.clearTimeout(release);
      release = window.setTimeout(() => (heldRef.current = false), 60);
    };
    // Captured on the document, so it hears the overlay's own scrolling as well as the page's.
    document.addEventListener("scroll", handleScroll, { capture: true, passive: true });
    document.addEventListener("scrollend", handleScrollEnd, { capture: true });
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(release);
      document.removeEventListener("scroll", handleScroll, { capture: true });
      document.removeEventListener("scrollend", handleScrollEnd, { capture: true });
    };
  }, [sections]);

  // Each part's text arrives as it comes into view (the tools after the last part too).
  const detailsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const arrived = entries
          .filter((entry) => entry.isIntersecting)
          .map((entry) => Number((entry.target as HTMLElement).dataset.part));
        if (!arrived.length) return;
        setSeen((previous) => {
          if (arrived.every((part) => previous.has(part))) return previous;
          return new Set([...previous, ...arrived]);
        });
      },
      { rootMargin: "0px 0px -12% 0px" },
    );
    for (const part of partRefs.current) if (part) observer.observe(part);
    if (detailsRef.current) observer.observe(detailsRef.current);
    return () => observer.disconnect();
  }, [sections]);

  const goTo = useCallback(
    (target: number) => {
      const part = partRefs.current[target];
      if (!part) return;
      setChannel(target);
      heldRef.current = true;
      // In case nothing scrolls (already there), or scrollend never comes.
      window.setTimeout(() => (heldRef.current = false), 1400);
      part.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "start" });
    },
    [reduceMotion],
  );

  const close = useCallback(() => {
    if (onClose) onClose();
    else router.push("/#work");
  }, [onClose, router]);

  // Eject: the disk slides out of the monitor's drive and the tube goes dark, then the case
  // study closes (back into its disk in the list, or to the work on the home page).
  const ejectingRef = useRef(false);
  const eject = useCallback(async () => {
    if (ejectingRef.current) return;
    ejectingRef.current = true;
    onCue?.("driveEject");
    await Promise.race([
      ejectRef.current?.() ?? Promise.resolve(),
      new Promise((done) => window.setTimeout(done, 700)),
    ]);
    ejectingRef.current = false;
    close();
  }, [close, onCue]);

  // Keys: ← and → change channel, 1–9 jump to a part.
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (closer !== null || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      let goal = -1;
      if (event.key === "ArrowRight") goal = Math.min(channel + 1, sections.length - 1);
      else if (event.key === "ArrowLeft") goal = Math.max(channel - 1, 0);
      else if (/^[1-9]$/.test(event.key)) goal = Number(event.key) - 1;
      if (goal < 0 || goal >= sections.length || goal === channel) return;
      event.preventDefault();
      onCue?.("remoteKey");
      goTo(goal);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [channel, closer, goTo, onCue, sections.length]);

  return (
    <article
      ref={setViewRef}
      className={clsx(styles.view, className)}
      style={{ "--disk": project.disk, "--disk-ink": project.ink } as CSSProperties}
      aria-labelledby="project-title"
    >
      {/* A floating pill, like the site's own nav: the disk and its name, a tick per part of
          the case study (lit up to where you are), and Eject. */}
      <header className={styles.bar}>
        <div className={styles.pill}>
          <span className={styles.miniDisk} aria-hidden="true">
            <span className={styles.miniShutter} />
            <span className={styles.miniLabel} />
          </span>
          <span className={styles.pillTitle}>
            <span className={styles.pillNumber}>{padNumber(number)}</span>
            {project.title}
          </span>
          {sections.length > 1 && (
            <ol className={styles.ticks} aria-label="Parts of this case study">
              {sections.map((section, position) => (
                <li key={section.id}>
                  <button
                    type="button"
                    className={styles.tick}
                    data-passed={position < channel || undefined}
                    aria-current={position === channel ? "step" : undefined}
                    aria-label={`Part ${position + 1}: ${section.label}`}
                    title={section.label}
                    onClick={() => {
                      onCue?.("remoteKey");
                      goTo(position);
                    }}
                  />
                </li>
              ))}
            </ol>
          )}
          <button
            type="button"
            className={styles.eject}
            onClick={eject}
            onMouseEnter={onTap}
            aria-label={onClose ? "Eject: close the case study" : "Eject: back to all work"}
          >
            <svg className={styles.ejectIcon} viewBox="0 0 12 12" aria-hidden="true">
              <path d="M6 1.5 10.5 7h-9z" fill="currentColor" />
              <rect x="1.5" y="8.6" width="9" height="1.9" rx="0.5" fill="currentColor" />
            </svg>
            Eject
          </button>
        </div>
      </header>

      <div className={styles.layout}>
        {/* On narrow screens this column dissolves (display: contents), so the monitor can sit
            between the title and the parts. */}
        <div className={styles.story}>
          <div className={styles.intro}>
            <p className={styles.meta}>
              {padNumber(number)} ·{" "}
              {project.context === "Spotmies" ? "At Spotmies" : "Personal project"}
              {project.caseStudy && ` · ${project.caseStudy.timeframe}`}
            </p>
            <h1 id="project-title" className={styles.title} aria-label={project.title}>
              <span aria-hidden="true">
                <FlapWords text={project.title} active={titleShown} onFlap={playFlap} />
              </span>
            </h1>
            <p className={styles.kind}>
              {project.kind} · {project.role}
            </p>
          </div>

          <div className={styles.parts}>
            {sections.map((section, position) => (
              <section
                key={section.id}
                ref={(part) => {
                  partRefs.current[position] = part;
                }}
                className={styles.part}
                aria-labelledby={`part-${section.id}`}
                data-part={position}
                data-current={position === channel || undefined}
                data-seen={seen.has(position) || undefined}
              >
                <p className={styles.partTag} aria-hidden="true">
                  CH {padNumber(position + 1)} · {section.label}
                </p>
                <h2
                  id={`part-${section.id}`}
                  className={styles.partHeading}
                  aria-label={section.heading}
                >
                  <span aria-hidden="true">
                    <FlapWords
                      text={section.heading}
                      active={seen.has(position)}
                      onFlap={playFlap}
                    />
                  </span>
                </h2>
                {section.paragraphs.map((paragraph, order) => (
                  <p
                    key={paragraph}
                    className={clsx(styles.paragraph, styles.arrive)}
                    style={{ "--order": order } as CSSProperties}
                  >
                    {paragraph}
                  </p>
                ))}
                {section.points && (
                  <ul className={styles.highlights}>
                    {section.points.map((point, order) => (
                      <li
                        key={point}
                        className={styles.arrive}
                        style={{ "--order": section.paragraphs.length + order } as CSSProperties}
                      >
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            ))}
          </div>

          <div
            ref={detailsRef}
            className={styles.details}
            data-part={sections.length}
            data-seen={seen.has(sections.length) || undefined}
          >
            <ul className={styles.stack} aria-label="Tools">
              {project.stack.map((item, order) => (
                <li key={item} style={{ "--order": order } as CSSProperties}>
                  {item}
                </li>
              ))}
            </ul>
            {project.link && (
              <a
                href={project.link.href}
                target="_blank"
                rel="noreferrer noopener"
                className={styles.visit}
                onMouseEnter={onTap}
              >
                Visit {project.link.label} ↗
                <span className={styles.srOnly}> (opens in a new tab)</span>
              </a>
            )}
          </div>
        </div>

        <div ref={stageRef} className={styles.stage}>
          <CaseMonitor
            project={project}
            number={number}
            sections={sections}
            channel={channel}
            closer={leaving ? null : closer}
            screenRectRef={screenRectRef}
            ejectRef={ejectRef}
            onSelect={goTo}
            onPower={eject}
            onCue={onCue}
            onLookCloser={(item) => {
              onCue?.("insert");
              setLeaving(false);
              setCloser(item);
            }}
          />
          {/* The remote as real buttons: a strip along the bottom on narrow screens; on wide
              ones hidden (the set's remote is the pointer's) until a key is focused. */}
          <nav className={styles.remote} aria-label="Parts of this case study">
            <ol>
              {sections.map((section, position) => (
                <li key={section.id}>
                  <button
                    type="button"
                    className={styles.remoteKey}
                    aria-current={position === channel ? "step" : undefined}
                    onClick={() => {
                      onCue?.("remoteKey");
                      goTo(position);
                    }}
                  >
                    <span className={styles.remoteNumber}>{padNumber(position + 1)}</span>
                    {section.label}
                  </button>
                </li>
              ))}
            </ol>
          </nav>
        </div>
      </div>

      {closer !== null && (
        <ScreenViewer
          sections={sections}
          channel={channel}
          item={closer}
          onItem={setCloser}
          onChannel={(next) => {
            onCue?.("remoteKey");
            setCloser(0);
            goTo(next);
          }}
          screenRect={() => screenRectRef.current?.() ?? null}
          onLeave={() => setLeaving(true)}
          onClose={() => {
            setCloser(null);
            setLeaving(false);
          }}
          onTap={onTap}
        />
      )}

      <nav className={styles.pager} aria-label="Other projects">
        {[
          { project: previous, label: "Previous", arrow: "←" },
          { project: next, label: "Next", arrow: "→" },
        ].map(({ project: other, label, arrow }) => {
          const content = (
            <>
              <span className={styles.pagerLabel}>
                {arrow === "←" && `${arrow} `}
                {label} disk
                {arrow === "→" && ` ${arrow}`}
              </span>
              <span className={styles.pagerTitle}>
                <span
                  className={styles.pagerChip}
                  style={{ "--chip": other.disk } as CSSProperties}
                  aria-hidden="true"
                />
                {padNumber(diskNumber(other))} {other.title}
              </span>
            </>
          );
          const pagerClass = clsx(styles.pagerLink, arrow === "→" && styles.pagerNext);
          return onSelect ? (
            <button
              key={label}
              type="button"
              className={pagerClass}
              onClick={() => onSelect(other)}
              onMouseEnter={onTap}
            >
              {content}
            </button>
          ) : (
            <Link key={label} href={`/work/${other.id}`} className={pagerClass}>
              {content}
            </Link>
          );
        })}
      </nav>
    </article>
  );
}

// A heading on the split-flap board, a word at a time so it can wrap like ordinary text.
function FlapWords({
  text,
  active,
  onFlap,
}: {
  text: string;
  active: boolean;
  onFlap?: (across: number, landed: boolean) => void;
}) {
  const lines = useMemo(() => {
    // Spaced by a margin (in the CSS), not Disket's space, which is a whole wide cell.
    return text
      .toUpperCase()
      .split(" ")
      .map((word) => ({ text: word, className: styles.flapWord }));
  }, [text]);
  return <SplitFlapText lines={lines} active={active} lineGap={0.06} onFlap={onFlap} />;
}
