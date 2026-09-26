"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import clsx from "clsx";
import { motion, useSpring, useTransform } from "framer-motion";
import { useIntro } from "./SiteIntro";
import styles from "./AboutTimeline.module.css";

// Months are counted from January 2020, where the ruler starts: (year - 2020) * 12 + month.
const firstYear = 2020;
export const monthOf = (year: number, month: number) => (year - firstYear) * 12 + month - 1;

// What "now" is while the page is built and hydrated; the browser then moves it to the real
// month. A fixed value keeps the server's HTML and the first client render identical.
const builtAt = monthOf(2026, 9);
const currentMonth = () => {
  const date = new Date();
  return monthOf(date.getFullYear(), date.getMonth() + 1);
};
const noSubscription = () => () => {};

// Single-month entries in a lane this many months apart or closer share a label.
const labelReach = 6;
// Room after "now", so its end of the ruler doesn't sit on the edge.
const tailMonths = 3;
const names = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const monthName = (m: number) => `${names[m % 12]} ${firstYear + Math.floor(m / 12)}`;

export interface TimelineItem {
  id: string;
  /** Name printed over its bar. */
  short: string;
  lane: string;
  /** Kind of entry, which sets its colour. */
  tone: "work" | "study" | "event";
  from: number;
  /** Last month, inclusive, or "now". */
  to: number | "now";
  /**
   * Name for a run of these that share a label (the hackathons): shown instead of all their
   * names, until one of them is lit and its own name shows over its mark.
   */
  group?: string;
  /** Known only to the year: drawn dashed, across the whole year. */
  yearOnly?: boolean;
}

/** Ids of the items running during month `m`. */
export function itemsAt(items: TimelineItem[], m: number, now: number) {
  return items
    .filter((item) => m >= item.from && m <= (item.to === "now" ? now : item.to))
    .map((item) => item.id);
}

/**
 * A ruler of the years so far, with a bar for each dated entry. Its needle rests on "now",
 * glides to an entry's start when that row is hovered, and follows the pointer (or a drag on
 * touch screens) so you can scrub through the years and see what was running at the time.
 */
