import type { Metadata } from "next";
import Link from "next/link";
import { ControllerIcon } from "@/components/about/ControllerIcon";
import { ListeningTo } from "@/components/about/ListeningTo";
import { Milestones } from "@/components/about/Milestones";
import { Playing } from "@/components/about/Playing";
import { RecordTimeline } from "@/components/about/RecordTimeline";
import { Watching } from "@/components/about/Watching";
import key from "@/components/about/Keycap.module.css";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "About — Thakur Sameer Shetty",
  description:
    "The longer story: from a diploma in electrical engineering to designing and building products at Spotmies, and what's playing outside work.",
};

// The "Read more" from the home page's About section: the timeline at full length, then
// what's playing outside work.
export default function AboutPage() {
  return (
    <div className={styles.shell}>
      <div aria-hidden="true" className={styles.band} />
      <main className={styles.page}>
        <nav className={styles.top}>
          <Link href="/#about" className={key.key}>
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
        </nav>

        <header className={styles.header}>
          <p className={styles.label}>About</p>
          <h1 className={styles.statement}>
            I&rsquo;m Thakur. I design products, and I build what I design.
          </h1>
          <p className={styles.lede}>
            I started out in electrical and electronics engineering, moved to
            computer science, and joined Spotmies as a UI/UX designer in
            December 2025. The work grew from screens into whole products:
            research, design, frontend and backend. I care most about the small
            moments that make something feel right.
          </p>
        </header>

        <section className={styles.section} aria-labelledby="timeline-heading">
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
  );
}
