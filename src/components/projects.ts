// Projects shown as floppy disks in the Work section, drawn from Thakur's résumé (only what it
// states; add years, images and links as they're confirmed). `disk` is the disk's body
// colour and `ink` the colour of anything printed on it.

/** A still or a clip; `caption` is the short line shown under it in a case study, and `label`
 *  its name on a carousel's tab. */
export type ProjectMedia =
  | {
      type: "image";
      src: string;
      alt: string;
      caption?: string;
      label?: string;
    }
  | {
      type: "video";
      src: string;
      poster: string;
      alt: string;
      caption?: string;
      label?: string;
    };

/** Someone else's video on YouTube: its thumbnail (`src`, saved locally) stands in for it in
 *  the story and on the monitor, and the closer look plays it. */
export type YouTubeMedia = {
  type: "youtube";
  id: string;
  src: string;
  alt: string;
  caption?: string;
  label?: string;
};

/** The animated diagrams (in `diagrams/`), drawn in SVG. */
export type DiagramId =
  | "packet-flow"
  | "bell-pair"
  | "fleet-average"
  | "submission-flow"
  | "quote-flow"
  | "sign-in-flow"
  | "two-scripts"
  | "feed-styles"
  | "tmn-system"
  | "nova-home"
  | "nova-cards"
  | "nova-system"
  | "rao-join"
  | "rao-system"
  | "spotmies-system"
  | "mutiny-system";

/** An animated diagram in the story and the closer look. The monitor can't play one (its
 *  screen is a WebGL texture), so a part with a diagram gives the monitor a `screen`. */
export type DiagramFigure = {
  type: "diagram";
  diagram: DiagramId;
  alt: string;
  caption?: string;
  label?: string;
};

/**
 * A picture in a case study (or on its monitor): a still or clip, a YouTube video, an
 * animated diagram, or (until the footage exists) a test card naming what will go there.
 */
export type ScreenItem =
  | ProjectMedia
  | YouTubeMedia
  | DiagramFigure
  | { type: "card"; title: string; note: string };

/** What tells a picture apart from the others in its part (a React key). */
export const screenKey = (item: ScreenItem) =>
  item.type === "card"
    ? item.title
    : item.type === "diagram"
      ? item.diagram
      : item.src;

/** One part of a case study: its text, then its pictures, large. */
export interface CaseSection {
  id: string;
  /** Starts a new act of the story (e.g. "The decisions"), named above this part. */
  act?: string;
  /** Short name for the progress ticks and the closer look. */
  label: string;
  heading: string;
  paragraphs: string[];
  /** Numbers worth seeing at a glance, set out as a table under the paragraphs. */
  stats?: { value: string; label: string }[];
  /** Key points, each numbered; "Title: the rest" sets its title above the rest. */
  points?: string[];
  figures?: ScreenItem[];
  /** A picture shown on its own, full width, before the figures (whatever their layout). */
  lead?: ScreenItem;
  /** What the monitor shows on this part's channel, when it can't be the figures (the
   *  screen is 4:3 and fills itself, so tall pictures lose their top and bottom). */
  screen?: ScreenItem[];
  /** How the figures sit: each full width (the default), two side by side, two across in a
   *  grid, all in one row (for tall ones, like posts), or one at a time in a carousel (for
   *  clips that would compete side by side). */
  layout?: "wide" | "pair" | "grid" | "row" | "carousel";
}

/** A cell of the brief under a case study's title: what it's about, the fact, and a note.
 *  `logo` shows a mark in place of the value (which then only names it for screen readers);
 *  `people` shows who made it the same way, as overlapping photos (each a link if it has an
 *  `href`); `href` makes the value a link. */
export interface CaseFact {
  label: string;
  value: string;
  note?: string;
  logo?: string;
  people?: { name: string; photo: string; href?: string }[];
  href?: string;
}

/** A logo credited above a case study's title. */
export interface CaseClient {
  logo: string;
  name: string;
  height?: number;
}

/** The kinds of work a project shows, tagged on its row in the Work list. */
export type Discipline = "design" | "development" | "3d";

export const disciplines: { id: Discipline; label: string }[] = [
  { id: "design", label: "Design" },
  { id: "development", label: "Dev" },
  { id: "3d", label: "3D" },
];

export interface Project {
  id: string;
  /** What kinds of work it shows (a project can be several). */
  disciplines: Discipline[];
  title: string;
  /** Short label line under the title. */
  kind: string;
  role: string;
  /** Where it was made: at Spotmies, or as a personal / hackathon project. */
  context: "Spotmies" | "Project";
  summary: string;
  /** The row's line in the Work list: short enough to fit its two lines whole (the summary
   *  is for the case study). */
  blurb: string;
  highlights: string[];
  stack: string[];
  link?: { href: string; label: string };
  /** A second, lesser link, shown beside the first on the case study. */
  alsoLink?: { href: string; label: string };
  /** Screenshots and clips, shown on the preview monitor and in the project window. */
  media?: ProjectMedia[];
  /** The full write-up, part by part; projects without one get a single overview part.
   *  `headline` is the story in a line, under the title; `brief` the grid of facts at a
   *  glance; `reel` what the monitor plays first (the project's media if left out); `client`
   *  the logo of who it was for (or several, for a client with more than one brand), credited
   *  beside Spotmies' above the title (`height` for a squarer mark that needs more than the
   *  usual 34px to read beside a wide one). */
  caseStudy?: {
    timeframe: string;
    client?: CaseClient | CaseClient[];
    headline?: string;
    brief?: CaseFact[];
    reel?: ScreenItem[];
    sections: CaseSection[];
  };
  /** Its stage, for a project without a case study brief to read it from. */
  stage?: string;
  disk: string;
  ink: string;
}

/**
 * A project's stage in a word, for its row in the Work list: its brief's Stage cell, cut to
 * "0 → 1", "Redesign" or "Concept" (the note and the rest stay on the case study).
 */
export function stageOf(project: Project) {
  const value =
    project.caseStudy?.brief?.find((fact) => fact.label === "Stage")?.value ??
    project.stage;
  if (!value) return undefined;
  return value.startsWith("0 → 1") ? "0 → 1" : value.split(",")[0].trim();
}

