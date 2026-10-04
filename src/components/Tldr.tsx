"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ShredderIcon } from "./icons/ShredderIcon";
import { Diagram, isPhoneDiagram } from "./diagrams/Diagram";
import { CompactDiagrams } from "./diagrams/widget";
import type { CaseTldr, ScreenItem, TldrPart } from "./projects";
import styles from "./Tldr.module.css";

// The case study in a minute: a dark "TL;DR" pill that rises at the foot of the screen once
// the story starts, and opens the whole case study summed up in a white panel: overview,
// problem, (a reframe), solution, result, learnings. Its springs, sizes and layering follow
// the reference the owner chose (rahulrnadkarni.framer.website/wonders), except the key's own
// entrance, made quicker; the backdrop fades to 80% black; the panel springs up from 600px below
// while growing from 80%, and the close button fades in a beat later.

// The reference's springs.
// The key's own entrance is quicker than the reference's (its overdamped spring crept into
// place): a light spring with a touch of settle, like the contents button's pop.
const pillIn = { type: "spring", damping: 26, mass: 0.8, stiffness: 520 } as const;
const press = { type: "spring", damping: 60, mass: 6, stiffness: 600 } as const;
const panelIn = { type: "spring", damping: 80, mass: 6, stiffness: 600 } as const;
const panelOut = { type: "spring", damping: 60, mass: 3, stiffness: 600 } as const;

// The key shrinking into its square (and back): one smooth move, no bounce.
const morph = { type: "spring", damping: 34, mass: 1, stiffness: 340 } as const;

