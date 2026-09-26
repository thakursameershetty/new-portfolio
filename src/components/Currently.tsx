"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { AboutTimeline, itemsAt, monthOf, type TimelineItem } from "./AboutTimeline";
import { useIntro } from "./SiteIntro";
import { useInView } from "./useInView";
import { DocumentIcon } from "./icons/DocumentIcon";
import type { AnimatedIconHandle } from "./icons/types";
import styles from "./Currently.module.css";

// Everything below the statement comes from the résumé (public/resume.pdf), and only what
// it states: keep the two in step when either changes.
interface Entry {
  title: string;
  detail?: string;
  when?: string;
  /** Its place on the timeline, for entries with dates. */
  timeline?: Omit<TimelineItem, "id" | "tone">;
}

// Hackathons share a lane, each a single month, drawn as a solid mark.
function oneMonth(year: number, month: number) {
  return {
    lane: "hackathons",
    group: "Hackathons",
    from: monthOf(year, month),
    to: monthOf(year, month),
  };
}

// `compact` groups (the toolkit) put each label and its list on one line. `tone` colours the
// group's bars on the timeline, and a swatch by its heading keys the two together.
const record: {
  heading: string;
  tone?: TimelineItem["tone"];
  compact?: boolean;
  entries: Entry[];
}[] = [
  {
    heading: "Experience",
    tone: "work",
    entries: [
      {
        title: "Spotmies LLP",
        detail:
          "Hired as a UI/UX designer; grew the role into leading full stack builds, from the first screen to the backend.",
        when: "Jan 2026 – now",
        timeline: { short: "Spotmies", lane: "work", from: monthOf(2026, 1), to: "now" },
      },
    ],
  },
  {
    heading: "Education",
    tone: "study",
    entries: [
      {
        title: "B.Tech, Computer Science",
        detail: "Gayatri Vidya Parishad College · CGPA 8.54",
        when: "2023 – 2026",
        timeline: { short: "B.Tech", lane: "study", from: monthOf(2023, 8), to: monthOf(2026, 6) },
      },
      {
        title: "Diploma, Electrical & Electronics",
        detail: "Government Polytechnic Visakhapatnam",
        when: "2020 – 2023",
        timeline: { short: "Diploma", lane: "study", from: monthOf(2020, 3), to: monthOf(2023, 5) },
      },
    ],
  },
  {
    heading: "Hackathons",
    tone: "event",
    entries: [
      {
        title: "Smart India Hackathon",
        detail: "National selection · YatraSarthi, AI train traffic management for Indian Railways",
        when: "Nov 2025",
        timeline: { short: "SIH", ...oneMonth(2025, 11) },
      },
      {
        title: "Hack With Vizag 3.0",
        detail: "36-hour hackathon · CogniScan, AI for cognitive assessment",
        when: "Sep 2025",
        timeline: { short: "HWV", ...oneMonth(2025, 9) },
      },
      {
        title: "Tutedude Hackathon",
        detail: "Solo Traveler App, from user research to a high-fidelity prototype",
        when: "Jul 2025",
        timeline: { short: "Tutedude", ...oneMonth(2025, 7) },
      },
      {
        title: "GDG IWD",
        detail: "24-hour hackathon · MindBridge, AI for accessibility",
        when: "Mar 2025",
        timeline: { short: "GDG", ...oneMonth(2025, 3) },
      },
    ],
  },
  {
    heading: "Toolkit",
    compact: true,
    entries: [
      { title: "Design", detail: "Figma, design systems, wireframing, After Effects" },
      { title: "Motion", detail: "Framer Motion, React Reanimated" },
      { title: "Frontend", detail: "React, Next.js, TypeScript, React Native, Three.js" },
      { title: "Backend", detail: "Node.js, Express, Python, Flask, Prisma, MongoDB" },
      { title: "AI", detail: "OpenCV, MediaPipe, scikit-learn, Gemini API" },
    ],
  },
];

const timelineItems: TimelineItem[] = record.flatMap((group) =>
  group.entries.flatMap((entry) =>
    entry.timeline && group.tone
      ? [{ id: entry.title, tone: group.tone, ...entry.timeline }]
      : [],
  ),
);

