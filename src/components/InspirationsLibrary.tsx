"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";
import {
  bookmarkCount,
  previewSlug,
  shelves,
  type Bookmark,
  type Shelf,
} from "./inspirations";
import previewList from "./inspirationPreviews.json";
import styles from "./InspirationsLibrary.module.css";

const all = "All";

// The bookmarks with a screenshot (scripts/capture-inspirations.mjs lists them).
const previews = new Set<string>(previewList);

// The preview's size, and how far it sits from the pointer.
const peekWidth = 320;
const peekHeight = 236;
const peekGap = 24;

/**
 * The Inspirations page's library: a search field and a row of keys to pick a group, over
 * the groups, each a floppy disk like the Work shelf's (in its tone, labelled with the
 * group) beside its bookmarks, listed like the work is. "/" jumps to the search.
 */
export function InspirationsLibrary() {
  const [query, setQuery] = useState("");
  const [picked, setPicked] = useState(all);
  const searchRef = useRef<HTMLInputElement>(null);
  const libraryRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const peekRef = useRef<HTMLDivElement>(null);
  // The bookmark under the pointer, kept while its preview fades out.
  const [peek, setPeek] = useState<Bookmark | null>(null);
  const [peeking, setPeeking] = useState(false);

  // The preview follows the pointer, below and to the right of it, flipping to the left
  // or riding up when it would run off the screen. Moved straight on the element, not
  // through state, so it keeps up.
  const place = (x: number, y: number) => {
    const element = peekRef.current;
    if (!element) return;
    const left =
      x + peekGap + peekWidth > window.innerWidth
        ? x - peekGap - peekWidth
        : x + peekGap;
    const top = Math.min(y + peekGap, window.innerHeight - peekHeight - 12);
    element.style.transform = `translate3d(${left}px, ${top}px, 0)`;
  };

  const onPeek = (next: Bookmark | null, event?: React.PointerEvent) => {
    if (event && event.pointerType !== "mouse") return;
    if (next && !previews.has(previewSlug(next.url))) next = null;
    if (next) {
      if (event) place(event.clientX, event.clientY);
      setPeek(next);
    }
    setPeeking(Boolean(next));
  };

  // Picking a group brings its key fully into the row, and, from further down the page,
  // the list back up to its start under the toolbar.
  const pick = (title: string) => {
    setPicked(title);
    requestAnimationFrame(() =>
      filtersRef.current
        ?.querySelector<HTMLElement>('[aria-pressed="true"]')
        ?.scrollIntoView({ block: "nearest", inline: "nearest" }),
    );
    const library = libraryRef.current;
    if (library && library.getBoundingClientRect().top < 0)
      library.scrollIntoView({ block: "start" });
  };

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      const typing = (event.target as HTMLElement | null)?.closest?.(
        "input, textarea, [contenteditable]",
      );
      if (event.key === "/" && !typing) {
        event.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const shown = useMemo(() => {
    const words = query.trim().toLowerCase();
    return shelves
      .map((shelf, index) => ({ ...shelf, number: index + 1 }))
      .filter((shelf) => picked === all || shelf.title === picked)
      .map((shelf) => ({
        ...shelf,
        links: words
          ? shelf.links.filter((link) =>
              `${link.name} ${link.host} ${shelf.title}`
                .toLowerCase()
                .includes(words),
            )
          : shelf.links,
      }))
      .filter((shelf) => shelf.links.length > 0);
  }, [query, picked]);

  // Each link once, as bookmarkCount counts them (Best of All repeats some).
  const count = new Set(
    shown.flatMap((shelf) => shelf.links.map((link) => link.url)),
  ).size;

  return (
    <div
      ref={libraryRef}
      className={styles.library}
      onPointerMove={(event) => {
        if (peeking) place(event.clientX, event.clientY);
      }}
    >
      <div className={styles.toolbar}>
        <label className={styles.search}>
          <svg
            aria-hidden="true"
            viewBox="0 0 24 24"
            className={styles.searchIcon}
          >
            <circle cx="11" cy="11" r="7" />
            <path d="m20 20-3.5-3.5" />
          </svg>
          <span className={styles.srOnly}>Search the bookmarks</span>
          <input
            ref={searchRef}
            type="search"
            value={query}
            placeholder={`Search ${bookmarkCount} bookmarks`}
            className={styles.input}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Escape") {
                setQuery("");
                event.currentTarget.blur();
              }
            }}
          />
          <span aria-hidden="true" className={styles.tally}>
            {count === bookmarkCount
              ? bookmarkCount
              : `${count}/${bookmarkCount}`}
          </span>
          <kbd aria-hidden="true" className={styles.kbd}>
            /
          </kbd>
        </label>

        <div
          ref={filtersRef}
          className={styles.filters}
          role="group"
          aria-label="Groups"
        >
          <FilterKey
            label={all}
            count={bookmarkCount}
            on={picked === all}
            onPick={() => pick(all)}
          />
          {shelves.map((shelf) => (
            <FilterKey
              key={shelf.title}
              label={shelf.title}
              count={shelf.links.length}
              tone={shelf.tone}
              on={picked === shelf.title}
              onPick={() => pick(picked === shelf.title ? all : shelf.title)}
            />
          ))}
        </div>
      </div>

      <p className={styles.srOnly} aria-live="polite">
        {count} of {bookmarkCount} bookmarks
      </p>

      {shown.length === 0 ? (
        <p className={styles.empty}>
          Nothing for &ldquo;{query}&rdquo;. It&rsquo;s probably still open in a
          tab somewhere.
        </p>
      ) : (
        shown.map((shelf) => (
          <section
            key={shelf.title}
            className={styles.shelf}
            style={toneStyle(shelf.tone)}
            aria-labelledby={idFor(shelf.title)}
          >
            <div className={styles.side}>
              <Disk shelf={shelf} number={shelf.number} />
              <div className={styles.shelfHead}>
                <h2 id={idFor(shelf.title)} className={styles.shelfTitle}>
                  {shelf.title}
                </h2>
                <p className={styles.shelfNote}>{shelf.note}</p>
                <p className={styles.shelfCount}>
                  {shelf.links.length}{" "}
                  {shelf.links.length === 1 ? "link" : "links"}
                </p>
              </div>
            </div>
            <ol className={styles.rows}>
              {shelf.links.map((link, index) => (
                <li key={link.url}>
                  <Row
                    link={link}
                    number={index + 1}
                    onPeek={(on, event) => onPeek(on ? link : null, event)}
                  />
                </li>
              ))}
            </ol>
          </section>
        ))
      )}

      <div
        ref={peekRef}
        aria-hidden="true"
        className={clsx(styles.peek, peeking && styles.peekOn)}
      >
        {peek && (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- a local screenshot, shown at its own size */}
            <img
              key={peek.url}
              src={`/inspirations/${previewSlug(peek.url)}.webp`}
              alt=""
              width={640}
              height={400}
              className={styles.peekShot}
            />
            <span className={styles.peekBar}>
              <span className={styles.peekHost}>{peek.host}</span>
              <span>Opens in a new tab ↗</span>
            </span>
          </>
        )}
      </div>
    </div>
  );
}