export const projects: Project[] = [
  {
    id: "raobahadur",
    disciplines: ["design", "development"],
    title: "Rao Bahadur",
    kind: "Fan site for a feature film",
    role: "Solo: design + full stack",
    context: "Spotmies",
    summary:
      "A fan site for the Telugu film Rao Bahadur, where people who'd seen it could pick their favourite characters and post and debate theories, without making an account. Built alone in under a week, with an admin panel the film team ran themselves.",
    blurb:
      "A fan site where people who'd seen the Telugu film could pick their favourite characters and debate theories.",
    highlights: [
      "No sign-up: a nickname and a generated face, asked for only on your first like or post",
      "Likes, replies and trending theories that update live",
      "An admin panel for the debate, the critics' videos, users and theories",
    ],
    stack: ["Next.js", "GSAP", "Postgres", "Railway", "Cloudinary", "UploadThing", "Vercel"],
    link: { href: "https://raobahadur.in", label: "raobahadur.in" },
    media: [
      {
        type: "image",
        src: "/work/raobahadur/hero.jpg",
        alt: "Rao Bahadur home page",
      },
      {
        type: "image",
        src: "/work/raobahadur/characters.jpg",
        alt: "Picking favourite characters, with like counts",
      },
      {
        type: "image",
        src: "/work/raobahadur/theories.jpg",
        alt: "The fan theories board",
      },
    ],
    caseStudy: {
      timeframe: "July 2026",
      client: { logo: "/logos/rao-bahadur-logo.webp", name: "Rao Bahadur" },
      headline:
        "Getting a slow-burn film talked about, with nothing in the way of joining in",
      brief: [
        {
          label: "Role",
          value: "Solo, end to end",
          note: "Design, frontend, backend, admin",
        },
        {
          label: "Product",
          value: "Fan site + admin panel",
          note: "For the Telugu film Rao Bahadur",
        },
        {
          label: "Stage",
          value: "0 → 1, shipped",
          note: "Live in 5–6 days, for the July 2026 release",
        },
        {
          label: "Fans",
          value: "271 theories",
          note: "And 144 comments and replies",
        },
        {
          label: "Reach",
          value: "4 official posts",
          note: "36,000+ views on X, the director replying",
        },
        {
          label: "Takeaway",
          value: "Remove every hurdle",
          note: "A nickname was enough to join in",
        },
      ],
      reel: [
        {
          type: "image",
          src: "/work/raobahadur/hero.jpg",
          alt: "Rao Bahadur home page",
        },
        {
          type: "image",
          src: "/work/raobahadur/characters.jpg",
          alt: "Picking favourite characters",
        },
        {
          type: "image",
          src: "/work/raobahadur/theories.jpg",
          alt: "The fan theories board",
        },
        {
          type: "image",
          src: "/work/raobahadur/easter-egg.jpg",
          alt: "The insect easter egg",
        },
      ],
      sections: [
        {
          id: "brief",
          act: "The brief",
          label: "Brief",
          heading: "Keep people talking after the film",
          paragraphs: [
            "Rao Bahadur is a Telugu film directed by Venkatesh Maha. Its makers asked Spotmies for a site where people who'd watched it could share their opinions and dig into the hidden details the director had put in. It's a slow, detailed film, and it opened in the same week as a much bigger star's, so it needed word of mouth. The film's team hired MutinyX, which brought in Spotmies, and Spotmies gave the project to me. I designed and built all of it.",
            "The first draft took two to three days and covered about 90% of the site. The client's changes, like the admin panel, took it to five or six.",
          ],
          figures: [
            {
              type: "image",
              src: "/work/raobahadur/hero.jpg",
              alt: "Rao Bahadur home page",
              caption:
                "The home page: root for the film, or see the buzz around it.",
            },
          ],
        },
        {
          id: "constraints",
          label: "Constraints",
          heading: "The limits I worked inside",
          paragraphs: ["Every choice below had to fit these:"],
          points: [
            "Live in under a week, in time for the July 2026 release",
            "The same week as a bigger star's film, so it had to spread by word of mouth",
            "No messy sign-up or login pages: on a fan site, people who meet one leave",
            "My first time building something with this much content at this scale",
          ],
        },
        {
          id: "ownership",
          label: "My part",
          heading: "What I owned, and what I didn't",
          paragraphs: [
            "The film's team hired MutinyX, which brought in Spotmies; I worked with Spotmies only.",
          ],
          points: [
            "Mine: the design, the frontend, the backend and the admin panel, and every asset, from the posters and stills I found to the graphics I made",
            "Mine too: the spoiler question, the easter egg, and how to join in without signing up",
            "The client's: the user flow, what the site had to include, and the rule against sign-up pages",
          ],
        },
        {
          id: "identity",
          act: "The decisions",
          label: "No sign-up",
          heading: "No sign-up, just a name",
          paragraphs: [
            "The client's one firm rule was no messy sign-up or login pages: fans of a smaller film won't make an account just to leave a comment, and most who meet a sign-up page leave. How to do without one was my call. Reading is open to everyone, and only your first like, reply or post asks for a nickname. As you type it, a face is drawn from the letters with FaceHash, so everyone has an avatar without uploading a photo.",
            "The trade-off: without accounts, anyone can post as anyone. So the film team watched the theories from the admin panel and could remove any that crossed a line.",
          ],
          lead: {
            type: "diagram",
            diagram: "rao-join",
            alt: "Animated diagram: on a usual fan site, liking a theory opens a sign-up form for an email and a password twice, then asks you to check your inbox; on Rao Bahadur, the first like asks only for a nickname, a face is drawn from it as it's typed, and the like lands",
            caption: "Liking a theory for the first time, on a usual fan site and on Rao Bahadur.",
          },
          layout: "pair",
          figures: [
            {
              type: "image",
              src: "/work/raobahadur/identify-modal.jpg",
              alt: "Identify yourself: an empty avatar and a nickname field",
              caption: "Asked for only on your first like, reply or post.",
            },
            {
              type: "image",
              src: "/work/raobahadur/identify-avatar-modal.jpg",
              alt: "The avatar's face appears as the name is typed",
              caption: "The face is drawn from the name as you type it.",
            },
          ],
        },
        {
          id: "spoilers",
          label: "Spoilers",
          heading: "Ask before you spoil it",
          paragraphs: [
            "This was my idea. Rooting for the film starts with one question: have you watched it? If not, you go to the buzz page, with trailers, critics' posts and where to book tickets, and nothing that gives the film away. If you have, you pick your favourite characters and go on to the theories.",
          ],
          layout: "pair",
          figures: [
            {
              type: "image",
              src: "/work/raobahadur/watched.jpg",
              alt: "Have you watched Rao Bahadur? Two cards: yes, or not yet",
              caption: "One question before any spoilers.",
            },
            {
              type: "image",
              src: "/work/raobahadur/characters.jpg",
              alt: "Five character cards, each with a like count",
              caption:
                "Favourite characters, with like counts that update live.",
            },
          ],
        },
        {
          id: "easter-egg",
          label: "Easter egg",
          heading: "A hidden detail of my own",
          paragraphs: [
            "The site is about the details the director hid in the film, so I hid one in the site. Search the theories for “the insect”, in English or in Telugu, and confetti falls while a card explains what the insect stands for in the film.",
          ],
          figures: [
            {
              type: "image",
              src: "/work/raobahadur/easter-egg.jpg",
              alt: "Easter egg: the Insect of Doubt card over falling confetti",
              caption: "Found by searching “the insect”.",
            },
          ],
        },
        {
          id: "design-language",
          act: "The look",
          label: "Design language",
          heading: "Gold, peacock and Cinzel",
          paragraphs: [
            "The look comes from the film's main posters: gold on near-black, with a peacock green. Gold is for buttons and anything you can act on, with a gold gradient on the big headings; peacock green marks small labels. Headings and buttons are set in Cinzel, and everything you read in Inter.",
          ],
          lead: {
            type: "diagram",
            diagram: "rao-system",
            alt: "Rao Bahadur's design language: gold #F5C66D for buttons, a gold gradient from #FFD16A to #D6812E for headings, peacock #008288 for labels and #010A09 for the page; Cinzel for headings and buttons and Inter for text; fully round buttons and tags",
            caption: "The colours, type and shape behind the site.",
          },
        },
        {
          id: "more",
          act: "The build",
          label: "Also built",
          heading: "Everything around it",
          paragraphs: [
            "Around those decisions is the rest of the product: the theories themselves, a debate the film team ran, and an admin panel they used without needing me.",
          ],
          layout: "grid",
          figures: [
            {
              type: "image",
              src: "/work/raobahadur/theories.jpg",
              alt: "The fan theories board, with tabs for trending, new and hidden details",
              caption: "Theories to read, like, reply to, save and share.",
            },
            {
              type: "image",
              src: "/work/raobahadur/theory-trending.jpg",
              alt: "A theory trending through clicks and through replies",
              caption:
                "Tags show whether a theory is trending through clicks, likes or replies.",
            },
            {
              type: "image",
              src: "/work/raobahadur/hero-debate.jpg",
              alt: "The home page with its Live debate banner",
              caption:
                "An open debate with the film team, announced on the home page.",
            },
            {
              type: "image",
              src: "/work/raobahadur/debate-form.jpg",
              alt: "Open debate sign-up form",
              caption:
                "The debate sign-up: the only place that asks for real details, so the team could pick people and contact them.",
            },
            {
              type: "image",
              src: "/work/raobahadur/admin-theories.jpg",
              alt: "Admin dashboard listing theories, comments and replies",
              caption:
                "The admin panel: users and theories to watch, the debate (on or off, and its answers), and the buzz page's videos and posts.",
            },
            {
              type: "image",
              src: "/work/raobahadur/my-theories.jpg",
              alt: "My theories and saved theories",
              caption: "Your own theories, and the ones you saved.",
            },
          ],
        },
        {
          id: "hard",
          label: "Hard part",
          heading: "Keeping it fast and live",
          paragraphs: [
            "It runs on Next.js, with a Postgres database on Railway and the images and videos in Cloudinary and UploadThing. I was still new to building at this scale. The hardest part was keeping pages quick while theories, replies, videos and images piled up, and making likes and counts update live without a refresh. I also reworked the animations several times, until each one explained something instead of getting in the way.",
          ],
          figures: [
            {
              type: "image",
              src: "/work/raobahadur/theory-hidden-detail.jpg",
              alt: "A theory page with its discussion and like count",
              caption:
                "A theory page. Likes and replies arrive without a refresh.",
            },
          ],
        },
        {
          id: "outcome",
          act: "What happened",
          label: "Outcome",
          heading: "What happened",
          paragraphs: [
            // The count on the home page is set by the client for marketing, so it isn't quoted
            // here; these totals are from the admin panel.
            "Fans filled the site with theories and replies. The film's official X account sent people to the site four times in its first ten days, asked for easter eggs and theories, and said the director would reply to the best ones. Spotmies was told on a call that the filmmakers loved the site.",
            "It also carried on past the cinema run. The debate opened after the film left cinemas, and once it closed, the site turned to pointing fans to the film on Netflix.",
          ],
          stats: [
            { value: "271", label: "theories posted" },
            { value: "144", label: "comments and replies" },
            { value: "4", label: "official posts about it" },
            { value: "36,000+", label: "views on those posts" },
          ],
          layout: "row",
          // Paired side by side, so they fill the monitor's 4:3 screen.
          screen: [
            {
              type: "image",
              src: "/work/raobahadur/posts-jul-7.jpg",
              alt: "Two posts about the site from @RaoBahadurMovie on July 7",
            },
            {
              type: "image",
              src: "/work/raobahadur/posts-jul-8-16.jpg",
              alt: "Posts about the site from July 8 and July 16",
            },
          ],
          figures: [
            {
              type: "image",
              src: "/work/raobahadur/post-1.jpg",
              alt: "@RaoBahadurMovie: Loved #RaoBahadur? Visit raobahadur.in. Root for it. Root for good cinema.",
              caption: "July 7 · 13,985 views",
            },
            {
              type: "image",
              src: "/work/raobahadur/post-2.jpg",
              alt: "@RaoBahadurMovie: Think you've decoded #RaoBahadur? Share the easter eggs you found; @mahaisnotanoun will reply to the best ones.",
              caption: "July 7 · 7,450 views",
            },
            {
              type: "image",
              src: "/work/raobahadur/post-3.jpg",
              alt: "@RaoBahadurMovie: We're going through all of them and are quite amazed by them, with a fan's theory from the site",
              caption: "July 8 · 4,834 views",
            },
            {
              type: "image",
              src: "/work/raobahadur/post-4.jpg",
              alt: "@RaoBahadurMovie: Loved it or have mixed feelings? Join the #RaoBahadur Debate at raobahadur.in/debate",
              caption: "July 16 · 9,892 views",
            },
          ],
        },
        {
          id: "reflection",
          label: "Reflection",
          heading: "A site can't change a release date",
          paragraphs: [
            "The site was built in a hurry, in under a week, and it still gave the client everything they asked for. The film got good reviews but didn't do well at the box office, partly because it came out alongside a bigger film. The site kept the people who had watched it talking, and gave the film team something to post about, but it couldn't bring in the people who never went to see it.",
          ],
          points: [
            "What I learned: in a week, decide early what has to be right. Here it was joining in without an account, and everything else could follow",
            "What I'd change: plan for speed from the start, setting up how images load and counts update before the content piled up, not after",
            "What I'd do next: a spoiler-free way into the theories, to draw in people who haven't watched it yet",
          ],
        },
      ],
    },
    disk: "#0e5e57",
    ink: "#f5f1ea",
  },
  {
    id: "mutiny",
    disciplines: ["design", "development"],
    title: "MutinyX",
    kind: "Creator app + website",
    role: "Design + frontend",
    context: "Spotmies",
    summary:
      "The creator app for MutinyX, an influencer marketing network: designed in Figma twice, six months apart, with the second version's frontend built by me in React Native, plus the Next.js landing pages for its rebrand. My first big project at Spotmies.",
    blurb:
      "The creator app for an influencer marketing network, designed twice and rebuilt to match, and its website.",
    highlights: [
      "Designed the first version, about 35 screens, in three days, and built some of its screens in React Native",
      "Redesigned it after the rebrand, around a new flow for submitting each deliverable, and built its frontend in React Native",
      "Designed and built the MutinyX landing pages in Next.js",
    ],
    stack: ["Figma", "React Native", "Next.js", "HTML/CSS/JS"],
    link: { href: "https://www.mutinyx.in", label: "mutinyx.in" },
    media: [
      {
        type: "video",
        src: "/work/mutiny/boards/v2-home.mp4",
        poster: "/work/mutiny/boards/v2-home.jpg",
        alt: "MutinyX version 2 home screen",
      },
      {
        type: "image",
        src: "/work/mutiny/boards/v2-screens.jpg",
        alt: "MutinyX version 2 screens",
      },
      {
        type: "image",
        src: "/work/mutiny/boards/v1-start.jpg",
        alt: "Mutiny Talent version 1 screens",
      },
    ],
    caseStudy: {
      timeframe: "Feb–Sep 2026",
      client: { logo: "/work/mutiny/logo-dark.svg", name: "MutinyX" },
      headline:
        "Redesigning a creator app around the work that comes after yes",
      brief: [
        {
          label: "Role",
          value: "Design + frontend",
          note: "Designed both; built part of v1 and all of v2's frontend",
        },
        {
          label: "Team",
          value: "Me + my team lead",
          note: "With Spotmies developers on version 1's build",
        },
        {
          label: "Timeline",
          value: "Feb–Sep 2026",
          note: "Version 1 in Feb, version 2 in Aug–Sep",
        },
        {
          label: "Problem",
          value: "Lost after yes",
          note: "Creators couldn't tell where or how to submit each deliverable",
        },
        {
          label: "Outcome",
          value: "v2 approved",
          note: "Frontend signed off, now in testing",
        },
        {
          label: "Platform",
          value: "iOS + Android",
          note: "React Native, plus the Next.js website",
          logo: "/work/mutiny/logo-dark.svg",
          href: "https://www.mutinyx.in",
        },
      ],
      reel: [
        {
          type: "video",
          src: "/work/mutiny/boards/v2-home.mp4",
          poster: "/work/mutiny/boards/v2-home.jpg",
          alt: "Version 2's home screen, its carousel turning",
          caption: "",
          label: "Home",
        },
        {
          type: "image",
          src: "/work/mutiny/boards/v1-start.jpg",
          alt: "Version 1: the landing, home and campaigns screens",
          caption: "",
          label: "Version 1",
        },
        {
          type: "image",
          src: "/work/mutiny/boards/v2-screens.jpg",
          alt: "Version 2: explore, the submissions dashboard and the profile",
          caption: "",
          label: "Version 2",
        },
      ],
      sections: [
        {
          id: "brief",
          act: "The problem",
          label: "Brief",
          heading: "A creator app that stopped at yes",
          paragraphs: [
            "MutinyX connects brands, agencies and creators for influencer marketing. Brands and agencies run campaigns from a desktop dashboard; creators use the app to find them, quote a price, submit their work and get paid. This is the creators' app, called Mutiny Talent until June.",
            "Version 1 made finding a campaign and saying yes easy. What came after was harder: as soon as a brand asked for more than one deliverable, creators couldn't tell where each one went or what came next. The app that shipped had also drifted from the design. Creators complained to the client, and their complaints became the brief for version 2: the same premium design, built exactly as designed.",
          ],
        },
        {
          id: "version-1",
          label: "Version 1",
          heading: "Where it started: a whole app in three days",
          paragraphs: [
            "In February, my first big project at Spotmies, the client gave me a user flow, the logo and a few references, and asked for a premium, production-ready design. I designed about 35 screens in Figma over three days, from February 25 to 28, from signing up to getting paid: finding campaigns, negotiating a price, tracking the work, chats, the wallet and the profile. From early March, I built some of them in React Native (the opening and sign-in, the campaigns list, transactions and the profile), while my team lead and the Spotmies developers built the rest.",
            "Covering the whole journey that fast got the product live, but it treated a campaign as one pipeline, and that's where it broke. By release, the build had also changed the design, even on the screens I'd built: what creators got wasn't what the client had approved.",
          ],
          layout: "carousel",
          figures: [
            {
              type: "image",
              src: "/work/mutiny/boards/v1-start.jpg",
              alt: "Version 1: the landing screen, home and the campaigns list",
              caption: "The landing, home, and the campaigns to choose from.",
              label: "Getting started",
            },
            {
              type: "image",
              src: "/work/mutiny/boards/v1-campaign.jpg",
              alt: "Version 1: a campaign's details, the price slider and the campaign's progress",
              caption:
                "A campaign's details, the price slider, and its progress.",
              label: "A campaign",
            },
            {
              type: "image",
              src: "/work/mutiny/boards/v1-after.jpg",
              alt: "Version 1: the wallet, an invoice and the creator's profile",
              caption: "The wallet, an invoice, and the creator's profile.",
              label: "After the work",
            },
          ],
        },
        {
          id: "goals",
          label: "Goals",
          heading: "What version 2 had to do, and within what",
          paragraphs: [
            "In June, Mutiny Talent took the name of the brands' dashboard, MutinyX, so both sides now share one name. The client wanted a fresh app with the same premium feel, and this time built exactly as designed. From August 25, I had five days to redesign it, with these goals:",
          ],
          points: [
            "Make every deliverable clear: where it goes, what's next, and where it stands",
            "Stop asking creators to guess at a price the brand never set",
            "Get creators in with as little as a phone number",
            "Carry the new MutinyX brand",
            "Ship what was designed, by building the frontend myself",
          ],
        },
        {
          id: "constraints",
          label: "Constraints",
          heading: "The limits I worked inside",
          paragraphs: [
            "Every choice below had to fit these:",
          ],
          points: [
            "Phones only: the app is for creators, while brands work in a separate desktop dashboard",
            "From the client: a user flow, the logo and a few references; the rest of the look was mine to set",
            "It had to feel premium and production-ready, not like a prototype",
            "Five days to redesign, then about a week to build the frontend",
            "The React Native architecture was already in place, so new flows had to fit it",
            "Creators' followers and data came from Instagram, so sign-in had to connect to it",
          ],
        },
        {
          id: "ownership",
          label: "My part",
          heading: "What I owned, and what I didn't",
          paragraphs: [
            "In version 1, I designed everything and built a few screens; in version 2, I designed and built the whole frontend. Here's where my part ends and the others' begin:",
          ],
          points: [
            "Mine: both versions' design in Figma, some of version 1's screens, the submissions flow (which I pitched), the opening animation, and version 2's frontend in React Native",
            "My team lead's, with the Spotmies developers: the rest of version 1's build and its release, the app's architecture, the Instagram connection, the backend, and the brands' desktop dashboard",
            "The client's: the user flow, the brand, and sign-off on every step",
            "Decided together: dropping the price slider, and phone-number-only sign-in",
          ],
        },
        {
          id: "submissions",
          act: "The decisions",
          label: "Submissions",
          heading: "One place for every deliverable",
          paragraphs: [
            "In version 1, a campaign had one progress timeline. A brand asking for two reels and a story still got one upload button, so creators couldn't tell which piece they were submitting, or what the brand had already approved.",
            "In version 2, every deliverable sits in its own tab at the top of the submissions screen, with steps that fit what it is: a reel goes from script to work to proof of work, while a story or post goes from post to proof. Each step is reviewed and shows where it stands.",
            "I pitched the flow to the client, then designed and built it once they approved. It adds a screen of tabs, but creators always know what's left.",
          ],
          lead: {
            type: "diagram",
            diagram: "submission-flow",
            alt: "Animated diagram: in version 1, two reels and a story all go through one upload button under one timeline, and it's unclear which moved it; in version 2, each has its own track with its own steps",
            caption:
              "A campaign with two reels and a story, before and after.",
          },
          // The monitor can't play a diagram, so it shows the Figma prototype instead.
          screen: [
            {
              type: "video",
              src: "/work/mutiny/boards/v2-submit-flow.mp4",
              poster: "/work/mutiny/boards/v2-submit-flow.jpg",
              alt: "The version 2 submission flow: a reel's script uploaded and approved, then its work, then the proof of work",
              caption:
                "The whole flow, from script to proof of work, prototyped in Figma.",
            },
          ],
          layout: "pair",
          figures: [
            {
              type: "image",
              src: "/work/mutiny/boards/v1-submit.jpg",
              alt: "Version 1: a campaign's single progress timeline, the upload screen and the submitted message",
              caption: "Before: one pipeline per campaign.",
            },
            {
              type: "image",
              src: "/work/mutiny/boards/v2-submit.jpg",
              alt: "Version 2: deliverable tabs for two reels, with script upload, then work upload, then proof of work",
              caption: "After: a tab per deliverable, each step reviewed in turn.",
            },
          ],
        },
        {
          id: "quote",
          label: "Quoting",
          heading: "The feature we dropped",
          paragraphs: [
            "Version 1 had a price slider that showed how your price changed your chances of being accepted. It looked helpful, but brands set one budget for a whole campaign, across nano, micro and mega creators, not a price per creator, so there was no honest number to put on it.",
            "My team lead and the client decided to drop it, and I designed what replaced it: creators type their own quote, and the app only says whether it's within the brand's budget or above it. They lose the guidance of a suggested price, but they quote what they're worth instead of guessing what the brand wants.",
          ],
          lead: {
            type: "diagram",
            diagram: "quote-flow",
            alt: "Animated diagram: in version 1, a slider moves the price between $490 and $550 and promises better or worse odds that nothing backs up; in version 2, the creator types a quote and the app says whether it's above or within the brand's budget",
            caption: "Quoting a price, before and after.",
          },
          layout: "pair",
          figures: [
            {
              type: "image",
              src: "/work/mutiny/boards/v1-quote.jpg",
              alt: "Version 1: the price slider at $500, $490 and $550, each with its chance of acceptance",
              caption: "Before: a slider promising odds it couldn't know.",
              label: "Version 1",
            },
            {
              type: "image",
              src: "/work/mutiny/boards/v2-quote.jpg",
              alt: "Version 2: a quote of ₹5000, marked above the brand's budget, and the same quote marked within it",
              caption: "After: your own quote, within the brand's budget or above it.",
              label: "Version 2",
            },
          ],
        },
        {
          id: "sign-in",
          label: "Sign-in",
          heading: "One field to get in",
          paragraphs: [
            "Version 1 asked new creators for a name, email and phone before an OTP. The client wanted a phone number to be enough, so one field now does both: an existing creator gets an OTP and is in, and a new one adds a name and email, then connects Instagram so their followers come in by themselves (my team lead and the developers built that part).",
          ],
          lead: {
            type: "diagram",
            diagram: "sign-in-flow",
            alt: "Animated diagram: in version 1, a name, email and phone are typed before a five-digit OTP; in version 2, a phone number and a six-digit OTP are enough to get back in",
            caption: "Getting in, before and after.",
          },
          layout: "pair",
          figures: [
            {
              type: "image",
              src: "/work/mutiny/boards/v1-signin.jpg",
              alt: "Version 1 sign-up: name, email and phone, the OTP keypad, then the entered OTP",
              caption: "Before: name, email and phone, then an OTP.",
              label: "Version 1",
            },
            {
              type: "image",
              src: "/work/mutiny/boards/v2-signin.jpg",
              alt: "Version 2 sign-in: a phone number, then the OTP boxes, then the entered OTP",
              caption: "After: a phone number, then an OTP.",
              label: "Version 2",
            },
          ],
        },
        {
          id: "opening",
          act: "The craft",
          label: "Opening",
          heading: "An opening that explains the app",
          paragraphs: [
            "Version 1 opened on a rotating globe of faces, which looked good but didn't say what the app was for. The new opening does: find campaigns, find brands, find collaborations, find you, as campaign posters fly past.",
            "I built it in HTML, CSS and JavaScript, with motion blur and haptics, and embedded it in the React Native app.",
          ],
          figures: [
            {
              type: "video",
              src: "/work/mutiny/boards/openings.mp4",
              poster: "/work/mutiny/boards/openings.jpg",
              alt: "The two openings side by side: version 1's cluster of creators' faces on yellow, and version 2's Find campaigns, brands, collaborations and you, as posters fly past",
              caption: "Version 1's opening, left, and version 2's, right.",
            },
          ],
        },
        {
          id: "new-look",
          label: "New look",
          heading: "Yellow only where you can act",
          paragraphs: [
            "With the rebrand, the client moved to a black logo: yellow on white had looked loud and cheap, not true to the brand. So the app went pure black (#000000), with the MutinyX yellow (#FACB03) kept for everything you can act on, and version 1's SF Pro gave way to General Sans. The tabs became Home, Explore, Chats and Submissions, and Explore split campaigns into public ones and the ones you're invited to, with filters for paid, barter and programs. I prototyped the moving parts in Figma before building them.",
          ],
          lead: {
            type: "diagram",
            diagram: "mutiny-system",
            alt: "MutinyX's design language: yellow #FACB03 for anything you can act on, pure black #000000 for the page and #1A1A1A from the logo's wordmark, picked from the logo; General Sans for version 2 after version 1's SF Pro; buttons and fields fully round, cards at 25px",
            caption: "The colours, type and shape behind version 2.",
          },
          layout: "carousel",
          figures: [
            {
              type: "video",
              src: "/work/mutiny/boards/v2-home.mp4",
              poster: "/work/mutiny/boards/v2-home.jpg",
              alt: "Version 2's home screen: earnings at the top, then a carousel of campaigns turning",
              caption: "The home screen's carousel, prototyped in Figma.",
              label: "Home",
            },
            {
              type: "video",
              src: "/work/mutiny/boards/v2-campaign.mp4",
              poster: "/work/mutiny/boards/v2-campaign.jpg",
              alt: "A version 2 campaign screen scrolling, its header folding away",
              caption: "A campaign screen as it scrolls, prototyped in Figma.",
              label: "Campaign",
            },
            {
              type: "image",
              src: "/work/mutiny/boards/v2-screens.jpg",
              alt: "Version 2: explore with its filters, the submissions dashboard and the profile",
              caption:
                "Explore with its filters, the submissions dashboard, and the profile.",
              label: "Screens",
            },
          ],
        },
        {
          id: "status",
          act: "What happened",
          label: "Outcome",
          heading: "Built as designed, and in testing",
          paragraphs: [
            "From September 9, I built version 2's frontend in about a week, matching the Figma screens with every animation and interaction tuned. My team lead checked and approved it, and is now connecting the backend.",
            "Version 2 is in testing and no creators are on it yet, so there are no numbers to share. Once it's live, the first thing to watch is how many creators submit a deliverable on the first try.",
          ],
        },
        {
          id: "reflection",
          label: "Reflection",
          heading: "Designing twice taught me more than once",
          paragraphs: [
            "Version 1, my first project, taught me how to turn a rough user flow into a prototype that could actually be built. It also taught me that a design can change on its way through development, and that the real test comes after launch: creators' feedback showed me where my flow was weak, and version 2 is the stronger, smoother flow that came out of it.",
          ],
          points: [
            "What I learned: a design is only as good as what ships, which is why I built version 2's frontend myself",
            "What I'd change: hear from creators directly, not only through the client",
            "What I'd do next: once version 2 is live, watch how many creators submit on the first try",
          ],
        },
        {
          id: "website",
          act: "Also designed",
          label: "Website",
          heading: "Landing pages for the rebrand",
          paragraphs: [
            "For the June rebrand, I designed and built the MutinyX landing pages in Next.js: one for the network as a whole, one for creators, and a pair for brands and agencies that share a layout, with the micro-interactions designed and built together.",
          ],
          layout: "carousel",
          figures: [
            {
              type: "video",
              src: "/work/mutiny/site-home.mp4",
              poster: "/work/mutiny/site-home.jpg",
              alt: "Scrolling through the MutinyX home page: the hero, the three sides of the network, the globe, the FAQ and the closing banner",
              caption: "The home page, for the whole network.",
              label: "Home",
            },
            {
              type: "video",
              src: "/work/mutiny/site-creators.mp4",
              poster: "/work/mutiny/site-creators.jpg",
              alt: "Scrolling through MutinyX for Creators: phones fanning out of the hero, the app's screens, the seven features joined by a path, the FAQ and the closing banner",
              caption:
                "For creators: the app's features, one after another along a path.",
              label: "Creators",
            },
          ],
        },
      ],
    },
    // Its brief has no Stage cell now, so the Work list reads it from here.
    stage: "0 → 1",
    disk: "#facb03",
    ink: "#1a1a1a",
  },
  {
    id: "spotmies",
    disciplines: ["design", "development"],
    title: "Spotmies",
    kind: "Company website",
    role: "Solo: design + build",
    context: "Spotmies",
    summary:
      "A redesign of Spotmies' own website, the landing page and the inner pages, from a stock-photo template to a dark, modern studio site. Researched, designed and built by me in Next.js, right after Amero X.",
    blurb:
      "The studio's own website, redesigned from a stock-photo template into a dark, modern site.",
    highlights: [
      "Replaced the old template site with a new design, researched across many references",
      "Designed and built the landing and inner pages in Next.js, with three.js on the landing page",
    ],
    stack: ["Figma", "Next.js", "three.js", "Vercel"],
    link: { href: "https://www.spotmies.com", label: "spotmies.com" },
    media: [
      {
        type: "video",
        src: "/work/spotmies/hero.mp4",
        poster: "/work/spotmies/hero.jpg",
        alt: "The Spotmies landing page",
      },
      {
        type: "image",
        src: "/work/spotmies/old-hero.jpg",
        alt: "The old Spotmies website",
      },
    ],
    caseStudy: {
      timeframe: "Jan–Feb 2026",
      headline:
        "Redesigning the company I'd just joined, from a template to its own look",
      brief: [
        {
          label: "Role",
          value: "Solo, end to end",
          note: "Research, design and build",
        },
        {
          label: "Product",
          value: "spotmies.com",
          note: "Landing page and inner pages",
          href: "https://www.spotmies.com",
        },
        {
          label: "Stage",
          value: "Redesign",
          note: "Replacing a stock, photo-led template",
        },
        {
          label: "Window",
          value: "Done by mid-Feb 2026",
          note: "Straight after Amero X",
        },
        {
          label: "Stack",
          value: "Next.js",
          note: "three.js on the landing page, on Vercel",
        },
        {
          label: "Order",
          value: "My second project",
          note: "Of my first three at Spotmies",
        },
      ],
      reel: [
        {
          type: "video",
          src: "/work/spotmies/hero.mp4",
          poster: "/work/spotmies/hero.jpg",
          alt: "The new Spotmies landing page",
        },
        {
          type: "image",
          src: "/work/spotmies/old-hero.jpg",
          alt: "The old Spotmies website",
        },
      ],
      sections: [
        {
          id: "brief",
          act: "The brief",
          label: "Brief",
          heading: "A site that didn't look like the work",
          paragraphs: [
            "When I joined Spotmies, its website was a template: stock photos of smiling people, a light layout and generic lines like “Innovative solutions to stay ahead of the competition”. It said little about what the studio actually builds.",
            "Once Amero X was handed off, I redesigned it, the landing page and the inner pages, and built it myself in Next.js. It was live by the second week of February 2026, signed off by Spotmies' CEO and founders.",
          ],
          layout: "pair",
          figures: [
            {
              type: "image",
              src: "/work/spotmies/old-hero.jpg",
              alt: "The old Spotmies home page: a stock photo of a woman with a tablet, and Innovative solutions to stay ahead of the competition",
              caption: "Before: the template I found when I joined.",
            },
            {
              type: "image",
              src: "/work/spotmies/new-hero.jpg",
              alt: "The new Spotmies home page: The future of development is human + AI, over a dark field of stars",
              caption: "After: “The future of development is human + AI”.",
            },
          ],
          screen: [
            {
              type: "image",
              src: "/work/spotmies/old-hero.jpg",
              alt: "Before",
            },
            { type: "image", src: "/work/spotmies/new-hero.jpg", alt: "After" },
          ],
        },
        {
          id: "research",
          act: "The redesign",
          label: "Research",
          heading: "References first",
          paragraphs: [
            "I spent a lot of the time before designing anything going through studio and product sites, looking for how the best of them show what they do instead of saying it. The new site leads with the work: what Spotmies builds, the products it's built, and how it thinks about product and brand together.",
          ],
          lead: {
            type: "video",
            src: "/work/spotmies/hero.mp4",
            poster: "/work/spotmies/hero.jpg",
            alt: "The Spotmies landing page opening: the hero over moving stars, then the services",
            caption: "The opening, and the services under it.",
          },
        },
        {
          id: "site",
          label: "The site",
          heading: "Page by page",
          paragraphs: [
            "Each section has one job. The services come as cards, the clients as a wall of logos, and a map shows where product and brand meet. Featured work opens into full case studies, and the page ends on designs, testimonials, questions and a way to get in touch.",
          ],
          layout: "carousel",
          figures: [
            {
              type: "video",
              src: "/work/spotmies/approach.mp4",
              poster: "/work/spotmies/approach.jpg",
              alt: "Client logos, then a map of where product and brand meet",
              caption: "Clients, and where product and brand meet.",
              label: "Approach",
            },
            {
              type: "video",
              src: "/work/spotmies/work.mp4",
              poster: "/work/spotmies/work.jpg",
              alt: "A featured case study for Readiy.io, then the grid of featured work",
              caption: "Featured work, opening into a full case study.",
              label: "Work",
            },
            {
              type: "video",
              src: "/work/spotmies/closing.mp4",
              poster: "/work/spotmies/closing.jpg",
              alt: "The designs gallery, testimonials, questions, the contact form and footer",
              caption: "Designs, what clients say, questions and contact.",
              label: "Closing",
            },
          ],
        },
        {
          id: "design-language",
          label: "Design language",
          heading: "Black, cyan and Outfit",
          paragraphs: [
            "The old template was light and full of stock photos; the new site is near-black, with the Spotmies cyan kept for highlights, borders and glows. Headings are set in Outfit, the body in the system's own sans, and buttons are fully round.",
          ],
          lead: {
            type: "diagram",
            diagram: "spotmies-system",
            alt: "Spotmies' design language: cyan #00EEF9 for highlights and glows, cyan #00D3F3 for fills, #050505 for the page and white for text; Outfit for headings; fully round buttons and 16 to 24px cards",
            caption: "The colours, type and shape behind the new site.",
          },
        },
        {
          id: "before",
          label: "Before",
          heading: "What it replaced",
          paragraphs: ["For comparison, the old site from top to bottom."],
          figures: [
            {
              type: "video",
              src: "/work/spotmies/old-site.mp4",
              poster: "/work/spotmies/old-site.jpg",
              alt: "Scrolling through the old Spotmies website",
              caption: "The old site.",
            },
          ],
        },
        {
          id: "outcome",
          act: "What happened",
          label: "Outcome",
          heading: "Signed off at the top, and live",
          paragraphs: [
            "Spotmies' CEO and founders signed it off, and it's live at [spotmies.com](https://www.spotmies.com), the first thing a new client sees of the studio.",
          ],
        },
        {
          id: "reflection",
          label: "Reflection",
          heading: "Show the work, don't describe it",
          paragraphs: [
            "Redesigning the company I'd just joined meant designing for people who already had an opinion of the brand. It taught me to lead with proof: the old site called Spotmies innovative; the new one shows what it has built, and lets that do the talking.",
          ],
          points: [
            "What I'd change: build in a way to measure it, like where enquiries come from, so its effect could be seen and not just heard about",
          ],
        },
      ],
    },
    disk: "#16b3c1",
    ink: "#0d2226",
  },
  {
    id: "amerox",
    disciplines: ["design", "development"],
    title: "Amero X",
    kind: "Crypto trading platform",
    role: "Design + landing page build",
    context: "Spotmies",
    summary:
      "My first project at Spotmies: refining Amero X, a crypto trading platform whose designs felt cheap, into a black-and-gold product that feels premium and trustworthy. I redesigned it in Figma, then built the landing page to match.",
    blurb:
      "My first project: refining a crypto trading platform into a black-and-gold product that feels premium.",
    highlights: [
      "Refined the platform's designs in Figma: trading, swap, P2P, wallet and more",
      "Built the landing page from the approved design, animations and all",
    ],
    stack: ["Figma", "Frontend"],
    link: { href: "https://amerox.io", label: "amerox.io" },
    media: [
      {
        type: "video",
        src: "/work/amerox/site.mp4",
        poster: "/work/amerox/site.jpg",
        alt: "The Amero X landing page",
      },
      {
        type: "image",
        src: "/work/amerox/board-trading.jpg",
        alt: "Amero X trading screens",
      },
    ],
    caseStudy: {
      timeframe: "Dec 2025 – Jan 2026",
      client: { logo: "/logos/amerox-cropped.png", name: "Amero X" },
      headline: "Making gold on black feel trustworthy, not cheap",
      brief: [
        {
          label: "Role",
          value: "Design + landing page",
          note: "Refined in Figma, then built",
        },
        {
          label: "Product",
          value: "Amero X",
          note: "Crypto trading, swaps and P2P",
          logo: "/logos/amerox-cropped.png",
          href: "https://amerox.io",
        },
        {
          label: "Stage",
          value: "Redesign",
          note: "My first project at Spotmies: refining existing designs",
        },
        {
          label: "Window",
          value: "Dec 2025 – Jan 2026",
          note: "About six weeks",
        },
        {
          label: "Screens",
          value: "21 in Figma",
          note: "Trading, swap, P2P, wallet, proposals",
        },
        {
          label: "Challenge",
          value: "Gold without cheap",
          note: "Premium, modern and trustworthy",
        },
      ],
      reel: [
        {
          type: "video",
          src: "/work/amerox/site.mp4",
          poster: "/work/amerox/site.jpg",
          alt: "The Amero X landing page",
        },
        {
          type: "image",
          src: "/work/amerox/board-trading.jpg",
          alt: "Dashboard, spot trading, futures and copy trading",
        },
        {
          type: "image",
          src: "/work/amerox/board-money.jpg",
          alt: "Swap, wallet, liquidity staking and orders",
        },
      ],
      sections: [
        {
          id: "brief",
          act: "The brief",
          label: "Brief",
          heading: "My first project",
          paragraphs: [
            "Amero X was the first thing I worked on after joining Spotmies, in December 2025. It's a crypto trading platform: spot and futures trading, copy trading, swaps, P2P deals, staking and a wallet. Its designs already existed, but they felt cheap, and in crypto a cheap look costs trust. My job was to refine them, working with Spotmies' design head and the client.",
          ],
        },
        {
          id: "gold",
          act: "The design",
          label: "Gold",
          heading: "Gold without looking cheap",
          paragraphs: [
            "The client wanted black and gold. My first real struggle as a designer was balancing the two in a modern design language: enough gold to feel premium, never so much that it looked cheap or broke trust.",
            "Across the platform, gold is kept for what matters: the action you're about to take, your balance, the page you're on. Everything else sits in dark, warm greys, with the gold glowing softly behind it.",
          ],
          layout: "carousel",
          figures: [
            {
              type: "image",
              src: "/work/amerox/board-trading.jpg",
              alt: "Amero X dashboard, spot trading, futures trading and copy trading screens",
              caption: "Dashboard, spot trading, futures and copy trading.",
              label: "Trading",
            },
            {
              type: "image",
              src: "/work/amerox/board-money.jpg",
              alt: "Amero X swap, wallet, liquidity pool staking and orders screens",
              caption: "Swap, wallet, liquidity staking and orders.",
              label: "Money",
            },
            {
              type: "image",
              src: "/work/amerox/board-p2p.jpg",
              alt: "Amero X P2P trading, a purchase proposal, incoming proposals and a chat with the buyer",
              caption:
                "P2P deals: offers, proposals and a chat with the buyer.",
              label: "P2P",
            },
            {
              type: "image",
              src: "/work/amerox/login.jpg",
              alt: "Amero X login page with a gold coin and wallet",
              caption: "Signing in.",
              label: "Login",
            },
          ],
        },
        {
          id: "landing",
          act: "The build",
          label: "Landing",
          heading: "From Figma to code, to the pixel",
          paragraphs: [
            "Once the client approved the landing page in Figma, I built it myself, matching the design exactly: the fonts, the effects and every animation. A gold coin spins in to open the page, gold circuits trace the background, the feature cards fan out as a stack, and the footer spells AMERO X in lit dots.",
          ],
          lead: {
            type: "video",
            src: "/work/amerox/site.mp4",
            poster: "/work/amerox/site.jpg",
            alt: "The built Amero X landing page: the coin intro, Swap Instantly. Own Your Crypto., the trading tools, the card stack, stats and the dot-matrix footer",
            caption: "The landing page as I built it.",
          },
          figures: [
            {
              type: "video",
              src: "/work/amerox/figma.mp4",
              poster: "/work/amerox/figma.jpg",
              alt: "The approved Amero X landing page design, scrolled in Figma",
              caption: "The approved design, in Figma.",
            },
          ],
        },
        {
          id: "handoff",
          act: "What happened",
          label: "Handoff",
          heading: "Handed off",
          paragraphs: [
            "My part ended in January 2026, and the development team took it from there. They changed parts of it later, so the live site at [amerox.io](https://amerox.io) differs from what's shown here: the design and build as I handed them over.",
          ],
        },
        {
          id: "reflection",
          label: "Reflection",
          heading: "Restraint is what makes gold premium",
          paragraphs: [
            "My first project taught me that a premium look comes from restraint. Gold everywhere looked cheap; gold kept for the one thing that matters on each screen made the same palette feel trustworthy. Building the landing page myself, to the pixel, also showed me what survives the move from Figma to code.",
          ],
          points: [
            "What I'd change: write down the rules behind the design (where gold goes, and why) at handoff, so whoever changes it later keeps what makes it work",
          ],
        },
      ],
    },
    disk: "#b8892a",
    ink: "#1a1a1a",
  },
  {
    id: "peddi",
    disciplines: ["design", "development", "3d"],
    title: "Peddi",
    kind: "Roblox game world for a feature film",
    role: "Duo: world building",
    context: "Spotmies",
    summary:
      "A Roblox world for the Telugu film Peddi, made with Dworak in Roblox Studio to promote its release: a fairground, mountains, caves and rivers to explore, with references to the film all through it.",
    blurb:
      "A Roblox world for the Telugu film Peddi, full of references to the film, made with Dworak.",
    highlights: [
      "Built the virtual world around the game's core mechanics",
      "Filled it with references to the film, for fans to find",
      "Played and reviewed by Telugu YouTubers on their channels",
    ],
    stack: ["Roblox Studio", "Environment design"],
    link: {
      href: "https://www.roblox.com/share?code=df349887342b94458e3f07628b53f639&type=ExperienceDetails&stamp=1790520545384",
      label: "Peddi on Roblox",
    },
    media: [
      {
        type: "image",
        src: "/work/peddi/cover.jpg",
        alt: "Peddi on Roblox: the hero with a cricket bat before a lit ferris wheel",
      },
      {
        type: "image",
        src: "/work/peddi/cricket.jpg",
        alt: "The cricket pitch beside the fairground at sunset",
      },
      {
        type: "image",
        src: "/work/peddi/view.jpg",
        alt: "Looking out over the world from a mountain",
      },
    ],
    caseStudy: {
      timeframe: "June 2026",
      client: { logo: "/logos/peddi-mark.webp", name: "Peddi" },
      headline:
        "A film's world you can walk around in, with the film hidden all through it",
      brief: [
        {
          label: "Team",
          value: "Me and Dworak",
          note: "Me and Dworak, in Roblox Studio",
          people: [
            { name: "Me", photo: "/work/peddi/avatar-thakur.jpg" },
            {
              name: "Dworak",
              photo: "/work/peddi/avatar-dworak.jpg",
              href: "https://www.instagram.com/dwrkk.k/",
            },
          ],
        },
        {
          label: "Product",
          value: "Peddi on Roblox",
          note: "A world to explore, for the Telugu film Peddi",
          logo: "/logos/peddi-mark.webp",
          href: "https://www.roblox.com/share?code=df349887342b94458e3f07628b53f639&type=ExperienceDetails&stamp=1790520545384",
        },
        {
          label: "Stage",
          value: "0 → 1, launched",
          note: "Live June 5, 2026, announced by the film's X account",
        },
        {
          label: "World",
          value: "Full of references",
          note: "Places and things from the film, to find",
        },
        {
          label: "Reach",
          value: "49.5K views",
          note: "On the launch post, with 3.3K likes",
        },
        {
          label: "Reviews",
          value: "On YouTube",
          note: "Telugu creators played it on their channels",
          href: "https://www.youtube.com/results?search_query=Peddi+roblox",
        },
      ],
      reel: [
        { type: "image", src: "/work/peddi/cover.jpg", alt: "Peddi on Roblox" },
        {
          type: "image",
          src: "/work/peddi/fair.jpg",
          alt: "The fairground at sunset",
        },
        {
          type: "image",
          src: "/work/peddi/night-pitch.jpg",
          alt: "The cricket pitch at night, by lantern light",
        },
        {
          type: "image",
          src: "/work/peddi/view.jpg",
          alt: "The world from a mountain top",
        },
        {
          type: "image",
          src: "/work/peddi/cave-inside.jpg",
          alt: "Inside a torch-lit cave",
        },
      ],
      sections: [
        {
          id: "brief",
          act: "The brief",
          label: "Brief",
          heading: "A film you can play",
          paragraphs: [
            "Peddi is a Telugu film, and like Rao Bahadur, it came to Spotmies as a promotion: something fans could spend time in before and around the release. This one was a game. Dworak and I built it in Roblox Studio, as a world to explore with the film all through it.",
          ],
          figures: [
            {
              type: "image",
              src: "/work/peddi/cover.jpg",
              alt: "Peddi on Roblox: the film's hero as a Roblox character, holding a cricket bat before a lit ferris wheel",
              caption: "Peddi on Roblox.",
            },
          ],
        },
        {
          id: "roblox",
          act: "The decision",
          label: "Why Roblox",
          heading: "Why Roblox",
          paragraphs: [
            "Peddi came the same way as Rao Bahadur: the film's team gave the contract to MutinyX, and MutinyX to Spotmies. The ask was a game, built fast. Dworak and I proposed Roblox: it comes with its own studio, it's quick to build in and easy for players to pick up, and its MCP let us connect AI tools to Roblox Studio to build faster.",
          ],
        },
        {
          id: "references",
          act: "The world",
          label: "References",
          heading: "The film, all through it",
          paragraphs: [
            "The world is built from the film. Its fairground and ferris wheel, the cricket bat and pitch, and many smaller details all refer to things in Peddi, so fans who know the film keep recognising it as they explore.",
          ],
          layout: "pair",
          figures: [
            {
              type: "image",
              src: "/work/peddi/cricket.jpg",
              alt: "A player walking up to the pitch, a Play Cricket! sign over it, the fair behind",
              caption:
                "A pitch beside the fair, and a game of cricket to play.",
            },
            {
              type: "image",
              src: "/work/peddi/night-pitch.jpg",
              alt: "The pitch at night, a player holding a glowing lantern",
              caption: "The same ground at night, by lantern light.",
            },
          ],
        },
        {
          id: "places",
          label: "Places",
          heading: "A whole world around it",
          paragraphs: [
            "Around the fair is a world to wander: rivers to swim, a log cabin, giant trees along a railway, caves lit by torches, and mountains with snow on top. I built the environment around the game's core mechanics, so there's always somewhere new to go.",
          ],
          layout: "grid",
          figures: [
            {
              type: "image",
              src: "/work/peddi/overlook.jpg",
              alt: "A player on a rock looking over the fair, the hills and the town",
              caption: "The fair, the hills and the town from a rock.",
            },
            {
              type: "image",
              src: "/work/peddi/river.jpg",
              alt: "A player swimming in a sunlit river between hills",
              caption: "Rivers to swim.",
            },
            {
              type: "image",
              src: "/work/peddi/underwater.jpg",
              alt: "Looking up at a swimmer from under the water, rocks below",
              caption: "And to dive under.",
            },
            {
              type: "image",
              src: "/work/peddi/cabin.jpg",
              alt: "Inside a log cabin with a stone fireplace, bunk beds and a rocking chair",
              caption: "A log cabin to step inside.",
            },
            {
              type: "image",
              src: "/work/peddi/trees.jpg",
              alt: "Giant tree trunks on a grassy field, a railway and houses behind",
              caption: "Giant trees along the railway.",
            },
            {
              type: "image",
              src: "/work/peddi/cave.jpg",
              alt: "A torch-lit cave mouth in a dark hillside",
              caption: "Caves, lit by torches.",
            },
          ],
        },
        {
          id: "finds",
          label: "Finds",
          heading: "Things to find",
          paragraphs: [
            "The world rewards wandering. A grand piano waits on a hilltop, a chest sits at the top of the snowiest peak, and after dark a lantern lights the way, with fireflies in the grass.",
          ],
          layout: "grid",
          figures: [
            {
              type: "image",
              src: "/work/peddi/piano-town.jpg",
              alt: "A player at a grand piano on a hill, the town and ferris wheel below",
              caption: "A piano on the hill above town.",
            },
            {
              type: "image",
              src: "/work/peddi/summit.jpg",
              alt: "A player climbing a snowy peak towards a chest at the top",
              caption: "A chest at the summit.",
            },
            {
              type: "image",
              src: "/work/peddi/view.jpg",
              alt: "A player on a mountain top, the world spread out below",
              caption: "And the view from up there.",
            },
            {
              type: "image",
              src: "/work/peddi/fireflies.jpg",
              alt: "A player with a lantern in the grass at dusk, fireflies around",
              caption: "A lantern, and fireflies, after dark.",
            },
          ],
        },
        {
          id: "making",
          act: "The build",
          label: "Making it",
          heading: "Two of us in Roblox Studio",
          paragraphs: [
            "I built the world: how it looks, and the small details that refer to Peddi's world and to Ram Charan's character, for whom I tried several character designs, with custom clothes from the film. The mini cricket pitch and its game logic are mine too. Dworak helped build the world early on and started a mini wrestling pitch, which the client cut when the timeline ran short.",
            "These were taken on launch day, still at it after the film's team had shared it.",
          ],
          layout: "pair",
          figures: [
            {
              type: "image",
              src: "/work/peddi/studio.jpg",
              alt: "Over the shoulder: working on the world in Roblox Studio on a laptop, palm trees and a fence on screen",
              caption: "The world in Roblox Studio.",
            },
            {
              type: "image",
              src: "/work/peddi/team.jpg",
              alt: "Dworak and me at our desks at Spotmies, working on Peddi",
              caption: "Dworak and me, on launch day.",
            },
          ],
        },
        {
          id: "launch",
          act: "What happened",
          label: "Launch",
          heading: "Launched by the film",
          paragraphs: [
            "The film's official X account launched the world on June 5, 2026: “Enter the world of #PEDDI now on Roblox.” The launch post did this:",
          ],
          stats: [
            { value: "49.5K", label: "views" },
            { value: "3.3K", label: "likes" },
            { value: "684", label: "reposts" },
          ],
          layout: "pair",
          // Framed on black, so it fills the monitor's 4:3 screen.
          screen: [
            {
              type: "image",
              src: "/work/peddi/x-post-screen.jpg",
              alt: "@PeddiMovieOffl: Enter the world of #PEDDI now on Roblox",
            },
          ],
          figures: [
            {
              type: "image",
              src: "/work/peddi/x-post.jpg",
              alt: "@PeddiMovieOffl: Enter the world of #PEDDI now on Roblox. Experience it now, with the Peddi on Roblox key art",
              caption: "June 5 · 49.5K views",
            },
          ],
        },
        {
          id: "played",
          label: "Played",
          heading: "Played on YouTube",
          paragraphs: [
            "Many Telugu YouTubers played the world on their channels and gave their take on it, which put the film in front of their audiences in a way a poster can't. These two had the most views and likes.",
          ],
          layout: "pair",
          figures: [
            {
              type: "youtube",
              id: "kCuq6TKrxCQ",
              src: "/work/peddi/yt-sudhapusa.jpg",
              alt: "Sudhapusa: PEDDI | ROBLOX GAMEPLAY",
              caption: "Sudhapusa plays Peddi on Roblox.",
            },
            {
              type: "youtube",
              id: "4Py5Y00FsAk",
              src: "/work/peddi/yt-aura.jpg",
              alt: "Aura Entertainer: PEDDI on Roblox",
              caption: "Aura Entertainer plays Peddi on Roblox.",
            },
          ],
        },
        {
          id: "reflection",
          label: "Reflection",
          heading: "A new tool, and a fixed launch date",
          paragraphs: [
            "I'd never used Roblox before this. Building in it to a launch date the film had already set improved my 3D design skills fast, and taught me how to split a world between two people.",
          ],
          points: [
            "What I learned: picking the tool is a design decision too; Roblox Studio is what made the launch date possible",
            "What I'd change: scope to the timeline from day one, so nothing like the wrestling pitch is started only to be cut",
          ],
        },
      ],
    },
    disk: "#a08670",
    ink: "#1a1a1a",
  },
  {
    id: "tmn",
    disciplines: ["design"],
    title: "TMN · Satara Today",
    kind: "News app + website, in two languages",
    role: "UI/UX design",
    context: "Spotmies",
    summary:
      "The app and website for TMN, Today Media Network, and Satara Today, its Marathi sister in Satara: one minimal design that holds English and Marathi alike, with articles readers can react to, vote on and write themselves. Designed in Figma, and built by the Spotmies development team.",
    blurb:
      "One minimal news app and website for TMN and Satara Today, in English and in Marathi.",
    highlights: [
      "One design for both brands, in English and in Marathi",
      "Articles with reactions, instant polls and comments",
      "Readers can write and publish their own articles",
    ],
    stack: ["Figma", "Prototyping", "Micro-interactions"],
    // Add the link once the website launches on its own domain.
    media: [
      {
        type: "video",
        src: "/work/tmn-satara/site-tmn.mp4",
        poster: "/work/tmn-satara/site-tmn.jpg",
        alt: "The TMN News website",
      },
      {
        type: "video",
        src: "/work/tmn-satara/app-article.mp4",
        poster: "/work/tmn-satara/app-article.jpg",
        alt: "The TMN and Satara Today apps side by side",
      },
    ],
    caseStudy: {
      timeframe: "May 2026",
      client: [
        { logo: "/logos/tmn-mark.webp", name: "TMN, Today Media Network" },
        {
          logo: "/logos/satara-today-mark.webp",
          name: "Satara Today",
          height: 48,
        },
      ],
      headline: "A news app in two languages, made for readers who talk back",
      brief: [
        {
          label: "Role",
          value: "UI/UX design",
          note: "Every screen and prototype, app and website",
        },
        {
          label: "Team",
          value: "Just me",
          note: "Briefed by the client through our project manager",
        },
        {
          label: "Timeline",
          value: "3 days + 1 week",
          note: "A first draft, then the final design",
        },
        {
          label: "Problem",
          value: "A dated website",
          note: "Mixed fonts and colours, and no motion",
        },
        {
          label: "Languages",
          value: "English + Marathi",
          note: "One design for TMN and Satara Today",
          logo: "/logos/tmn-mark.webp",
        },
        {
          label: "Outcome",
          value: "In testing",
          note: "Being built by the Spotmies developers",
        },
      ],
      reel: [
        {
          type: "video",
          src: "/work/tmn-satara/site-tmn.mp4",
          poster: "/work/tmn-satara/site-tmn.jpg",
          alt: "The TMN News website",
        },
        {
          type: "video",
          src: "/work/tmn-satara/app-article.mp4",
          poster: "/work/tmn-satara/app-article.jpg",
          alt: "An article in the TMN and Satara Today apps",
        },
        {
          type: "video",
          src: "/work/tmn-satara/site-satara.mp4",
          poster: "/work/tmn-satara/site-satara.jpg",
          alt: "The Satara Today website, in Marathi",
        },
      ],
      sections: [
        {
          id: "brief",
          act: "The problem",
          label: "Brief",
          heading: "Two newsrooms, one dated website",
          paragraphs: [
            "TMN, Today Media Network, is an English news platform, and Satara Today, the voice of Satara, brings the same kind of news to readers there in Marathi. Both are for everyone, but tuned for Gen Z.",
            "They had a website, but its fonts and colours didn't match from page to page, and nothing on it moved. The client wanted a news app that felt Gen Z and modern, like Inshorts, not another generic news app, and a website to go with it.",
          ],
        },
        {
          id: "constraints",
          label: "Constraints",
          heading: "The limits I worked inside",
          paragraphs: ["Every choice below had to fit these:"],
          points: [
            "A one-line brief, passed on by our project manager: a Gen Z news app like Inshorts, with a scrollable home feed, a community, a profile, and readers posting their own articles with images",
            "Three days for the first draft, with no logo or brand colours yet",
            "One design for two brands and two scripts, English and Marathi",
            "Phones and desktop: the app and the website",
          ],
        },
        {
          id: "ownership",
          label: "My part",
          heading: "What I owned, and what I didn't",
          paragraphs: ["I was the only designer, and design was my whole part:"],
          points: [
            "Mine: every screen and prototype in Figma, for both drafts, the app and the website",
            "The client's: the brief, the brand, and the final say on each draft",
            "Our project manager's: passing on the brief, and feedback on the final design",
            "The Spotmies developers': building the app and the website",
          ],
        },
        {
          id: "first-draft",
          act: "The decisions",
          label: "First draft",
          heading: "From Inshorts to Instagram",
          paragraphs: [
            "The client asked for an app like Inshorts, in white, black and red, which was already how The Newspaper looked, a news app I'd designed on my own the month before. So I built the first draft on it in three days, about 80% of it from The Newspaper, with a scroll that worked exactly like Inshorts'.",
            "The client half liked it: it did what Inshorts did, but it didn't feel Gen Z. For the final version I looked at where Gen Z already spends its time, Instagram, and built the home feed on its scroll. This time I asked for the logos and brand colours first, reused most of what I'd already designed, including The Newspaper's community feed, and finished in a week.",
          ],
          lead: {
            type: "diagram",
            diagram: "feed-styles",
            alt: "Animated diagram: the first draft's home scrolled like Inshorts, one story filling the screen and snapping to the next; the final home scrolls like Instagram, a feed of stories with likes and comments, one liked as it goes by",
            caption: "The home feed, first drafted like Inshorts, then like Instagram.",
          },
          layout: "pair",
          figures: [
            {
              type: "image",
              src: "/work/the-newspaper/boards/feed.jpg",
              alt: "The Newspaper, the first draft's starting point: its front page, an article and search, in white, black and red",
              caption: "The first draft started from The Newspaper.",
              label: "First draft",
            },
            {
              type: "image",
              src: "/work/tmn-satara/app-tour.jpg",
              alt: "The final design: the TMN app in English beside the Satara Today app in Marathi",
              caption: "The final design, with each brand's own masthead and colours.",
              label: "Final",
            },
          ],
        },
        {
          id: "languages",
          label: "Two scripts",
          heading: "One layout for both scripts",
          paragraphs: [
            "Marathi headlines run longer and sit taller than English ones, so every card, headline and tab had to hold both. Rather than a layout for each, the two apps share one: cards grow to fit a longer headline, and only the words and the masthead change.",
          ],
          lead: {
            type: "diagram",
            diagram: "two-scripts",
            alt: "Animated diagram: the same top story in English, with a two-line headline, and in Marathi, where the headline runs to three lines and the card grows to hold it in the same layout",
            caption: "One story in English and in Marathi, in the same layout.",
          },
          figures: [
            {
              type: "video",
              src: "/work/tmn-satara/app-tour.mp4",
              poster: "/work/tmn-satara/app-tour.jpg",
              alt: "The TMN app in English beside the Satara Today app in Marathi: the home feed, search, people, the profile and the dark theme",
              caption:
                "The TMN app, left, and the Satara Today app, right, prototyped in Figma.",
            },
          ],
        },
        {
          id: "article",
          label: "Articles",
          heading: "An article you can answer",
          paragraphs: [
            "For a Gen Z reader, a story is something to react to, not only read. So an article carries more than the story: a pull quote, a quick reaction in their own words (lit, woke, cap, ded or vibe), an instant poll that shows its results, and comments that open from the bottom, with a box for your hot take.",
          ],
          figures: [
            {
              type: "video",
              src: "/work/tmn-satara/app-article.mp4",
              poster: "/work/tmn-satara/app-article.jpg",
              alt: "Opening an article in both apps: the story, a pull quote, reactions, an instant poll and the comments",
              caption:
                "An article in both apps, from the feed to the comments.",
            },
          ],
        },
        {
          id: "writing",
          label: "Writing",
          heading: "Readers write too",
          paragraphs: [
            "The client wanted readers to post their own articles, so anyone can write. A new article takes a title, tags, the text with its formatting, and images or video, then publishes from the top. Your articles sit on your profile, with your followers, badges like News Hound and Comment Guru, and settings like the dark theme and offline mode.",
          ],
          figures: [
            {
              type: "video",
              src: "/work/tmn-satara/app-write.mp4",
              poster: "/work/tmn-satara/app-write.jpg",
              alt: "Writing a new article in both apps: title, tags, the text and images, then your articles",
              caption: "Writing and publishing an article.",
            },
          ],
        },
        {
          id: "design-language",
          act: "The final design",
          label: "Design language",
          heading: "Three colours, two typefaces, one shape",
          paragraphs: [
            "The client asked for white, black and red, so each got one job. Red is the news: breaking stories, the Trending tag and whatever you've selected, so it always points at something. Black is the ink, and white the page. Headlines are set in Epilogue and everything else in Inter, and every chip, tag and button is fully round.",
          ],
          lead: {
            type: "diagram",
            diagram: "tmn-system",
            alt: "TMN's design language: red #DB0D14 for the news, black #1A1C1C for the ink and white #FFFFFF for the page; Epilogue for headlines and Inter for everything else, with Marathi in the same layout; and one fully round shape for chips, tags and buttons",
            caption: "The colours, type and shape behind the design.",
          },
        },
        {
          id: "website",
          label: "Website",
          heading: "A briefing, not a feed",
          paragraphs: [
            "The app opens on a feed and the website on a briefing, the client's call: Gen Z reads on phones, where a feed fits, while the website is more for a proper catch-up. It opens on your briefing: the date and the local weather, the top stories in a carousel with the most recent beside them, then local stories, sport and your topics. Every category sits in one row under the search, and the fonts, colours and motion are consistent from page to page, which the old website never was.",
          ],
          layout: "carousel",
          figures: [
            {
              type: "video",
              src: "/work/tmn-satara/site-tmn.mp4",
              poster: "/work/tmn-satara/site-tmn.jpg",
              alt: "Scrolling through the TMN News website in Figma: the briefing, an article, the profile and writing a new article",
              caption: "The TMN News website, in English.",
              label: "TMN",
            },
            {
              type: "video",
              src: "/work/tmn-satara/site-satara.mp4",
              poster: "/work/tmn-satara/site-satara.jpg",
              alt: "Scrolling through the Satara Today website in Figma, in Marathi",
              caption: "The Satara Today website, in Marathi.",
              label: "Satara Today",
            },
          ],
        },
        {
          id: "status",
          act: "What happened",
          label: "Outcome",
          heading: "Approved, and being built",
          paragraphs: [
            "The client approved the final design, and the Spotmies developers are building the app and the website, both now in testing. No readers are on them yet, so there are no numbers to share.",
          ],
        },
        {
          id: "reflection",
          label: "Reflection",
          heading: "The brief isn't always the answer",
          paragraphs: [
            "I designed the first draft carefully, and made it work just like Inshorts, as the client asked, and they still didn't like it: it didn't feel Gen Z. When I took Instagram as the reference instead, reusing most of what I'd already built, they did.",
          ],
          points: [
            "What I learned: the client isn't always right about what they need, so I ask until the requirements are clear before designing anything",
            "What I'd change: ask for the brand, and what Gen Z means to the client, before the first draft",
            "What I'd do next: once it's live, watch how many readers react, vote or write, since that's what makes it Gen Z",
          ],
        },
      ],
    },
    disk: "#d64541",
    ink: "#fff8f3",
  },
  {
    id: "the-newspaper",
    disciplines: ["design"],
    title: "The Newspaper",
    kind: "Online news app",
    role: "Solo: design",
    context: "Project",
    summary:
      "The Newspaper, an online news app I designed on my own in Figma as a draft: the day's front page with breaking news and top stories, articles to read, the print papers to explore by date, a profile where readers publish their own posts, and every screen in light and dark. The month after, it became the first draft of TMN · Satara Today.",
    blurb:
      "A news app I drafted on my own, in light and dark, which became TMN · Satara Today's first draft.",
    highlights: [
      "A front page with the date, the city, breaking news and top stories",
      "The print papers to explore, and a calendar for another day's",
      "Readers publish their own posts, with an image or video",
      "Every screen in light and dark",
    ],
    stack: ["Figma", "Prototyping", "Light + dark themes"],
    media: [
      {
        type: "video",
        src: "/work/the-newspaper/boards/flow-read.mp4",
        poster: "/work/the-newspaper/boards/flow-read.jpg",
        alt: "The Newspaper's home feed and an article, prototyped in Figma",
      },
      {
        type: "image",
        src: "/work/the-newspaper/boards/feed.jpg",
        alt: "The Newspaper: the home feed, an article and search",
      },
      {
        type: "image",
        src: "/work/the-newspaper/boards/dark.jpg",
        alt: "The Newspaper in the dark theme",
      },
    ],
    caseStudy: {
      timeframe: "April 2026",
      headline:
        "A newspaper for your phone, drafted on my own, that fed a real one",
      brief: [
        {
          label: "Role",
          value: "Solo design",
          note: "Every screen, in Figma",
        },
        {
          label: "Product",
          value: "The Newspaper",
          note: "An online news app",
        },
        {
          label: "Stage",
          value: "Concept",
          note: "Designed and prototyped, not built",
        },
        {
          label: "Screens",
          value: "10, twice",
          note: "Each one in light and dark",
        },
        {
          label: "Designed",
          value: "April 2026",
          note: "On my own, as a draft",
        },
        {
          label: "Led to",
          value: "TMN · Satara Today",
          note: "It became that app's first draft",
        },
      ],
      reel: [
        {
          type: "video",
          src: "/work/the-newspaper/boards/flow-read.mp4",
          poster: "/work/the-newspaper/boards/flow-read.jpg",
          alt: "The home feed and an article",
        },
        {
          type: "image",
          src: "/work/the-newspaper/boards/feed.jpg",
          alt: "The home feed, an article and search",
        },
        {
          type: "image",
          src: "/work/the-newspaper/boards/papers.jpg",
          alt: "The print papers, the calendar and saved stories",
        },
        {
          type: "image",
          src: "/work/the-newspaper/boards/you.jpg",
          alt: "The profile, your interests and your posts",
        },
        {
          type: "image",
          src: "/work/the-newspaper/boards/dark.jpg",
          alt: "The dark theme",
        },
      ],
      sections: [
        {
          id: "brief",
          act: "The brief",
          label: "Brief",
          heading: "A newspaper, as an app",
          paragraphs: [
            "The Newspaper is an online news app I designed on my own in April 2026, as practice, a task I set myself: ten screens in Figma, each in light and dark, prototyped so it could be tapped through. It started as mine alone, and it didn't stay that way: the month after, it became the first draft of TMN · Satara Today.",
          ],
        },
        {
          id: "front-page",
          act: "The design",
          label: "Front page",
          heading: "The front page, on a phone",
          paragraphs: [
            "It opens like a paper: the masthead in a red serif, then the date and the city under it, Visakhapatnam here. Breaking news runs as a carousel of photos under the fold line, with the top stories listed below, each with its source, how long ago it went up and who wrote it.",
            "An article keeps the paper's feel too: a large photo, a serif headline in the masthead's red, and the text set in full. Search starts from what's trending: topics to tap, and the hashtags people are following.",
          ],
          layout: "carousel",
          figures: [
            {
              type: "video",
              src: "/work/the-newspaper/boards/flow-read.mp4",
              poster: "/work/the-newspaper/boards/flow-read.jpg",
              alt: "The prototype from the home feed: the breaking news carousel, the top stories, then reading articles",
              caption:
                "From the front page into the articles, prototyped in Figma.",
              label: "Flow",
            },
            {
              type: "image",
              src: "/work/the-newspaper/boards/feed.jpg",
              alt: "The home feed with breaking news and top stories, an article, and search with trending topics and hashtags",
              caption: "The front page, an article, and search.",
              label: "Screens",
            },
          ],
        },
        {
          id: "papers",
          label: "The papers",
          heading: "The print papers, too",
          paragraphs: [
            "Beside the app's own stories sit the papers people already read, like The Hindu, The Times of India and Hindustan Times, to explore as their front pages. A calendar lets you go back to another day's, and stories you save wait for you in one list.",
          ],
          layout: "carousel",
          figures: [
            {
              type: "video",
              src: "/work/the-newspaper/boards/flow-papers.mp4",
              poster: "/work/the-newspaper/boards/flow-papers.jpg",
              alt: "The prototype: search, the newspapers you could explore, and the calendar",
              caption: "Search, the papers and the calendar, prototyped.",
              label: "Flow",
            },
            {
              type: "image",
              src: "/work/the-newspaper/boards/papers.jpg",
              alt: "Newspapers you could explore, the calendar open over them, and your saved stories",
              caption:
                "The papers to explore, the calendar, and your saved stories.",
              label: "Screens",
            },
          ],
        },
        {
          id: "publish",
          label: "Publishing",
          heading: "Readers publish too",
          paragraphs: [
            "Your profile keeps count of what you've saved, what you've published and who you follow, and holds your settings: your interests, your posts, the dark theme and feedback. Your interests are topics you add or take away, from India and Visakhapatnam to technology and sport.",
            "A new post takes an image or video, a headline and up to 500 characters, then publishes from the bottom of the screen.",
          ],
          layout: "carousel",
          figures: [
            {
              type: "video",
              src: "/work/the-newspaper/boards/flow-you.mp4",
              poster: "/work/the-newspaper/boards/flow-you.jpg",
              alt: "The prototype: the profile with its counts, saved stories and settings",
              caption: "The profile and your saved stories, prototyped.",
              label: "Flow",
            },
            {
              type: "image",
              src: "/work/the-newspaper/boards/you.jpg",
              alt: "The profile, managing your interests, and your published posts",
              caption: "The profile, your interests, and your posts.",
              label: "Screens",
            },
          ],
        },
        {
          id: "dark",
          label: "Dark",
          heading: "Light and dark",
          paragraphs: [
            "Every screen has a dark twin. The paper goes black, the text goes light, and the masthead keeps its red, so it still reads as the same paper at night.",
          ],
          figures: [
            {
              type: "image",
              src: "/work/the-newspaper/boards/dark.jpg",
              alt: "The home feed, the newspapers to explore and a new post, in the dark theme",
              caption:
                "The front page, the papers and a new post, in the dark.",
            },
          ],
        },
        {
          id: "outcome",
          act: "What happened",
          label: "Outcome",
          heading: "Into TMN · Satara Today",
          paragraphs: [
            "The Newspaper was never built as itself. The next month, TMN's client asked for a news app in white, black and red, so I built the first draft of TMN · Satara Today on it, about 80% of it from here. The client wanted something more Gen Z, and the final design moved on, but it kept this draft's community feed. The Spotmies developers are building it now.",
          ],
        },
        {
          id: "reflection",
          label: "Reflection",
          heading: "Practice that paid off",
          paragraphs: [
            "Designing with no brief and no client gave me a head start when a real one arrived: most of TMN's first draft came from here. TMN then taught me the other half: a draft made for yourself still has to be reshaped for the client's brand and audience.",
          ],
        },
      ],
    },
    disk: "#ebe3d1",
    ink: "#b3261e",
  },
  {
    id: "samudragupt",
    disciplines: ["design", "development", "3d"],
    title: "SamudraGupt-Q",
    kind: "Cyber-physical security prototype",
    role: "Solo: research, design + build",
    context: "Project",
    summary:
      "A working simulation of how a swarm of underwater drones could keep its links safe from future quantum computers, and notice when one of its drones is captured. Phones stand in for the drones; a live 3D dashboard shows the swarm.",
    blurb:
      "A simulation of an underwater drone swarm that stays safe from quantum attacks and spots a captured drone.",
    highlights: [
      "Phones stream real motion data as drone nodes; shaking one plays a physical capture",
      "Quantum key bits, encrypted fleet averages and an AI agent that isolates hostile nodes",
      "An attacker console for breaking the system on purpose, live",
    ],
    stack: [
      "Three.js",
      "Node.js",
      "Socket.IO",
      "Python",
      "Flask",
      "Qiskit",
      "TenSEAL",
      "Stable Baselines3",
    ],
    // Stills from the final-year presentation; no screen recording exists yet.
    media: [
      {
        type: "image",
        src: "/work/samudragupt/swarm.jpg",
        alt: "The command dashboard: three drone nodes linked on the seabed, a submarine nearby",
      },
      {
        type: "image",
        src: "/work/samudragupt/sonar-threat.jpg",
        alt: "The dashboard flagging a hostile submarine picked up by one node's sonar",
      },
      {
        type: "image",
        src: "/work/samudragupt/kinetic-strike.jpg",
        alt: "A struck drone marked as hacked, with a MAYDAY alert asking to cut it off",
      },
    ],
    caseStudy: {
      timeframe: "Final-year B.Tech project, 2025–26",
      brief: [
        {
          label: "Role",
          value: "Solo build",
          note: "Research, design and every part of the code",
        },
        {
          label: "Team",
          value: "Pitched as four",
          note: "Three teammates joined the pitch to the judges",
        },
        {
          label: "Stage",
          value: "Working simulation",
          note: "Phones as drones, a live 3D dashboard",
        },
        {
          label: "Outcome",
          value: "Demo + paper",
          note: "Presented, and written up",
        },
        {
          label: "Talk",
          value: "GITAM Quantumisers",
          note: "Presented to the club, so members could see how it's built",
          href: "https://lnkd.in/p/dm_zxSaB",
        },
      ],
      sections: [
        {
          id: "overview",
          label: "Overview",
          heading: "What it is",
          paragraphs: [
            "SamudraGupt-Q is my final-year project, and I built all of it on my own: the research, the design and every part of the code. My three teammates, there for the course's requirements, helped me pitch it to the judges. It's a working simulation of a security system for swarms of autonomous underwater drones.",
            "Phones stand in for the drones and stream their real motion sensors. A 3D command dashboard shows the swarm live, and a separate attacker console lets me break things on purpose and watch how the system responds.",
          ],
          layout: "pair",
          figures: [
            {
              type: "image",
              src: "/work/samudragupt/swarm.jpg",
              alt: "The command dashboard: fleet status, the quantum layer's Bell value and key bits, three linked drone nodes and the encrypted telemetry bar",
              caption: "The command dashboard, with a three-drone swarm.",
            },
            {
              type: "image",
              src: "/work/samudragupt/architecture.jpg",
              alt: "System architecture: phones as drone nodes, a cloud aggregator, the command centre and the quantum layer",
            },
          ],
        },
        {
          id: "problem",
          label: "Problem",
          heading: "Two ways a swarm gets beaten",
          paragraphs: [
            "Drone swarms talk over encryption like RSA and elliptic curves, which a large enough quantum computer will break. Anyone can record that traffic today and decrypt it later, once the hardware exists.",
            "The second problem is physical. If one drone is caught in a net, its keys are still valid, so the swarm keeps trusting it while it feeds in false sonar or positions.",
          ],
          points: [
            "Keep the links safe from quantum attacks, not just today's",
            "Notice a captured drone from how it moves, not only from its keys",
            "Let the fleet share numbers without one server seeing every drone's data",
          ],
          figures: [
            {
              type: "card",
              title: "Store now, decrypt later",
              note: "Illustration coming soon",
            },
          ],
        },
        {
          id: "how",
          label: "How it works",
          heading: "How it works",
          paragraphs: [
            "Each phone sends its tilt, thrust and g-force ten times a second to a Node.js relay, which passes every packet to a Python backend. The backend runs four checks before anything reaches the dashboard.",
          ],
          points: [
            "Quantum layer: Qiskit simulates entangled Bell pairs and turns them into key bits (the E91 idea)",
            "Signatures: every packet is signed, so a node can't pretend to be another",
            "Privacy: TenSEAL averages the fleet's depth readings while they're still encrypted (CKKS)",
            "AI agent: a PPO agent reads link quality, latency and g-force, and chooses to carry on, rotate keys or cut the node off",
          ],
          lead: {
            type: "diagram",
            diagram: "packet-flow",
            alt: "Animation: packets travel from the phones through the relay and the four checks to the dashboard; a packet with a stripped key is blocked at the key check, a rogue node at the signature check, and a shaken drone is cut off by the AI agent",
            caption:
              "Every packet, every check: until one is stopped at the check that catches it.",
          },
          // The diagram can't play on the monitor, so its channel shows the drawings.
          screen: [
            {
              type: "image",
              src: "/work/samudragupt/architecture.jpg",
              alt: "System architecture diagram",
            },
            {
              type: "image",
              src: "/work/samudragupt/sequence.jpg",
              alt: "Sequence diagram: key exchange, encrypted telemetry and the AI agent's decision",
            },
          ],
          layout: "pair",
          figures: [
            {
              type: "image",
              src: "/work/samudragupt/architecture.jpg",
              alt: "System architecture diagram",
            },
            {
              type: "image",
              src: "/work/samudragupt/sequence.jpg",
              alt: "Sequence diagram: key exchange, encrypted telemetry and the AI agent's decision",
            },
          ],
        },
        {
          id: "quantum",
          label: "Quantum key",
          heading: "Keys from entangled pairs",
          paragraphs: [
            "The key exchange follows the E91 idea. Qiskit simulates a two-qubit circuit: an H gate puts the first qubit in both states at once, and a CNOT ties the second to it. Measured, the pair always agrees, 00 or 11, never 01 or 10.",
            "I run it 512 times, turn each agreeing pair into a bit (00 → 0, 11 → 1), shuffle the bits and keep the first 64 as the key. Switch the H gate off and you can see why it's there: every result is 00, and the key is all zeros.",
            "It's a simulation, not photons in water, and the Bell value on the dashboard is generated rather than measured from these shots (more under Limits).",
          ],
          lead: {
            type: "diagram",
            diagram: "bell-pair",
            alt: "Interactive circuit: two qubits pass an H gate and a CNOT, are measured as 00 or 11, and each result adds a bit to the key; the H gate can be switched off, and all 512 shots run at once",
            caption:
              "The circuit from quantum_layer.py. Run it a shot at a time, or all 512.",
          },
        },
        {
          id: "privacy",
          label: "Privacy",
          heading: "Averaging what no one can read",
          paragraphs: [
            "The fleet needs an average depth, but no single server should see every drone's readings. With CKKS encryption, through TenSEAL, each drone encrypts its depth before it's sent. The cloud adds the three ciphertexts and multiplies the sum by ⅓ without decrypting anything, and only the naval command centre can decrypt the result.",
            "Drag a drone's depth and its ciphertext turns into entirely different noise, while the decrypted average still comes out right. The outlier filter is the exception: it decrypts the readings, which I come back to under Limits.",
          ],
          lead: {
            type: "diagram",
            diagram: "fleet-average",
            alt: "Interactive diagram: three drones encrypt their depths, an untrusted cloud adds the ciphertexts blind, and the naval command centre decrypts only the fleet average; each drone's depth has a slider",
            caption:
              "498.5, 502.1 and 499.8 m in; 500.13 m out, and nothing in between is readable.",
          },
        },
        {
          id: "decisions",
          label: "Decisions",
          heading: "Decisions I'm glad I made",
          paragraphs: [
            "Using phones as the drones gave me real, messy sensor data for free. Shaking a phone hard is a believable stand-in for a drone being grabbed, and it made every test physical instead of a line in a dataset.",
            "I gave the agent three choices instead of a yes-or-no alarm. Rotating keys is a middle step, so a noisy reading doesn't split the swarm the way cutting a node off would.",
            "I built the attacker as its own console. Spoofing a node, stripping its key or striking it all happen live, against the running system.",
          ],
          layout: "row",
          figures: [
            {
              type: "image",
              src: "/work/samudragupt/threat-flow.jpg",
              alt: "Flowchart of the threat response, from the quantum check to Protocol Omega",
            },
            {
              type: "image",
              src: "/work/samudragupt/drone-console.jpg",
              alt: "The drone console on a phone: callsign, thrust slider, pitch and roll, a kinetic strike button and sonar contacts",
              caption: "A phone as a drone.",
            },
            {
              type: "image",
              src: "/work/samudragupt/attacker-console.jpg",
              alt: "The attacker console on a phone, in red: spoofing a MAC address and a button to infiltrate the swarm",
              caption: "The attacker's console.",
            },
          ],
          // The phones are too tall for the 4:3 screen, so it shows what the attacker sets off.
          screen: [
            {
              type: "image",
              src: "/work/samudragupt/threat-flow.jpg",
              alt: "Flowchart of the threat response, from the quantum check to Protocol Omega",
            },
            {
              type: "image",
              src: "/work/samudragupt/rogue-node.jpg",
              alt: "An unknown node appearing in the swarm, with its traffic blocked",
            },
          ],
        },
        {
          id: "testing",
          label: "Testing",
          heading: "Breaking it on purpose",
          paragraphs: [
            "I tested the system with seven attack scenarios, run live from the attacker console against a swarm of phones.",
          ],
          points: [
            "Starting a single node's key exchange, then a three-node swarm",
            "A hostile sonar contact the agent has to flag without breaking the swarm",
            "A packet with its key stripped, and a rogue node with a spoofed MAC address",
            "A violent shake, which triggers Protocol Omega: the node is cut off and its keys wiped",
            "A drone reporting a false depth, which the fleet average has to ignore",
          ],
          layout: "carousel",
          figures: [
            {
              type: "image",
              src: "/work/samudragupt/single-node.jpg",
              alt: "One drone node online, its quantum channel up and no alerts",
              caption: "One node joins and its quantum channel comes up.",
              label: "One node",
            },
            {
              type: "image",
              src: "/work/samudragupt/sonar-threat.jpg",
              alt: "An external threat alert: a hostile submarine identified by one node, with its depth and range",
              caption:
                "A hostile submarine on sonar: flagged, and the swarm holds together.",
              label: "Sonar contact",
            },
            {
              type: "image",
              src: "/work/samudragupt/key-failure.jpg",
              alt: "A system breach alert: decryption failed for a node with a missing quantum key, which is marked as hacked",
              caption: "A packet with its key stripped: the node's traffic is blocked.",
              label: "Stripped key",
            },
            {
              type: "image",
              src: "/work/samudragupt/rogue-node.jpg",
              alt: "An unknown node among the swarm, marked in red, with its traffic blocked",
              caption: "A rogue node with a spoofed MAC address shows up as unknown.",
              label: "Rogue node",
            },
            {
              type: "image",
              src: "/work/samudragupt/kinetic-strike.jpg",
              alt: "A MAYDAY alert after a severe impact on one node, with buttons to cut it off or ignore",
              caption:
                "A violent shake reads as a strike, and the dashboard asks to cut the node off.",
              label: "Kinetic strike",
            },
          ],
        },
        {
          id: "limits",
          label: "Limits",
          heading: "What's real, and what isn't yet",
          paragraphs: [
            "It's a simulation, and some parts are still stand-ins. The Bell-test value the dashboard shows is generated rather than measured, the post-quantum Dilithium signatures are stubbed out after the library wouldn't install, and the step that filters outliers decrypts the readings, which undoes the privacy it's meant to keep. The agent also learns from synthetic data with a reward I wrote, so for now it mostly learns my own thresholds.",
            "Some limits are physical: water absorbs light within about a hundred metres, and no drone can hold entangled qubits steady yet.",
          ],
          points: [
            "Measure the Bell value from real measurement bases",
            "Get Dilithium running, and filter outliers without decrypting",
            "Train and evaluate the agent on recorded phone sessions with labelled attacks",
          ],
          figures: [
            { type: "card", title: "Next steps", note: "Diagram coming soon" },
          ],
        },
        {
          id: "outcome",
          act: "What happened",
          label: "Outcome",
          heading: "A demo, a paper and a club talk",
          paragraphs: [
            "I demonstrated it to the judges and wrote it up as a paper. GITAM's Quantumisers club liked it enough to have me present it to them, so their members could see how ideas like these are actually built.",
          ],
        },
      ],
    },
    // Built from nothing; no brief yet to say so.
    stage: "0 → 1",
    disk: "#23395b",
    ink: "#f5f1ea",
  },
  {
    id: "gesture",
    disciplines: ["design", "development", "3d"],
    title: "Gesture Shop · Aura",
    kind: "Touchless web interfaces",
    role: "Solo: design + build",
    context: "Project",
    summary:
      "Two experiments in using the web without touching anything: Gesture Shop, a store you browse and fill your cart in with your hand, and Aura, a music visualizer you play, skip and restyle with gestures. Both track your hand through the webcam with MediaPipe, in the browser.",
    blurb:
      "A shop and a music player you use with your hand, tracked through the webcam in the browser.",
    highlights: [
      "Pinch to select, close your hand to grab a product and drop it in the cart",
      "Play, skip and switch Aura's visual themes with your hand",
      "Visuals that react to the music, drawn in Three.js shaders",
    ],
    stack: ["MediaPipe", "Three.js", "GLSL", "Web Audio", "GSAP", "React"],
    link: { href: "https://gesture-shop.vercel.app/", label: "Gesture Shop" },
    alsoLink: { href: "https://aura-player-vert.vercel.app/", label: "Aura" },
    media: [
      {
        type: "video",
        src: "/work/guesture-shop/shop-hands.mp4",
        poster: "/work/guesture-shop/shop-hands.jpg",
        alt: "Gesture Shop: browsing and adding products to the cart by hand",
      },
      {
        type: "video",
        src: "/work/guesture-aura/aura.mp4",
        poster: "/work/guesture-aura/aura.jpg",
        alt: "Aura: changing the visuals by hand as a music video plays",
      },
    ],
    caseStudy: {
      // Confirm: when each was made.
      timeframe: "Hand-tracking experiments",
      headline:
        "Putting the mouse down: a shop and a music player you use with your hand",
      brief: [
        {
          label: "Role",
          value: "Solo, end to end",
          note: "Design and code, both projects",
        },
        {
          label: "Gesture Shop",
          value: "gesture-shop.vercel.app",
          note: "Pinch to select, grab to add to the cart",
          href: "https://gesture-shop.vercel.app/",
        },
        {
          label: "Aura",
          value: "aura-player-vert.vercel.app",
          note: "A music visualizer you play by hand",
          href: "https://aura-player-vert.vercel.app/",
        },
        {
          label: "Stage",
          value: "0 → 1, personal",
          note: "Both built and live on Vercel",
        },
        {
          label: "Tracking",
          value: "MediaPipe",
          note: "Hand landmarks from the webcam, in the browser",
        },
        {
          label: "Order",
          value: "Gesture Shop first",
          note: "My first experiment with MediaPipe",
        },
      ],
      reel: [
        {
          type: "video",
          src: "/work/guesture-shop/shop-hands.mp4",
          poster: "/work/guesture-shop/shop-hands.jpg",
          alt: "Gesture Shop, used by hand",
        },
        {
          type: "video",
          src: "/work/guesture-aura/aura.mp4",
          poster: "/work/guesture-aura/aura.jpg",
          alt: "Aura, played by hand",
        },
      ],
      sections: [
        {
          id: "idea",
          act: "The idea",
          label: "Idea",
          heading: "What if you didn't need a mouse?",
          paragraphs: [
            "These started as experiments with MediaPipe and the idea of the web as something you reach into. Both follow your hand through the webcam, right in the browser, and turn what it does into clicks, drags and scrolls.",
          ],
        },
        {
          id: "shop",
          act: "Gesture Shop",
          label: "Shop",
          heading: "A shop you use with your hand",
          paragraphs: [
            "Gesture Shop was the first thing I made with MediaPipe. A cursor follows your hand across the screen. Pinch to open, select or click; close your hand to grab a product, move it, and let go over the cart to add it. You can get around the whole store without touching the keyboard or the mouse.",
          ],
          layout: "pair",
          figures: [
            {
              type: "video",
              src: "/work/guesture-shop/shop-hands.mp4",
              poster: "/work/guesture-shop/shop-hands.jpg",
              alt: "Using Gesture Shop by hand in front of a laptop: pointing at products, grabbing them and dropping them in the cart",
              caption: "Browsing and filling the cart, hands off the laptop.",
            },
          ],
        },
        {
          id: "steady",
          label: "Steady",
          heading: "A cursor that doesn't shake",
          paragraphs: [
            "A hand in front of a webcam never sits still, and the raw positions jitter. I smoothed them before they reach the cursor, so it glides instead of trembling, and changed its look between hovering over a product and holding one, so you always know what your hand is doing. A toggle switches back to the mouse at any time.",
          ],
        },
        {
          id: "aura",
          act: "Aura",
          label: "Aura",
          heading: "A music player you conduct",
          paragraphs: [
            "Aura plays music and music videos, and your hand runs it: play and pause, skip tracks and change the look, with a mode switch for when you'd rather click. Its themes, including Nebula, Kaleidoscope, Cyber Glitch, Vortex and Liquid Gold, are drawn with Three.js and my own GLSL shaders.",
            "The visuals listen to the track. The Web Audio API reads its frequencies as it plays, and those numbers drive the shaders' scale, colour and speed, so the picture pulses with the music.",
          ],
          layout: "pair",
          figures: [
            {
              type: "video",
              src: "/work/guesture-aura/aura.mp4",
              poster: "/work/guesture-aura/aura.jpg",
              alt: "Aura on a laptop: the landing page, then music videos framed by shifting kaleidoscope visuals as a hand changes them",
              caption: "Changing Aura's themes by hand as the music plays.",
            },
          ],
        },
        {
          id: "smooth",
          label: "Smooth",
          heading: "Three heavy things at once",
          paragraphs: [
            "Tracking a hand, analysing the audio and running full-screen shaders all at once is a lot for a laptop. Drawing the effects into smaller buffers and keeping the shaders lean keeps it running smoothly.",
          ],
        },
      ],
    },
    disk: "#7a5cc7",
    ink: "#f5f1ea",
  },
  {
    id: "nova",
    disciplines: ["design"],
    title: "Nova UPI",
    kind: "UPI payments app",
    role: "Solo: design",
    context: "Project",
    summary:
      "The design for Nova, a UPI payments app, made in 48 hours as a challenge to myself: wireframes, a design system drawn from iOS 26's glass, then signing in, cards that arrive from your phone number, a home screen with your balance and quick sends, and paying by QR with a swipe. About fifty screens in Figma, prototyped end to end with Smart Animate so each screen morphs into the next.",
    blurb:
      "A UPI payments app designed in 48 hours: wireframes, a design system and fifty screens that morph.",
    highlights: [
      "Cards fetched from your phone number, added with a pull",
      "Scan a UPI QR, pick a card and swipe to pay",
      "Screens that morph into each other, prototyped with Figma's Smart Animate",
      "A full design system and prototype in 48 hours, a challenge I set myself",
      "The project that got me hired at Spotmies",
    ],
    stack: ["Figma", "Smart Animate", "Design system", "Prototyping"],
    media: [
      {
        type: "image",
        src: "/work/nova-upi/boards/mockup-card.jpg",
        alt: "Nova's opening screen on an iPhone, held beside a card",
      },
      {
        type: "video",
        src: "/work/nova-upi/boards/flow-home.mp4",
        poster: "/work/nova-upi/boards/flow-home.jpg",
        alt: "Nova's home screen, prototyped in Figma",
      },
      {
        type: "image",
        src: "/work/nova-upi/boards/home.jpg",
        alt: "Nova: home, quick send and stats",
      },
      {
        type: "image",
        src: "/work/nova-upi/boards/pay.jpg",
        alt: "Nova: scanning a QR, swiping to pay, and the payment done",
      },
    ],
    caseStudy: {
      timeframe: "48-hour sprint",
      headline: "Your money, upgraded: a calmer UPI app, designed in 48 hours",
      brief: [
        {
          label: "Role",
          value: "Solo design",
          note: "Research, wireframes, system and every screen",
        },
        {
          label: "Timeline",
          value: "48 hours",
          note: "A sprint I set myself",
        },
        {
          label: "Problem",
          value: "Cluttered UPI apps",
          note: "Ads first, the balance hidden, hard to read",
        },
        {
          label: "Stage",
          value: "Concept",
          note: "Prototyped end to end, not built",
        },
        {
          label: "Screens",
          value: "About 50",
          note: "With Smart Animate between them",
        },
        {
          label: "Outcome",
          value: "Got me hired",
          note: "The project Spotmies hired me on",
        },
      ],
      reel: [
        {
          type: "image",
          src: "/work/nova-upi/boards/mockup-card.jpg",
          alt: "Nova on an iPhone, beside a card",
        },
        {
          type: "video",
          src: "/work/nova-upi/boards/flow-home.mp4",
          poster: "/work/nova-upi/boards/flow-home.jpg",
          alt: "Nova's home screen",
        },
        {
          type: "image",
          src: "/work/nova-upi/boards/signin.jpg",
          alt: "Signing in",
        },
        {
          type: "image",
          src: "/work/nova-upi/boards/cards.jpg",
          alt: "Adding cards",
        },
        {
          type: "image",
          src: "/work/nova-upi/boards/pay.jpg",
          alt: "Paying by QR",
        },
      ],
      sections: [
        {
          id: "brief",
          act: "The problem",
          label: "Brief",
          heading: "Paying shouldn't start with an ad",
          paragraphs: [
            "Nova is a UPI payments app I designed in 48 hours, a sprint I set myself to try a new kind of product: finance. Before drawing anything, I went through the apps most people in India pay with, PhonePe, Google Pay and Paytm, and kept running into the same three problems:",
          ],
          points: [
            "Clutter: the home screen is crowded with ads and insurance offers",
            "Poor hierarchy: everyday tasks like checking your balance hide behind several taps",
            "Visual noise: colours that don't match, and low-contrast text that's hard to read outdoors",
          ],
        },
        {
          id: "constraints",
          label: "Constraints",
          heading: "The limits I worked inside",
          paragraphs: ["Every choice below had to fit these:"],
          points: [
            "48 hours, on my own, from research to a prototype you can click through",
            "A concept, not a build: some ideas would take real work with banks to ship",
            "UPI's own steps stay UPI's: entering your UPI PIN is handed over, not redrawn",
            "References from Pinterest, Dribbble and Behance, and iOS 26's glass for the look",
          ],
        },
        {
          id: "wireframes",
          act: "The groundwork",
          label: "Wireframes",
          heading: "The flow, in grey first",
          paragraphs: [
            "Before any colour, I laid the app out as low-fidelity wireframes, with the user flow drawn between them: from the landing page to home, then two ways to pay, by scanning a QR code or through quick send to a friend, both meeting at swipe to pay and the payment done.",
            "The very last step, entering your UPI PIN, belongs to UPI itself, so the design hands over to it there instead of redrawing it.",
          ],
          figures: [
            {
              type: "image",
              src: "/work/nova-upi/boards/wireframes.jpg",
              alt: "Low-fidelity wireframes with the user flow: landing page, home, paying by QR or by quick send, swipe to pay, and the payment done",
              caption: "The wireframes, and the two ways to pay.",
            },
          ],
        },
        {
          id: "home",
          act: "The decisions",
          label: "Home",
          heading: "Your balance first",
          paragraphs: [
            "The answer to clutter and hidden balances was to open on what's yours. Home puts your balance and your cards at the top, then the people you pay most for a quick send, and your latest transactions, with no ads or offers in the way. Stats shows your savings month by month.",
          ],
          lead: {
            type: "diagram",
            diagram: "nova-home",
            alt: "Animated diagram: a typical UPI app's home shows ads, offers and a grid of services first, and the balance only after tapping Check balance and entering the UPI PIN; Nova's home opens on the balance, the card and quick send",
            caption: "Home in a typical UPI app, and in Nova.",
          },
          layout: "carousel",
          figures: [
            {
              type: "video",
              src: "/work/nova-upi/boards/flow-home.mp4",
              poster: "/work/nova-upi/boards/flow-home.jpg",
              alt: "The home screen in the prototype: the cards, quick send, transactions and stats",
              caption: "Home, quick send, transactions and stats, prototyped.",
              label: "Flow",
            },
            {
              type: "image",
              src: "/work/nova-upi/boards/home.jpg",
              alt: "Home, the full quick send list, and stats",
              caption: "Home, everyone to quick send to, and stats.",
              label: "Screens",
            },
          ],
        },
        {
          id: "cards",
          label: "Cards",
          heading: "Your cards find you",
          paragraphs: [
            "UPI apps already look up your bank accounts from your phone number, but they still have you find your bank in a list and pick your account. Nova reimagines that: once your number is in, every card linked to it is fetched and appears one at a time, and you pull a card down to add it. A new card is typed straight onto the card itself, which flips over for the CVV.",
            "It's a concept: fetching every linked card at once would take real work with banks to build. But it cuts the steps between signing up and paying to almost none.",
          ],
          lead: {
            type: "diagram",
            diagram: "nova-cards",
            alt: "Animated diagram: a typical UPI app takes your number, then has you scroll a list to find your bank and pick your account; Nova fetches every card linked to the number and you pull one down to add it",
            caption: "Adding your money, in a typical UPI app and in Nova.",
          },
          layout: "carousel",
          figures: [
            {
              type: "video",
              src: "/work/nova-upi/boards/flow-cards.mp4",
              poster: "/work/nova-upi/boards/flow-cards.jpg",
              alt: "Adding cards in the prototype: connecting a bank account, the fetched cards pulled in one by one, then a new card typed and flipped for the CVV",
              caption:
                "Pulling in the fetched cards, then adding a new one, prototyped.",
              label: "Flow",
            },
            {
              type: "image",
              src: "/work/nova-upi/boards/cards.jpg",
              alt: "A card fetched from the phone number, a new card's number typed onto it, and the card flipped for the CVV",
              caption:
                "A fetched card to pull in, and a new one typed onto the card, front and back.",
              label: "Screens",
            },
          ],
        },
        {
          id: "pay",
          label: "Paying",
          heading: "Swipe to pay, so you mean it",
          paragraphs: [
            "Paying starts with the camera on a UPI QR code. Type the amount, pick the card to pay from, and swipe to pay instead of tapping. A tap is easy to make by accident; a swipe takes a moment, so you know you're paying and think before you do. The tick, the amount and who it went to come up at once, and the balance changes with it.",
          ],
          layout: "carousel",
          figures: [
            {
              type: "video",
              src: "/work/nova-upi/boards/flow-pay.mp4",
              poster: "/work/nova-upi/boards/flow-pay.jpg",
              alt: "Paying in the prototype: scanning a BHIM UPI QR code, the amount, choosing a card, swiping to pay and the success screen",
              caption: "A payment from the QR code to the tick, prototyped.",
              label: "Flow",
            },
            {
              type: "image",
              src: "/work/nova-upi/boards/pay.jpg",
              alt: "Scanning a QR code, choosing a card and swiping to pay, then Payment of ₹100 successful",
              caption: "Scan, pick a card and swipe, then the payment done.",
              label: "Screens",
            },
          ],
        },
        {
          id: "system",
          act: "The craft",
          label: "System",
          heading: "Glass, blue and one typeface",
          paragraphs: [
            "Against the visual noise, one calm look throughout. It starts from iOS 26 and its glass: a blue gradient background with soft blobs of colour, and frosted panels floating over it, in white (#FFFFFF), a light blue (#92D5FF) and a deep blue (#0171FF), with black for text. The whole app is set in Product Sans (Google Sans); the style guide lists SF Pro Display and Plus Jakarta Sans as close alternatives. Buttons, chips and panels are fully round, and the app icon is a pinwheel of blue petals, which opens the screens too.",
          ],
          lead: {
            type: "diagram",
            diagram: "nova-system",
            alt: "Nova's design language: #0171FF for buttons and links, #92D5FF for the gradient's light end, #FFFFFF for the glass and #000000 for text; Product Sans throughout; and one fully round shape for buttons, chips and the tab bar",
            caption: "The colours, type and shape behind Nova.",
          },
          figures: [
            {
              type: "image",
              src: "/work/nova-upi/boards/system.jpg",
              alt: "Nova's design system: the blue gradient and its three colours, glassmorphism inspired by iOS 26, the app icon, and the fonts SF Pro Display, Plus Jakarta Sans and Product Sans",
              caption: "Colours, glass, the icon and the type.",
            },
          ],
        },
        {
          id: "getting-in",
          label: "Getting in",
          heading: "In with a glance",
          paragraphs: [
            "The app opens on what it's for, “Your money, upgraded”, with save, spend, invest and pay turning over above it. You continue with Google or Apple, confirm with Face ID, then add your phone number and its OTP.",
          ],
          layout: "carousel",
          figures: [
            {
              type: "video",
              src: "/work/nova-upi/boards/flow-start.mp4",
              poster: "/work/nova-upi/boards/flow-start.jpg",
              alt: "The prototype from the first screen: signing in with Google, then the phone number and OTP",
              caption:
                "From opening the app to adding your number, prototyped in Figma.",
              label: "Flow",
            },
            {
              type: "image",
              src: "/work/nova-upi/boards/signin.jpg",
              alt: "The opening screen, signing in with Apple and Face ID, and the OTP",
              caption: "The opening, signing in with Apple, and the OTP.",
              label: "Screens",
            },
          ],
        },
        {
          id: "motion",
          label: "Motion",
          heading: "Screens that morph",
          paragraphs: [
            "What makes it feel finished is how it moves. I prototyped it with Figma's Smart Animate, matching layers from one screen to the next so they morph instead of cutting: the words on the opening turn over, a fetched card slides into place as you pull it, a new card flips over for its CVV, and the balance and cards carry through from home into paying.",
            "Getting a morph right means the same layer, with the same name, on both screens, so I built the screens to share their parts. That discipline is also what kept fifty screens consistent in 48 hours.",
          ],
          layout: "carousel",
          figures: [
            {
              type: "video",
              src: "/work/nova-upi/boards/flow-cards.mp4",
              poster: "/work/nova-upi/boards/flow-cards.jpg",
              alt: "Cards sliding in as they're pulled, then a new card flipping over for its CVV",
              caption: "Cards slide in as you pull them, and flip for the CVV.",
              label: "Cards",
            },
            {
              type: "video",
              src: "/work/nova-upi/boards/flow-pay.mp4",
              poster: "/work/nova-upi/boards/flow-pay.jpg",
              alt: "The balance and cards carrying through from scanning a QR code to the payment done",
              caption: "The balance and cards carry through a payment.",
              label: "Paying",
            },
          ],
        },
        {
          id: "mockups",
          label: "Mockups",
          heading: "In the hand",
          paragraphs: [
            "To see it the way people would, I placed the finished screens into photo mockups: in the hand beside a card, on a desk, and over a laptop.",
          ],
          layout: "carousel",
          figures: [
            {
              type: "image",
              src: "/work/nova-upi/boards/mockup-card.jpg",
              alt: "Nova's opening screen on an iPhone, held beside a Visa card",
              caption: "The opening, beside a card. Mockups from Mockuuups.",
              label: "Card",
            },
            {
              type: "image",
              src: "/work/nova-upi/boards/mockup-desk.jpg",
              alt: "Nova's home screen on an iPhone lying on a desk beside a mouse and earphones",
              caption: "Home, on the desk. Mockups from Mockuuups.",
              label: "Desk",
            },
            {
              type: "image",
              src: "/work/nova-upi/boards/mockup-hand.jpg",
              alt: "Nova's opening screen on an iPhone held over a laptop",
              caption: "The opening, over a laptop. Mockups from Mockuuups.",
              label: "Hand",
            },
          ],
        },
        {
          id: "status",
          act: "What happened",
          label: "Outcome",
          heading: "The project that got me hired",
          paragraphs: [
            "Nova was never built, but it did its job: it's the project that got me hired at Spotmies, who liked it enough to bring me on.",
          ],
        },
        {
          id: "reflection",
          label: "Reflection",
          heading: "What 48 hours taught me",
          paragraphs: [
            "Nova was my first big personal project, and an experiment. I reimagined a whole app and designed it in 48 hours, which I'd never done before, and along the way I found the techniques and shortcuts in Figma that made me an expert in it.",
          ],
          points: [
            "What I learned: a tight deadline makes you build a system, because there's no time to draw anything twice",
            "What I'd change: even for a concept, show the prototype to a few people who pay by UPI every day, to check it really feels quicker to them",
          ],
        },
      ],
    },
    disk: "#3d8bd6",
    ink: "#f5f1ea",
  },
  {
    id: "gym",
    disciplines: ["development"],
    title: "AI Gym Trainer",
    kind: "Computer vision app",
    role: "Solo: design + build",
    context: "Project",
    summary:
      "FitPro, a fitness dashboard with a trainer that watches you through your webcam: it measures the angle of your elbow with MediaPipe and counts your bicep curls as you do them. Designed and built alone in April 2025, with Flask streaming the tracked video to the page.",
    blurb:
      "A fitness dashboard whose camera watches your arm and counts your bicep curls as you go.",
    highlights: [
      "Counts a curl from your elbow's angle: a rep is the arm straightening past 160°, then bending under 30°",
      "Flask streams the camera feed to the dashboard live, with your skeleton, the angle and the count drawn on it",
      "Around it, a pastel dashboard: a workout calendar and charts for calories, training and sleep, still on sample data",
    ],
    stack: ["Python", "Flask", "OpenCV", "MediaPipe", "Chart.js"],
    link: {
      href: "https://github.com/thakursameershetty/personal-gym-trainer",
      label: "GitHub",
    },
    media: [
      {
        type: "image",
        src: "/work/gym-trainer/dashboard.jpg",
        alt: "The FitPro dashboard: the live camera feed with a pose skeleton and a rep counter reading 4, an April calendar, and charts for calories, training and sleep",
        caption: "The dashboard, with the tracked camera feed counting reps.",
      },
    ],
    // Built from nothing; no brief yet to say so.
    stage: "0 → 1",
    disk: "#ef7d3c",
    ink: "#1a1a1a",
  },
];

