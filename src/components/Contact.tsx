"use client";

import { useEffect, useRef, useState } from "react";
import clsx from "clsx";
import { useGridPointerSounds, useIntro } from "./SiteIntro";
import { useInView } from "./useInView";
import { WebsiteShaderBackground, getKineticGrid } from "./WebsiteShaderCanvas";
import { SplitFlapText } from "./SplitFlapText";
import { AtSymbolIcon } from "./icons/AtSymbolIcon";
import { LinkedinIcon } from "./icons/LinkedinIcon";
import { MapPinIcon } from "./icons/MapPinIcon";
import type { AnimatedIconHandle } from "./icons/types";
import styles from "./Contact.module.css";

const email = "thakursst5002810@gmail.com";
const linkedIn = "https://www.linkedin.com/in/thakur-sameer-shetty-tammana/";
const timeZone = "Asia/Kolkata";
const location = "Visakhapatnam, India";
// The red grows down the section as it scrolls in: none while its top is at the bottom of
// the screen, all of it by the time its top has risen this far up the screen.
const revealEndsAt = 0.25;
// The front runs this many rows past the last row, so it finishes cleanly.
const frontOvershoot = 3;
// Rows at the top of the grid that dissolve into the dark section above.
const edgeRows = 3;

const headline = [
  { text: "LET'S MAKE SOMETHING", className: styles.headlineLine },
  { text: "FEEL RIGHT", className: styles.headlineLine },
];

/** The closing section: a split-flap sign-off, contact keys, and a live status line. */
export function Contact() {
  const { playFlap, playCue, soundOn, getSounds } = useIntro();
  const sectionRef = useRef<HTMLElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef);
  const pinRef = useRef<AnimatedIconHandle>(null);
  const reveal = useRef(0);
  const gridLive = useScrollReveal(sectionRef, reveal, () => playCue("tap"));

  // The pin hops once as the status line arrives.
  useEffect(() => {
    if (!inView) return;
    const hop = window.setTimeout(() => pinRef.current?.startAnimation(), 400);
    return () => window.clearTimeout(hop);
  }, [inView]);

  useGridPointerSounds(gridRef, gridLive && soundOn, getSounds);

  return (
    <section
      ref={sectionRef}
      id="contact"
      className={styles.contact}
      aria-labelledby="contact-heading"
    >
      {/* The hero's red grid again, bookending the page. It starts dark, and the red grows
          down it cell by cell as you scroll in (and pulls back if you scroll up), its ragged
          front flowing out of the dissolving black edge at the top. */}
      <div ref={gridRef} aria-hidden="true" className={styles.grid}>
        <WebsiteShaderBackground
          preset="kinetic-dots"
          tone="light"
          revealDuration={1}
          revealControl={reveal}
          topEdgeRows={edgeRows}
          revealFrom="top"
        />
      </div>

      {/* The red part of the section, below its dissolving edge, for the nav. */}
      <div aria-hidden="true" data-nav-surface="red" className={styles.redSurface} />

      <div className={styles.inner}>
        <p className={styles.label}>Contact</p>
        <h2
          id="contact-heading"
          className={styles.headline}
          aria-label="Let's make something feel right."
        >
          <span aria-hidden="true" className={styles.headlineLines}>
            <SplitFlapText lines={headline} active={inView} onFlap={playFlap} />
          </span>
        </h2>

        <div className={styles.status}>
          <span className={styles.available}>
            <span aria-hidden="true" className={styles.pulse} />
            Open to UI/UX &amp; full stack roles
          </span>
          <span
            className={styles.place}
            onMouseEnter={() => pinRef.current?.startAnimation()}
          >
            <MapPinIcon ref={pinRef} size={16} className={styles.pin} />
            <LocalTime /> in {location}
          </span>
        </div>

        <div className={styles.keys}>
          <EmailKey />
          <LinkKey href={linkedIn} label="LinkedIn" Icon={LinkedinIcon} />
        </div>

        <footer className={styles.footer}>
          <span>© {new Date().getFullYear()} Thakur Sameer Shetty</span>
          <span>
            Designed and built by me · Next.js, Three.js, WebGL, Web Audio, Claude, Gemini
          </span>
        </footer>
      </div>
    </section>
  );
}

