"use client";

import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import { useReducedMotion } from "framer-motion";
import localFont from "next/font/local";
import { ControlIcon, useDiagramBox } from "./shared";
import styles from "./Diagram.module.css";
import type_ from "./Widget.module.css";
import card from "./SystemCard.module.css";

// A project's design language, as a card of widgets in the diagrams' style: its colours named
// for their jobs, its typefaces set in themselves, and its shape. Every value is from the
// project's Figma file. It isn't a before and after, so it's HTML (it reflows on a phone) and
// its parts come in once as it scrolls into view. Where the colours came from a picture (the
// logo, a poster, the style guide), it's shown first: a dot lands on each colour in it, then
// each dot flies down and stretches into its swatch.

// TMN's Epilogue and Inter, and Rao Bahadur's Cinzel (with Inter), Latin subsets (SIL Open
// Font License), self-hosted like the site's own. Nova's Product Sans is Google Sans, the
// site's display face already.
const epilogue = localFont({
  src: "../../fonts/epilogue-latin.woff2",
  weight: "400 800",
  variable: "--font-epilogue",
});
const inter = localFont({
  src: "../../fonts/inter-latin.woff2",
  weight: "400 700",
  variable: "--font-inter",
});
// MutinyX's General Sans (ITF Free Font License, from Fontshare), self-hosted the same way.
const generalSans = localFont({
  src: "../../fonts/general-sans.woff2",
  weight: "200 700",
  variable: "--font-general",
});
// Amero X's Gambarino (Fontshare) and Space Grotesk (OFL), self-hosted the same way.
const gambarino = localFont({
  src: "../../fonts/gambarino.woff2",
  weight: "400",
  variable: "--font-gambarino",
});
const spaceGrotesk = localFont({
  src: "../../fonts/space-grotesk-latin.woff2",
  weight: "300 700",
  variable: "--font-space-grotesk",
});
const outfit = localFont({
  src: "../../fonts/outfit-latin.woff2",
  weight: "300 700",
  variable: "--font-outfit",
});
const cinzel = localFont({
  src: "../../fonts/cinzel-latin.woff2",
  weight: "400 900",
  variable: "--font-cinzel",
});

interface Colour {
  name: string;
  hex: string;
  use: string;
  ink: string;
  /** A gradient, when the colour is one. */
  fill?: string;
}

interface Face {
  text: string;
  style: CSSProperties;
  lang?: string;
}

interface Pill {
  label: string;
  /** chip, tag or button: sizes, from small to large. */
  kind: "chip" | "tag" | "button";
  bg: string;
  fg: string;
  border?: string;
}

/** A picture the colours were picked from, and where in it (in %) each colour sits; null for a
 *  colour that isn't in it. */
interface Picture {
  src: string;
  alt: string;
  width: number;
  height: number;
  picks: ({ x: number; y: number } | null)[];
}

/** The area (px²) each logo gets when there's more than one, so they look the same size. */
const SHARED_AREA = 16000;

/** Where the colours came from: one picture or more (a colour in none simply fades in). */
interface Source {
  label: string;
  pictures: Picture[];
  /** The panel behind them: light for a logo drawn for light, and the other way round. */
  backdrop: string;
}

interface System {
  colours: Colour[];
  source?: Source;
  specimen: CSSProperties;
  faces: Face[];
  typeNote?: string;
  pills: Pill[];
  pillFont: string;
  shapeNote: string;
  footer?: string;
  fonts?: string;
}

