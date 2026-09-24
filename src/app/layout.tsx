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

export const metadata: Metadata = {
  title: "Thakur Sameer Shetty — UI/UX Designer & Full Stack Developer",
  description:
    "Making things feel right. UI/UX designer and full stack developer crafting interfaces and micro-interactions from Figma to production.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${sans.variable} ${display.variable} ${hero.variable}`} suppressHydrationWarning>
      <head>
        {/* Before first paint: mark reloads within this visit (tab session) so the Enter
            screen stays hidden. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              'try{if(sessionStorage.getItem("intro-seen")==="1")document.documentElement.setAttribute("data-intro-seen","")}catch(e){}',
          }}
        />
      </head>
      <body>
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
