import type { Metadata } from "next";
import Link from "next/link";
import { AboutFooter } from "@/components/about/AboutFooter";
import { FigmaLogo, PracticeBoard } from "@/components/Explorations";
import { PageSound, SoundKey } from "@/components/SiteIntro";
import key from "@/components/about/Keycap.module.css";
import about from "../about/page.module.css";
import styles from "./page.module.css";

const description =
  "Figma prototypes Thakur Sameer Shetty made while teaching himself to design, since June 2021: small interactions and ideas, tried out to see how they feel.";

const preview = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Thakur Sameer Shetty, Product Designer",
};

export const metadata: Metadata = {
  title: "Figma practice",
  description,
  alternates: { canonical: "/practice" },
  openGraph: {
    url: "/practice",
    title: "Figma practice — Thakur Sameer Shetty",
    description,
    images: [preview],
  },
  twitter: {
    card: "summary_large_image",
    title: "Figma practice — Thakur Sameer Shetty",
    description,
    images: [preview.url],
  },
};

// Where the timeline's Figma practice line leads: the About page's frame (the red band,
// the keys, the statement and the footer) around the board of prototypes.
export default function PracticePage() {
  return (
    <PageSound>
      <div className={about.shell}>
        <div aria-hidden="true" className={about.band} />
        <main className={about.page}>
          <nav className={about.top}>
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
            <p className={`${about.label} ${styles.label}`}>
              <FigmaLogo size={16} />
              Practice
            </p>
            <h1 className={about.statement}>
              <span className={about.statementLine}>
                Figma, since June 2021.
              </span>{" "}
              <span className={about.statementLine}>
                Small ideas, tried out to see how they feel.
              </span>
            </h1>
            <p className={about.lede}>
              I taught myself to design by prototyping in Figma: a folder that
              gathers up files, a wallet that opens into payment options, a note
              that grows out of its button. None of it is client work; it&rsquo;s
              how I practise.
            </p>
          </header>

          <PracticeBoard />
        </main>
        <AboutFooter />
      </div>
    </PageSound>
  );
}