const TMN: System = {
  colours: [
    {
      name: "The news",
      hex: "#DB0D14",
      use: "Breaking news, the Trending tag, and whatever's selected",
      ink: "#ffffff",
    },
    {
      name: "The ink",
      hex: "#1A1C1C",
      use: "Headlines and text",
      ink: "#ffffff",
    },
    {
      name: "The page",
      hex: "#FFFFFF",
      use: "The page, and type on red",
      ink: "#1A1C1C",
    },
  ],
  source: {
    label: "Picked from both logos",
    backdrop: "#ffffff",
    pictures: [
      {
        src: "/logos/tmn-mark.webp",
        alt: "The TMN logo",
        width: 395,
        height: 158,
        picks: [
          { x: 6, y: 40 },
          { x: 8, y: 88 },
          { x: 15, y: 18 },
        ],
      },
      {
        src: "/logos/satara-today-mark.webp",
        alt: "The Satara Today logo",
        width: 318,
        height: 368,
        // The red, the white lettering (a cut-out), and the black "Voice of Satara".
        picks: [
          { x: 30, y: 20 },
          { x: 9, y: 95.7 },
          { x: 60, y: 38 },
        ],
      },
    ],
  },
  specimen: { fontFamily: "var(--font-epilogue), sans-serif", fontWeight: 700 },
  faces: [
    {
      text: "Epilogue, for headlines",
      style: {
        fontFamily: "var(--font-epilogue), sans-serif",
        fontSize: 22,
        fontWeight: 700,
      },
    },
    {
      text: "Inter, for everything else",
      style: {
        fontFamily: "var(--font-inter), sans-serif",
        fontSize: 17,
        opacity: 0.8,
      },
    },
    {
      text: "आयफोन 17 आघाडीवर",
      lang: "mr",
      style: { fontSize: 21, fontWeight: 700, marginTop: 12 },
    },
  ],
  typeNote: "Marathi takes the same sizes and the same layout",
  pills: [
    { label: "Politics", kind: "chip", bg: "#db0d14", fg: "#ffffff" },
    {
      label: "Sports",
      kind: "chip",
      bg: "#2c2a27",
      fg: "rgba(244, 236, 230, 0.6)",
    },
    { label: "Trending", kind: "tag", bg: "#db0d14", fg: "#ffffff" },
    { label: "Publish", kind: "button", bg: "#ffffff", fg: "#1a1c1c" },
  ],
  pillFont: "var(--font-inter), sans-serif",
  shapeNote: "One shape, fully round: chips, tags and buttons",
  footer: "Set up in Figma as styles and component variants.",
  fonts: `${epilogue.variable} ${inter.variable}`,
};

const NOVA: System = {
  colours: [
    {
      name: "The action",
      hex: "#0171FF",
      use: "Buttons, links, and the deep end of the gradient",
      ink: "#ffffff",
    },
    {
      name: "The sky",
      hex: "#92D5FF",
      use: "The light end of the gradient, and its blobs",
      ink: "#0b2540",
    },
    {
      name: "The glass",
      hex: "#FFFFFF",
      use: "Frosted panels and cards, with black (#000000) text",
      ink: "#0b2540",
    },
    {
      name: "The icon",
      hex: "#9592EA → #1D2B85",
      use: "The app icon's petals, lavender to navy",
      ink: "#ffffff",
      fill: "linear-gradient(135deg, #9592ea, #1d2b85)",
    },
  ],
  source: {
    label: "Picked from the style guide and the app icon",
    backdrop: "#ffffff",
    pictures: [
      {
        src: "/work/nova-upi/boards/style-colours.jpg",
        alt: "Nova's style guide: the background gradient, and white, light blue and blue",
        width: 560,
        height: 255,
        picks: [
          { x: 93.2, y: 75.7 },
          { x: 93.2, y: 49.4 },
          { x: 93.2, y: 22.7 },
          null,
        ],
      },
      {
        src: "/logos/nova-logo.png",
        alt: "Nova's app icon: a pinwheel of lavender-to-navy petals on pale blue",
        width: 360,
        height: 360,
        // Measured on the icon: a petal, where its lavender turns to navy.
        picks: [null, null, null, { x: 41.7, y: 33.3 }],
      },
    ],
  },
  specimen: { fontFamily: "var(--font-display), sans-serif", fontWeight: 500 },
  faces: [
    {
      text: "Product Sans, for the whole app",
      style: {
        fontFamily: "var(--font-display), sans-serif",
        fontSize: 22,
        fontWeight: 500,
      },
    },
    {
      text: "₹33,500.00",
      style: {
        fontFamily: "var(--font-display), sans-serif",
        fontSize: 34,
        fontWeight: 500,
        marginTop: 8,
      },
    },
  ],
  typeNote:
    "Regular and Medium only. SF Pro Display and Plus Jakarta Sans are in the style guide as close alternatives.",
  pills: [
    { label: "See All →", kind: "chip", bg: "#0171ff", fg: "#ffffff" },
    {
      label: "Home",
      kind: "chip",
      bg: "rgba(255, 255, 255, 0.16)",
      fg: "#ffffff",
    },
    { label: "Pull to add", kind: "button", bg: "#0171ff", fg: "#ffffff" },
  ],
  pillFont: "var(--font-display), sans-serif",
  shapeNote: "One shape, fully round: buttons, chips and the tab bar",
  footer: "The glass and blobs come from iOS 26.",
};

