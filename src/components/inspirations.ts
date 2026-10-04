// Thakur's design bookmarks, gathered over the years from his browser, for the
// Inspirations page: grouped the way they live there, each group marked with one of the
// site's tones. Swap or add links freely; the counts and filters follow.

export interface Bookmark {
  name: string;
  url: string;
  /** The bare domain, shown under the name and used for its favicon. */
  host: string;
}

export interface Shelf {
  title: string;
  /** A line on the disk's label: what the group is for. */
  note: string;
  tone: "work" | "study" | "event" | "project" | "practice";
  links: Bookmark[];
}

export const shelves: Shelf[] = [
  {
    title: "Best of All",
    note: "If you only open seven.",
    tone: "event",
    links: [
      { name: "21st.dev", url: "https://21st.dev/home", host: "21st.dev" },
      {
        name: "Pinterest",
        url: "https://www.pinterest.com",
        host: "pinterest.com",
      },
      {
        name: "React Bits",
        url: "https://reactbits.dev",
        host: "reactbits.dev",
      },
      { name: "Dribbble", url: "https://dribbble.com", host: "dribbble.com" },
      {
        name: "Framer Marketplace",
        url: "https://www.framer.com/marketplace/templates/",
        host: "framer.com",
      },
      { name: "Saaspo", url: "https://saaspo.com", host: "saaspo.com" },
      { name: "Thiings", url: "https://thiings.co/things", host: "thiings.co" },
    ],
  },
  {
    title: "Inspiration & Galleries",
    note: "Where I look before I start.",
    tone: "work",
    links: [
      {
        name: "Pinterest",
        url: "https://www.pinterest.com",
        host: "pinterest.com",
      },
      { name: "Dribbble", url: "https://dribbble.com", host: "dribbble.com" },
      { name: "Saaspo", url: "https://saaspo.com", host: "saaspo.com" },
      {
        name: "60fps.design",
        url: "https://60fps.design",
        host: "60fps.design",
      },
      {
        name: "Recent (formerly Godly)",
        url: "https://recent.design",
        host: "recent.design",
      },
      {
        name: "Interface Index",
        url: "https://interface-index.com",
        host: "interface-index.com",
      },
      {
        name: "Design Spells",
        url: "https://designspells.com",
        host: "designspells.com",
      },
      {
        name: "Call to Inspiration",
        url: "https://calltoinspiration.com",
        host: "calltoinspiration.com",
      },
      { name: "Refero", url: "https://refero.design", host: "refero.design" },
      { name: "Cosmos", url: "https://cosmos.so", host: "cosmos.so" },
      {
        name: "Rebrand Gallery",
        url: "https://rebrand.gallery",
        host: "rebrand.gallery",
      },
      { name: "Httpster", url: "https://httpster.net", host: "httpster.net" },
      {
        name: "SiteInspire",
        url: "https://siteinspire.com",
        host: "siteinspire.com",
      },
      {
        name: "One Page Love",
        url: "https://onepagelove.com",
        host: "onepagelove.com",
      },
      {
        name: "Landingfolio",
        url: "https://landingfolio.com",
        host: "landingfolio.com",
      },
      {
        name: "Land-book",
        url: "https://land-book.com",
        host: "land-book.com",
      },
      {
        name: "Page Flows",
        url: "https://pageflows.com",
        host: "pageflows.com",
      },
      {
        name: "Mobbin",
        url: "https://mobbin.com/discover/apps/ios/latest",
        host: "mobbin.com",
      },
      {
        name: "Spotted in Prod",
        url: "https://spottedinprod.com",
        host: "spottedinprod.com",
      },
      {
        name: "3D Websites",
        url: "https://3dwebsites.design",
        host: "3dwebsites.design",
      },
      {
        name: "Refero Styles",
        url: "https://styles.refero.design",
        host: "styles.refero.design",
      },
      {
        name: "Hubfolio",
        url: "https://uithemez.com/i/hubfolio_HTML/digital_studio/index.html",
        host: "uithemez.com",
      },
      {
        name: "Humans",
        url: "https://humans.wannathis.one",
        host: "humans.wannathis.one",
      },
      {
        name: "Scribbbles",
        url: "https://scribbbles.design",
        host: "scribbbles.design",
      },
      {
        name: "Highlights",
        url: "https://highlights.design",
        host: "highlights.design",
      },
      {
        name: "Nocode Supply",
        url: "https://nocodesupply.co",
        host: "nocodesupply.co",
      },
      {
        name: "The Gist Of",
        url: "https://thegistof.me",
        host: "thegistof.me",
      },
    ],
  },
  {
    title: "Portfolios",
    note: "People whose work I study.",
    tone: "study",
    links: [
      {
        name: "Wall of Portfolios",
        url: "https://www.wallofportfolios.in",
        host: "wallofportfolios.in",
      },
      {
        name: "By Saurabh",
        url: "https://bysaurabh.com",
        host: "bysaurabh.com",
      },
      {
        name: "Yiannifive",
        url: "https://yiannifive.com",
        host: "yiannifive.com",
      },
      {
        name: "Abhijit Rout",
        url: "https://abhijitrout.in",
        host: "abhijitrout.in",
      },
      { name: "Tigranz", url: "https://tigranz.com", host: "tigranz.com" },
      {
        name: "DS Nikhil",
        url: "https://www.dsnikhil.com",
        host: "dsnikhil.com",
      },
      {
        name: "Rahul R Nadkarni",
        url: "https://rahulrnadkarni.framer.website",
        host: "rahulrnadkarni.framer.website",
      },
    ],
  },
  {
    title: "Design Systems",
    note: "How big teams keep it together.",
    tone: "project",
    links: [
      {
        name: "Material 3",
        url: "https://m3.material.io",
        host: "m3.material.io",
      },
      {
        name: "Nord Health",
        url: "https://nordhealth.design",
        host: "nordhealth.design",
      },
      {
        name: "Skyscanner Backpack",
        url: "https://skyscanner.design/latest/welcome-to-backpack-Mtf5OEo4",
        host: "skyscanner.design",
      },
      {
        name: "Monday Vibe",
        url: "https://vibe.monday.com/?path=/docs/welcome--docs",
        host: "vibe.monday.com",
      },
      {
        name: "Mews Design",
        url: "https://mews.design/latest/welcome-eumfLxWD",
        host: "mews.design",
      },
    ],
  },
  {
    title: "UI Components",
    note: "Parts I take apart.",
    tone: "practice",
    links: [
      { name: "21st.dev", url: "https://21st.dev/home", host: "21st.dev" },
      {
        name: "Framer Marketplace",
        url: "https://www.framer.com/marketplace/templates/",
        host: "framer.com",
      },
      {
        name: "Stacksorted Buttons",
        url: "https://stacksorted.com/buttons",
        host: "stacksorted.com",
      },
      {
        name: "Aceternity UI",
        url: "https://ui.aceternity.com/components",
        host: "ui.aceternity.com",
      },
      {
        name: "Magic UI",
        url: "https://magicui.design",
        host: "magicui.design",
      },
      { name: "Cult UI", url: "https://cult-ui.com", host: "cult-ui.com" },
      {
        name: "KokonutUI",
        url: "https://kokonutui.pro",
        host: "kokonutui.pro",
      },
      {
        name: "shadcn/ui",
        url: "https://ui.shadcn.com",
        host: "ui.shadcn.com",
      },
      {
        name: "UI Lora",
        url: "https://uilora.com/get-started/web/components",
        host: "uilora.com",
      },
      {
        name: "Watermelon UI",
        url: "https://ui.watermelon.sh/home",
        host: "ui.watermelon.sh",
      },
      {
        name: "OriginKit",
        url: "https://originkit.dev",
        host: "originkit.dev",
      },
      {
        name: "React Bits \\u00b7 Split Text",
        url: "https://reactbits.dev/text-animations/split-text",
        host: "reactbits.dev",
      },
      {
        name: "Framer \\u00b7 Pixel Button",
        url: "https://framer.com/marketplace/components/pixel-button/",
        host: "framer.com",
      },
      {
        name: "Framer \\u00b7 Pixel Wipe Preloader",
        url: "https://framer.com/marketplace/components/pixel-wipe-preloader/",
        host: "framer.com",
      },
      {
        name: "Framer \\u00b7 Scroll Flip Card",
        url: "https://framer.com/marketplace/components/scroll-flip-card/",
        host: "framer.com",
      },
      {
        name: "Framer \\u00b7 3D Circular Text",
        url: "https://framer.com/marketplace/components/3d-circular-text/",
        host: "framer.com",
      },
      {
        name: "Framer \\u00b7 3D Video Gallery",
        url: "https://framer.com/marketplace/components/3d-video-gallery/",
        host: "framer.com",
      },
      { name: "Bklit", url: "https://bklit.com", host: "bklit.com" },
      {
        name: "Smooothy",
        url: "https://smooothy.federic.ooo",
        host: "smooothy.federic.ooo",
      },
    ],
  },
  {
    title: "Motion & Animation",
    note: "For things that move.",
    tone: "event",
    links: [
      { name: "Anime.js", url: "https://animejs.com", host: "animejs.com" },
      { name: "Motion", url: "https://motion.dev", host: "motion.dev" },
      { name: "Jitter", url: "https://jitter.video", host: "jitter.video" },
      { name: "Animos", url: "https://animos.app", host: "animos.app" },
      {
        name: "Particles",
        url: "https://particles.casberry.in",
        host: "particles.casberry.in",
      },
      {
        name: "Unicorn Studio",
        url: "https://unicorn.studio",
        host: "unicorn.studio",
      },
      { name: "Three.js", url: "https://threejs.org", host: "threejs.org" },
    ],
  },
  {
    title: "Typography",
    note: "Faces, and what to pair them with.",
    tone: "study",
    links: [
      {
        name: "Google Fonts",
        url: "https://fonts.google.com",
        host: "fonts.google.com",
      },
      {
        name: "Fontshare",
        url: "https://fontshare.com",
        host: "fontshare.com",
      },
      {
        name: "Fontbrief",
        url: "https://fontbrief.com/fontbrief",
        host: "fontbrief.com",
      },
      { name: "Fontpair", url: "https://fontpair.co/all", host: "fontpair.co" },
      { name: "Meshfont", url: "https://meshfont.com", host: "meshfont.com" },
      {
        name: "Space Type Generator",
        url: "https://spacetypegenerator.com",
        host: "spacetypegenerator.com",
      },
      {
        name: "Type Dither",
        url: "https://typedither.vercel.app",
        host: "typedither.vercel.app",
      },
      {
        name: "Figma \\u00b7 Modern Fonts",
        url: "https://figma.com/resource-library/modern-fonts/",
        host: "figma.com",
      },
    ],
  },
  {
    title: "Icons & Illustration",
    note: "Small pictures.",
    tone: "work",
    links: [
      {
        name: "21st.dev Animated Icons",
        url: "https://21st.dev/community/icons/animated",
        host: "21st.dev",
      },
      {
        name: "Google Icons",
        url: "https://fonts.google.com/icons",
        host: "fonts.google.com",
      },
      {
        name: "Notion Icons",
        url: "https://notionicons.so",
        host: "notionicons.so",
      },
      { name: "Thiings", url: "https://thiings.co/things", host: "thiings.co" },
      { name: "IconSVG", url: "https://iconsvg.xyz", host: "iconsvg.xyz" },
      { name: "Isocons", url: "https://isocons.app", host: "isocons.app" },
      { name: "Iconsax", url: "https://iconsax.io", host: "iconsax.io" },
      {
        name: "Design.dev Free Icons",
        url: "https://design.dev/free-icons/",
        host: "design.dev",
      },
      {
        name: "Blush \\u00b7 Pablo Stanley",
        url: "https://blush.design/artists/RyUTVuP8G4QeAAEEQgug/pablo-stanley",
        host: "blush.design",
      },
      {
        name: "Craftwork",
        url: "https://craftwork.design",
        host: "craftwork.design",
      },
    ],
  },
  {
    title: "Color & Backgrounds",
    note: "Palettes and gradients.",
    tone: "event",
    links: [
      {
        name: "PhotoGradient",
        url: "https://photogradient.com",
        host: "photogradient.com",
      },
      {
        name: "UI Colors",
        url: "https://uicolors.app/generate/1f3b5a",
        host: "uicolors.app",
      },
      {
        name: "Backgrounds Supply",
        url: "https://backgrounds.supply/freebies",
        host: "backgrounds.supply",
      },
    ],
  },
  {
    title: "Dither & Generative",
    note: "Pixels on purpose.",
    tone: "practice",
    links: [
      {
        name: "Dither Lab",
        url: "https://dragoy.net/play-ground/dither-lab/index.html",
        host: "dragoy.net",
      },
      {
        name: "Dither Garden",
        url: "https://dithergarden.com/editor.html",
        host: "dithergarden.com",
      },
      {
        name: "Tooooools",
        url: "https://tooooools.app",
        host: "tooooools.app",
      },
    ],
  },
  {
    title: "Mockups & Design Tools",
    note: "Shortcuts for the boring bits.",
    tone: "project",
    links: [
      {
        name: "Mockuuups Studio",
        url: "https://mockuuups.studio",
        host: "mockuuups.studio",
      },
      { name: "Shots", url: "https://shots.so", host: "shots.so" },
      {
        name: "Ray.so",
        url: "https://ray.so/#width=520&theme=wrapped&padding=32",
        host: "ray.so",
      },
      { name: "Octopus", url: "https://octopus.do", host: "octopus.do" },
      {
        name: "Magic Pattern",
        url: "https://magicpattern.design",
        host: "magicpattern.design",
      },
      {
        name: "Flectofy",
        url: "https://flectofy.flecto.io",
        host: "flectofy.flecto.io",
      },
      {
        name: "SuperDesign",
        url: "https://superdesign.dev",
        host: "superdesign.dev",
      },
      { name: "Omma", url: "https://omma.build", host: "omma.build" },
      {
        name: "Content Core",
        url: "https://contentcore.xyz",
        host: "contentcore.xyz",
      },
      {
        name: "Endless Tools",
        url: "https://endlesstools.io",
        host: "endlesstools.io",
      },
      { name: "Toolfolio", url: "https://toolfolio.io", host: "toolfolio.io" },
      { name: "Toools", url: "https://toools.design", host: "toools.design" },
      {
        name: "UI Goodies",
        url: "https://uigoodies.com",
        host: "uigoodies.com",
      },
      {
        name: "Free Design Tool",
        url: "https://freedesigntool.online/baby-track",
        host: "freedesigntool.online",
      },
      {
        name: "99designs",
        url: "https://99designs.com",
        host: "99designs.com",
      },
      { name: "Uncut", url: "https://uncut.wtf", host: "uncut.wtf" },
      { name: "OverAPI", url: "https://overapi.com", host: "overapi.com" },
      { name: "Rows", url: "https://rows.gg", host: "rows.gg" },
    ],
  },
  {
    title: "Play & Misc",
    note: "Breaks, mostly.",
    tone: "work",
    links: [
      { name: "Slow Roads", url: "https://slowroads.io", host: "slowroads.io" },
      {
        name: "Townscaper",
        url: "https://oskarstalberg.com/Townscaper/#GSB0RARueC6Snc9E0lO5B",
        host: "oskarstalberg.com",
      },
      {
        name: "Floor796",
        url: "https://floor796.com/#t0l2,553,513",
        host: "floor796.com",
      },
    ],
  },
];

// Each link once, though the Best of All shelf repeats some from their own groups.
export const bookmarkCount = new Set(
  shelves.flatMap((shelf) => shelf.links.map((link) => link.url)),
).size;

/** The name of a bookmark's screenshot in /public/inspirations: the URL without its
 *  scheme and "www.", in lower case, runs of anything else turned to dashes (as
 *  scripts/capture-inspirations.mjs names them). */
export const previewSlug = (url: string) =>
  url
    .replace(/^https?:\/\/(www\.)?/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
