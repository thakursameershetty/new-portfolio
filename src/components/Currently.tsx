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
        <strong>Spotmies</strong>. I started as a UI/UX designer and now lead full stack
        builds,{" "}
        <span className={styles.muted}>
          with a soft spot for micro-interactions: the small moments that make a product feel
          right.
        </span>
      </p>
    </section>
  );
}
