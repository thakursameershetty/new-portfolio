"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useReducedMotion } from "framer-motion";
import clsx from "clsx";
import { useIntro } from "./SiteIntro";
import { SplitFlapText } from "./SplitFlapText";
import { revealDelay } from "./WebsiteShaderCanvas";
import styles from "./Hero.module.css";

const nameWords = ["I'M", "THAKUR"];
const statement = [
  { text: "MAKING THINGS", className: styles.statement },
  { text: "FEEL RIGHT", className: styles.statement },
];

// Intro timeline, in ms from the Enter click. "HI" lands on the thump as the four center
// cells switch on, gives way to the name while the ripple spreads, and the name then
// shrinks into place above the headline, which flips in right after.
const hiAt = revealDelay * 1000;
const swapAt = 1350;
const shrinkAt = 2750;
const statementAt = shrinkAt + 100;

const easeOutExpo = "cubic-bezier(0.16, 1, 0.3, 1)";
const easeOvershoot = "cubic-bezier(0.34, 1.1, 0.64, 1)";

export function Hero() {
  const { entered, instant, playFlap, playCue } = useIntro();
  const reduceMotion = useReducedMotion();
  const [nameLanded, setNameLanded] = useState(false);
  const [statementActive, setStatementActive] = useState(false);
  const [statementLanded, setStatementLanded] = useState(false);
  const hiRef = useRef<HTMLSpanElement>(null);
  const bigNameRef = useRef<HTMLSpanElement>(null);
  const nameRef = useRef<HTMLSpanElement>(null);

  // Parallax: publish how far the hero has scrolled away (0 at the top, 1 once it has
  // fully left) as --hero-scroll, which the grid, copy and scene layers each move by.
  useEffect(() => {
    if (reduceMotion) return;
    const root = document.documentElement;
    let frame = 0;

    const update = () => {
      frame = 0;
      const progress = Math.min(
        Math.max(window.scrollY / Math.max(window.innerHeight, 1), 0),
        1,
      );
      root.style.setProperty("--hero-scroll", progress.toFixed(4));
    };
    const handleScroll = () => {
      if (!frame) frame = requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("resize", handleScroll);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("resize", handleScroll);
      root.style.removeProperty("--hero-scroll");
    };
  }, [reduceMotion]);

  useEffect(() => {
    const hi = hiRef.current;
    const bigName = bigNameRef.current;
    const name = nameRef.current;
    if (!entered || !hi || !bigName || !name) return;

    const timers: number[] = [];
    const animations: Animation[] = [];
    const at = (ms: number, run: () => void) =>
      timers.push(window.setTimeout(run, ms));
    const animate = (
      element: Element,
      keyframes: Keyframe[] | PropertyIndexedKeyframes,
      options: KeyframeAnimationOptions,
    ) => {
      const animation = element.animate(keyframes, { fill: "both", ...options });
      animations.push(animation);
      return animation;
    };

    if (reduceMotion || instant) {
      at(0, () => {
        setNameLanded(true);
        setStatementActive(true);
      });
    } else {
      // Arrive: fade in fast and settle up into place. (Disket Mono comes in two static
      // weights, so animating the weight would snap between them instead of swelling.)
      const arrive = (element: Element, settleMs: number) => {
        animate(element, { opacity: [0, 1] }, { duration: 90 });
        animate(
          element,
          { transform: ["translateY(12px) scale(0.9)", "translateY(0) scale(1)"] },
          { duration: settleMs, easing: easeOutExpo },
        );
      };

      at(hiAt, () => arrive(hi, 2400));

      at(swapAt, () => {
        // "HI" deflates and lifts away as the name takes its place.
        for (const animation of hi.getAnimations()) animation.cancel();
        animate(
          hi,
          {
            transform: ["translateY(0) scale(1)", "translateY(-8px) scale(0.97)"],
          },
          { duration: 180, easing: "ease-in" },
        );
        animate(hi, { opacity: [1, 0] }, { duration: 120, delay: 60, easing: "ease-in" });
        at(60, () => arrive(bigName, 1800));
        playCue("swap");
      });

      at(shrinkAt, () => {
        // Fly each big word onto its resting place above the headline (a FLIP: measure
        // both boxes, then transform the big word until it matches the small one).
        for (const animation of bigName.getAnimations()) animation.cancel();
        bigName.style.opacity = "1";
        const fromWords = Array.from(bigName.children) as HTMLElement[];
        const toWords = Array.from(name.children) as HTMLElement[];
        const flights = fromWords.map((word, index) => {
          const from = word.getBoundingClientRect();
          const to = toWords[index].getBoundingClientRect();
          const scale = to.width / from.width;
          return animate(
            word,
            {
              transformOrigin: ["0 0", "0 0"],
              transform: [
                "none",
                `translate(${to.left - from.left}px, ${to.top - from.top}px) scale(${scale})`,
              ],
            },
            { duration: 700, easing: easeOvershoot },
          );
        });
        flights[0]?.finished
          .then(() => {
            setNameLanded(true);
            playCue("land");
          })
          .catch(() => {});
      });

      at(statementAt, () => setStatementActive(true));
    }

    return () => {
      for (const timer of timers) window.clearTimeout(timer);
      for (const animation of animations) animation.cancel();
    };
  }, [entered, instant, playCue, reduceMotion]);

  return (
    <section id="top" className={styles.hero}>
      {/* Intro-only type; the real heading is the h1 below. */}
      <div aria-hidden="true" className={styles.introLayer}>
        <span ref={hiRef} className={styles.hi}>
          HI
        </span>
        <span
          ref={bigNameRef}
          className={clsx(styles.bigName, nameLanded && styles.gone)}
        >
          {nameWords.map((word) => (
            <span key={word} className={styles.bigWord}>
              {word}
            </span>
          ))}
        </span>
      </div>

      <div className={styles.copy}>
        <h1 className={styles.headline} aria-label="I'm Thakur. Making things feel right.">
          {/* In flow at its final size from the start, so nothing shifts when the name lands. */}
          <span
            ref={nameRef}
            aria-hidden="true"
            className={clsx(styles.name, !nameLanded && styles.pending)}
          >
            {nameWords.map((word) => (
              <span key={word} className={styles.nameWord}>
                {word}
              </span>
            ))}
          </span>
          <span aria-hidden="true" className={styles.lines}>
            <SplitFlapText
              lines={statement}
              active={statementActive}
            instant={instant}
              onFlap={playFlap}
              onDone={() => {
                setStatementLanded(true);
                playCue("arrive");
              }}
            />
          </span>
        </h1>
        <p className={clsx(styles.role, statementLanded && styles.roleVisible)}>
          UI/UX Designer · Full Stack Developer
        </p>
      </div>
      <div className={clsx(styles.scene, statementLanded && styles.sceneVisible)}>
        <Image
          src="/avatar-story.png"
          alt="Thakur as a toy figure in headphones, sketching on a drawing tablet in a brick-built studio overgrown with plants: design sketches and UI boards on one side, code screens, devices and servers on the other, and small models of past projects around him, including a drone swarm, a train, a gym camera, a gesture-tracking hand and a game-world island."
          width={1672}
          height={941}
          priority
          sizes="100vw"
          className={styles.sceneImage}
        />
      </div>
      {/* The red part of the hero, above its fade, for the nav to know what's behind it. */}
      <div aria-hidden="true" data-nav-surface="red" className={styles.redSurface} />
      {/* The red grid bleeds into the black page below. */}
      <div aria-hidden="true" className={styles.fade} />
    </section>
  );
}
