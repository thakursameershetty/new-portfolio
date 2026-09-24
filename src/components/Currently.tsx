import Image from "next/image";
import styles from "./Currently.module.css";

/** First section below the hero: what Thakur is doing right now. */
export function Currently() {
  return (
    <section
      id="about"
      className={styles.currently}
      aria-labelledby="currently-heading"
    >
      <h2 id="currently-heading" className={styles.label}>
        Currently
      </h2>
      <p className={styles.statement}>
        Designing and building at{" "}
        <Image
          src="/spotmies-mark.png"
          alt=""
          width={692}
          height={684}
          className={styles.mark}
        />
        <strong>Spotmies</strong>. I joined as a UI/UX
        designer and grew into leading full stack builds:{" "}
        <span className={styles.muted}>
          web apps, mobile apps and immersive 3D experiences, shipped end to end.
        </span>
      </p>
      <p className={styles.craft}>
        What I care about most are the small moments: the click that confirms, the
        transition that explains, the sound that makes a screen feel physical.{" "}
        <strong>Micro-interactions</strong> are where a product starts to feel right.{" "}
        <span className={styles.muted}>
          This site is built out of them, so go ahead and click around.
        </span>
      </p>
    </section>
  );
}
