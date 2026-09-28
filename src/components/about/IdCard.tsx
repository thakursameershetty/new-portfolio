"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import {
  animate as animateValue,
  motion,
  useAnimate,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { onTilt } from "../deviceTilt";
import { useIntro } from "../SiteIntro";
import { StickerPeel } from "./StickerPeel";
import key from "./Keycap.module.css";
import styles from "./IdCard.module.css";

// Thakur's photo (square, 640px, from public/about/id/20250115_181050.jpg), shown in black
// and white.
const photo = "/about/id/photo.webp";

// The stickers on the back, where they start (as fractions of the back's width and height,
// from its top-left) and how far each is turned. All can be peeled and moved.
const stickers = [
  {
    src: "/about/id/stickers/feel-right.png",
    x: 0.04,
    y: 0.08,
    size: 0.25,
    rotate: -8,
  },
  {
    src: "/about/id/stickers/floppy.png",
    x: 0.31,
    y: 0.2,
    size: 0.2,
    rotate: 10,
  },
  {
    src: "/about/id/stickers/damn.png",
    x: 0.42,
    y: 0.24,
    size: 0.36,
    rotate: -3,
  },
  {
    src: "/about/id/stickers/controller.png",
    x: 0.22,
    y: 0.46,
    size: 0.22,
    rotate: -12,
  },
  {
    src: "/about/id/stickers/vinyl.png",
    x: 0.03,
    y: 0.62,
    size: 0.2,
    rotate: 0,
  },
  {
    src: "/about/id/stickers/pixels-code.png",
    x: 0.74,
    y: 0.06,
    size: 0.22,
    rotate: 8,
  },
];

// A barcode for the back, drawn from the name: each letter's code sets a bar and a gap.
const bars = (() => {
  let x = 0;
  const out: { x: number; w: number }[] = [];
  for (const char of "THAKURSAMEERSHETTY") {
    const code = char.charCodeAt(0);
    const w = 1 + (code % 3);
    out.push({ x, w });
    x += w + 1 + ((code >> 2) % 3);
  }
  return { out, width: x };
})();

const spring = { stiffness: 180, damping: 18, mass: 0.6 };

/**
 * A portfolio ID card on a lanyard, two-sided like the reference: the front has the name
 * written in, the details typed, and the photo in black and white on a starburst; the back
 * carries a barcode and a crowd of stickers that peel up under the pointer (or a finger) and
 * can be moved anywhere on it. Click the card, or its Flip key, to turn it over. It drops in
 * and sways as if just hung, and the front tilts toward the pointer under a moving gloss.
 */
