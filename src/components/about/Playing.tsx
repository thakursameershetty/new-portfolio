import Image from "next/image";
import { games, type Game } from "./taste";
import styles from "./Playing.module.css";

/** "Playing": the most-played games as Game Center's ranked cards. */
export function Playing() {
  return (
    <ol className={styles.grid}>
      {games.map((game, i) => (
        <li
          key={game.name}
          className={styles.card}
          style={{ "--game": game.color } as React.CSSProperties}
        >
          <span aria-hidden="true" className={styles.rank}>
            {i + 1}
          </span>
          <GameIcon game={game} />
          <p className={styles.name}>{game.name}</p>
          <p className={styles.genre}>{game.genre}</p>
          {game.link && (
            <a className={styles.view} href={game.link} target="_blank" rel="noreferrer noopener">
              View<span className={styles.srOnly}> {game.name} (opens in a new tab)</span>
            </a>
          )}
        </li>
      ))}
    </ol>
  );
}

// The app icon, or until there is one a stand-in: the game's colour with its initials.
function GameIcon({ game }: { game: Game }) {
  if (game.icon) {
    return <Image src={game.icon} alt="" width={108} height={108} className={styles.icon} />;
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
