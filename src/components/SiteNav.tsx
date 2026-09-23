"use client";

import { useEffect, useState } from "react";
import clsx from "clsx";
import styles from "./SiteNav.module.css";

const links = [
  { id: "top", label: "Home" },
  { id: "work", label: "Work" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

interface SiteNavProps {
  /** Drops the bar in; before that it is hidden and inert. */
  visible: boolean;
  soundOn: boolean;
  onToggleSound: () => void;
  /** Called when a nav item is hovered or focused, for its tick. */
  onHover: () => void;
}

/** The rectangular bar at the top: section links plus the sound switch. */
export function SiteNav({ visible, soundOn, onToggleSound, onHover }: SiteNavProps) {
  const active = useActiveSection();

  return (
    <nav
      aria-label="Main"
      className={clsx(styles.nav, visible && styles.visible)}
      inert={!visible}
    >
      <div className={styles.plate}>
        {links.map((link) => (
          <a
            key={link.id}
            href={`#${link.id}`}
            className={clsx(styles.link, active === link.id && styles.active)}
            aria-current={active === link.id ? "true" : undefined}
            onMouseEnter={onHover}
            onFocus={onHover}
          >
            {link.label}
          </a>
        ))}
      </div>
      <button
        type="button"
        className={clsx(styles.plate, styles.sound)}
        onClick={onToggleSound}
        onMouseEnter={onHover}
        aria-pressed={soundOn}
        aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
      >
        <SpeakerIcon muted={!soundOn} />
      </button>
    </nav>
  );
}

// The section whose top has passed 40% of the way down the screen, among those on the page.
function useActiveSection() {
  const [active, setActive] = useState(links[0].id);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      let current = links[0].id;
      for (const link of links) {
        const section = document.getElementById(link.id);
        if (section && section.getBoundingClientRect().top <= window.innerHeight * 0.4) {
          current = link.id;
        }
      }
      setActive(current);
    };
    const handleScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return active;
}

function SpeakerIcon({ muted }: { muted: boolean }) {
  return (
    <svg aria-hidden="true" width="18" height="18" viewBox="0 0 24 24" fill="none">
      <path
        d="M11 5 6 9H3v6h3l5 4V5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      {muted ? (
        <path
          d="m16 9 6 6m0-6-6 6"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      ) : (
        <path
          d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
      )}
    </svg>
  );
}
