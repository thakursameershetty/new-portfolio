import styles from "./page.module.css";
import { Currently } from "@/components/Currently";
import { Hero } from "@/components/Hero";
import { SiteIntro } from "@/components/SiteIntro";

export default function Home() {
  return (
    <SiteIntro>
      <main className={styles.main}>
        <Hero />
        <Currently />
      </main>
    </SiteIntro>
  );
}