// Disks are numbered straight through both boxes: the Spotmies box first, then personal work.
export const diskOrder: Project[] = [
  ...projects.filter((project) => project.context === "Spotmies"),
  ...projects.filter((project) => project.context === "Project"),
];

export const diskNumber = (project: Project) =>
  diskOrder.findIndex((entry) => entry.id === project.id) + 1;

/** A project's case study, part by part: its own, or a single overview built from its card. */
export function caseSections(project: Project): CaseSection[] {
  if (project.caseStudy) return project.caseStudy.sections;
  return [
    {
      id: "overview",
      label: "Overview",
      heading: "Overview",
      // The summary already opens the page.
      paragraphs: [],
      points: project.highlights,
      figures: project.media,
      layout: "grid",
    },
  ];
}

/** A part's pictures in order: its lead, if it has one, then its figures. */
export function sectionPictures(section: CaseSection): ScreenItem[] {
  return [...(section.lead ? [section.lead] : []), ...(section.figures ?? [])];
}

/** A channel on the case study's monitor. */
export interface CaseChannel {
  label: string;
  screen: ScreenItem[];
  /** The part it shows, or null for the reel. */
  part: number | null;
}

/**
 * The monitor's channels: the reel first (the project's media if it has no reel of its own),
 * then one for each part with pictures.
 */