// Drives the grid's reveal from scroll: writes 0–1 into `reveal` each frame the page scrolls,
// calls `onRow` as the front crosses each row (for a tick), and reports whether the grid is
// fully revealed (then its hover sounds switch on).
function useScrollReveal(
  sectionRef: React.RefObject<HTMLElement | null>,
  reveal: { current: number },
  onRow: () => void,
) {
  const [complete, setComplete] = useState(false);
  const onRowRef = useRef(onRow);

  useEffect(() => {
    onRowRef.current = onRow;
  }, [onRow]);

  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;
    let frame = 0;
    let lastRow = -1;

    const update = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const screen = window.innerHeight;
      const progress = Math.min(
        Math.max((screen - rect.top) / (screen * (1 - revealEndsAt)), 0),
        1,
      );
      reveal.current = progress;

      const { rows } = getKineticGrid(rect.width, rect.height);
      const row = Math.floor(progress * (rows + frontOvershoot));
      if (lastRow >= 0 && row > lastRow && progress < 1) onRowRef.current();
      lastRow = row;
      setComplete(progress >= 1);
    };
    const handleScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    // Content above can also move the section without any scroll, like a disk box's list
    // closing up; the page's height changes as it does, so follow that too.
    const bodyObserver = new ResizeObserver(handleScroll);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    bodyObserver.observe(document.body);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      bodyObserver.disconnect();
    };
  }, [reveal, sectionRef]);

  return complete;
}

// Thakur's local time, ticking, with a blinking colon. Rendered after mount so the server
// and browser clocks never disagree during hydration.
function LocalTime() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    const update = () => setNow(new Date());
    const first = window.setTimeout(update, 0);
    const timer = window.setInterval(update, 10_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(timer);
    };
  }, []);

  if (!now) return <span className={styles.time}>--:--</span>;

  const parts = new Intl.DateTimeFormat("en-IN", {
    timeZone,
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  }).formatToParts(now);
  const part = (type: string) =>
    parts.find((p) => p.type === type)?.value ?? "";

  return (
    <span className={styles.time}>
      {part("hour")}
      <span aria-hidden="true" className={styles.colon}>
        :
      </span>
      <span className={styles.srOnly}>:</span>
      {part("minute")} {part("dayPeriod").toUpperCase()}
    </span>
  );
}

// The email key copies the address (and says so); the small arrow opens the mail app.
function EmailKey() {
  const { playCue } = useIntro();
  const iconRef = useRef<AnimatedIconHandle>(null);
  const [copied, setCopied] = useState(false);
  const resetRef = useRef(0);

  useEffect(() => () => window.clearTimeout(resetRef.current), []);

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(email);
    } catch {
      window.location.href = `mailto:${email}`;
      return;
    }
    setCopied(true);
    playCue("swap");
    window.clearTimeout(resetRef.current);
    resetRef.current = window.setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className={clsx(styles.key, styles.keyPrimary)}>
      <button
        type="button"
        className={styles.keyFace}
        onClick={copy}
        onMouseEnter={() => {
          iconRef.current?.startAnimation();
          playCue("tap");
        }}
        onPointerDown={() => playCue("land")}
        aria-label={
          copied ? "Email address copied" : `Copy email address ${email}`
        }
      >
        <AtSymbolIcon ref={iconRef} size={20} className={styles.keyIcon} />
        <span key={copied ? "copied" : "email"} className={styles.keyLabel}>
          {copied ? "Copied ✓" : email}
        </span>
      </button>
      <a
        href={`mailto:${email}`}
        className={styles.keyArrow}
        aria-label="Open in your mail app"
        onMouseEnter={() => playCue("tap")}
        onPointerDown={() => playCue("land")}
      >
        <ArrowIcon />
      </a>
    </div>
  );
}

function LinkKey({
  href,
  label,
  Icon,
}: {
  href: string;
  label: string;
  Icon: React.ComponentType<
    { size?: number; className?: string } & React.RefAttributes<AnimatedIconHandle>
  >;
}) {
  const { playCue } = useIntro();
  const iconRef = useRef<AnimatedIconHandle>(null);

  return (
    <div className={styles.key}>
      <a
        href={href}
        target="_blank"
        rel="noreferrer noopener"
        className={styles.keyFace}
        onMouseEnter={() => {
          iconRef.current?.startAnimation();
          playCue("tap");
        }}
        onPointerDown={() => playCue("land")}
      >
        <Icon ref={iconRef} size={20} className={styles.keyIcon} />
        <span className={styles.keyLabel}>{label}</span>
        <span className={styles.keyArrowInline}>
          <ArrowIcon />
        </span>
        <span className={styles.srOnly}> (opens in a new tab)</span>
      </a>
    </div>
  );
}

function ArrowIcon() {
  return (
    <svg
      aria-hidden="true"
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
  );
}