/** First section below the hero: who Thakur is, the work right now, and the record behind it. */
export function Currently() {
  // The row being hovered, and the entries running at the month being scrubbed to.
  const [focus, setFocus] = useState<string | null>(null);
  const [scrubbed, setScrubbed] = useState<string[] | null>(null);
  const [lineOn, setLineOn] = useState(false);

  return (
    <section id="about" className={styles.currently} aria-labelledby="about-heading">
      <h2 id="about-heading" className={styles.label}>
        About
      </h2>
      <p className={styles.statement}>
        Designing and building at{" "}
        <Image
          src="/spotmies-mark.png"
          alt=""
          width={692}
          height={684}
          className={styles.mark}
        />
        <strong>Spotmies</strong>. I started as a UI/UX designer and now lead full stack
        builds,{" "}
        <span className={clsx(styles.muted, lineOn && styles.mutedOn)}>
          with a soft spot for <LineSwitch on={lineOn} onToggle={setLineOn} />
          micro-interactions: the small moments that make a product feel right.
        </span>
      </p>

      <ResumeKey />

      <div className={styles.record}>
        <section className={styles.group}>
          <h3 className={styles.groupHeading}>Timeline</h3>
          <AboutTimeline
            items={timelineItems}
            focus={focus}
            onScrub={(month, now) =>
              setScrubbed(month === null ? null : itemsAt(timelineItems, month, now))
            }
          />
        </section>

        {record.map((group) => (
          <section key={group.heading} className={styles.group}>
            <h3 className={styles.groupHeading}>
              {group.tone && (
                <span
                  aria-hidden="true"
                  className={styles.swatch}
                  style={{ "--tone": `var(--tone-${group.tone})` } as React.CSSProperties}
                />
              )}
              {group.heading}
            </h3>
            <ul className={clsx(styles.entries, group.compact && styles.compact)}>
              {group.entries.map((entry) => (
                <li
                  key={entry.title}
                  className={clsx(
                    styles.entry,
                    scrubbed && !scrubbed.includes(entry.title) && styles.entryDim,
                  )}
                  onPointerEnter={
                    entry.timeline ? () => setFocus(entry.title) : undefined
                  }
                  onPointerLeave={entry.timeline ? () => setFocus(null) : undefined}
                >
                  <span className={styles.entryTitle}>{entry.title}</span>
                  {entry.when && <span className={styles.entryWhen}>{entry.when}</span>}
                  {entry.detail && (
                    <span className={styles.entryDetail}>{entry.detail}</span>
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </section>
  );
}

// A small toggle switch set into the sentence, just before "micro-interactions": flick it
// and the muted half of the line lights up, a micro-interaction making its own point. It
// nudges once when the statement comes into view, so it reads as something to flick.
function LineSwitch({ on, onToggle }: { on: boolean; onToggle: (on: boolean) => void }) {
  const { playCue } = useIntro();
  const ref = useRef<HTMLButtonElement>(null);
  const seen = useInView(ref);

  return (
    <button
      ref={ref}
      type="button"
      role="switch"
      aria-checked={on}
      aria-label="Light up the rest of the line"
      className={clsx(styles.switch, on && styles.switchOn, seen && !on && styles.switchHint)}
      onClick={() => {
        onToggle(!on);
        playCue(on ? "switchOff" : "switchOn");
      }}
      onMouseEnter={() => playCue("tap")}
    >
      <span className={styles.switchKnob} />
    </button>
  );
}

// The same cream keycap as the Contact section's email key; opens the PDF in a new tab so
// the page stays where it was.
function ResumeKey() {
  const { playCue } = useIntro();
  const iconRef = useRef<AnimatedIconHandle>(null);

  return (
    <a
      href="/resume.pdf"
      target="_blank"
      rel="noopener"
      className={styles.key}
      onMouseEnter={() => {
        iconRef.current?.startAnimation();
        playCue("tap");
      }}
      onPointerDown={() => playCue("land")}
    >
      <DocumentIcon ref={iconRef} size={20} className={styles.keyIcon} />
      <span>Résumé</span>
      <span className={styles.keyMeta}>PDF</span>
      <svg
        aria-hidden="true"
        className={styles.keyArrow}
        width="16"
        height="16"
        viewBox="0 0 24 24"
        fill="none"
      >
        <path
          d="M7 17 17 7M8 7h9v9"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className={styles.srOnly}> (opens in a new tab)</span>
    </a>
  );
}