export function caseChannels(project: Project): CaseChannel[] {
  const reel = project.caseStudy?.reel ?? project.media;
  const channels: CaseChannel[] = [
    {
      label: "Reel",
      screen: reel?.length
        ? reel
        : [{ type: "card", title: project.title, note: "Screens coming soon" }],
      part: null,
    },
  ];
  // Without a write-up, the overview's pictures are the reel again.
  if (!project.caseStudy) return channels;
  project.caseStudy.sections.forEach((section, part) => {
    // Diagrams can't play on the monitor; a part with one gives it a `screen` instead.
    const pictures =
      section.screen ??
      sectionPictures(section).filter((figure) => figure.type !== "diagram");
    // Every part has a channel, so the remote matches the progress ticks; one with no
    // pictures shows its title on a card.
    const screen = pictures.length
      ? pictures
      : [{ type: "card" as const, title: section.heading, note: section.label }];
    channels.push({ label: section.label, screen, part });
  });
  return channels;
}

// Minutes to read a case study: its words at an easy 200 a minute (captions included).
export const readingMinutes = (project: Project) => {
  const study = project.caseStudy;
  if (!study) return 0;
  const text = [
    project.summary,
    study.headline ?? "",
    ...study.sections.flatMap((section) => [
      section.heading,
      ...section.paragraphs,
      ...(section.points ?? []),
      ...sectionPictures(section).map((figure) =>
        figure.type === "card" ? "" : (figure.caption ?? ""),
      ),
    ]),
  ].join(" ");
  return Math.max(1, Math.round(text.split(/\s+/).length / 200));
};
