// Click spark - adapted from React Bits (https://reactbits.dev), ClickSpark.
// Adapted: TypeScript; one fixed, screen-sized canvas over the whole page that listens for
// presses anywhere (instead of a wrapper sized to its content); crisp on high-density
// screens; animates only while sparks are in flight; off for reduced motion.
"use client";

import { useEffect, useRef } from "react";
import { useReducedMotion } from "framer-motion";

interface ClickSparkProps {
  sparkColor?: string;
  sparkSize?: number;
  sparkRadius?: number;
  sparkCount?: number;
  duration?: number;
  extraScale?: number;
}

interface Spark {
  x: number;
  y: number;
  angle: number;
  startTime: number;
}

// Ease-out: fast away from the press, settling as it fades.
const easeOut = (t: number) => t * (2 - t);

export function ClickSpark({
  sparkColor = "#f5f1ea",
  sparkSize = 10,
  sparkRadius = 18,
  sparkCount = 8,
  duration = 400,
  extraScale = 1,
}: ClickSparkProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const canvas = canvasRef.current;
    const context = canvas?.getContext("2d");
    if (!canvas || !context || reduceMotion) return;

    let sparks: Spark[] = [];
    let frame = 0;

    const resize = () => {
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.round(window.innerWidth * ratio);
      canvas.height = Math.round(window.innerHeight * ratio);
      context.setTransform(ratio, 0, 0, ratio, 0, 0);
    };

    const draw = (now: number) => {
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      context.strokeStyle = sparkColor;
      context.lineWidth = 2;
      context.lineCap = "round";

      sparks = sparks.filter((spark) => {
        const elapsed = now - spark.startTime;
        if (elapsed >= duration) return false;

        const eased = easeOut(elapsed / duration);
        const distance = eased * sparkRadius * extraScale;
        const length = sparkSize * (1 - eased);
        const cos = Math.cos(spark.angle);
        const sin = Math.sin(spark.angle);

        context.beginPath();
        context.moveTo(spark.x + distance * cos, spark.y + distance * sin);
        context.lineTo(
          spark.x + (distance + length) * cos,
          spark.y + (distance + length) * sin,
        );
        context.stroke();
        return true;
      });

      frame = sparks.length ? requestAnimationFrame(draw) : 0;
    };

    const handlePointerDown = (event: PointerEvent) => {
      const now = performance.now();
      for (let i = 0; i < sparkCount; i++) {
        sparks.push({
          x: event.clientX,
          y: event.clientY,
          angle: (2 * Math.PI * i) / sparkCount,
          startTime: now,
        });
      }
      if (!frame) frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("pointerdown", handlePointerDown, { passive: true });
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("pointerdown", handlePointerDown);
    };
  }, [duration, extraScale, reduceMotion, sparkColor, sparkCount, sparkRadius, sparkSize]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 60,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
      }}
    />
  );
}
