"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import Link from "next/link";
import { AboutTimeline, itemsAt, useMonthNow } from "./AboutTimeline";
import { PrototypesLink } from "./Explorations";
import { record, timelineItems } from "./record";
import { useIntro } from "./SiteIntro";
import { useInView } from "./useInView";
import { ArrowIcon } from "./icons/ArrowIcon";
import { ChartBarIncreasingIcon } from "./icons/ChartBarIncreasingIcon";
import { DocumentIcon } from "./icons/DocumentIcon";
import { ProfileCardIcon } from "./icons/ProfileCardIcon";
import type { AnimatedIconHandle } from "./icons/types";
import styles from "./Currently.module.css";

/** How long something's run, in whole years, counted to this month so it never goes stale. */
function YearsSince({ from }: { from?: number }) {
  const now = useMonthNow();
  if (from === undefined) return null;
  const months = now + 1 - from;
  const years = Math.floor(months / 12);
  if (years < 1) return null;
  return (
    <span className={styles.groupYears}>
      {years}
      {months % 12 ? "+" : ""} {years === 1 && months % 12 === 0 ? "yr" : "yrs"}
    </span>
  );
}

/** First section below the hero: who Thakur is and the work right now, with the Résumé
 *  key. The record behind it comes after the work, in TrackRecord. */
export function Currently() {
  const [lineOn, setLineOn] = useState(false);

  return (
    <section
      id="about"
      className={styles.currently}
      aria-labelledby="about-heading"
    >
      <h2 id="about-heading" className={styles.label}>
        About
      </h2>
      <p className={styles.statement}>
        Designing and building at{" "}
        {/* The mark and the name wrap as one word, so the logo never ends a line alone. */}
        <span className={styles.brand}>
          <Image
            src="/spotmies-mark.png"
            alt=""
            width={692}
            height={684}
            className={styles.mark}
          />
          <strong>Spotmies</strong>.
        </span>{" "}
        I started as a UI/UX designer and now lead full stack builds,{" "}
        <span className={clsx(styles.muted, lineOn && styles.mutedOn)}>
          with a soft spot for{" "}
          {/* The switch stands in for the hyphen in "micro-interactions", the word kept
              whole so the line never breaks around it. */}
          <span className={styles.compound}>
            micro
            <LineSwitch on={lineOn} onToggle={setLineOn} />
            interactions:
          </span>{" "}
          the small moments that make a product feel right.
        </span>
      </p>

      <div className={styles.actions}>
        <ResumeKey />
        <TimelineKey />
      </div>
    </section>
  );
}

/** After the work: the record behind it (the timeline and the groups of entries), and the
 *  key on to the About page for the longer story. */
export function TrackRecord() {
  // The row being hovered, and the entries running at the month being scrubbed to.
  const [focus, setFocus] = useState<string | null>(null);
  const [scrubbed, setScrubbed] = useState<string[] | null>(null);

  return (
    <section
      id="record"
      className={styles.trackRecord}
      aria-labelledby="record-heading"
    >
      <h2 id="record-heading" className={styles.label}>
        Track record
      </h2>
      <div className={styles.record}>
        <section className={styles.group}>
          <h3 className={styles.groupHeading}>Timeline</h3>
          <AboutTimeline
            items={timelineItems}
            focus={focus}
            onScrub={(month, now) =>
              setScrubbed(
                month === null ? null : itemsAt(timelineItems, month, now),
              )
            }
          />
        </section>

        {record.map((group) => (
          <section key={group.heading} className={styles.group}>
            <h3 className={styles.groupHeading}>
              {group.tone && (
                <span
                  aria-hidden="true"
                  className={clsx(
                    styles.swatch,
                    group.tone === "practice" && styles.swatchSettling,
                  )}
                  style={
                    {
                      "--tone": `var(--tone-${group.tone}-fill, var(--tone-${group.tone}))`,
                    } as React.CSSProperties
                  }
                />
              )}
              {group.heading}
              {group.years && (
                <YearsSince from={group.entries[0].timeline?.from} />
              )}
            </h3>
            <ul
              className={clsx(styles.entries, group.compact && styles.compact)}
            >
              {group.entries.map((entry) => (
                <li
                  key={entry.title}
                  className={clsx(
                    styles.entry,
                    scrubbed &&
                      !scrubbed.includes(entry.title) &&
                      styles.entryDim,
                  )}
                  onPointerEnter={
                    entry.timeline ? () => setFocus(entry.title) : undefined
                  }
                  onPointerLeave={
                    entry.timeline ? () => setFocus(null) : undefined
                  }
                >
                  <span className={styles.entryTitle}>{entry.title}</span>
                  {entry.when && (
                    <span className={styles.entryWhen}>{entry.when}</span>
                  )}
                  {entry.detail && (
                    <span className={styles.entryDetail}>{entry.detail}</span>
                  )}
                  {entry.timeline?.href && (
                    <PrototypesLink className={styles.entryAction} />
                  )}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>

      <div className={styles.actions}>
        <MoreLink />
      </div>
    </section>
  );
}

// Down to the track record, after the work: the red keycap that pairs with the Résumé key,
// a rising bar chart before its name (its bars redrawing on hover, like the other keys'
// icons), and an arrow pointing the way the page goes. The page's smooth scrolling (off
// with reduced motion) carries it.
function TimelineKey() {
  const { playCue } = useIntro();
  const iconRef = useRef<AnimatedIconHandle>(null);
  return (
    <a
      href="#record"
      className={clsx(styles.key, styles.keyRed, styles.keyDown)}
      onMouseEnter={() => {
        iconRef.current?.startAnimation();
        playCue("tap");
      }}
      onPointerDown={() => playCue("land")}
    >
      <ChartBarIncreasingIcon
        ref={iconRef}
        size={20}
        className={styles.keyIcon}
      />
      <span>My timeline</span>
      <ArrowIcon
        direction="down"
        size={16}
        animated={false}
        className={styles.keyArrow}
      />
    </a>
  );
}

// A small toggle switch set into the sentence, standing in for the hyphen of "micro-interactions": flick it
// and the muted half of the line lights up, a micro-interaction making its own point. It
// nudges once when the statement comes into view, so it reads as something to flick.
function LineSwitch({
  on,
  onToggle,
}: {
  on: boolean;
  onToggle: (on: boolean) => void;
}) {
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
      className={clsx(
        styles.switch,
        on && styles.switchOn,
        seen && !on && styles.switchHint,
      )}
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

// On to the About page: the longer timeline, and what's playing outside work.
function MoreLink() {
  const { playCue } = useIntro();
  const iconRef = useRef<AnimatedIconHandle>(null);

  return (
    <Link
      href="/about"
      className={clsx(styles.key, styles.keyRed)}
      onMouseEnter={() => {
        iconRef.current?.startAnimation();
        playCue("tap");
      }}
      onPointerDown={() => playCue("land")}
    >
      <ProfileCardIcon ref={iconRef} size={20} className={styles.keyIcon} />
      <span>More about me</span>
      <ArrowIcon size={16} animated={false} className={styles.keyArrow} />
    </Link>
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
      <ArrowIcon
        direction="up-right"
        size={16}
        animated={false}
        className={styles.keyArrow}
      />
      <span className={styles.srOnly}> (opens in a new tab)</span>
    </a>
  );
}
