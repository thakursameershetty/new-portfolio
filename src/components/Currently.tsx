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
        Designing and building at <strong>Spotmies</strong>. I joined as a UI/UX
        designer and grew into leading full stack builds:{" "}
        <span className={styles.muted}>
          web apps, mobile apps and immersive 3D experiences, shipped end to end.
        </span>
      </p>
    </section>
  );
}
