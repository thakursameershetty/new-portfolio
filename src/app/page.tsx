import styles from "./page.module.css";
import { Contact } from "@/components/Contact";
import { Currently } from "@/components/Currently";
import { Hero } from "@/components/Hero";
import { Personality } from "@/components/Personality";
import { SiteIntro } from "@/components/SiteIntro";
import { Work } from "@/components/Work";
import { homeJsonLd, jsonLd } from "@/components/site";

export default function Home() {
  return (
    <SiteIntro>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(homeJsonLd) }}
      />
      <main className={styles.main}>
        <Hero />
        <Currently />
        <Work />
        <Personality />
        <Contact />
      </main>
    </SiteIntro>
  );
}