const RAO: System = {
  colours: [
    {
      name: "The gold",
      hex: "#F5C66D",
      use: "Buttons, borders and what you can act on",
      ink: "#010a09",
    },
    {
      name: "The title",
      hex: "#FFD16A → #D6812E",
      use: "A gradient for the big headings, after the poster's metal title",
      ink: "#010a09",
      fill: "linear-gradient(135deg, #ffd16a, #d6812e, #ffd16a)",
    },
    {
      name: "The peacock",
      hex: "#008288",
      use: "Section labels and tags",
      ink: "#f4ead5",
    },
    {
      name: "The night",
      hex: "#010A09",
      use: "The page, with cream text (#F4EAD5) on it",
      ink: "#f4ead5",
    },
  ],
  source: {
    label: "Picked from the film's poster",
    backdrop: "#010a09",
    pictures: [
      {
        src: "/work/raobahadur/poster.jpg",
        alt: "The Rao Bahadur poster: Satyadev in a turban before a fan of peacock feathers, with the title in metal letters",
        width: 640,
        height: 935,
        // Measured on the poster: a feather's gold eye, the title's metal, a shoulder feather's
        // teal, and the dark at its edge.
        picks: [
          { x: 9.5, y: 16.4 },
          { x: 58.3, y: 78.5 },
          { x: 73.1, y: 52.1 },
          { x: 1.9, y: 90.8 },
        ],
      },
    ],
  },
  specimen: { fontFamily: "var(--font-cinzel), serif", fontWeight: 700 },
  faces: [
    {
      text: "Cinzel, for headings and buttons",
      style: {
        fontFamily: "var(--font-cinzel), serif",
        fontSize: 22,
        fontWeight: 700,
      },
    },
    {
      text: "Inter, for everything else",
      style: {
        fontFamily: "var(--font-inter), sans-serif",
        fontSize: 17,
        opacity: 0.8,
      },
    },
  ],
  typeNote:
    "Cinzel in capitals for the big moments; Inter for reading theories",
  pills: [
    {
      label: "Root for Rao Bahadur",
      kind: "button",
      bg: "#f5c66d",
      fg: "#010a09",
    },
    {
      label: "See the buzz",
      kind: "button",
      bg: "transparent",
      fg: "#f5c66d",
      border: "#f5c66d",
    },
    { label: "Trending", kind: "tag", bg: "#008288", fg: "#f4ead5" },
  ],
  pillFont: "var(--font-cinzel), serif",
  shapeNote: "Fully round buttons and tags; cards keep a small 8px corner",
  fonts: `${cinzel.variable} ${inter.variable}`,
};

const MUTINY: System = {
  colours: [
    {
      name: "The action",
      hex: "#FACB03",
      use: "Buttons, the quote field, and anything you can act on",
      ink: "#000000",
    },
    {
      name: "The night",
      hex: "#000000",
      use: "The page, behind everything",
      ink: "#ffffff",
    },
    {
      name: "The mark",
      hex: "#1A1A1A",
      use: "The logo's wordmark",
      ink: "#ffffff",
    },
  ],
  source: {
    label: "Picked from the logo",
    backdrop: "#ffffff",
    pictures: [
      {
        src: "/work/mutiny/logo-dark.svg",
        alt: "The MutinyX logo: Mutiny in near-black, and a yellow X",
        width: 2880,
        height: 694,
        // The yellow chevron of the X, and the M's stem.
        picks: [{ x: 88.7, y: 41.8 }, null, { x: 2, y: 43 }],
      },
    ],
  },
  specimen: { fontFamily: "var(--font-general), sans-serif", fontWeight: 600 },
  faces: [
    {
      text: "General Sans, for version 2",
      style: {
        fontFamily: "var(--font-general), sans-serif",
        fontSize: 22,
        fontWeight: 600,
      },
    },
    {
      text: "SF Pro was version 1's",
      style: {
        fontFamily: "system-ui, sans-serif",
        fontSize: 17,
        opacity: 0.6,
      },
    },
  ],
  pills: [
    { label: "Submit Quote", kind: "button", bg: "#facb03", fg: "#000000" },
    {
      label: "₹5000",
      kind: "button",
      bg: "transparent",
      fg: "#ffffff",
      border: "#facb03",
    },
    { label: "Send OTP", kind: "chip", bg: "#facb03", fg: "#000000" },
  ],
  pillFont: "var(--font-general), sans-serif",
  shapeNote: "Buttons and fields fully round (50px); cards at 25px",
  fonts: generalSans.variable,
};

