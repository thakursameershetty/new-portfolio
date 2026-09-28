"use client";

import { useEffect, useRef } from "react";
import Link from "next/link";
import { ContactKeys, Credits, useScrollReveal } from "../Contact";
import { useGridPointerSounds, useIntro } from "../SiteIntro";
import { WebsiteShaderBackground } from "../WebsiteShaderCanvas";
import key from "./Keycap.module.css";
import styles from "./AboutFooter.module.css";

/**
 * The foot of the About page: a closing line, the same contact keys as the home page's
 * Contact section (copy the email or open the mail app, LinkedIn, Dribbble, GitHub), a way
 * on to the work, and the site's credits, over the same living grid as the home page's
 * Contact: dark at first, its red growing down cell by cell as the section scrolls in (and
 * pulling back if it scrolls away), out of a ragged, dissolving top edge; each cell the
 * pointer crosses then lights and ticks.
 */
export function AboutFooter() {
  const { playCue, soundOn, getSounds } = useIntro();
  const gridRef = useRef<HTMLDivElement>(null);
  const reveal = useRef(0);

  // While the footer's on screen, the floating badges (the docked ID card, the music's mini
  // disc) step out of the way of its keys and credits: they watch <html data-page-end>.
  const ref = useRef<HTMLElement>(null);
  useEffect(() => {
    const footer = ref.current;
    if (!footer) return;
    const root = document.documentElement;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) root.dataset.pageEnd = "";
        else delete root.dataset.pageEnd;
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    observer.observe(footer);
    return () => {
      observer.disconnect();
      delete root.dataset.pageEnd;
    };
  }, []);

  const gridLive = useScrollReveal(ref, reveal, () => playCue("tap"));
  useGridPointerSounds(gridRef, gridLive && soundOn, getSounds);

  return (
    <section ref={ref} className={styles.footer} aria-labelledby="say-hello">
      <div ref={gridRef} aria-hidden="true" className={styles.grid}>
        <WebsiteShaderBackground
          preset="kinetic-dots"
          tone="light"
          revealDuration={1}
          revealControl={reveal}
          topEdgeRows={3}
          revealFrom="top"
        />
      </div>
      <div className={styles.inner}>
        <p className={styles.label}>Say hello</p>
        <h2 id="say-hello" className={styles.statement}>
          That&rsquo;s the story so far.
          <span className={styles.statementLine}>
            Want to be in the next part?
          </span>
        </h2>

        <div className={styles.keys}>
          <ContactKeys />
        </div>

        <Link
          href="/#work"
          className={`${key.key} ${styles.work}`}
          data-feel="land"
          onMouseEnter={() => playCue("tap")}
        >
          See my work
          <svg
            aria-hidden="true"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M5 12h14M13 6l6 6-6 6"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </Link>

        <Credits />
      </div>
    </section>
  );
}
