import type { SVGProps } from "react";

// An arrow drawn as a line, not a character: text arrows like "↗" turn into emoji on
// iPhones. After an animated arrow (the shaft draws, then the head); turned to point where
// it's needed. Rotated -45° for "up-right", about its own middle, so the shaft still fits the
// 24-unit box.
const turns = { right: 0, "up-right": -45, left: 180, down: 90 } as const;

export function ArrowIcon({
  direction = "right",
  size = 16,
  animated = true,
  style,
  ...props
}: SVGProps<SVGSVGElement> & {
  direction?: keyof typeof turns;
  size?: number;
  /** Draws itself in when it appears. */
  animated?: boolean;
}) {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        flex: "none",
        transform: `rotate(${turns[direction]}deg)`,
        ...style,
      }}
      {...props}
    >
      <g
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2.2"
      >
        <path d="M4 12h15.5" strokeDasharray={animated ? 16 : undefined}>
          {animated && (
            <animate
              attributeName="stroke-dashoffset"
              values="16;0"
              dur="0.3s"
              fill="freeze"
            />
          )}
        </path>
        <path
          d="M20 12l-6 6M20 12l-6-6"
          strokeDasharray={animated ? 9 : undefined}
          strokeDashoffset={animated ? 9 : undefined}
        >
          {animated && (
            <animate
              attributeName="stroke-dashoffset"
              begin="0.3s"
              to="0"
              dur="0.2s"
              fill="freeze"
            />
          )}
        </path>
      </g>
    </svg>
  );
}