export function MutinySystem(props: {
  className?: string;
  onOpen?: () => void;
}) {
  return <SystemCard system={MUTINY} {...props} />;
}

const AMERO: System = {
  colours: [
    {
      name: "The gold",
      hex: "#FCDA7B",
      use: "The action you're about to take, your balance, the page you're on",
      ink: "#050505",
    },
    {
      name: "The coin",
      hex: "#FCDA7B → #E2B649 → #FDB648",
      use: "The gradient on buttons and highlights, from the coin's metal",
      ink: "#050505",
      fill: "linear-gradient(135deg, #fcda7b, #e2b649, #fdb648)",
    },
    { name: "The mark", hex: "#FDD303", use: "The logo's own yellow", ink: "#050505" },
    {
      name: "The night",
      hex: "#050505",
      use: "The page, with panels at #121212 and text at #EDEDED",
      ink: "#ededed",
    },
  ],
  source: {
    label: "Picked from the logo and the coin",
    backdrop: "#050505",
    pictures: [
      {
        src: "/logos/amerox-cropped.png",
        alt: "The Amero X logo, in yellow",
        width: 1060,
        height: 150,
        // The A's stroke: the logo is one yellow.
        picks: [null, null, { x: 11.5, y: 45 }, null],
      },
      {
        src: "/work/amerox/coin.png",
        alt: "The Amero X coin: a gold AMX coin with a circuit-traced A over a world map",
        width: 512,
        height: 512,
        // Measured on the coin: its bright upper rim, and its face's gold.
        picks: [{ x: 58.6, y: 9.4 }, { x: 39.1, y: 11.7 }, null, null],
      },
    ],
  },
  specimen: { fontFamily: "var(--font-gambarino), serif", fontWeight: 400 },
  faces: [
    {
      text: "Gambarino, for headings",
      style: { fontFamily: "var(--font-gambarino), serif", fontSize: 24 },
    },
    {
      text: "Space Grotesk, for everything else",
      style: { fontFamily: "var(--font-space-grotesk), sans-serif", fontSize: 17, opacity: 0.8 },
    },
  ],
  pills: [
    { label: "Buy ETH", kind: "button", bg: "#fcda7b", fg: "#050505" },
    { label: "Refresh", kind: "chip", bg: "transparent", fg: "#fcda7b", border: "#fcda7b" },
    { label: "Follow", kind: "chip", bg: "#fcda7b", fg: "#050505" },
  ],
  pillFont: "var(--font-space-grotesk), sans-serif",
  shapeNote: "Buttons fully round; cards at 8px",
  fonts: `${gambarino.variable} ${spaceGrotesk.variable}`,
};

export function AmeroSystem(props: { className?: string; onOpen?: () => void }) {
  return <SystemCard system={AMERO} {...props} />;
}

const SPOTMIES: System = {
  colours: [
    {
      name: "The signal",
      hex: "#00EEF9",
      use: "Highlights, borders and glows",
      ink: "#050505",
    },
    {
      name: "The fill",
      hex: "#00D3F3",
      use: "Filled shapes and accents",
      ink: "#050505",
    },
    { name: "The night", hex: "#050505", use: "The page", ink: "#ffffff" },
    {
      name: "The light",
      hex: "#FFFFFF",
      use: "Text on the night",
      ink: "#050505",
    },
  ],
  source: {
    label: "Picked from the logo",
    backdrop: "#050505",
    pictures: [
      {
        src: "/spotmies-mark.png",
        alt: "The Spotmies S mark",
        width: 692,
        height: 684,
        picks: [{ x: 17, y: 88 }, { x: 92, y: 66 }, null, null],
      },
    ],
  },
  specimen: { fontFamily: "var(--font-outfit), sans-serif", fontWeight: 400 },
  faces: [
    {
      text: "Outfit, for headings",
      style: {
        fontFamily: "var(--font-outfit), sans-serif",
        fontSize: 24,
        fontWeight: 400,
      },
    },
    {
      text: "The system's own sans, for body text",
      style: {
        fontFamily: "system-ui, sans-serif",
        fontSize: 17,
        opacity: 0.8,
      },
    },
  ],
  typeNote: "As on the hero: “The future of development is human + AI”",
  pills: [
    { label: "Schedule a call", kind: "button", bg: "#ffffff", fg: "#050505" },
    {
      label: "Get Quote",
      kind: "button",
      bg: "rgba(255, 255, 255, 0.08)",
      fg: "#ffffff",
    },
  ],
  pillFont: "system-ui, sans-serif",
  shapeNote: "Buttons fully round; cards at 16 to 24px",
  fonts: outfit.variable,
};

