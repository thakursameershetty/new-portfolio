import clsx from "clsx";
import styles from "./GestureHints.module.css";

export interface GestureHint {
  /** The gesture, shown on a small keycap: "Hover", "Click", "Tap"… */
  gesture: string;
  /** What it does, following the keycap. */
  does: string;
  /** Mice only (a hover or a drag) or touch screens only; both when left out. */
  device?: "mouse" | "touch";
}

/**
 * A line of how-to hints: small cream keycaps (like the Contact keys) naming a gesture,
 * each followed by what it does. Mouse and touch hints swap by media query, so nothing
 * depends on JS. When `active` turns on, the keys press once in turn, showing the gesture.
 */
export function GestureHints({
  hints,
  active,
  className,
}: {
  hints: GestureHint[];
  active: boolean;
  className?: string;
}) {
  return (
    <p className={clsx(styles.hints, active && styles.active, className)}>
      {hints.map((hint) => (
        <span
          key={`${hint.gesture} ${hint.does}`}
          className={clsx(
            styles.hint,
            hint.device === "mouse" && styles.mouse,
            hint.device === "touch" && styles.touch,
          )}
        >
          <kbd className={styles.key}>{hint.gesture}</kbd> {hint.does}
        </span>
      ))}
    </p>
  );
}

/**
 * The switch for a set of hints, kept beside them: "? Hide hints" while they show, and
 * "? Show hints" left in their place once they're put away, so there's always a way back.
 */
export function HintsToggle({
  shown,
  onToggle,
  onHover,
  className,
}: {
  shown: boolean;
  onToggle: () => void;
  onHover?: () => void;
  className?: string;
}) {
  return (
    <button
      type="button"
      className={clsx(styles.toggle, className)}
      aria-pressed={shown}
      onMouseEnter={onHover}
      // Kept from reaching anything that listens for presses around it (the monitor
      // counts a press on the set as having found it).
      onPointerDown={(event) => event.stopPropagation()}
      onClick={onToggle}
    >
      <span aria-hidden="true" className={styles.toggleMark}>
        ?
      </span>
      {shown ? "Hide hints" : "Show hints"}
    </button>
  );
}
