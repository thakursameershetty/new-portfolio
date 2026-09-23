import styles from "./page.module.css";
import { SiteIntro } from "@/components/SiteIntro";

export default function Home() {
  return (
    <SiteIntro>
      <div className={styles.page}>
        <main className={styles.main}></main>
      </div>
    </SiteIntro>
  );
}
