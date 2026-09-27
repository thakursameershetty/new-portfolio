"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type CSSProperties,
  type Ref,
} from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { CaseMonitor } from "./CaseMonitor";
import { GestureHints, HintsToggle, type GestureHint } from "./GestureHints";
import {
  readHintPreferenceOrMemory,
  subscribeHintPreference,
  writeHintPreference,
} from "./hintPreference";
import { ScreenViewer, type ViewerChannel } from "./ScreenViewer";
import { useIntro } from "./SiteIntro";
import { SplitFlapText } from "./SplitFlapText";
import {
  caseChannels,
  caseSections,
  diskNumber,
  diskOrder,
  type Project,
  type ScreenItem,
} from "./projects";
import styles from "./ProjectView.module.css";

const padNumber = (number: number) => String(number).padStart(2, "0");

// How to work the set and the pictures, in the card under the hints switch in the hero's
// top corner. Mouse and touch
// get their own (the remote is only out on wide screens with a mouse).
const caseHints: GestureHint[] = [
  { gesture: "Drag", does: "the set to turn it", device: "mouse" },
  { gesture: "Click", does: "the screen to look closer", device: "mouse" },
  { gesture: "Click", does: "a key to change channel", device: "mouse" },
  { gesture: "Click", does: "◀ ▶ for the next picture", device: "mouse" },
  { gesture: "Click", does: "power to eject", device: "mouse" },
  { gesture: "Tap", does: "Look closer to see the screen full size", device: "touch" },
  { gesture: "Tap", does: "any picture to see it full size", device: "touch" },
];

// Where the hints can open on their own: wide screens with a mouse. Elsewhere they'd cover the
// title, so they wait to be asked for.
const roomyQuery = "(min-width: 1000px) and (hover: hover) and (pointer: fine)";
const subscribeRoomy = (onChange: () => void) => {
  const query = window.matchMedia(roomyQuery);
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
};
const readRoomy = () => window.matchMedia(roomyQuery).matches;

// A part counts as the one being read once its top passes this far down the screen.
const readingLine = 0.38;

// Minutes to read a case study: its words at an easy 200 a minute (captions included).
const readingMinutes = (project: Project) => {
  const study = project.caseStudy;
  if (!study) return 0;
  const text = [
    project.summary,
    study.headline ?? "",
    ...study.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
      ...(section.points ?? []),
      ...(section.figures ?? []).map((figure) => (figure.type === "card" ? "" : (figure.caption ?? ""))),
    ]),
  ].join(" ");
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
};

/** What's being looked at closely: what's on the monitor, or a picture in the story. */
type Closer = { from: "set" | "story"; channel: number; item: number };

