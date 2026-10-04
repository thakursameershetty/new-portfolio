import type { Metadata } from "next";
import Link from "next/link";
import { AboutFooter } from "@/components/about/AboutFooter";
import { bookmarkCount } from "@/components/inspirations";
import { InspirationsLibrary } from "@/components/InspirationsLibrary";
import { PageSound, SoundKey } from "@/components/SiteIntro";
import key from "@/components/about/Keycap.module.css";
import about from "../about/page.module.css";
import styles from "./page.module.css";

const description =
  "Thakur Sameer Shetty's design bookmarks: galleries, design systems, component libraries, type, tools and a few toys, collected over the years.";

const preview = {
  url: "/opengraph-image",
  width: 1200,
  height: 630,
  alt: "Thakur Sameer Shetty, Product Designer",
};

export const metadata: Metadata = {
  title: "Inspirations",
  description,
  alternates: { canonical: "/inspirations" },
  openGraph: {
    url: "/inspirations",
    title: "Inspirations — Thakur Sameer Shetty",
    description,
    images: [preview],
  },
  twitter: {
    card: "summary_large_image",
    title: "Inspirations — Thakur Sameer Shetty",
    description,
    images: [preview.url],
  },
};

// Where the home page's "Yeah! I'm not a Robot" dialog leads: the About page's frame
// (the red band, the keys, the statement and the footer) around the library of bookmarks.
export default function InspirationsPage() {
  return (
    <PageSound>
      <div className={about.shell}>
        <div aria-hidden="true" className={about.band} />
        <main className={about.page}>
          <nav className={about.top}>
            <Link href="/" className={key.key} data-feel="land">
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
            <p className={about.label}>Inspirations</p>
            <h1 className={about.statement}>
              <span className={about.statementLine}>
                Every tab I couldn&rsquo;t close.
              </span>{" "}
              <span className={about.statementLine}>
                {bookmarkCount} places my taste comes from.
              </span>
            </h1>
            <p className={about.lede}>
              Bookmarked over the years and never cleaned up: galleries I check
              before starting anything, design systems and component libraries I
              borrow ideas from, type, tools, and a few toys. Each one opens in
              a new tab.
            </p>
          </header>

          <InspirationsLibrary />
        </main>
        <AboutFooter />
      </div>
    </PageSound>
  );
}
