import type { Metadata } from "next";
import { Google_Sans, Google_Sans_Flex } from "next/font/google";
import localFont from "next/font/local";
import { ThemeProvider } from "next-themes";
import "./globals.css";

const sans = Google_Sans_Flex({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Headline and uppercase labels. Loaded as a variable font so the intro can animate
// its weight from regular to bold.
const display = Google_Sans({
  variable: "--font-display",
  weight: "variable",
  subsets: ["latin"],
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

export const metadata: Metadata = {
  title: "Thakur Sameer Shetty — UI/UX Designer & Full Stack Developer",
  description:
    "Making things feel right. UI/UX designer and full stack developer crafting interfaces and micro-interactions from Figma to production.",
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