/**
 * A project's case study, full screen: a floating pill at the top (the project's disk and
 * name, a tick per part, and Eject); then the opening, with the title, the story in a line,
 * the brief (a grid of facts at a glance) and a CRT playing the project's reel, with a channel for each part's pictures on its remote;
 * then the story, part by part, each with its pictures large. Any picture (or the monitor's
 * screen) opens a closer look. The neighbouring disks come last.
 *
 * The text arrives as it's reached: the title and each part's heading flip in on the
 * split-flap board, and paragraphs, points and pictures rise in after them.
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
  onCue?: (cue: "remoteKey" | "driveLoad" | "driveEject" | "insert" | "crtOn" | "static") => void;
  className?: string;
  ref?: Ref<HTMLElement>;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { playFlap, setHum } = useIntro();
  const sections = useMemo(() => caseSections(project), [project]);
  const channels = useMemo(() => caseChannels(project), [project]);
  const study = project.caseStudy;
  const brief = study?.brief;
  const minutes = readingMinutes(project);
  const number = diskNumber(project);
  const index = diskOrder.findIndex((entry) => entry.id === project.id);
  const previous = diskOrder[(index - 1 + diskOrder.length) % diskOrder.length];
  const next = diskOrder[(index + 1) % diskOrder.length];

  // The closer look's channels: the monitor's, or the parts that have pictures.
  const setChannels = useMemo<ViewerChannel[]>(
    () =>
      channels.map((entry, position) => ({
        tag: `CH ${padNumber(position + 1)} · ${entry.label}`,
        label: entry.label,
        items: entry.screen,
      })),
    [channels],
  );
  const storyChannels = useMemo(
    () =>
      sections.flatMap((section, position) =>
        section.figures?.length
          ? [
              {
                part: position,
                tag: `${padNumber(position + 1)} · ${section.label}`,
                label: section.label,
                items: section.figures,
              },
            ]
          : [],
      ),
    [sections],
  );

  // The part being read, for the ticks in the pill, and the monitor's channel.
  const [current, setCurrent] = useState(0);
  const [tvChannel, setTvChannel] = useState(0);
  // Still at the top: the cue to scroll shows.
  const [atTop, setAtTop] = useState(true);
  // The how-to hints: shown until the set is first used (where there's room), unless the
  // visitor has chosen with the hints switch, which then holds (on stays on through use; off stays
  // off).
  const hintPreference = useSyncExternalStore(
    subscribeHintPreference,
    readHintPreferenceOrMemory,
    () => null,
  );
  const [triedSet, setTriedSet] = useState(false);
  const roomy = useSyncExternalStore(subscribeRoomy, readRoomy, () => false);
  const hintsShown = hintPreference === "on" || (hintPreference === null && !triedSet && roomy);
  const toggleHints = () => {
    onCue?.("remoteKey");
    writeHintPreference(hintsShown ? "off" : "on");
  };
  const [closer, setCloser] = useState<Closer | null>(null);
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
    setCurrent(0);
    setTvChannel(0);
    setAtTop(true);
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

  // The part being read: the last one whose top has passed the reading line. While a tick's
  // scroll is under way, it holds the tick's part instead.
  const partRefs = useRef<(HTMLElement | null)[]>([]);
  const openingRef = useRef<HTMLDivElement>(null);
  const heldRef = useRef(false);
  useEffect(() => {
    let frame = 0;
    let release = 0;
    const update = () => {
      frame = 0;
      const opening = openingRef.current?.getBoundingClientRect();
      setAtTop(!opening || opening.top > -60);
      if (heldRef.current) return;
      const line = window.innerHeight * readingLine;
      let reading = 0;
      partRefs.current.forEach((part, position) => {
        if (part && part.getBoundingClientRect().top <= line) reading = position;
      });
      setCurrent(reading);
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

  // Each part's text and pictures arrive as it comes into view.
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
    return () => observer.disconnect();
  }, [sections]);

  const goTo = useCallback(
    (target: number) => {
      const part = partRefs.current[target];
      if (!part) return;
      setCurrent(target);
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

  // The set hums while its tube is lit: from the disk latching in until it's ejected or the
  // case study closes. Each channel change crackles through a moment of snow.
  const litRef = useRef(false);
  const warmTimerRef = useRef(0);
  const monitorCue = useCallback(
    (cue: "remoteKey" | "driveLoad") => {
      onCue?.(cue);
      if (cue !== "driveLoad") return;
      litRef.current = true;
      setHum(true);
      // The tube warming, once the drive's head has settled.
      window.clearTimeout(warmTimerRef.current);
      warmTimerRef.current = window.setTimeout(() => onCue?.("crtOn"), 180);
    },
    [onCue, setHum],
  );
  const powerDown = useCallback(() => {
    litRef.current = false;
    window.clearTimeout(warmTimerRef.current);
    setHum(false);
  }, [setHum]);
  useEffect(() => powerDown, [powerDown]);

  const shownChannelRef = useRef({ id: project.id, channel: tvChannel });
  useEffect(() => {
    const shown = shownChannelRef.current;
    shownChannelRef.current = { id: project.id, channel: tvChannel };
    if (shown.id !== project.id || shown.channel === tvChannel || !litRef.current) return;
    onCue?.("static");
  }, [onCue, project.id, tvChannel]);

  // Eject: the disk slides out of the monitor's drive and the tube goes dark, then the case
  // study closes (back into its disk in the list, or to the work on the home page).
  const ejectingRef = useRef(false);
  const eject = useCallback(async () => {
    if (ejectingRef.current) return;
    ejectingRef.current = true;
    onCue?.("driveEject");
    powerDown();
    await Promise.race([
      ejectRef.current?.() ?? Promise.resolve(),
      new Promise((done) => window.setTimeout(done, 700)),
    ]);
    ejectingRef.current = false;
    close();
  }, [close, onCue, powerDown]);

  // Keys: ← and → move a part, 1–9 jump to one.
  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      if (closer !== null || event.metaKey || event.ctrlKey || event.altKey) return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      let goal = -1;
      if (event.key === "ArrowRight") goal = Math.min(current + 1, sections.length - 1);
      else if (event.key === "ArrowLeft") goal = Math.max(current - 1, 0);
      else if (/^[1-9]$/.test(event.key)) goal = Number(event.key) - 1;
      if (goal < 0 || goal >= sections.length || goal === current) return;
      event.preventDefault();
      onCue?.("remoteKey");
      goTo(goal);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [current, closer, goTo, onCue, sections.length]);

  // The pictures in the story, to grow the closer look from (and shrink it back into).
  const figureRefs = useRef(new Map<string, HTMLElement>());
  const figureRect = (part: number, item: number) =>
    figureRefs.current.get(`${part}:${item}`)?.getBoundingClientRect() ?? null;
  const storyChannel = closer?.from === "story" ? storyChannels[closer.channel] : undefined;

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
                    data-passed={position < current || undefined}
                    aria-current={position === current ? "step" : undefined}
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

      {/* The opening: what it is at a glance, beside the set playing the project's reel. */}
      <div ref={openingRef} className={styles.opening}>
        <div className={styles.intro} data-seen={titleShown || undefined}>
          <p className={styles.meta}>
            {padNumber(number)} ·{" "}
            {project.context === "Spotmies" ? "At Spotmies" : "Personal project"}
            {study && ` · ${study.timeframe}`}
            {minutes > 0 && ` · ${minutes} min read`}
          </p>
          <h1 id="project-title" className={styles.title} aria-label={project.title}>
            <span aria-hidden="true">
              <FlapWords text={project.title} active={titleShown} onFlap={playFlap} />
            </span>
          </h1>
          {study?.headline ? (
            <p className={styles.headline}>{study.headline}</p>
          ) : (
            <p className={styles.kind}>
              {project.kind} · {project.role}
            </p>
          )}
          {/* With a headline, the brief below says the rest. */}
          {!study?.headline && (
            <p className={clsx(styles.summary, styles.arrive)}>{project.summary}</p>
          )}
          <div className={clsx(styles.actions, styles.arrive)} style={{ "--order": 1 } as CSSProperties}>
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
            <ul className={styles.stack} aria-label="Tools">
              {project.stack.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* How to work the set and the pictures: a switch in the hero's top corner, and the
            card of hints dropping from it. */}
        <div className={styles.hintsCorner}>
          <HintsToggle
            shown={hintsShown}
            onToggle={toggleHints}
            onHover={onTap}
            className={styles.hintsToggle}
          />
          <div
            id="case-hints"
            className={styles.hintsCard}
            data-shown={hintsShown || undefined}
            aria-hidden={!hintsShown || undefined}
          >
            <GestureHints hints={caseHints} active={titleShown && hintsShown} />
          </div>
        </div>

        <div className={styles.stage}>
          <CaseMonitor
            project={project}
            number={number}
            channels={channels}
            channel={tvChannel}
            closer={!leaving && closer?.from === "set" ? closer.item : null}
            onSelect={setTvChannel}
            screenRectRef={screenRectRef}
            ejectRef={ejectRef}
            onPower={eject}
            onUsed={() => setTriedSet(true)}
            onCue={monitorCue}
            onLookCloser={(item) => {
              onCue?.("insert");
              setLeaving(false);
              setCloser({ from: "set", channel: tvChannel, item });
            }}
          />
        </div>

        {/* The brief: the facts at a glance, in a band across the page under the fold. */}
        {brief && (
          <dl className={styles.brief} data-seen={titleShown || undefined}>
            {brief.map((fact, order) => (
              <div
                key={fact.label}
                className={clsx(styles.briefCell, styles.arrive)}
                style={{ "--order": order + 2 } as CSSProperties}
              >
                <dt className={styles.briefLabel}>{fact.label}</dt>
                <dd className={styles.briefValue}>{fact.value}</dd>
                {fact.note && <dd className={styles.briefNote}>{fact.note}</dd>}
              </div>
            ))}
          </dl>
        )}

        {/* A cue to scroll, like the home page's, once the title has arrived; it goes as the
            page moves, and takes you to the first part. */}
        <button
          type="button"
          className={styles.scrollCue}
          data-shown={(titleShown && atTop) || undefined}
          tabIndex={atTop ? undefined : -1}
          onMouseEnter={onTap}
          onClick={() => {
            onCue?.("remoteKey");
            goTo(0);
          }}
        >
          <svg
            aria-hidden="true"
            className={styles.scrollArrow}
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 4v16M5 13l7 7 7-7"
              stroke="currentColor"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Scroll
        </button>
      </div>

      <div className={styles.story}>
        {sections.map((section, position) => {
          const channel = storyChannels.findIndex((entry) => entry.part === position);
          const textCount = section.paragraphs.length + (section.points?.length ?? 0);
          return (
            <section
              key={section.id}
              ref={(part) => {
                partRefs.current[position] = part;
              }}
              className={styles.part}
              aria-labelledby={`part-${section.id}`}
              data-part={position}
              data-current={position === current || undefined}
              data-seen={seen.has(position) || undefined}
            >
              {section.act && (
                <p className={styles.act}>
                  <span>{section.act}</span>
                </p>
              )}
              <div className={styles.partText}>
                <p className={styles.partTag} aria-hidden="true">
                  {padNumber(position + 1)} · {section.label}
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
              </div>

              {section.figures && section.figures.length > 0 && (
                <div className={styles.figures} data-layout={section.layout ?? "wide"}>
                  {section.figures.map((figure, item) => (
                    <figure
                      key={figure.type === "card" ? figure.title : figure.src}
                      className={clsx(styles.figure, styles.arrive)}
                      style={{ "--order": textCount + item } as CSSProperties}
                    >
                      <button
                        type="button"
                        ref={(node) => {
                          const key = `${position}:${item}`;
                          if (node) figureRefs.current.set(key, node);
                          else figureRefs.current.delete(key);
                        }}
                        className={styles.figureButton}
                        aria-label={`Look closer: ${figure.type === "card" ? figure.title : figure.alt}`}
                        onClick={() => {
                          onCue?.("insert");
                          setLeaving(false);
                          setCloser({ from: "story", channel, item });
                        }}
                      >
                        <FigureMedia figure={figure} layout={section.layout ?? "wide"} />
                      </button>
                      {figure.type !== "card" && figure.caption && (
                        <figcaption className={styles.caption}>{figure.caption}</figcaption>
                      )}
                    </figure>
                  ))}
                </div>
              )}
            </section>
          );
        })}
      </div>

      {closer?.from === "set" && (
        <ScreenViewer
          channels={setChannels}
          channel={closer.channel}
          item={closer.item}
          onItem={(item) => setCloser({ ...closer, item })}
          onChannel={(channel) => {
            onCue?.("remoteKey");
            setTvChannel(channel);
            setCloser({ from: "set", channel, item: 0 });
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
      {closer?.from === "story" && storyChannel && (
        <ScreenViewer
          channels={storyChannels}
          channel={closer.channel}
          item={closer.item}
          onItem={(item) => setCloser({ ...closer, item })}
          onChannel={(channel) => {
            onCue?.("remoteKey");
            setCloser({ from: "story", channel, item: 0 });
            // Keep the page under the view on the same part, so stepping back lands on it.
            partRefs.current[storyChannels[channel].part]?.scrollIntoView({ block: "start" });
          }}
          screenRect={() => figureRect(storyChannel.part, closer.item)}
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

// A picture in the story, sized for how its part lays them out.
function FigureMedia({ figure, layout }: { figure: ScreenItem; layout: string }) {
  if (figure.type === "card") {
    return (
      <span className={styles.figureCard}>
        <span className={styles.figureCardTitle}>{figure.title}</span>
        <span className={styles.figureCardNote}>{figure.note}</span>
      </span>
    );
  }
  if (figure.type === "video") {
    return (
      <video
        src={figure.src}
        poster={figure.poster}
        className={styles.figureMedia}
        autoPlay
        muted
        loop
        playsInline
        aria-hidden="true"
      />
    );
  }
  const sizes =
    layout === "row"
      ? "(min-width: 900px) 300px, 50vw"
      : layout === "wide"
        ? "(min-width: 1200px) 1100px, 100vw"
        : "(min-width: 700px) 560px, 100vw";
  // The width and height only reserve room; the picture keeps its own shape (see the CSS).
  return (
    <Image
      src={figure.src}
      alt=""
      width={1680}
      height={1050}
      sizes={sizes}
      className={styles.figureMedia}
    />
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
