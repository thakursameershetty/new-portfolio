"use client";

// StickerPeel, from React Bits (reactbits.dev, MIT), adapted: TypeScript, a CSS module in
// place of global class names, SVG filter ids unique to each sticker (the original's fixed
// ids meant every sticker's light followed only the first one's pointer), the inertia plugin
// registered so a flicked sticker glides, and the site's haptic taps on pick-up and drop.

import { useEffect, useId, useMemo, useRef } from "react";
import { gsap } from "gsap";
import { Draggable } from "gsap/Draggable";
import { InertiaPlugin } from "gsap/InertiaPlugin";
import { useIntro } from "../SiteIntro";
import styles from "./StickerPeel.module.css";

gsap.registerPlugin(Draggable, InertiaPlugin);

interface StickerPeelProps {
  imageSrc: string;
  /** Tilt of the artwork, in degrees. */
  rotate?: number;
  peelBackHoverPct?: number;
  peelBackActivePct?: number;
  width?: number;
  shadowIntensity?: number;
  lightingIntensity?: number;
  /** Where it starts, in px from its bounds' top-left. */
  initialPosition?: { x: number; y: number };
  peelDirection?: number;
  className?: string;
}

const padding = 10;

export function StickerPeel({
  imageSrc,
  rotate = 30,
  peelBackHoverPct = 30,
  peelBackActivePct = 40,
  width = 200,
  shadowIntensity = 0.6,
  lightingIntensity = 0.1,
  initialPosition,
  peelDirection = 0,
  className = "",
}: StickerPeelProps) {
  const { playCue } = useIntro();
  const containerRef = useRef<HTMLDivElement>(null);
  const dragTargetRef = useRef<HTMLDivElement>(null);
  const pointLightRef = useRef<SVGFEPointLightElement>(null);
  const pointLightFlippedRef = useRef<SVGFEPointLightElement>(null);
  const cueRef = useRef(playCue);

  useEffect(() => {
    cueRef.current = playCue;
  }, [playCue]);

  // Ids safe inside url(#…): useId's colons aren't.
  const id = useId().replace(/[^a-zA-Z0-9-]/g, "");
  const ids = {
    light: `${id}-light`,
    lightFlipped: `${id}-light-flipped`,
    shadow: `${id}-shadow`,
    fill: `${id}-fill`,
  };

  useEffect(() => {
    const target = dragTargetRef.current;
    if (!target || !initialPosition) return;
    gsap.set(target, { x: initialPosition.x, y: initialPosition.y });
  }, [initialPosition]);

  useEffect(() => {
    const target = dragTargetRef.current;
    const bounds = target?.parentElement;
    if (!target || !bounds) return;

    const [instance] = Draggable.create(target, {
      type: "x,y",
      bounds,
      inertia: true,
      onPress() {
        cueRef.current("diskTap");
      },
      onDrag() {
        const rotation = gsap.utils.clamp(-24, 24, this.deltaX * 0.4);
        gsap.to(target, { rotation, duration: 0.15, ease: "power1.out" });
      },
      onRelease() {
        cueRef.current("land");
      },
      onDragEnd() {
        gsap.to(target, { rotation: 0, duration: 0.8, ease: "power2.out" });
      },
    });

    // Keep it inside its bounds when the window changes size.
    const handleResize = () => {
      instance.update();
      const x = Number(gsap.getProperty(target, "x"));
      const y = Number(gsap.getProperty(target, "y"));
      const box = bounds.getBoundingClientRect();
      const rect = target.getBoundingClientRect();
      const nx = Math.max(0, Math.min(x, box.width - rect.width));
      const ny = Math.max(0, Math.min(y, box.height - rect.height));
      if (nx !== x || ny !== y)
        gsap.to(target, { x: nx, y: ny, duration: 0.3, ease: "power2.out" });
    };

    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);
    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
      instance.kill();
    };
  }, []);

  // The light follows the pointer across the sticker (and, mirrored, across its flap).
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const updateLight = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      gsap.set(pointLightRef.current, { attr: { x, y } });
      if (Math.abs(peelDirection % 360) !== 180) {
        gsap.set(pointLightFlippedRef.current, {
          attr: { x, y: rect.height - y },
        });
      } else {
        gsap.set(pointLightFlippedRef.current, {
          attr: { x: -1000, y: -1000 },
        });
      }
    };
    container.addEventListener("mousemove", updateLight);
    return () => container.removeEventListener("mousemove", updateLight);
  }, [peelDirection]);

  // Touch has no hover, so a finger on it peels it back instead.
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const start = () => container.classList.add(styles.touchActive);
    const end = () => container.classList.remove(styles.touchActive);
    container.addEventListener("touchstart", start, { passive: true });
    container.addEventListener("touchend", end);
    container.addEventListener("touchcancel", end);
    return () => {
      container.removeEventListener("touchstart", start);
      container.removeEventListener("touchend", end);
      container.removeEventListener("touchcancel", end);
    };
  }, []);

  const cssVars = useMemo(
    () =>
      ({
        "--sticker-rotate": `${rotate}deg`,
        "--sticker-p": `${padding}px`,
        "--sticker-peelback-hover": `${peelBackHoverPct}%`,
        "--sticker-peelback-active": `${peelBackActivePct}%`,
        "--sticker-width": `${width}px`,
        "--peel-direction": `${peelDirection}deg`,
      }) as React.CSSProperties,
    [rotate, peelBackHoverPct, peelBackActivePct, width, peelDirection],
  );

  return (
    <div
      className={`${styles.draggable} ${className}`}
      data-sticker=""
      ref={dragTargetRef}
      style={cssVars}
    >
      <svg width="0" height="0" className={styles.defs} aria-hidden="true">
        <defs>
          <filter id={ids.light}>
            <feGaussianBlur stdDeviation="1" result="blur" />
            <feSpecularLighting
              result="spec"
              in="blur"
              specularExponent="100"
              specularConstant={lightingIntensity}
              lightingColor="white"
            >
              <fePointLight ref={pointLightRef} x="100" y="100" z="300" />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceGraphic" result="lit" />
            <feComposite in="lit" in2="SourceAlpha" operator="in" />
          </filter>
          <filter id={ids.lightFlipped}>
            <feGaussianBlur stdDeviation="10" result="blur" />
            <feSpecularLighting
              result="spec"
              in="blur"
              specularExponent="100"
              specularConstant={lightingIntensity * 7}
              lightingColor="white"
            >
              <fePointLight
                ref={pointLightFlippedRef}
                x="100"
                y="100"
                z="300"
              />
            </feSpecularLighting>
            <feComposite in="spec" in2="SourceGraphic" result="lit" />
            <feComposite in="lit" in2="SourceAlpha" operator="in" />
          </filter>
          <filter id={ids.shadow}>
            <feDropShadow
              dx="2"
              dy="4"
              stdDeviation={3 * shadowIntensity}
              floodColor="black"
              floodOpacity={shadowIntensity}
            />
          </filter>
          <filter id={ids.fill}>
            <feOffset dx="0" dy="0" in="SourceAlpha" result="shape" />
            <feFlood floodColor="rgb(179,179,179)" result="flood" />
            <feComposite operator="in" in="flood" in2="shape" />
          </filter>
        </defs>
      </svg>

      <div className={styles.container} ref={containerRef}>
        <div className={styles.main} style={{ filter: `url(#${ids.shadow})` }}>
          <div style={{ filter: `url(#${ids.light})` }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- clipped and filtered in place */}
            <img
              src={imageSrc}
              alt=""
              className={styles.image}
              draggable={false}
              onContextMenu={(event) => event.preventDefault()}
            />
          </div>
        </div>

        <div className={styles.flap}>
          <div style={{ filter: `url(#${ids.lightFlipped})` }}>
            {/* eslint-disable-next-line @next/next/no-img-element -- the flap's mirrored copy */}
            <img
              src={imageSrc}
              alt=""
              className={styles.flapImage}
              style={{ filter: `url(#${ids.fill})` }}
              draggable={false}
              onContextMenu={(event) => event.preventDefault()}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
