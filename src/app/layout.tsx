import type { Metadata, Viewport } from "next";
import { MiniPlayer } from "@/components/MiniPlayer";
import { site } from "@/components/site";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import "./globals.css";

// Google Sans Flex (body) and Google Sans (headings, labels) are self-hosted variable fonts
// (Latin subset, SIL Open Font License), so the build doesn't depend on Google Fonts and the
// fallback font is measured from the files themselves.
const sans = localFont({
  variable: "--font-sans",
  src: "../fonts/google-sans-flex-latin.woff2",
  weight: "1 1000",
});

const display = localFont({
  variable: "--font-display",
  src: "../fonts/google-sans-latin.woff2",
  weight: "400 700",
});

// A brush script, for the name written on the About page's ID card (Kaushan Script, Latin
// subset, SIL Open Font License; self-hosted like the others).
const script = localFont({
  variable: "--font-script",
  src: "../fonts/kaushan-script-latin.woff2",
  weight: "400",
});

// Hero type: "HI", the name and the statement lines.
const hero = localFont({
  variable: "--font-hero",
  src: [
    {
      path: "../../public/disket-mono-free-font/disket-mono-regular.ttf",
      weight: "400",
    },
    {
      path: "../../public/disket-mono-free-font/disket-mono-bold.ttf",
      weight: "700",
    },
  ],
});

// Defaults for every page; pages set their own title (filling the template), description and
// canonical URL. The link preview image is src/app/opengraph-image.tsx, the icons
// favicon.ico and apple-icon.png beside this file, and the rest of the SEO lives in
// robots.ts, sitemap.ts, manifest.ts and the JSON-LD from components/site.ts.
export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: site.title, template: `%s — ${site.name}` },
  description: site.description,
  applicationName: site.name,
  authors: [{ name: site.name, url: site.url }],
  creator: site.name,
  keywords: [
    "Thakur Sameer Shetty",
    "product designer",
    "UI/UX designer",
    "interaction design",
    "micro-interactions",
    "design engineer",
    "portfolio",
    "Visakhapatnam",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    locale: "en_IN",
    url: "/",
    siteName: site.name,
    title: site.title,
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: site.title,
    description: site.description,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  formatDetection: { telephone: false, email: false, address: false },
};

// The browser's own chrome (and the phone's status bar) in the site's near-black.
export const viewport: Viewport = {
  themeColor: "#0a0a0a",
  colorScheme: "dark",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${display.variable} ${hero.variable} ${script.variable}`}
      suppressHydrationWarning
    >
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          {/* The music's mini disc: here in the layout, so it carries on across pages. */}
          <MiniPlayer />
        </ThemeProvider>
      </body>
    </html>
  );
}
