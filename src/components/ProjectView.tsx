"use client";

import {
  Fragment,
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
import { SoundKey, useIntro } from "./SiteIntro";
import { SplitFlapText } from "./SplitFlapText";
import {
  caseChannels,
  caseSections,
  diskNumber,
  sectionPictures,
  diskOrder,
  readingMinutes,
  type Project,
  type ScreenItem,
} from "./projects";
import { ArrowIcon } from "./icons/ArrowIcon";
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
  {
    gesture: "Tap",
    does: "Look closer to see the screen full size",
    device: "touch",
  },
  { gesture: "Tap", does: "any picture to see it full size", device: "touch" },
];

// A part counts as the one being read once its top passes this far down the screen.
const readingLine = 0.38;
// How loud the part headings' split-flaps are against the title's (about 8 dB quieter).
const partFlapLevel = 0.4;

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
  onTap: onTapProp,
  onCue: onCueProp,
  className,
  ref,
}: {
  project: Project;
  onClose?: () => void;
  onSelect?: (project: Project) => void;
  /** Hover tick for the controls (the overlay's sound). */
  onTap?: () => void;
  /** The monitor's own sounds: its keys, the disk going in and out, and looking closer. */
  onCue?: (
    cue:
      "remoteKey" | "driveLoad" | "driveEject" | "insert" | "crtOn" | "static",
  ) => void;
  className?: string;
  ref?: Ref<HTMLElement>;
}) {
  const router = useRouter();
  const reduceMotion = useReducedMotion();
  const { playFlap, playCue, setHum } = useIntro();
  // In the home page's overlay the sounds come from the props; opened on its own (a shared
  // link), from the page's sound.
  const tapFromPage = useCallback(() => playCue("tap"), [playCue]);
  const onCue = onCueProp ?? playCue;
  const onTap = onTapProp ?? tapFromPage;
  // The part headings flip as each part scrolls in, again and again down the page, so their
  // flaps sit well back; the title keeps the full sound.
  const playPartFlap = useCallback(
    (across: number, landed: boolean) => playFlap(across, landed, partFlapLevel),
    [playFlap],
  );
  const sections = useMemo(() => caseSections(project), [project]);
  const channels = useMemo(() => caseChannels(project), [project]);
  const study = project.caseStudy;
  const brief = study?.brief;
  const clients = study?.client ? [study.client].flat() : [];
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
      sections.flatMap((section, position) => {
        const items = sectionPictures(section);
        return items.length
          ? [
              {
                part: position,
                tag: `${padNumber(position + 1)} · ${section.label}`,
                label: section.label,
                items,
              },
            ]
          : [];
      }),
    [sections],
  );

  // The part being read, for the ticks in the pill, and the monitor's channel.
  const [current, setCurrent] = useState(0);
  const [tvChannel, setTvChannel] = useState(0);
  // Still at the top: the cue to scroll shows.
  const [atTop, setAtTop] = useState(true);
  // The how-to hints: put away until the visitor asks for them with the hints switch, which
  // is remembered.
  const hintPreference = useSyncExternalStore(
    subscribeHintPreference,
    readHintPreferenceOrMemory,
    () => null,
  );
  const hintsShown = hintPreference === "on";
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
    const timer = window.setTimeout(
      () => setTitleShown(true),
      reduceMotion ? 0 : 320,
    );
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
        if (part && part.getBoundingClientRect().top <= line)
          reading = position;
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
    document.addEventListener("scroll", handleScroll, {
      capture: true,
      passive: true,
    });
    document.addEventListener("scrollend", handleScrollEnd, { capture: true });
    update();
    return () => {
      cancelAnimationFrame(frame);
      window.clearTimeout(release);
      document.removeEventListener("scroll", handleScroll, { capture: true });
      document.removeEventListener("scrollend", handleScrollEnd, {
        capture: true,
      });
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
      part.scrollIntoView({
        behavior: reduceMotion ? "auto" : "smooth",
        block: "start",
      });
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
    if (
      shown.id !== project.id ||
      shown.channel === tvChannel ||
      !litRef.current
    )
      return;
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
      if (closer !== null || event.metaKey || event.ctrlKey || event.altKey)
        return;
      const target = event.target as HTMLElement | null;
      if (target?.closest("input, textarea, select, [contenteditable]")) return;
      let goal = -1;
      if (event.key === "ArrowRight")
        goal = Math.min(current + 1, sections.length - 1);
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
  const storyChannel =
    closer?.from === "story" ? storyChannels[closer.channel] : undefined;

  return (
    <article
      ref={setViewRef}
      className={clsx(styles.view, className)}
      style={
        { "--disk": project.disk, "--disk-ink": project.ink } as CSSProperties
      }
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
            aria-label={
              onClose
                ? "Eject: close the case study"
                : "Eject: back to all work"
            }
          >
            <svg
              className={styles.ejectIcon}
              viewBox="0 0 12 12"
              aria-hidden="true"
            >
              <path d="M6 1.5 10.5 7h-9z" fill="currentColor" />
              <rect
                x="1.5"
                y="8.6"
                width="9"
                height="1.9"
                rx="0.5"
                fill="currentColor"
              />
            </svg>
            Eject
          </button>
        </div>
      </header>

      {/* The opening: what it is at a glance, beside the set playing the project's reel. */}
      <div ref={openingRef} className={styles.opening}>
        <div className={styles.intro} data-seen={titleShown || undefined}>
          {/* Who it was made at and for: Spotmies, and the client beside it. */}
          {(project.context === "Spotmies" || clients.length > 0) && (
            <p className={clsx(styles.credits, styles.arrive)}>
              {project.context === "Spotmies" && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src="/logos/spotmies-dark.png"
                  alt="Spotmies"
                  className={styles.creditLogo}
                />
              )}
              {project.context === "Spotmies" && clients.length > 0 && (
                <span className={styles.creditCross} aria-label="for">
                  ×
                </span>
              )}
              {/* A client with more than one brand: each, split by a rule. */}
              {clients.map((client, index) => (
                <Fragment key={client.logo}>
                  {index > 0 && (
                    <span className={styles.creditRule} aria-label="and" />
                  )}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={client.logo}
                    alt={client.name}
                    className={styles.creditLogo}
                    // Taller than the row, it reaches into the space around it instead of
                    // pushing the title down.
                    style={
                      client.height
                        ? ({
                            "--logo-h": `${client.height}px`,
                          } as CSSProperties)
                        : undefined
                    }
                  />
                </Fragment>
              ))}
            </p>
          )}
          <p className={styles.meta}>
            {padNumber(number)}
            {/* Spotmies work is credited by its logo above. */}
            {project.context !== "Spotmies" && " · Personal project"}
            {study && ` · ${study.timeframe}`}
            {minutes > 0 && ` · ${minutes} min read`}
          </p>
          <h1
            id="project-title"
            className={styles.title}
            aria-label={project.title}
          >
            <span aria-hidden="true">
              <FlapWords
                text={project.title}
                active={titleShown}
                onFlap={playFlap}
              />
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
            <p className={clsx(styles.summary, styles.arrive)}>
              {project.summary}
            </p>
          )}
          <div
            className={clsx(styles.actions, styles.arrive)}
            style={{ "--order": 1 } as CSSProperties}
          >
            {project.link && (
              <div className={styles.links}>
                {[project.link, project.alsoLink].map(
                  (link, index) =>
                    link && (
                      <a
                        key={link.href}
                        href={link.href}
                        target="_blank"
                        rel="noreferrer noopener"
                        className={
                          index === 0 ? styles.visit : styles.visitAlso
                        }
                        onMouseEnter={onTap}
                      >
                        Visit {link.label}
                        <ArrowIcon direction="up-right" size={14} />
                        <span className={styles.srOnly}>
                          {" "}
                          (opens in a new tab)
                        </span>
                      </a>
                    ),
                )}
              </div>
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
          {/* Only on the page opened on its own; the home page has its own sound key. */}
          <SoundKey className={styles.soundKey} />
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
                <dd className={styles.briefValue}>
                  {fact.people ? (
                    <span
                      className={styles.briefPeople}
                      role="list"
                      aria-label={fact.value}
                    >
                      {fact.people.map((person) => {
                        const photo = (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={person.photo}
                            alt={person.name}
                            className={styles.briefFace}
                          />
                        );
                        return (
                          <span
                            key={person.name}
                            role="listitem"
                            title={person.name}
                          >
                            {person.href ? (
                              <a
                                href={person.href}
                                target="_blank"
                                rel="noreferrer noopener"
                                className={styles.briefPerson}
                                onMouseEnter={onTap}
                              >
                                {photo}
                                <span className={styles.srOnly}>
                                  {" "}
                                  (opens in a new tab)
                                </span>
                              </a>
                            ) : (
                              <span className={styles.briefPerson}>
                                {photo}
                              </span>
                            )}
                          </span>
                        );
                      })}
                    </span>
                  ) : (
                    (() => {
                      const value = fact.logo ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={fact.logo}
                          alt={fact.value}
                          className={styles.briefLogo}
                        />
                      ) : (
                        fact.value
                      );
                      return fact.href ? (
                        <a
                          href={fact.href}
                          target="_blank"
                          rel="noreferrer noopener"
                          className={styles.briefLink}
                          onMouseEnter={onTap}
                        >
                          {value}
                          <span
                            aria-hidden="true"
                            className={styles.briefArrow}
                          >
                            <ArrowIcon
                              direction="up-right"
                              size={12}
                              animated={false}
                            />
                          </span>
                          <span className={styles.srOnly}>
                            {" "}
                            (opens in a new tab)
                          </span>
                        </a>
                      ) : (
                        value
                      );
                    })()
                  )}
                </dd>
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
          const channel = storyChannels.findIndex(
            (entry) => entry.part === position,
          );
          const textCount =
            section.paragraphs.length + (section.points?.length ?? 0);
          // Pictures are numbered across the part (the lead first), as the closer look and the
          // monitor count them.
          const lead = section.lead ? 1 : 0;
          const setFigureRef = (item: number, node: HTMLElement | null) => {
            const key = `${position}:${item}`;
            if (node) figureRefs.current.set(key, node);
            else figureRefs.current.delete(key);
          };
          const open = (item: number) => {
            onCue?.("insert");
            setLeaving(false);
            setCloser({ from: "story", channel, item });
          };
          const figureGrid = (
            figures: ScreenItem[],
            layout: string,
            offset: number,
          ) => (
            <div className={styles.figures} data-layout={layout}>
              {figures.map((figure, index) => {
                const item = index + offset;
                return (
                  <figure
                    key={figure.type === "card" ? figure.title : figure.src}
                    className={clsx(styles.figure, styles.arrive)}
                    style={{ "--order": textCount + item } as CSSProperties}
                  >
                    <button
                      type="button"
                      ref={(node) => setFigureRef(item, node)}
                      className={styles.figureButton}
                      aria-label={`Look closer: ${figure.type === "card" ? figure.title : figure.alt}`}
                      onClick={() => open(item)}
                    >
                      <FigureMedia figure={figure} layout={layout} />
                    </button>
                    {figure.type !== "card" && figure.caption && (
                      <figcaption className={styles.caption}>
                        {figure.caption}
                      </figcaption>
                    )}
                  </figure>
                );
              })}
            </div>
          );
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
                      onFlap={playPartFlap}
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
                        style={
                          {
                            "--order": section.paragraphs.length + order,
                          } as CSSProperties
                        }
                      >
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {section.lead && figureGrid([section.lead], "wide", 0)}
              {section.layout === "carousel" &&
                section.figures &&
                section.figures.length > 0 && (
                  <FigureCarousel
                    figures={section.figures}
                    className={styles.arrive}
                    style={{ "--order": textCount + lead } as CSSProperties}
                    setRef={(item, node) => setFigureRef(item + lead, node)}
                    onOpen={(item) => open(item + lead)}
                  />
                )}
              {section.layout !== "carousel" &&
                section.figures &&
                section.figures.length > 0 &&
                figureGrid(section.figures, section.layout ?? "wide", lead)}
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
            partRefs.current[storyChannels[channel].part]?.scrollIntoView({
              block: "start",
            });
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
                {arrow === "←" && (
                  <ArrowIcon direction="left" size={12} animated={false} />
                )}
                {label}
                <span className={styles.pagerLabelMore}>disk</span>
                {arrow === "→" && <ArrowIcon size={12} animated={false} />}
              </span>
              <span className={styles.pagerBody}>
                {/* The disk itself, in its colour, with its number on the sticker: it lifts
                    out of the card on hover, like taking the next one from the box. */}
                <span
                  className={styles.pagerDisk}
                  style={{ "--chip": other.disk } as CSSProperties}
                  aria-hidden="true"
                >
                  <span className={styles.pagerDiskFace}>
                    <span className={styles.pagerShutter} />
                    <span className={styles.pagerSticker}>
                      {padNumber(diskNumber(other))}
                    </span>
                  </span>
                </span>
                <span className={styles.pagerText}>
                  <span className={styles.pagerTitle}>{other.title}</span>
                  <span className={styles.pagerBlurb}>{other.blurb}</span>
                </span>
              </span>
            </>
          );
          const pagerClass = clsx(
            styles.pagerLink,
            arrow === "→" && styles.pagerNext,
          );
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
            <Link
              key={label}
              href={`/work/${other.id}`}
              className={pagerClass}
              onMouseEnter={onTap}
            >
              {content}
            </Link>
          );
        })}
      </nav>
    </article>
  );
}

