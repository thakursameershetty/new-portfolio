import type { Metadata } from "next";
import Link from "next/link";
import { ControllerIcon } from "@/components/about/ControllerIcon";
import { IdCard } from "@/components/about/IdCard";
import { ListeningTo } from "@/components/about/ListeningTo";
import { Milestones } from "@/components/about/Milestones";
import { Playing } from "@/components/about/Playing";
import { RecordTimeline } from "@/components/about/RecordTimeline";
import { Watching } from "@/components/about/Watching";
import { PageSound, SoundKey } from "@/components/SiteIntro";
import { aboutJsonLd, jsonLd } from "@/components/site";
import key from "@/components/about/Keycap.module.css";
import styles from "./page.module.css";

const description =
  "Thakur Sameer Shetty, product designer at Spotmies in Visakhapatnam: the longer story from electrical engineering to designing and building whole products, and what he's listening to, watching and playing.";

// The site's link preview carries on here (a page's own openGraph replaces the one it
// would inherit, images and all).
const preview = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Thakur Sameer Shetty, Product Designer",
};

export const metadata: Metadata = {
  title: "About",
  description,
  alternates: { canonical: "/about" },
  openGraph: {
    type: "profile",
    url: "/about",
    title: "About — Thakur Sameer Shetty",
    description,
    images: [preview],
  },
  twitter: {
    card: "summary_large_image",
    title: "About — Thakur Sameer Shetty",
    description,
    images: [preview.url],
  },
};

// The "Read more" from the home page's About section: the timeline at full length, then
// what's playing outside work.
export default function AboutPage() {
  return (
    <PageSound>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: jsonLd(aboutJsonLd) }}
      />
      <div className={styles.shell}>
        <div aria-hidden="true" className={styles.band} />
        <main className={styles.page}>
          <nav className={styles.top}>
            <Link href="/#about" className={key.key} data-feel="land">
              <svg
                aria-hidden="true"
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
              >
                <path
                  d="m15 18-6-6 6-6"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Home
            </Link>
            <SoundKey className={`${key.key} ${key.square}`} />
          </nav>

          <header className={styles.header}>
            <div className={styles.intro}>
              <p className={styles.label}>About</p>
              <h1 className={styles.statement}>
                <span className={styles.statementLine}>I&rsquo;m Thakur.</span>{" "}
                <span className={styles.statementLine}>
                  I draw rectangles until they look like real products.
                </span>
              </h1>
              <p className={styles.lede}>
                I started out in electrical and electronics engineering, moved
                to computer science, and joined Spotmies as a UI/UX designer in
                December 2025. The work grew from screens into whole products:
                research, design, frontend and backend. I care most about the
                small moments that make something feel right.
              </p>
            </div>
            <IdCard />
          </header>

          <section
            className={styles.section}
            aria-labelledby="timeline-heading"
          >
            <h2 id="timeline-heading" className={styles.sectionLabel}>
              Timeline
            </h2>
            <div className={styles.ruler}>
              <RecordTimeline />
            </div>
            <Milestones />
          </section>

          <section className={styles.section} aria-labelledby="outside-heading">
            <h2 id="outside-heading" className={styles.sectionLabel}>
              Outside work
            </h2>
            <div className={styles.outside}>
              <ListeningTo />

              <div>
                <h3 className={styles.subheading}>Watching</h3>
                <Watching />
              </div>

              <div>
                <h3 className={styles.subheading}>
                  <ControllerIcon size={40} className={styles.controller} />
                  Top played games
                </h3>
                <Playing />
              </div>
            </div>
          </section>
        </main>
      </div>
    </PageSound>
  );
}
