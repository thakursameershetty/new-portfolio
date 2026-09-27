import type { Metadata } from "next";
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

const title = "Thakur Sameer Shetty — Product Designer";
const description =
  "Making things feel right. Product designer who prototypes in code: research, interfaces and micro-interactions, from Figma to production.";

// The link preview image is src/app/opengraph-image.tsx; the icons are favicon.ico and
// apple-icon.png beside this file.
export const metadata: Metadata = {
  metadataBase: new URL("https://www.thakursameershetty.com"),
  title,
  description,
  openGraph: { title, description, url: "/", siteName: "Thakur Sameer Shetty", type: "website" },
  twitter: { card: "summary_large_image", title, description },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${hero.variable}`} suppressHydrationWarning>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
