"use client";

import {
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentType,
  type RefAttributes,
} from "react";
import clsx from "clsx";
import { motion, useReducedMotion } from "framer-motion";
import { AtSymbolIcon } from "./icons/AtSymbolIcon";
import { HouseIcon } from "./icons/HouseIcon";
import { LayoutDashboardIcon } from "./icons/LayoutDashboardIcon";
import { ProfileCardIcon } from "./icons/ProfileCardIcon";
import { VolumeIcon } from "./icons/VolumeIcon";
import type { AnimatedIconHandle } from "./icons/types";
import styles from "./SiteNav.module.css";

type NavIcon = ComponentType<
  { size?: number; className?: string } & RefAttributes<AnimatedIconHandle>
>;

const links: { id: string; label: string; Icon?: NavIcon }[] = [
  // In page order, so the active tile moves left to right as you scroll down.
  { id: "top", label: "Home", Icon: HouseIcon },
  { id: "about", label: "About", Icon: ProfileCardIcon },
  { id: "work", label: "Work", Icon: LayoutDashboardIcon },
  { id: "contact", label: "Contact", Icon: AtSymbolIcon },
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
  const navRef = useRef<HTMLElement>(null);
  // The bar's tints are tuned for what's behind it: a dark tile vanishes on black.
  const onDark = !useOverRed(navRef);
  const plateRef = useRef<HTMLDivElement>(null);
  const indicator = useIndicatorTarget(plateRef, active);
  const reduceMotion = useReducedMotion();

  return (
    <nav
      ref={navRef}
      aria-label="Main"
      className={clsx(styles.nav, visible && styles.visible, onDark && styles.onDark)}
      inert={!visible}
    >
      <div ref={plateRef} className={clsx(styles.plate, styles.links)}>
        {/* One tile that glides between tabs on a spring: it eases in and settles softly,
            and if the target changes mid-glide it carries its speed into the new course. */}
        {indicator && (
          <motion.span
            aria-hidden="true"
            className={styles.indicator}
            initial={false}
            animate={{ x: indicator.x, width: indicator.width }}
            transition={
              indicator.glide && !reduceMotion
                ? { type: "spring", stiffness: 260, damping: 30, mass: 0.9 }
                : { duration: 0 }
            }
          />
        )}
        {links.map((link) => (
          <NavLink
            key={link.id}
            link={link}
            active={active === link.id}
            onHover={onHover}
          />
        ))}
      </div>
      <button
        type="button"
        className={clsx(styles.plate, styles.sound)}
        onClick={onToggleSound}
        data-sound-toggle=""
        onMouseEnter={onHover}
        aria-pressed={soundOn}
        aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
      >
        <VolumeIcon on={soundOn} size={18} />
      </button>
    </nav>
  );
}

// Whether the bar is over a red surface: the page marks those areas with
// data-nav-surface="red" (the hero above its fade, Contact below its dissolving edge).
function useOverRed(navRef: React.RefObject<HTMLElement | null>) {
  const [overRed, setOverRed] = useState(true);

  useEffect(() => {
    let frame = 0;
    const update = () => {
      frame = 0;
      const nav = navRef.current;
      if (!nav) return;
      const navRect = nav.getBoundingClientRect();
      const y = navRect.top + navRect.height / 2;
      const surfaces = document.querySelectorAll<HTMLElement>('[data-nav-surface="red"]');
      setOverRed(
        Array.from(surfaces).some((surface) => {
          const rect = surface.getBoundingClientRect();
          return rect.top <= y && rect.bottom >= y;
        }),
      );
    };
    const handleScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
    };
  }, [navRef]);

  return overRed;
}

// Where the indicator tile should sit: under the active link, matching its position and
// width. Measured on mount, when the tab changes, and when the bar resizes (fonts loading,
// the phone layout); only a tab change glides, the rest snap.
function useIndicatorTarget(
  plateRef: React.RefObject<HTMLDivElement | null>,
  active: string,
) {
  const [target, setTarget] = useState<{ x: number; width: number; glide: boolean }>();

  useLayoutEffect(() => {
    const plate = plateRef.current;
    if (!plate) return;

    const measure = (glide: boolean) => {
      const link = plate.querySelector<HTMLElement>(`[data-id="${active}"]`);
      if (!link) return;
      setTarget((previous) => ({
        x: link.offsetLeft,
        width: link.offsetWidth,
        glide: glide && previous !== undefined,
      }));
    };

    const frame = requestAnimationFrame(() => measure(true));
    const observer = new ResizeObserver(() => measure(false));
    observer.observe(plate);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
    };
  }, [plateRef, active]);

  return target;
}

// A nav link; hovering or focusing anywhere on it plays its icon's animation.
function NavLink({
  link,
  active,
  onHover,
}: {
  link: (typeof links)[number];
  active: boolean;
  onHover: () => void;
}) {
  const iconRef = useRef<AnimatedIconHandle>(null);
  const wasActiveRef = useRef(active);
  const { Icon } = link;

  // Becoming the active tab (the indicator sliding over) plays the icon too; the tab that is
  // active when the page loads stays still.
  useEffect(() => {
    if (active && !wasActiveRef.current) iconRef.current?.startAnimation();
    wasActiveRef.current = active;
  }, [active]);
  const start = () => {
    iconRef.current?.startAnimation();
    onHover();
  };

  return (
    <a
      href={`#${link.id}`}
      data-id={link.id}
      className={clsx(styles.link, active && styles.active)}
      aria-current={active ? "true" : undefined}
      onMouseEnter={start}
      onFocus={start}
    >
      {Icon && <Icon ref={iconRef} size={15} className={styles.icon} />}
      <span className={styles.label}>{link.label}</span>
    </a>
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