export function Tldr({
  tldr,
  shown,
  minimised = false,
  onOpenChange,
  findSection,
  onJump,
}: {
  tldr: CaseTldr;
  /** Whether the pill shows (once the story has started, and nothing covers it). */
  shown: boolean;
  /** 30% through the case study: the key steps aside, a small circle at the bottom right. */
  minimised?: boolean;
  onOpenChange?: (open: boolean) => void;
  /** Where in the story a picture comes from (a part's position), or -1. */
  findSection?: (item: ScreenItem) => number;
  /** Go to a part of the story. */
  onJump?: (position: number) => void;
}) {
  const [open, setOpen] = useState(false);
  // The shredder runs while the circle is hovered, and once (one pass, 1.5s) as the key
  // shrinks into it.
  const [hovered, setHovered] = useState(false);
  const [shredding, setShredding] = useState(false);
  const [wasMinimised, setWasMinimised] = useState(minimised);
  if (wasMinimised !== minimised) {
    setWasMinimised(minimised);
    setShredding(minimised);
  }
  useEffect(() => {
    if (!shredding) return;
    const timer = window.setTimeout(() => setShredding(false), 1500);
    return () => window.clearTimeout(timer);
  }, [shredding]);
  const still = Boolean(useReducedMotion());
  const rootRef = useRef<HTMLDivElement>(null);
  // On a phone the panel is a sheet from the bottom; wider, a card in the middle.
  const [narrow, setNarrow] = useState(false);
  useEffect(() => {
    const query = window.matchMedia("(max-width: 720px)");
    const update = () => setNarrow(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, []);

  const setOpenAndTell = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
  };

  useEffect(() => {
    if (!open) return;
    // Esc closes the summary, not the case study around it (a <dialog> on the home page).
    const handleKey = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      setOpen(false);
      onOpenChange?.(false);
    };
    window.addEventListener("keydown", handleKey, true);
    // The page under it holds still: whichever is scrolling, the page or the case study's
    // own window.
    const scroller =
      rootRef.current?.closest("dialog") ?? document.scrollingElement ?? document.documentElement;
    const previous = (scroller as HTMLElement).style.overflow;
    (scroller as HTMLElement).style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", handleKey, true);
      (scroller as HTMLElement).style.overflow = previous;
    };
  }, [open, onOpenChange]);

  const panelFrom = narrow
    ? { opacity: 1, y: 800, scale: 1 }
    : { opacity: 0, y: 600, scale: 0.8 };

  return (
    // Takes no room where it sits: everything in it floats.
    <div ref={rootRef} className={styles.root}>
      {/* The pill at the foot of the screen. */}
      <AnimatePresence>
        {shown && !open && (
          <motion.div
            className={styles.bar}
            data-minimised={minimised || undefined}
            initial={still ? false : { opacity: 0, y: 48, scale: 0.92 }}
            animate={{
              opacity: 1,
              y: 0,
              scale: 1,
              transition: { ...pillIn, opacity: { duration: 0.18 } },
            }}
            exit={{
              opacity: 0,
              y: 32,
              scale: 0.96,
              transition: { duration: 0.2, ease: [0.4, 0, 1, 1] },
            }}
          >
            <motion.button
              type="button"
              className={styles.pill}
              aria-haspopup="dialog"
              aria-label="TL;DR"
              layout={!still}
              transition={{ layout: morph }}
              // Round like the contents button and its progress ring: rounded ends while it's
              // wide, a circle once it shrinks. Set here (not only in CSS) so the curve stays
              // true while it changes shape.
              style={{ borderRadius: 24 }}
              onClick={() => setOpenAndTell(true)}
              onHoverStart={() => setHovered(true)}
              onHoverEnd={() => setHovered(false)}
              whileHover={{ scale: 1.05, transition: press }}
              whileTap={{ scale: 0.95, transition: press }}
            >
              <AnimatePresence initial={false}>
                {minimised ? (
                  <motion.span
                    key="icon"
                    className={styles.face}
                    initial={{ opacity: 0, scale: 0.6 }}
                    animate={{ opacity: 1, scale: 1, transition: { delay: 0.12, duration: 0.2 } }}
                    exit={{ opacity: 0, scale: 0.6, transition: { duration: 0.12 } }}
                  >
                    <ShredderIcon size={22} active={hovered || shredding} />
                  </motion.span>
                ) : (
                  <motion.span
                    key="label"
                    className={styles.face}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1, transition: { delay: 0.12, duration: 0.2 } }}
                    exit={{ opacity: 0, transition: { duration: 0.1 } }}
                  >
                    TL;DR
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The summary. */}
      <AnimatePresence>
        {open && (
          <>
            <motion.div
              key="backdrop"
              className={styles.backdrop}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { duration: 0.3, ease: [0.5, 0, 0.88, 0.77] } }}
              exit={{ opacity: 0, transition: { duration: 0.3, ease: [0.12, 0.23, 0.5, 1] } }}
              onClick={() => setOpenAndTell(false)}
            />
            <div className={styles.frame} role="dialog" aria-modal="true" aria-label="TL;DR">
              <motion.button
                key="close"
                type="button"
                className={styles.close}
                aria-label="Close the TL;DR"
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  transition: still
                    ? { duration: 0 }
                    : { type: "spring", damping: 120, mass: 4, stiffness: 600, delay: 0.6 },
                }}
                exit={{ opacity: 0, transition: { duration: 0.15 } }}
                whileHover={{ scale: 1.05, transition: press }}
                whileTap={{ scale: 0.9, transition: press }}
                onClick={() => setOpenAndTell(false)}
              >
                <svg viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M6 6l12 12M18 6 6 18" />
                </svg>
              </motion.button>
              <motion.div
                key="panel"
                className={styles.panel}
                initial={still ? { opacity: 0 } : panelFrom}
                animate={{ opacity: 1, y: 0, scale: 1, transition: still ? { duration: 0.2 } : panelIn }}
                exit={still ? { opacity: 0 } : { ...panelFrom, transition: panelOut }}
              >
                <div className={styles.scroll}>
                  <Summary
                    tldr={tldr}
                    compact={!narrow}
                    readFrom={(item) => {
                      const position = findSection?.(item) ?? -1;
                      if (position < 0 || !onJump) return undefined;
                      // Close first; once the page underneath can scroll again, go there.
                      return () => {
                        setOpenAndTell(false);
                        window.setTimeout(() => onJump(position), 80);
                      };
                    }}
                  />
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function Lines({ lines }: { lines: string[] }) {
  return (
    <ul className={styles.lines}>
      {lines.map((line) => (
        <li key={line}>{line}</li>
      ))}
    </ul>
  );
}

/** A part's picture, clip or diagram, if it has one: the diagrams play as they scroll into
 *  view within the panel, as they do in the story. */
type ReadFrom = (item: ScreenItem) => (() => void) | undefined;