export function SpotmiesSystem(props: {
  className?: string;
  onOpen?: () => void;
}) {
  return <SystemCard system={SPOTMIES} {...props} />;
}

export function RaoSystem(props: { className?: string; onOpen?: () => void }) {
  return <SystemCard system={RAO} {...props} />;
}

export function TmnSystem(props: { className?: string; onOpen?: () => void }) {
  return <SystemCard system={TMN} {...props} />;
}

export function NovaSystem(props: { className?: string; onOpen?: () => void }) {
  return <SystemCard system={NOVA} {...props} />;
}

function SystemCard({
  system,
  className,
  onOpen,
}: {
  system: System;
  className?: string;
  onOpen?: () => void;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const { onScreen } = useDiagramBox(rootRef);
  // Comes in once, the first time it's seen, and stays.
  const [seen, setSeen] = useState(false);
  if (onScreen && !seen) setSeen(true);

  // The colours' arrival: picked on the picture one at a time, then flown into the swatches.
  const still = Boolean(useReducedMotion());
  const source = system.source;
  // Every dot, in the order they land: picture by picture, colour by colour.
  const picks = (source?.pictures ?? []).flatMap((picture, p) =>
    picture.picks.flatMap((pick, k) => (pick ? [{ p, k, ...pick }] : [])),
  );
  const picked = picks.length;
  const [phase, setPhase] = useState<"waiting" | "picking" | "flying" | "done">(
    source ? "waiting" : "done",
  );
  const [landed, setLanded] = useState<ReadonlySet<number>>(() => new Set());
  const colourRef = useRef<HTMLElement>(null);
  const dotRefs = useRef(new Map<string, HTMLSpanElement>());
  const swatchRefs = useRef<(HTMLDivElement | null)[]>([]);
  // Started once, the first time it's seen. (Keyed on the phase, each step's change cancelled
  // the next step's timer, and it stopped at the dots.)
  const startedRef = useRef(false);
  useEffect(() => {
    if (!seen || !source || startedRef.current) return;
    startedRef.current = true;
    const timers: number[] = [];
    const later = (ms: number, run: () => void) =>
      timers.push(window.setTimeout(run, ms));
    if (still) {
      later(0, () => setPhase("done"));
      return;
    }
    // The card rises in first, then a dot lands on each colour, then they all fly.
    later(500, () => setPhase("picking"));
    later(500 + picked * 320 + 500, () => {
      setPhase("flying");
      const box = colourRef.current;
      if (!box) return setPhase("done");
      const origin = box.getBoundingClientRect();
      let order = 0;
      picks.forEach(({ p, k }) => {
        const dot = dotRefs.current.get(`${p}:${k}`);
        const swatch = swatchRefs.current[k];
        if (!dot || !swatch) return;
        const from = dot.getBoundingClientRect();
        const to = swatch.getBoundingClientRect();
        const flyer = document.createElement("span");
        flyer.className = card.flyer;
        flyer.style.background =
          system.colours[k].fill ?? system.colours[k].hex;
        box.appendChild(flyer);
        const at = (rect: DOMRect, radius: string) => ({
          left: `${rect.left - origin.left}px`,
          top: `${rect.top - origin.top}px`,
          width: `${rect.width}px`,
          height: `${rect.height}px`,
          borderRadius: radius,
        });
        const flight = flyer.animate([at(from, "50%"), at(to, "22px")], {
          duration: 700,
          delay: order++ * 110,
          easing: "cubic-bezier(0.6, 0, 0.2, 1)",
          fill: "both",
        });
        flight.onfinish = () => {
          setLanded((previous) => new Set([...previous, k]));
          flyer.remove();
        };
      });
      later(700 + order * 110 + 150, () => setPhase("done"));
    });
    // The picks are derived from `source`, which is fixed per system.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seen, source, still, picked, system.colours]);

  // A swatch shows once its dot has landed; one with no dot, once they all have.
  const swatchShown = (k: number) => phase === "done" || landed.has(k);

  return (
    <div
      ref={rootRef}
      className={`${className ?? styles.root} ${type_.widget} ${system.fonts ?? ""}`}
    >
      <div className={card.stage} data-seen={seen || undefined}>
        <section className={card.card} ref={colourRef}>
          <h3 className={card.label}>Colour</h3>
          {source && (
            <figure
              className={card.source}
              data-light={source.backdrop === "#ffffff" || undefined}
              style={{ background: source.backdrop }}
            >
              <span className={card.sourcePictures}>
                {source.pictures.map((picture, p) => (
                  <Fragment key={picture.src}>
                    {/* Logos side by side are split by a rule, as in the case study's opening. */}
                    {p > 0 && (
                      <span className={card.sourceRule} aria-label="and" />
                    )}
                    <span
                      className={card.sourcePicture}
                      data-several={source.pictures.length > 1 || undefined}
                      style={
                        {
                          aspectRatio: `${picture.width} / ${picture.height}`,
                          "--ratio": picture.width / picture.height,
                          // Side by side, each takes the same area, so a wide wordmark and a
                          // tall emblem look the same size (equal widths or heights can't).
                          "--balanced": `${Math.sqrt(SHARED_AREA * (picture.width / picture.height))}px`,
                        } as CSSProperties
                      }
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element -- a small picture inside a diagram, sized by its box */}
                      <img src={picture.src} alt={picture.alt} />
                      {picture.picks.map((pick, k) =>
                        pick ? (
                          <span
                            key={k}
                            ref={(node) => {
                              if (node) dotRefs.current.set(`${p}:${k}`, node);
                              else dotRefs.current.delete(`${p}:${k}`);
                            }}
                            className={card.pick}
                            data-shown={phase === "picking" || undefined}
                            style={
                              {
                                left: `${pick.x}%`,
                                top: `${pick.y}%`,
                                // A gradient colour shows as its gradient, not its label.
                                background:
                                  system.colours[k].fill ??
                                  system.colours[k].hex,
                                "--delay": `${picks.findIndex((d) => d.p === p && d.k === k) * 320}ms`,
                              } as CSSProperties
                            }
                          />
                        ) : null,
                      )}
                    </span>
                  </Fragment>
                ))}
              </span>
              <figcaption className={card.sourceLabel}>
                {source.label}
              </figcaption>
            </figure>
          )}
          <div
            className={card.swatches}
            style={{ "--rest": system.colours.length - 1 } as CSSProperties}
          >
            {system.colours.map((colour, k) => (
              <div
                key={colour.hex}
                ref={(node) => {
                  swatchRefs.current[k] = node;
                }}
                className={card.swatch}
                data-hidden={!swatchShown(k) || undefined}
                style={{
                  background: colour.fill ?? colour.hex,
                  color: colour.ink,
                }}
              >
                <span className={card.swatchName}>{colour.name}</span>
                <span className={card.swatchHex}>{colour.hex}</span>
                <span className={card.swatchUse}>{colour.use}</span>
              </div>
            ))}
          </div>
        </section>

        <section className={card.card}>
          <h3 className={card.label}>Type</h3>
          <div className={card.type}>
            <span
              className={card.specimen}
              style={system.specimen}
              aria-hidden="true"
            >
              Aa
            </span>
            <div className={card.faces}>
              {system.faces.map((face) => (
                <p key={face.text} lang={face.lang} style={face.style}>
                  {face.text}
                </p>
              ))}
              {system.typeNote && <p className={card.note}>{system.typeNote}</p>}
            </div>
          </div>
        </section>

        <section className={card.card}>
          <h3 className={card.label}>Shape</h3>
          <div
            className={card.pills}
            style={{ fontFamily: system.pillFont }}
            aria-hidden="true"
          >
            {system.pills.map((pill) => (
              <span
                key={pill.label}
                className={card[pill.kind]}
                style={{
                  background: pill.bg,
                  color: pill.fg,
                  border: pill.border ? `1px solid ${pill.border}` : undefined,
                }}
              >
                {pill.label}
              </span>
            ))}
          </div>
          <p className={card.note}>{system.shapeNote}</p>
        </section>

        {system.footer && <p className={card.footer}>{system.footer}</p>}
      </div>

      {onOpen && (
        <div className={`${styles.controls} ${type_.controls}`}>
          <span />
          <button
            type="button"
            className={`${styles.control} ${type_.control}`}
            aria-label="Look closer"
            onClick={onOpen}
          >
            <ControlIcon name="expand" />
          </button>
        </div>
      )}
    </div>
  );
}