export function AboutTimeline({
  items,
  focus,
  onScrub,
}: {
  items: TimelineItem[];
  /** The id of the row being hovered, if any. */
  focus: string | null;
  /** The month under the needle while scrubbing, or null when it lets go. */
  onScrub: (month: number | null, now: number) => void;
}) {
  const { playCue } = useIntro();
  const now = useSyncExternalStore(noSubscription, currentMonth, () => builtAt);
  const span = now + 1 + tailMonths;
  const rulerRef = useRef<HTMLDivElement>(null);
  const [scrub, setScrub] = useState<number | null>(null);
  const dragging = useRef(false);

  const endOf = (item: TimelineItem) => (item.to === "now" ? now : item.to);
  const lanes = [...new Set(items.map((item) => item.lane))];
  // Labels: entries in a lane that overlap, or single months within a few of each other (the
  // hackathons of 2025), share one label, so their names can't run into each other; longer
  // spans side by side (the diploma, then the B.Tech) keep their own.
  const labels = lanes.flatMap((lane) => {
    const clusters: { items: TimelineItem[]; from: number; end: number }[] = [];
    for (const item of items
      .filter((entry) => entry.lane === lane)
      .sort((a, b) => a.from - b.from)) {
      const last = clusters.at(-1);
      const isPoint = (entry: TimelineItem) => entry.to === entry.from;
      const near =
        last &&
        (item.from <= last.end ||
          (isPoint(item) && last.items.every(isPoint) && item.from <= last.end + labelReach));
      if (last && near) {
        last.items.push(item);
        last.end = Math.max(last.end, endOf(item));
      } else clusters.push({ items: [item], from: item.from, end: endOf(item) });
    }
    return clusters.map((cluster) => ({ lane, ...cluster }));
  });
  const focused = items.find((item) => item.id === focus);
  const lit =
    scrub !== null ? itemsAt(items, scrub, now) : focused ? [focused.id] : null;

  // Where the needle is headed, in months along the ruler: the middle of the month being
  // scrubbed, the hovered entry's first edge, or, at rest, the end of this month, exactly
  // where the ongoing bar stops, so the needle caps it.
  const resting = scrub === null && !focused;
  const target = scrub !== null ? scrub + 0.5 : (focused?.from ?? now + 1);
  const needle = useSpring(target, { stiffness: 260, damping: 30, mass: 0.8 });
  const left = useTransform(needle, (m) => `${(m / span) * 100}%`);
  // The readout stays on the ruler: pinned left at the start, right at the end.
  const shift = useTransform(needle, (m) => `translateX(${-(m / span) * 100}%)`);

  useEffect(() => {
    needle.set(target);
  }, [needle, target]);

  // Once the browser knows the real month, start there rather than gliding to it.
  useEffect(() => {
    needle.jump(now + 1);
  }, [needle, now]);

  // A detent click, and the year label lighting up, each time the needle crosses a year.
  const [year, setYear] = useState(Math.floor((now + 1) / 12));
  const yearRef = useRef(year);
  useEffect(
    () =>
      needle.on("change", (m) => {
        const next = Math.floor(m / 12);
        if (next === yearRef.current) return;
        yearRef.current = next;
        setYear(next);
        playCue("detent");
      }),
    [needle, playCue],
  );

  const monthAt = (clientX: number) => {
    const rect = rulerRef.current!.getBoundingClientRect();
    const m = Math.floor(((clientX - rect.left) / rect.width) * span);
    return Math.min(Math.max(m, 0), now);
  };
  const scrubTo = (m: number | null) => {
    setScrub(m);
    onScrub(m, now);
  };

  const readout =
    scrub !== null
      ? monthName(scrub)
      : focused
        ? focused.yearOnly
          ? String(firstYear + Math.floor(focused.from / 12))
          : focused.to === focused.from
            ? monthName(focused.from)
            : `${monthName(focused.from)} – ${focused.to === "now" ? "NOW" : monthName(focused.to)}`
        : "NOW";

  return (
    <div
      ref={rulerRef}
      className={clsx(styles.timeline, lit && styles.hasLit)}
      style={{ "--months": span } as React.CSSProperties}
      role="img"
      aria-label={`Timeline from ${firstYear} to now: ${items
        .map((item) => item.short)
        .join(", ")}.`}
      onPointerMove={(event) => {
        // Mice scrub by hovering; touch scrubs only while dragging, so the page still scrolls.
        if (event.pointerType === "mouse" || dragging.current) scrubTo(monthAt(event.clientX));
      }}
      onPointerDown={(event) => {
        dragging.current = true;
        event.currentTarget.setPointerCapture(event.pointerId);
        scrubTo(monthAt(event.clientX));
      }}
      onPointerUp={(event) => {
        dragging.current = false;
        if (event.pointerType !== "mouse") scrubTo(null);
      }}
      onPointerCancel={() => {
        dragging.current = false;
        scrubTo(null);
      }}
      onPointerLeave={(event) => {
        if (event.pointerType === "mouse") scrubTo(null);
      }}
    >
      <div className={styles.lanes}>
        {lanes.map((lane) => (
          <div key={lane} className={styles.lane}>
            {items
              .filter((item) => item.lane === lane)
              // Whole-year spans under, single months on top of them.
              .sort((a, b) => Number(!a.yearOnly) - Number(!b.yearOnly))
              .map((item) => (
                <div
                  key={item.id}
                  className={clsx(
                    styles.bar,
                    item.yearOnly && styles.yearOnly,
                    item.to === item.from && styles.point,
                    item.to === "now" && styles.ongoing,
                    lit?.includes(item.id) && styles.lit,
                  )}
                  style={
                    {
                      "--tone": `var(--tone-${item.tone})`,
                      left: `${(item.from / span) * 100}%`,
                      width: `${((endOf(item) + 1 - item.from) / span) * 100}%`,
                    } as React.CSSProperties
                  }
                />
              ))}
            {labels
              .filter((label) => label.lane === lane)
              .flatMap((label) => {
                // Late on the ruler, a label hangs from its end, or it would run off.
                const fromEnd = label.from / span > 0.6;
                const group = label.items.length > 1 ? label.items[0].group : undefined;
                const litItems = label.items.filter((item) => lit?.includes(item.id));
                const tone = { "--tone": `var(--tone-${label.items[0].tone})` };
                const main = (
                  <span
                    key={label.items.map((item) => item.id).join()}
                    className={clsx(
                      styles.barLabel,
                      label.items.some((item) => item.to === "now") && styles.labelOngoing,
                      // A group's name steps aside while one of its own names shows.
                      group
                        ? litItems.length > 0 && styles.labelAway
                        : litItems.length > 0 && styles.labelLit,
                    )}
                    style={
                      {
                        ...tone,
                        left: fromEnd ? "auto" : `${(label.from / span) * 100}%`,
                        right: fromEnd ? `${(1 - (label.end + 1) / span) * 100}%` : "auto",
                      } as React.CSSProperties
                    }
                  >
                    {group ?? label.items.map((item) => item.short).join(" · ")}
                  </span>
                );
                if (!group) return [main];
                // Each member's own name, over its mark, shown only while it's lit.
                return [
                  main,
                  ...label.items.map((item) => (
                    <span
                      key={`${item.id} name`}
                      aria-hidden="true"
                      className={clsx(
                        styles.barLabel,
                        styles.memberLabel,
                        lit?.includes(item.id) && styles.memberShown,
                      )}
                      style={
                        {
                          ...tone,
                          left: `${((item.from + 0.5) / span) * 100}%`,
                        } as React.CSSProperties
                      }
                    >
                      {item.short}
                    </span>
                  )),
                ];
              })}
          </div>
        ))}
      </div>

      <div className={styles.axis}>
        {Array.from({ length: Math.floor(now / 12) + 1 }, (_, i) => (
          <span
            key={i}
            className={clsx(styles.year, i === year && styles.yearLit)}
            style={{ left: `${((i * 12) / span) * 100}%` }}
          >
            {firstYear + i}
          </span>
        ))}
      </div>

      <motion.div aria-hidden="true" className={clsx(styles.needle, resting && styles.resting)}
        style={{ left }}
      >
        <motion.span className={styles.readout} style={{ transform: shift }}>
          {readout}
        </motion.span>
        <span className={styles.handle} />
      </motion.div>
    </div>
  );
}