export function IdCard() {
  const reduced = useReducedMotion();
  const { playCue } = useIntro();
  const [side, setSide] = useState<"front" | "back">("front");
  const [turning, setTurning] = useState(false);
  const [scope, animate] = useAnimate();
  const backRef = useRef<HTMLDivElement>(null);
  const [backSize, setBackSize] = useState<{ w: number; h: number } | null>(
    null,
  );

  // Pointer over the front, 0 to 1 each way.
  const px = useMotionValue(0.5);
  const py = useMotionValue(0.5);
  const sx = useSpring(px, spring);
  const sy = useSpring(py, spring);
  const rotateY = useTransform(sx, [0, 1], [-12, 12]);
  const rotateX = useTransform(sy, [0, 1], [9, -9]);
  const glossX = useTransform(sx, [0, 1], [0, 100]);
  const glossY = useTransform(sy, [0, 1], [0, 100]);
  // The lanyard: it leans a little with the pointer, swings like a pendulum when the card
  // turns over, and its strap twists as the card goes edge-on.
  const swing = useMotionValue(0);
  const lean = useTransform(sx, [0, 1], [2, -2]);
  const hangRotate = useTransform(() => swing.get() + lean.get());
  const twist = useMotionValue(1);
  const gloss = useMotionTemplate`radial-gradient(55% 60% at ${glossX}% ${glossY}%, rgba(255, 255, 255, 0.35), transparent 70%)`;

  const settle = () => {
    px.set(0.5);
    py.set(0.5);
  };
  const tilt = (event: React.PointerEvent<HTMLDivElement>) => {
    // Both sides tilt; it holds still while a button's down, so a sticker being dragged on
    // the back stays under the pointer.
    if (reduced || event.pointerType !== "mouse" || event.buttons) return;
    const rect = event.currentTarget.getBoundingClientRect();
    px.set((event.clientX - rect.left) / rect.width);
    py.set((event.clientY - rect.top) / rect.height);
  };

  // On phones, the gyroscope does what the mouse does: tipping the phone tilts the card and
  // slides its gloss (measured from however the phone's held, so holding it still settles
  // the card level). It holds still while a finger's on the card, so a sticker being
  // dragged on the back stays under it. The permission it needs on iPhones is asked on the
  // page's first tap (PageSound).
  const touchingRef = useRef(false);
  useEffect(() => {
    if (reduced) return;
    const release = () => (touchingRef.current = false);
    window.addEventListener("pointerup", release);
    window.addEventListener("pointercancel", release);
    // A sharp jolt knocks the loop in its slot: a clink, when the tilt's speed (smoothed,
    // in full tilts per second) jumps past `jolt`, at most one per `rest` ms, and only
    // while the card's hanging where it can be seen (not docked, not scrolled away).
    const jolt = 3;
    const rest = 550;
    let last: { x: number; y: number; t: number } | null = null;
    let speed = 0;
    let lastClink = 0;
    const stop = onTilt((x, y) => {
      if (touchingRef.current) return;
      px.set(0.5 + x * 0.5);
      py.set(0.5 + y * 0.5);

      const now = performance.now();
      if (last) {
        const dt = Math.max(now - last.t, 8) / 1000;
        const moved = Math.hypot(x - last.x, y - last.y) / dt;
        speed += (moved - speed) * 0.35;
      }
      last = { x, y, t: now };
      if (speed < jolt || now - lastClink < rest) return;
      const zone = cardZoneRef.current;
      if (!zone || zone.style.visibility === "hidden") return;
      const box = zone.getBoundingClientRect();
      if (box.bottom < 0 || box.top > window.innerHeight) return;
      lastClink = now;
      speed = 0;
      playCue("clink");
    });
    return () => {
      stop();
      window.removeEventListener("pointerup", release);
      window.removeEventListener("pointercancel", release);
    };
  }, [reduced, px, py, playCue]);

  // Turns over edge-on (to 90°), swaps faces out of sight, and comes back square, so at rest
  // neither side carries a 3D turn (which would throw off dragging the stickers).
  const flip = async () => {
    if (turning) return;
    setTurning(true);
    settle();
    playCue("swap");
    const next = side === "front" ? "back" : "front";
    if (!reduced) {
      // A kick one way and a damped swing back, alternating with each turn.
      const kick = next === "back" ? 1 : -1;
      animateValue(
        swing,
        [0, 7 * kick, -4.5 * kick, 2.5 * kick, -1 * kick, 0],
        {
          duration: 1.6,
          ease: "easeOut",
        },
      );
      animateValue(twist, [1, 0.35, 1], { duration: 0.54, ease: "easeInOut" });
    }
    if (reduced) {
      setSide(next);
    } else {
      await animate(
        scope.current,
        { rotateY: 90 },
        { duration: 0.2, ease: [0.55, 0, 1, 0.45] },
      );
      setSide(next);
      await animate(
        scope.current,
        { rotateY: [-90, 0] },
        { duration: 0.34, ease: [0.22, 1, 0.36, 1] },
      );
    }
    setTurning(false);
  };

  // The back is measured the first time it shows, to place the stickers by its size; both
  // sides stay mounted after that, so stickers stay wherever they were moved to.
  useEffect(() => {
    if (side !== "back" || backSize) return;
    const frame = requestAnimationFrame(() => {
      const back = backRef.current;
      if (back) setBackSize({ w: back.offsetWidth, h: back.offsetHeight });
    });
    return () => cancelAnimationFrame(frame);
  }, [side, backSize]);

  // ---- Docking ----
  // Scrolled half past the card, it lifts off the lanyard: a copy of it (as it is: the side
  // showing, the stickers where they were moved) shrinks, spins over once and settles in
  // the corner as a badge, while the card itself stays in place, out of sight. Scrolling
  // back, the copy spins back and lands on the lanyard again. Clicking the badge scrolls
  // back to the card. Built outside React (a node on <body>), so no transformed ancestor
  // can pin its position:fixed to the wrong box.
  const hangRef = useRef<HTMLDivElement>(null);
  const underRef = useRef<HTMLDivElement>(null);
  const lanyardRef = useRef<HTMLDivElement>(null);
  const cardZoneRef = useRef<HTMLDivElement>(null);
  const reducedRef = useRef(reduced);
  const cueRef = useRef(playCue);
  useEffect(() => {
    reducedRef.current = reduced;
    cueRef.current = playCue;
  }, [reduced, playCue]);

  useEffect(() => {
    const hang = hangRef.current;
    const under = underRef.current;
    const lanyard = lanyardRef.current;
    const cardZone = cardZoneRef.current;
    if (!hang || !under || !lanyard || !cardZone) return;

    // The lanyard reels up out of sight when the card leaves, and drops back down to meet
    // it on its way home; the card (with the loop through it) and the Flip key hide
    // meanwhile, and the card's arrival gives the lanyard a little swing.
    let reel: { stop: () => void } | null = null;
    const reelUp = () => {
      reel?.stop();
      reel = animateValue(
        lanyard,
        { y: -70, opacity: 0 },
        { duration: reducedRef.current ? 0 : 0.35, ease: [0.55, 0, 1, 0.45] },
      );
    };
    const reelDown = (duration: number) => {
      reel?.stop();
      reel = animateValue(
        lanyard,
        { y: 0, opacity: 1 },
        reducedRef.current
          ? { duration: 0 }
          : { type: "spring", stiffness: 170, damping: 16, duration },
      );
    };
    const showCard = (on: boolean) => {
      cardZone.style.visibility = on ? "" : "hidden";
      under.style.visibility = on ? "" : "hidden";
    };

    const dock = document.createElement("button");
    dock.type = "button";
    dock.className = styles.dock;
    dock.hidden = true;
    dock.setAttribute("aria-label", "Portfolio ID card: scroll back to it");
    const spin = document.createElement("div");
    spin.className = styles.dockSpin;
    dock.append(spin);
    document.body.append(dock);

    const ease = [0.22, 1, 0.36, 1] as const;
    const badgeWidth = () => (window.innerWidth < 600 ? 116 : 168);
    const shown = () =>
      hang.querySelector<HTMLElement>("article:not([hidden])");
    let docked = false;

    type Box = { x: number; y: number; scale: number };
    const corner = (width: number, height: number): Box => {
      const scale = badgeWidth() / width;
      return {
        x: window.innerWidth - width * scale - 20,
        y: window.innerHeight - height * scale - 20,
        scale,
      };
    };
    // Where the card is right now (it moves while the page scrolls).
    const onCard = (): Box => {
      const rect = shown()?.getBoundingClientRect();
      return rect
        ? { x: rect.left, y: rect.top, scale: 1 }
        : { x: 0, y: 0, scale: 1 };
    };
    const place = (box: Box, turn: number) => {
      dock.style.transform = `translate(${box.x}px, ${box.y}px) scale(${box.scale})`;
      spin.style.transform = `rotateY(${turn}deg)`;
    };

    // One flight from one box to another, with both ends read afresh on every frame: the
    // card keeps moving while the page scrolls (as it does after the badge is clicked),
    // so a flight aimed at where it was when it set off would land short, then snap.
    let flight: { stop: () => void } | null = null;
    const fly = (
      from: () => Box,
      to: () => Box,
      turn: [number, number],
      duration: number,
      done?: () => void,
    ) => {
      flight?.stop();
      const run = animateValue(0, 1, {
        duration: reducedRef.current ? 0 : duration,
        ease,
        onUpdate: (t) => {
          const a = from();
          const b = to();
          place(
            {
              x: a.x + (b.x - a.x) * t,
              y: a.y + (b.y - a.y) * t,
              scale: a.scale + (b.scale - a.scale) * t,
            },
            reducedRef.current ? 0 : turn[0] + (turn[1] - turn[0]) * t,
          );
        },
      });
      flight = run;
      run.then(() => {
        if (flight !== run) return;
        flight = null;
        done?.();
      });
    };

    const dockIn = () => {
      const source = shown();
      if (!source) return;
      const width = source.offsetWidth;
      const height = source.offsetHeight;
      // Two faces, back to back: the side showing, then the other, so the spin passes it.
      const other = [...hang.querySelectorAll<HTMLElement>("article")].find(
        (a) => a !== source,
      );
      spin.replaceChildren();
      [source, other].forEach((article, i) => {
        if (!article) return;
        const face = article.cloneNode(true) as HTMLElement;
        face.hidden = false;
        face.removeAttribute("aria-label");
        face.classList.add(styles.dockFace);
        if (i === 1) face.classList.add(styles.dockFaceBack);
        spin.append(face);
      });
      dock.style.setProperty("--card-w", `${width}px`);
      dock.style.width = `${width}px`;
      dock.style.height = `${height}px`;
      place(onCard(), 0);
      dock.hidden = false;
      showCard(false);
      reelUp();
      cueRef.current("swap");
      fly(onCard, () => corner(width, height), [0, 360], 0.85);
    };

    const dockOut = () => {
      const card = shown();
      if (!card) return;
      const width = card.offsetWidth;
      const height = card.offsetHeight;
      cueRef.current("land");
      // Down in time to catch it.
      reelDown(0.5);
      fly(
        () => corner(width, height),
        onCard,
        [360, 0],
        0.75,
        () => {
          if (docked) return;
          showCard(true);
          dock.hidden = true;
          spin.replaceChildren();
          if (!reducedRef.current) {
            animateValue(swing, [0, 3.5, -2.2, 1.1, 0], {
              duration: 1.1,
              ease: "easeOut",
            });
          }
        },
      );
    };

    let frame = 0;
    const check = () => {
      frame = 0;
      const card = shown();
      if (!card) return;
      const rect = card.getBoundingClientRect();
      const should = rect.bottom < rect.height * 0.5;
      if (should === docked) return;
      docked = should;
      if (docked) dockIn();
      else dockOut();
    };
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(check);
    };
    // Kept in its corner when the window changes size.
    const onResize = () => {
      if (!docked || flight) return;
      const card = shown();
      if (card) place(corner(card.offsetWidth, card.offsetHeight), 360);
    };
    const onClick = () =>
      hang.scrollIntoView({
        behavior: reducedRef.current ? "auto" : "smooth",
        block: "center",
      });

    dock.addEventListener("click", onClick);
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    check();
    return () => {
      cancelAnimationFrame(frame);
      flight?.stop();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      reel?.stop();
      dock.remove();
      showCard(true);
      lanyard.style.transform = "";
      lanyard.style.opacity = "";
    };
  }, [swing]);

  return (
    <div className={styles.area}>
      <motion.div
        ref={hangRef}
        className={styles.hang}
        initial={reduced ? false : { y: -120, rotate: -8, opacity: 0 }}
        animate={{ y: 0, rotate: 0, opacity: 1 }}
        transition={{
          type: "spring",
          stiffness: 120,
          damping: 7,
          mass: 0.9,
          delay: 0.2,
        }}
      >
        <motion.div className={styles.swing} style={{ rotate: hangRotate }}>
          <div ref={lanyardRef} className={styles.lanyard}>
            <motion.div
              aria-hidden="true"
              className={styles.strap}
              style={{ scaleX: twist }}
            >
              <span className={styles.strapText}>
                THAKURSAMEERSHETTY.COM · THAKURSAMEERSHETTY.COM
              </span>
            </motion.div>
            <div aria-hidden="true" className={styles.clip} />
          </div>

          <div
            ref={cardZoneRef}
            className={styles.tiltZone}
            onPointerMove={tilt}
            onPointerDown={(event) => {
              if (event.pointerType !== "mouse") touchingRef.current = true;
            }}
            onPointerLeave={settle}
          >
            <motion.div style={{ rotateX, rotateY }} className={styles.tilt}>
              {/* The clip's loop, threaded through the card's slot: its legs come down in front
                of the card and its curve rests in the slot, on the slot's lower edge, as the
                card hangs from it. It moves with the card, so it stays threaded as the card
                tilts and turns. */}
              <span aria-hidden="true" className={styles.loopBack} />
              {/* One leg crosses in front of the card, the other runs behind it, so the loop
                  reads as threaded through the slot: the left leg from the front, the right
                  from the back (the same leg, seen from the other side). */}
              <span
                aria-hidden="true"
                className={clsx(
                  styles.loopFront,
                  side === "front" ? styles.legLeft : styles.legRight,
                )}
              />
              <div ref={scope} className={styles.flipper}>
                <article
                  className={clsx(styles.card, styles.front)}
                  aria-label="Portfolio ID card, front"
                  hidden={side !== "front"}
                  onClick={flip}
                >
                  <span aria-hidden="true" className={styles.slot} />
                  <span
                    aria-hidden="true"
                    className={clsx(styles.scuff, styles.scuffFront)}
                  />
                  <h3 className={styles.title}>Portfolio ID card</h3>

                  <div className={styles.frontBody}>
                    <div className={styles.details}>
                      <p className={styles.type}>hello my name is...</p>
                      <p className={styles.signature}>Thakur</p>
                      <p className={styles.type}>dob: 10.08.2005</p>
                      <p className={clsx(styles.type, styles.position)}>
                        position:
                        <br />
                        product designer, ui/ux
                        <br />
                        designer and full stack
                        <br />
                        builder
                      </p>
                      <p className={styles.type}>expire date: never</p>
                    </div>

                    <div className={styles.photoSide}>
                      <div className={styles.photoFrame}>
                        <svg
                          aria-hidden="true"
                          viewBox="0 0 100 100"
                          className={styles.burst}
                        >
                          <polygon points={starburst(12, 50, 22)} />
                        </svg>
                        <Image
                          src={photo}
                          alt="Thakur Sameer Shetty"
                          width={640}
                          height={640}
                          className={styles.photo}
                          priority
                        />
                      </div>
                      <p className={styles.caption}>FRONTAL VIEW</p>
                    </div>
                  </div>

                  <motion.span
                    aria-hidden="true"
                    className={styles.gloss}
                    style={{ background: gloss }}
                  />
                </article>
                <article
                  ref={backRef}
                  className={clsx(styles.card, styles.back)}
                  aria-label="Portfolio ID card, back, covered in stickers"
                  hidden={side !== "back"}
                  // Clicking the card turns it back over; clicks on a sticker (or the end
                  // of dragging one) are the sticker's own.
                  onClick={(event) => {
                    if ((event.target as Element).closest("[data-sticker]"))
                      return;
                    flip();
                  }}
                >
                  <span aria-hidden="true" className={styles.slot} />
                  <span aria-hidden="true" className={styles.scuff} />
                  <p className={styles.nonTransfer}>NON-TRANSFERABLE</p>
                  {/* The same gloss as the front, under the stickers. */}
                  <motion.span
                    aria-hidden="true"
                    className={clsx(styles.gloss, styles.glossUnder)}
                    style={{ background: gloss }}
                  />
                  <div aria-hidden="true" className={styles.barcodeBlock}>
                    <svg
                      className={styles.barcode}
                      viewBox={`0 0 ${bars.width} 20`}
                      preserveAspectRatio="none"
                    >
                      {bars.out.map((bar) => (
                        <rect
                          key={bar.x}
                          x={bar.x}
                          width={bar.w}
                          height="20"
                          fill="currentColor"
                        />
                      ))}
                    </svg>
                    <span className={styles.barcodeNo}>1 0 08 2005 7</span>
                  </div>

                  {/* The stickers, placed once the back has a size to place them by. */}
                  {backSize &&
                    stickers.map((sticker) => (
                      <StickerPeel
                        key={sticker.src}
                        imageSrc={sticker.src}
                        width={Math.round(backSize.w * sticker.size)}
                        rotate={sticker.rotate}
                        peelBackHoverPct={22}
                        peelBackActivePct={38}
                        shadowIntensity={0.45}
                        lightingIntensity={0.12}
                        initialPosition={{
                          x: backSize.w * sticker.x,
                          y: backSize.h * sticker.y,
                        }}
                      />
                    ))}
                </article>
              </div>
            </motion.div>
          </div>
        </motion.div>
      </motion.div>

      <div ref={underRef} className={styles.under}>
        <button type="button" className={key.key} onClick={flip}>
          <svg
            aria-hidden="true"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M4 12a8 8 0 0 1 13.7-5.6L20 8.7M20 4v4.7h-4.7M20 12a8 8 0 0 1-13.7 5.6L4 15.3M4 20v-4.7h4.7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          {side === "front" ? "Flip it over" : "Flip back"}
        </button>
        <p className={styles.hint}>
          {side === "front"
            ? "Stickers on the back"
            : "Peel the stickers and move them around"}
        </p>
      </div>
    </div>
  );
}

// Points of a starburst: `spikes` outer points around the centre of a 100-unit box,
// alternating with inner ones `depth` units in.
function starburst(spikes: number, radius: number, depth: number) {
  const points: string[] = [];
  for (let i = 0; i < spikes * 2; i++) {
    const r = i % 2 === 0 ? radius : radius - depth;
    const angle = (Math.PI * i) / spikes - Math.PI / 2;
    points.push(
      `${(50 + r * Math.cos(angle)).toFixed(2)},${(50 + r * Math.sin(angle)).toFixed(2)}`,
    );
  }
  return points.join(" ");
}
