import styles from "./page.module.css";
import { Contact } from "@/components/Contact";
import { Currently } from "@/components/Currently";
import { Hero } from "@/components/Hero";
import { SiteIntro } from "@/components/SiteIntro";
import { Work } from "@/components/Work";

export default function Home() {
  return (
    <SiteIntro>
      <main className={styles.main}>
        <Hero />
        <Currently />
        <Work />
        <Contact />
      </main>
    </SiteIntro>
  );
}
