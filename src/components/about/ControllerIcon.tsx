import { useId } from "react";

/**
 * A little game controller in the favicon floppy disk's materials: the site's red with the
 * disk's sheen and shade, a brushed-metal d-pad like its shutter, and cream buttons and a
 * cream label like its paper label.
 */
export function ControllerIcon({ size = 34, className }: { size?: number; className?: string }) {
  const id = useId();
  const sheen = `${id}-sheen`;
  const shade = `${id}-shade`;
  const metal = `${id}-metal`;
  const body = `${id}-body`;

  return (
    <svg
      aria-hidden="true"
      className={className}
      width={size}
      height={(size * 44) / 64}
      viewBox="0 0 64 44"
      fill="none"
    >
      <defs>
        <linearGradient id={sheen} x1="0" y1="0" x2="0.4" y2="1">
          <stop offset="0" stopColor="#fff" stopOpacity="0.28" />
          <stop offset="0.45" stopColor="#fff" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={shade} x1="0" y1="1" x2="0" y2="0.55">
          <stop offset="0" stopColor="#000" stopOpacity="0.28" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </linearGradient>
        <linearGradient id={metal} x1="0" x2="1">
          <stop offset="0" stopColor="#a9afb3" />
          <stop offset="0.42" stopColor="#eef0f1" />
          <stop offset="0.7" stopColor="#c2c7ca" />
          <stop offset="1" stopColor="#a4aaae" />
        </linearGradient>
        <clipPath id={body}>
          <path d="M17 5h30c8 0 12.5 6 14.4 14.2l1.7 10.2c1 6.4-3.3 11-8.6 9.6-3.7-1-5.7-4.6-8.5-8.5H18c-2.8 3.9-4.8 7.5-8.5 8.5C4.2 40.4-.1 35.8.9 29.4l1.7-10.2C4.5 11 9 5 17 5Z" />
        </clipPath>
      </defs>

      {/* The shell, lit like the disk. */}
      <g clipPath={`url(#${body})`}>
        <rect width="64" height="44" fill="#e54b45" />
        <rect width="64" height="44" fill={`url(#${sheen})`} />
        <rect width="64" height="44" fill={`url(#${shade})`} />
      </g>
      <path
        d="M17 5h30c8 0 12.5 6 14.4 14.2l1.7 10.2c1 6.4-3.3 11-8.6 9.6-3.7-1-5.7-4.6-8.5-8.5H18c-2.8 3.9-4.8 7.5-8.5 8.5C4.2 40.4-.1 35.8.9 29.4l1.7-10.2C4.5 11 9 5 17 5Z"
        stroke="#000"
        strokeOpacity="0.35"
        strokeWidth="0.8"
      />

      {/* The d-pad, in the shutter's brushed metal. */}
      <path
        d="M14.2 12.2c0-.7.6-1.2 1.2-1.2h2.2c.7 0 1.2.5 1.2 1.2v3.9h3.9c.7 0 1.2.6 1.2 1.2v2.2c0 .7-.5 1.2-1.2 1.2h-3.9v3.9c0 .7-.5 1.2-1.2 1.2h-2.2c-.7 0-1.2-.5-1.2-1.2v-3.9h-3.9c-.7 0-1.2-.5-1.2-1.2v-2.2c0-.6.5-1.2 1.2-1.2h3.9z"
        fill={`url(#${metal})`}
        stroke="#000"
        strokeOpacity="0.3"
        strokeWidth="0.6"
      />

      {/* The label in the middle, with select and start. */}
      <rect x="25.5" y="9" width="13" height="7.5" rx="1.6" fill="#f4f0e6" />
      <rect x="25.5" y="9" width="13" height="2.2" rx="1" fill="#e54b45" opacity="0.9" />
      <rect x="27.6" y="12.8" width="3.6" height="1.6" rx="0.8" fill="#1a0605" opacity="0.7" />
      <rect x="32.8" y="12.8" width="3.6" height="1.6" rx="0.8" fill="#1a0605" opacity="0.7" />

      {/* The face buttons, cream. */}
      {[
        [48, 12.4],
        [52.6, 17],
        [48, 21.6],
        [43.4, 17],
      ].map(([cx, cy]) => (
        <g key={`${cx}-${cy}`}>
          <circle cx={cx} cy={cy + 0.6} r="2.5" fill="#000" opacity="0.28" />
          <circle cx={cx} cy={cy} r="2.5" fill="#f4f0e6" />
        </g>
      ))}

      {/* The thumbsticks: dark wells with metal caps. */}
      {[24, 40].map((cx) => (
        <g key={cx}>
          <circle cx={cx} cy="26" r="4" fill="#1a0605" opacity="0.75" />
          <circle cx={cx} cy="25.4" r="2.7" fill={`url(#${metal})`} />
        </g>
      ))}
    </svg>
  );
}