/**
 * A group as a floppy disk, built like the Work shelf's: its shell in the group's tone with
 * the chamfered corner, the metal shutter (sliding open on hover), and the ruled paper
 * label with the group's number and name. Only a picture: the heading beside it carries
 * the words.
 */
function Disk({ shelf, number }: { shelf: Shelf; number: number }) {
  return (
    <div aria-hidden="true" className={styles.disk}>
      <span aria-hidden="true" className={styles.media}>
        <span className={styles.hub} />
      </span>
      <span aria-hidden="true" className={styles.shutter}>
        <span className={styles.shutterWindow} />
      </span>
      <span aria-hidden="true" className={styles.protect} />

      <span className={styles.labelPaper}>
        <span className={styles.labelBand}>
          <span>{String(number).padStart(2, "0")}</span>
          <span>Bookmarks</span>
        </span>
        <span className={styles.labelTitle}>{shelf.title}</span>
      </span>
    </div>
  );
}

function FilterKey({
  label,
  count,
  tone,
  on,
  onPick,
}: {
  label: string;
  count: number;
  tone?: string;
  on: boolean;
  onPick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={on}
      data-feel="land"
      className={clsx(styles.filter, on && styles.filterOn)}
      style={tone ? toneStyle(tone) : undefined}
      onClick={onPick}
    >
      {tone && <span aria-hidden="true" className={styles.swatch} />}
      {label}
      <span className={styles.filterCount}>{count}</span>
    </button>
  );
}

// A bookmark, set like a row of the Work list: its number, its name in Disket Mono over
// its address, and a keycap with the arrow out. Hovered, it shows its preview.
function Row({
  link,
  number,
  onPeek,
}: {
  link: Bookmark;
  number: number;
  onPeek: (on: boolean, event: React.PointerEvent) => void;
}) {
  return (
    <a
      href={link.url}
      target="_blank"
      rel="noopener"
      data-feel="land"
      className={styles.row}
      onPointerEnter={(event) => onPeek(true, event)}
      onPointerLeave={(event) => onPeek(false, event)}
    >
      <span aria-hidden="true" className={styles.rowNumber}>
        {String(number).padStart(2, "0")}
      </span>
      <Favicon link={link} />
      <span className={styles.rowText}>
        <span className={styles.rowName}>{link.name}</span>
        <span className={styles.rowHost}>{link.host}</span>
      </span>
      <span aria-hidden="true" className={styles.rowKey}>
        <svg viewBox="0 0 24 24">
          <path d="M7 17 17 7M8 7h9v9" />
        </svg>
      </span>
      <span className={styles.srOnly}> (opens in a new tab)</span>
    </a>
  );
}

// The site's own icon, in its own colours; its first letter if there's none.
function Favicon({ link }: { link: Bookmark }) {
  const [failed, setFailed] = useState(false);
  return (
    <span aria-hidden="true" className={styles.favicon}>
      {failed ? (
        link.name[0]
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- a 64px favicon from another site
        <img
          src={`https://www.google.com/s2/favicons?domain=${link.host}&sz=64`}
          alt=""
          width={18}
          height={18}
          loading="lazy"
          onError={() => setFailed(true)}
        />
      )}
    </span>
  );
}

// The group's tone for its disk and swatches, and the ink that reads on it: cream on the
// work red, near-black on the lighter tones.
const toneStyle = (tone: string) =>
  ({
    "--tone": `var(--tone-${tone}-fill, var(--tone-${tone}))`,
    "--tone-ink": tone === "work" ? "#fff8f3" : "#1a0605",
  }) as React.CSSProperties;

const idFor = (title: string) =>
  `shelf-${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`;