// How long a still stays up in a carousel before the next picture (a clip plays to its end).
const carouselHold = 5000;

/**
 * A part's pictures one at a time, full width, instead of side by side (for clips that would
 * compete if they played together): under it, the caption and a tab per picture, whose bar
 * fills as its clip plays. A clip that ends moves on to the next; clips only play while the
 * carousel is in view.
 */
function FigureCarousel({
  figures,
  onOpen,
  setRef,
  className,
  style,
}: {
  figures: ScreenItem[];
  onOpen: (item: number) => void;
  setRef: (item: number, node: HTMLElement | null) => void;
  className?: string;
  style?: CSSProperties;
}) {
  const [active, setActive] = useState(0);
  const [inView, setInView] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const barRefs = useRef<(HTMLSpanElement | null)[]>([]);
  const count = figures.length;
  const next = useCallback(
    () => setActive((current) => (current + 1) % count),
    [count],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      {
        threshold: 0.35,
      },
    );
    observer.observe(root);
    return () => observer.disconnect();
  }, []);

  // The current clip plays while in view; the others wait at their start, their bars empty.
  useEffect(() => {
    videoRefs.current.forEach((video, item) => {
      if (!video) return;
      if (item === active && inView) {
        video.play().catch(() => {});
        return;
      }
      video.pause();
      if (item !== active) video.currentTime = 0;
    });
    barRefs.current.forEach((bar, item) => {
      if (bar && item !== active) bar.style.transform = "scaleX(0)";
    });
    if (figures[active]?.type === "video" || !inView || count < 2) return;
    const timer = window.setTimeout(next, carouselHold);
    return () => window.clearTimeout(timer);
  }, [active, count, figures, inView, next]);

  // Where the tabs scroll sideways (narrow screens), the current one slides into view.
  const tabsRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const tabs = tabsRef.current;
    const tab = tabs?.children[active] as HTMLElement | undefined;
    if (!tabs || !tab || tabs.scrollWidth <= tabs.clientWidth) return;
    tabs.scrollTo({
      left: tab.offsetLeft - (tabs.clientWidth - tab.offsetWidth) / 2,
      behavior: "smooth",
    });
  }, [active]);

  const current = figures[active];
  const labelOf = (figure: ScreenItem) =>
    figure.type === "card" ? figure.title : (figure.label ?? figure.alt);

  return (
    <div
      ref={rootRef}
      className={clsx(styles.carousel, className)}
      style={{ ...style, "--hold": `${carouselHold}ms` } as CSSProperties}
      data-running={inView || undefined}
    >
      <div className={styles.carouselStage}>
        {figures.map((figure, item) => (
          <button
            key={figure.type === "card" ? figure.title : figure.src}
            type="button"
            ref={(node) => setRef(item, node)}
            className={clsx(styles.figureButton, styles.carouselSlide)}
            data-active={item === active || undefined}
            aria-hidden={item !== active || undefined}
            tabIndex={item === active ? undefined : -1}
            aria-label={`Look closer: ${figure.type === "card" ? figure.title : figure.alt}`}
            onClick={() => onOpen(item)}
          >
            {figure.type === "video" ? (
              <video
                ref={(node) => {
                  videoRefs.current[item] = node;
                }}
                src={figure.src}
                poster={figure.poster}
                className={styles.figureMedia}
                muted
                playsInline
                loop={count < 2}
                preload={item === 0 ? "metadata" : "none"}
                aria-hidden="true"
                onTimeUpdate={(event) => {
                  const video = event.currentTarget;
                  const bar = barRefs.current[item];
                  if (bar && video.duration) {
                    bar.style.transform = `scaleX(${video.currentTime / video.duration})`;
                  }
                }}
                onEnded={next}
              />
            ) : (
              <FigureMedia figure={figure} layout="wide" />
            )}
          </button>
        ))}
      </div>
      <div className={styles.carouselFoot}>
        <p className={styles.caption} aria-live="polite">
          {current?.type === "card" ? current.note : current?.caption}
        </p>
        {count > 1 && (
          <div
            ref={tabsRef}
            className={styles.carouselTabs}
            role="tablist"
            aria-label="Pictures"
          >
            {figures.map((figure, item) => (
              <button
                key={figure.type === "card" ? figure.title : figure.src}
                type="button"
                role="tab"
                aria-selected={item === active}
                className={styles.carouselTab}
                onClick={() => setActive(item)}
              >
                {/* The fill behind the label: a clip's follows its playback, a still's runs
                    over its hold (in the CSS). */}
                <span className={styles.carouselBar} aria-hidden="true">
                  <span
                    ref={(node) => {
                      barRefs.current[item] = node;
                    }}
                    data-hold={figure.type !== "video" || undefined}
                  />
                </span>
                <span className={styles.carouselLabel}>
                  {padNumber(item + 1)} {labelOf(figure)}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// A picture in the story, sized for how its part lays them out.
function FigureMedia({
  figure,
  layout,
}: {
  figure: ScreenItem;
  layout: string;
}) {
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
  const image = (
    <Image
      src={figure.src}
      alt=""
      width={1680}
      height={1050}
      sizes={sizes}
      className={styles.figureMedia}
    />
  );
  // A YouTube video is its thumbnail with a play mark; the closer look plays it.
  if (figure.type === "youtube") {
    return (
      <span className={styles.figureVideo}>
        {image}
        <span className={styles.figurePlay} aria-hidden="true">
          <svg viewBox="0 0 12 12">
            <path d="M4 2.5v7l6-3.5z" fill="currentColor" />
          </svg>
          Play
        </span>
      </span>
    );
  }
  return image;
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
  return (
    <SplitFlapText
      lines={lines}
      active={active}
      lineGap={0.06}
      onFlap={onFlap}
    />
  );
}
