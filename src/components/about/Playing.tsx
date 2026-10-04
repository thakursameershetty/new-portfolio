"use client";

import { useState } from "react";
import Image from "next/image";
import clsx from "clsx";
import { useIntro } from "../SiteIntro";
import { games, type Game } from "./taste";
import styles from "./Playing.module.css";

// How thick a card is (px), and the layers that fill it, evenly between the two faces.
const thickness = 10;
const layers = 12;
const slices = Array.from(
  { length: layers },
  (_, i) => -thickness / 2 + (thickness * (i + 0.5)) / layers,
);

/**
 * "Playing": the most-played games as Game Center's ranked cards, cut like the site's
 * floppy disks. Click one and it turns over, like the ID card, to show why it's a
 * favourite and who made it; click again to turn it back.
 */
export function Playing() {
  const { playCue } = useIntro();
  const [open, setOpen] = useState<string | null>(null);

  return (
    <ol className={styles.grid}>
      {games.map((game, i) => {
        const flipped = open === game.name;
        return (
          <li
            key={game.name}
            className={clsx(styles.card, flipped && styles.flipped)}
            style={{ "--game": game.color } as React.CSSProperties}
          >
            <button
              type="button"
              className={styles.flipper}
              aria-expanded={flipped}
              aria-label={
                flipped
                  ? `${game.name}: turn back`
                  : `${game.name}: why I play it`
              }
              onClick={() => {
                playCue("swap");
                setOpen(flipped ? null : game.name);
              }}
            >
              <span className={styles.face} aria-hidden={flipped || undefined}>
                <span aria-hidden="true" className={styles.rank}>
                  {i + 1}
                </span>
                <GameIcon game={game} />
                <span className={styles.name}>{game.name}</span>
                <span className={styles.genre}>{game.genre}</span>
              </span>

              {/* The card's thickness: thin layers of its body between the two faces, seen
                  as a solid edge while it turns. */}
              {slices.map((z) => (
                <span
                  key={z}
                  aria-hidden="true"
                  className={styles.slice}
                  style={{ "--z": `${z}px` } as React.CSSProperties}
                />
              ))}

              <span
                className={clsx(styles.face, styles.back)}
                aria-hidden={!flipped || undefined}
              >
                <span className={styles.backLabel}>
                  #{i + 1} · {game.name}
                </span>
                {game.why && <span className={styles.why}>{game.why}</span>}
                <span className={styles.facts}>
                  {game.studio} · {game.year}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ol>
  );
}

// The app icon, or until there is one a stand-in: the game's colour with its initials.
function GameIcon({ game }: { game: Game }) {
  if (game.icon) {
    return (
      <Image
        src={game.icon}
        alt=""
        width={108}
        height={108}
        className={styles.icon}
      />
    );
  }
  const initials = game.name
    .replace(/[^A-Za-z ]/g, "")
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0])
    .join("");
  return (
    <span aria-hidden="true" className={`${styles.icon} ${styles.iconStandIn}`}>
      {initials}
    </span>
  );
}