function Visual({
  tldr,
  part,
  readFrom,
  compact,
}: {
  tldr: CaseTldr;
  part: TldrPart;
  readFrom: ReadFrom;
  /** In the centred panel (not the phone sheet, which scrolls): diagrams at their shortest. */
  compact: boolean;
}) {
  const item = tldr.visuals?.[part];
  if (!item) return null;
  const read = readFrom(item);
  return (
    <figure className={styles.visual}>
      {item.type === "diagram" ? (
        <div
          className={styles.visualDiagram}
          data-phone={isPhoneDiagram(item.diagram) || undefined}
          role="group"
          aria-label={item.alt}
        >
          <CompactDiagrams.Provider value={compact}>
            <Diagram id={item.diagram} />
          </CompactDiagrams.Provider>
        </div>
      ) : item.type === "video" ? (
        <video
          className={styles.visualMedia}
          src={item.src}
          poster={item.poster}
          aria-label={item.alt}
          muted
          autoPlay
          loop
          playsInline
          preload="metadata"
        />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element -- sized by the panel, loaded only when opened
        <img className={styles.visualMedia} src={item.src} alt={item.alt} loading="lazy" />
      )}
      {(item.caption || read) && (
        <figcaption className={styles.visualFoot}>
          {item.caption && <span className={styles.visualCaption}>{item.caption}</span>}
          {/* Back to where this comes from in the story, in full. */}
          {read && (
            <button type="button" className={styles.read} onClick={read}>
              Read the full story
              <svg viewBox="0 0 16 16" aria-hidden="true">
                <path d="M3 8h9.5M9 4.5 12.5 8 9 11.5" />
              </svg>
            </button>
          )}
        </figcaption>
      )}
    </figure>
  );
}

function Summary({
  tldr,
  readFrom,
  compact,
}: {
  tldr: CaseTldr;
  readFrom: ReadFrom;
  compact: boolean;
}) {
  return (
    <>
      <section className={styles.part}>
        <h2 className={styles.heading}>Overview</h2>
        <Lines lines={tldr.overview} />
        <Visual tldr={tldr} readFrom={readFrom} compact={compact} part="overview" />
      </section>

      {tldr.problem && (
        <section className={styles.part}>
          <h2 className={styles.heading}>Problem</h2>
          <Lines lines={tldr.problem.points} />
          {tldr.problem.insight && <p className={styles.insight}>{tldr.problem.insight}</p>}
          <Visual tldr={tldr} readFrom={readFrom} compact={compact} part="problem" />
        </section>
      )}

      {tldr.reframe && (
        <section className={styles.part}>
          <h2 className={styles.heading}>The reframe</h2>
          <p className={styles.text}>{tldr.reframe.from}</p>
          <p className={styles.text}>I reframed it as:</p>
          <p className={styles.quote}>{tldr.reframe.to}</p>
          <Visual tldr={tldr} readFrom={readFrom} compact={compact} part="reframe" />
        </section>
      )}

      {tldr.solution && (
        <section className={styles.part}>
          <h2 className={styles.heading}>Solution</h2>
          <Lines lines={tldr.solution} />
          <Visual tldr={tldr} readFrom={readFrom} compact={compact} part="solution" />
        </section>
      )}

      {tldr.result && (
        <section className={styles.part}>
          <h2 className={styles.heading}>Result</h2>
          {tldr.result.metrics && (
            <div className={styles.metrics}>
              {tldr.result.metrics.map((metric) => (
                <div key={metric.label} className={styles.metric}>
                  {metric.kicker && <span className={styles.kicker}>{metric.kicker}</span>}
                  <span className={styles.value}>{metric.value}</span>
                  <span className={styles.label}>{metric.label}</span>
                </div>
              ))}
            </div>
          )}
          {tldr.result.points && <Lines lines={tldr.result.points} />}
          <Visual tldr={tldr} readFrom={readFrom} compact={compact} part="result" />
        </section>
      )}

      {tldr.learnings && (
        <section className={styles.part}>
          <h2 className={styles.heading}>Learnings</h2>
          <Lines lines={tldr.learnings} />
          <Visual tldr={tldr} readFrom={readFrom} compact={compact} part="learnings" />
        </section>
      )}
    </>
  );
}
