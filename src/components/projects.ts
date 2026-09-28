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

/**
 * A picture in a case study (or on its monitor): a still or clip, a YouTube video, or (until
 * the footage exists) a test card naming what will go there.
 */
export type ScreenItem =
  ProjectMedia | YouTubeMedia | { type: "card"; title: string; note: string };

/** One part of a case study: its text, then its pictures, large. */
export interface CaseSection {
  id: string;
  /** Starts a new act of the story (e.g. "The decisions"), named above this part. */
  act?: string;
  /** Short name for the progress ticks and the closer look. */
  label: string;
  heading: string;
  paragraphs: string[];
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
  disk: string;
  ink: string;
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
    // Confirm: add the database / live-update service.
    stack: ["Next.js", "GSAP", "Vercel"],
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
          label: "Window",
          value: "5–6 days",
          note: "Live for the July 2026 release",
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
            "Rao Bahadur is a Telugu film directed by Venkatesh Maha. Its makers asked Spotmies for a site where people who'd watched it could share their opinions and dig into the hidden details the director had put in. It's a slow, detailed film, and it opened in the same week as a much bigger star's, so it needed word of mouth. Spotmies gave the project to me, and I designed and built all of it.",
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
          id: "identity",
          act: "The decisions",
          label: "No sign-up",
          heading: "No sign-up, just a name",
          paragraphs: [
            "Fans of a smaller film won't make an account just to leave a comment, and a fan discussion doesn't need real names. So reading is open to everyone, and only your first like, reply or post asks for a nickname. As you type it, a face is drawn from the letters, so everyone has an avatar without uploading a photo.",
          ],
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
            "Rooting for the film starts with one question: have you watched it? If not, you go to the buzz page, with trailers, critics' posts and where to book tickets, and nothing that gives the film away. If you have, you pick your favourite characters and go on to the theories.",
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
                "The admin panel: users, theories, the debate and the buzz page.",
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
            "I was still new to building at this scale. The hardest part was keeping pages quick while theories, replies, videos and images piled up, and making likes and counts update live without a refresh. I also reworked the animations several times, until each one explained something instead of getting in the way.",
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
            "Fans posted 271 theories and 144 comments and replies. The film's official X account sent people to the site four times in its first ten days, asked for easter eggs and theories, and said the director would reply to the best ones. Spotmies was told on a call that the filmmakers loved the site.",
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
            "The film got good reviews but didn't do well at the box office, partly because it came out alongside a bigger film. The site kept the people who had watched it talking, and gave the film team something to post about, but it couldn't bring in the people who never went to see it.",
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
      "The creator app for MutinyX, an influencer marketing network: designed in Figma and built in React Native twice, six months apart, plus the Next.js landing pages for its rebrand. My first big project at Spotmies.",
    blurb:
      "The creator app for an influencer marketing network, designed and built twice, and its website.",
    highlights: [
      "Designed the first version, about 35 screens, in three days, then built its frontend in React Native",
      "Redesigned it after the rebrand, around a new flow for submitting each deliverable",
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
        "Designing a creator app twice, and rebuilding it around the work that comes after yes",
      brief: [
        {
          label: "Role",
          value: "Design + frontend",
          note: "The creator app, twice, and the website",
        },
        {
          label: "Product",
          value: "MutinyX",
          note: "Brands, creators and agencies in one network",
          logo: "/work/mutiny/logo-dark.svg",
          href: "https://www.mutinyx.in",
        },
        {
          label: "Version 1",
          value: "3 days of design",
          note: "Feb 2026, then a React Native draft",
        },
        {
          label: "Version 2",
          value: "5 days of design",
          note: "Aug 2026, its frontend built in Sep",
        },
        {
          label: "Website",
          value: "Next.js",
          note: "Landing pages for the June rebrand",
        },
        {
          label: "Status",
          value: "In production",
          note: "Frontend approved, backend under way",
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
          act: "The brief",
          label: "Brief",
          heading: "The creator side of a network",
          paragraphs: [
            "MutinyX connects brands, agencies and creators for influencer marketing. Brands and agencies plan and run campaigns; creators use the Mutiny Talent app to find campaigns, quote a price, submit their work and get paid.",
            "The creator app was my first big project at Spotmies. I designed it twice, six months apart, built its frontend both times, and in between designed and built the website for the rebrand.",
          ],
        },
        {
          id: "version-1",
          act: "Version 1",
          label: "Version 1",
          heading: "A whole app in three days",
          paragraphs: [
            "From February 25 to 27, I designed about 35 screens in Figma, from signing up to getting paid: finding campaigns, negotiating a price, tracking the work, chats, the wallet and the creator's profile.",
            "In the first week of March, I built the frontend in React Native, on the architecture my team lead had set. The draft covered all of the UI, and my team lead took it from there to the development team for production. The app in the stores changed along the way, so the screens here are from my Figma file.",
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
          id: "website",
          act: "The rebrand",
          label: "Website",
          heading: "Landing pages for MutinyX",
          paragraphs: [
            "In June, Mutiny Talent became MutinyX. I designed and built its landing pages in Next.js: one for the network as a whole, one for creators, and a pair for brands and agencies that share a layout, with the micro-interactions designed and built together.",
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
        {
          id: "opening",
          act: "Version 2",
          label: "Opening",
          heading: "An opening that explains the app",
          paragraphs: [
            "The rebrand called for a fresh app, so from August 25 I redesigned it over five days. Version 1 opened on a rotating globe of faces. The new opening says what the app is for: find campaigns, find brands, find collaborations, find you, as campaign posters fly past.",
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
          heading: "A fresh look for MutinyX",
          paragraphs: [
            "The app went dark, with the MutinyX yellow for everything you can act on. The tabs became Home, Explore, Chats and Submissions, and Explore split campaigns into public ones and the ones you're invited to, with filters for paid, barter and programs. I prototyped the moving parts in Figma before building them.",
          ],
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
          id: "submissions",
          label: "Submissions",
          heading: "One place for every deliverable",
          paragraphs: [
            "In version 1, a campaign was one pipeline. When a brand asked for several deliverables, creators couldn't tell where to submit each one, or how. The client raised it, and it's the problem I most wanted to solve.",
            "In version 2, every deliverable a campaign needs sits in a row of tabs at the top of its submissions screen, and each has its own steps: a reel goes from script to work to proof of work, while a story or feed post goes from post to proof. Each step is reviewed and shows where it stands. I pitched the flow to the client, then designed and built it once they approved.",
          ],
          lead: {
            type: "video",
            src: "/work/mutiny/boards/v2-submit-flow.mp4",
            poster: "/work/mutiny/boards/v2-submit-flow.jpg",
            alt: "The version 2 submission flow: a reel's script uploaded and approved, then its work, then the proof of work",
            caption:
              "The whole flow, from script to proof of work, prototyped in Figma.",
          },
          layout: "pair",
          figures: [
            {
              type: "image",
              src: "/work/mutiny/boards/v1-submit.jpg",
              alt: "Version 1: a campaign's single progress timeline, the upload screen and the submitted message",
              caption: "Version 1: one pipeline per campaign.",
            },
            {
              type: "image",
              src: "/work/mutiny/boards/v2-submit.jpg",
              alt: "Version 2: deliverable tabs for two reels, with script upload, then work upload, then proof of work",
              caption:
                "Version 2: a tab per deliverable, each step reviewed in turn.",
            },
          ],
        },
        {
          id: "quote",
          label: "Quoting",
          heading: "Quote what you're worth",
          paragraphs: [
            "Version 1 had a price slider that showed how your price changed your chances of being accepted. But brands set one budget for a whole campaign, across nano, micro and mega creators, not a price for each creator, so there was no fair number to put on the slider.",
            "My team lead and the client decided to drop it. Now creators type their own quote, and the app only says whether it's within the brand's budget or above it, so they quote what they want, not what they guess the brand wants.",
          ],
          layout: "pair",
          figures: [
            {
              type: "image",
              src: "/work/mutiny/boards/v1-quote.jpg",
              alt: "Version 1: the price slider at $500, $490 and $550, each with its chance of acceptance",
              caption:
                "Version 1: the slider, and how each price changes your chances.",
              label: "Version 1",
            },
            {
              type: "image",
              src: "/work/mutiny/boards/v2-quote.jpg",
              alt: "Version 2: a quote of ₹5000, marked above the brand's budget, and the same quote marked within it",
              caption:
                "Version 2: your own quote, above the brand's budget or within it.",
              label: "Version 2",
            },
          ],
        },
        {
          id: "sign-in",
          label: "Sign-in",
          heading: "Just a phone number",
          paragraphs: [
            "The client wanted creators to get in with a phone number alone. One field now does both: an existing creator gets an OTP and is in, and a new one adds a name and email, then connects Instagram so their followers come in by themselves (the development team built that part).",
          ],
          layout: "pair",
          figures: [
            {
              type: "image",
              src: "/work/mutiny/boards/v1-signin.jpg",
              alt: "Version 1 sign-up: name, email and phone, the OTP keypad, then the entered OTP",
              caption: "Version 1: name, email and phone, then an OTP.",
              label: "Version 1",
            },
            {
              type: "image",
              src: "/work/mutiny/boards/v2-signin.jpg",
              alt: "Version 2 sign-in: a phone number, then the OTP boxes, then the entered OTP",
              caption: "Version 2: a phone number, then an OTP.",
              label: "Version 2",
            },
          ],
        },
        {
          id: "status",
          act: "Where it stands",
          label: "Status",
          heading: "Approved, and on to production",
          paragraphs: [
            "From September 9, I built version 2's frontend in about a week, with every animation and interaction tuned. My team lead has checked and approved it, and is now reworking the backend with the development team.",
          ],
        },
      ],
    },
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
          label: "Before",
          value: "A stock template",
          note: "Light, photo-led, like many agency sites",
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
            "Once Amero X was handed off, I redesigned it, the landing page and the inner pages, and built it myself in Next.js. It was live by the second week of February 2026.",
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
        {
          label: "Order",
          value: "My first project",
          note: "Straight after joining Spotmies",
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
            "Amero X was the first thing I worked on after joining Spotmies, in December 2025. It's a crypto trading platform: spot and futures trading, copy trading, swaps, P2P deals, staking and a wallet. Its designs already existed, but they felt cheap, and in crypto a cheap look costs trust. My job was to refine them.",
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
            "My part ended in January 2026, and the development team took it from there. They changed parts of it later, so the live site at amerox.io differs from what's shown here: the design and build as I handed them over.",
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
          label: "Launch",
          value: "June 5, 2026",
          note: "Announced by the film's own X account",
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
            "Dworak and I built the world side by side at Spotmies, in Roblox Studio. These were taken on launch day, still at it after the film's team had shared it.",
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
            "The film's official X account launched the world on June 5, 2026: “Enter the world of #PEDDI now on Roblox.” The post reached 49.5K views, with 3.3K likes and 684 reposts.",
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
      headline: "One news app in two languages, where readers can talk back",
      brief: [
        {
          label: "Role",
          value: "UI/UX design",
          note: "The app and website, in Figma",
        },
        {
          label: "Product",
          value: "TMN News",
          note: "Today Media Network, in English",
          logo: "/logos/tmn-mark.webp",
        },
        {
          label: "Languages",
          value: "English + Marathi",
          note: "The same design for TMN and Satara Today",
        },
        {
          label: "Platforms",
          value: "App + website",
          note: "Phones and desktop",
        },
        {
          label: "App",
          value: "In production",
          note: "Being built by the Spotmies dev team",
        },
        {
          label: "Website",
          value: "Launching soon",
          note: "Built by the Spotmies dev team",
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
          act: "The brief",
          label: "Brief",
          heading: "One design, two newsrooms",
          paragraphs: [
            "TMN, Today Media Network, is an English news platform, and Satara Today, the voice of Satara, brings the same kind of news to readers there in Marathi. I designed both, the app and the website, in Figma: one design that had to work as well in Marathi as in English, kept minimal so the news leads.",
            "The development team at Spotmies is building both, and I worked with them on how the interactions should be built.",
          ],
        },
        {
          id: "website",
          act: "The design",
          label: "Website",
          heading: "A briefing, not a feed",
          paragraphs: [
            "The website opens on your briefing: the date and the local weather, the top stories in a carousel with the most recent beside them, then local stories, sport and your topics. Every category sits in one row under the search.",
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
          id: "languages",
          label: "Two scripts",
          heading: "Made for both scripts",
          paragraphs: [
            "Marathi headlines run longer and sit taller than English ones, so every card, headline and tab had to hold both. Side by side, the two apps share one layout; only the words and the masthead change.",
          ],
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
            "An article carries more than the story: a pull quote, a quick reaction (lit, woke, cap, ded or vibe), an instant poll that shows its results, and comments that open from the bottom, with a box for your hot take.",
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
            "Anyone can write. A new article takes a title, tags, the text with its formatting, and images or video, then publishes from the top. Your articles sit on your profile, with your followers, badges like News Hound and Comment Guru, and settings like the dark theme and offline mode.",
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
          id: "status",
          act: "Where it stands",
          label: "Status",
          heading: "Being built",
          paragraphs: [
            "The development team has built the website, which launches soon, and is building the app now.",
          ],
        },
      ],
    },
    disk: "#d64541",
    ink: "#fff8f3",
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
    // Placeholder media for the hover preview: swap for real screenshots and clips.
    media: [
      {
        type: "image",
        src: "/work/samudragupt/architecture.jpg",
        alt: "SamudraGupt-Q system architecture",
      },
      {
        type: "image",
        src: "/work/samudragupt-1.jpg",
        alt: "SamudraGupt-Q screenshot 1",
      },
    ],
    caseStudy: {
      timeframe: "Final-year B.Tech project, 2025–26",
      sections: [
        {
          id: "overview",
          label: "Overview",
          heading: "What it is",
          paragraphs: [
            "SamudraGupt-Q is my final-year project, and I built all of it on my own: the research, the design and every part of the code. It's a working simulation of a security system for swarms of autonomous underwater drones.",
            "Phones stand in for the drones and stream their real motion sensors. A 3D command dashboard shows the swarm live, and a separate attacker console lets me break things on purpose and watch how the system responds.",
          ],
          layout: "pair",
          figures: [
            {
              type: "card",
              title: "Command dashboard",
              note: "Recording coming soon",
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
          id: "decisions",
          label: "Decisions",
          heading: "Decisions I'm glad I made",
          paragraphs: [
            "Using phones as the drones gave me real, messy sensor data for free. Shaking a phone hard is a believable stand-in for a drone being grabbed, and it made every test physical instead of a line in a dataset.",
            "I gave the agent three choices instead of a yes-or-no alarm. Rotating keys is a middle step, so a noisy reading doesn't split the swarm the way cutting a node off would.",
            "I built the attacker as its own console. Spoofing a node, stripping its key or striking it all happen live, against the running system.",
          ],
          layout: "pair",
          figures: [
            {
              type: "image",
              src: "/work/samudragupt/threat-flow.jpg",
              alt: "Flowchart of the threat response, from the quantum check to Protocol Omega",
            },
            {
              type: "card",
              title: "Drone and attacker consoles",
              note: "Recording coming soon",
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
          layout: "pair",
          figures: [
            {
              type: "card",
              title: "Kinetic strike → Protocol Omega",
              note: "Recording coming soon",
            },
            {
              type: "card",
              title: "Rogue node detected",
              note: "Recording coming soon",
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
      ],
    },
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
        src: "/work/guesture-shop/shop.mp4",
        poster: "/work/guesture-shop/shop.jpg",
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
          label: "Tracking",
          value: "MediaPipe",
          note: "Hand landmarks from the webcam, in the browser",
        },
        {
          label: "Input",
          value: "Hand or mouse",
          note: "Both switch back to a mouse when you want one",
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
          src: "/work/guesture-shop/shop.mp4",
          poster: "/work/guesture-shop/shop.jpg",
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
              src: "/work/guesture-shop/shop.mp4",
              poster: "/work/guesture-shop/shop.jpg",
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
      // Confirm: when it was made.
      timeframe: "48-hour challenge",
      headline: "Your money, upgraded: a UPI app designed in 48 hours",
      brief: [
        {
          label: "Role",
          value: "Solo design",
          note: "Every screen and its system, in Figma",
        },
        { label: "Product", value: "Nova", note: "A UPI payments app" },
        {
          label: "Window",
          value: "48 hours",
          note: "A challenge I set myself",
        },
        {
          label: "Screens",
          value: "About 50",
          note: "And the design system behind them",
        },
        {
          label: "Motion",
          value: "Smart Animate",
          note: "Every screen morphs into the next",
        },
        {
          label: "Prototype",
          value: "End to end",
          note: "From the first launch to a finished payment",
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
          act: "The brief",
          label: "Brief",
          heading: "A payments app in 48 hours",
          paragraphs: [
            "Nova is a UPI payments app I designed in 48 hours, a deadline I set myself to see how much I could do: its wireframes and user flow, its design system, and about fifty screens in Figma, from the first launch to a finished payment, prototyped so the whole thing could be clicked through, then placed in mockups. The goal was to make paying fast and give people a reason to come back.",
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
          id: "system",
          label: "System",
          heading: "Glass, blue and three typefaces",
          paragraphs: [
            "The look starts from iOS 26 and its glass: a blue gradient background with soft blobs of colour, and frosted panels floating over it, in white, a light blue and a deep blue. The type is SF Pro Display, Plus Jakarta Sans and Product Sans, and the app icon is a pinwheel of blue petals, which opens the screens too.",
          ],
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
          act: "The design",
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
          id: "cards",
          label: "Cards",
          heading: "Your cards find you",
          paragraphs: [
            "I designed it so that once your number is in, the cards linked to it appear one at a time, and you pull a card down to add it. A new card is typed straight onto the card itself, which flips over for the CVV.",
          ],
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
          id: "home",
          label: "Home",
          heading: "Everything on one screen",
          paragraphs: [
            "Home puts your balance and your cards at the top, then the people you pay most for a quick send, and your latest transactions. Stats shows your savings month by month.",
          ],
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
          id: "pay",
          label: "Paying",
          heading: "Scan, swipe, done",
          paragraphs: [
            "Paying starts with the camera on a UPI QR code. Type the amount, pick the card to pay from, and swipe to pay instead of tapping. The tick, the amount and who it went to come up at once, and the balance changes with it.",
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
          act: "In the hand",
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
    const screen = section.screen ?? sectionPictures(section);
    if (screen?.length) channels.push({ label: section.label, screen, part });
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
