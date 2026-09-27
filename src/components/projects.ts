// Projects shown as floppy disks in the Work section, drawn from Thakur's résumé (only what it
// states; add years, images and links as they're confirmed). `disk` is the disk's body
// colour and `ink` the colour of anything printed on it.

/** A still or a clip; `caption` is the short line shown under it in a case study. */
export type ProjectMedia =
  | { type: "image"; src: string; alt: string; caption?: string }
  | { type: "video"; src: string; poster: string; alt: string; caption?: string };

/**
 * A picture in a case study (or on its monitor): a still or clip, or (until the footage
 * exists) a test card naming what will go there.
 */
export type ScreenItem = ProjectMedia | { type: "card"; title: string; note: string };

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
  /** What the monitor shows on this part's channel, when it can't be the figures (the
   *  screen is 4:3 and fills itself, so tall pictures lose their top and bottom). */
  screen?: ScreenItem[];
  /** How the figures sit: each full width (the default), two side by side, two across in a
   *  grid, or all in one row (for tall ones, like posts). */
  layout?: "wide" | "pair" | "grid" | "row";
}

/** A cell of the brief under a case study's title: what it's about, the fact, and a note. */
export interface CaseFact {
  label: string;
  value: string;
  note?: string;
}

export interface Project {
  id: string;
  title: string;
  /** Short label line under the title. */
  kind: string;
  role: string;
  /** Where it was made: at Spotmies, or as a personal / hackathon project. */
  context: "Spotmies" | "Project";
  summary: string;
  highlights: string[];
  stack: string[];
  link?: { href: string; label: string };
  /** Screenshots and clips, shown on the preview monitor and in the project window. */
  media?: ProjectMedia[];
  /** The full write-up, part by part; projects without one get a single overview part.
   *  `headline` is the story in a line, under the title; `brief` the grid of facts at a
   *  glance; `reel` what the monitor plays first (the project's media if left out). */
  caseStudy?: {
    timeframe: string;
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
    title: "Rao Bahadur",
    kind: "Fan site for a feature film",
    role: "Solo: design + full stack",
    context: "Spotmies",
    summary:
      "A fan site for the Telugu film Rao Bahadur, where people who'd seen it could pick their favourite characters and post and debate theories, without making an account. Built alone in under a week, with an admin panel the film team ran themselves.",
    highlights: [
      "No sign-up: a nickname and a generated face, asked for only on your first like or post",
      "Likes, replies and trending theories that update live",
      "An admin panel for the debate, the critics' videos, users and theories",
    ],
    // Confirm: add the database / live-update service.
    stack: ["Next.js", "GSAP", "Vercel"],
    link: { href: "https://raobahadur.in", label: "raobahadur.in" },
    media: [
      { type: "image", src: "/work/raobahadur/hero.jpg", alt: "Rao Bahadur home page" },
      { type: "image", src: "/work/raobahadur/characters.jpg", alt: "Picking favourite characters, with like counts" },
      { type: "image", src: "/work/raobahadur/theories.jpg", alt: "The fan theories board" },
    ],
    caseStudy: {
      timeframe: "July 2026",
      headline: "Getting a slow-burn film talked about, with nothing in the way of joining in",
      brief: [
        { label: "Role", value: "Solo, end to end", note: "Design, frontend, backend, admin" },
        { label: "Product", value: "Fan site + admin panel", note: "For the Telugu film Rao Bahadur" },
        { label: "Window", value: "5–6 days", note: "Live for the July 2026 release" },
        { label: "Fans", value: "271 theories", note: "And 144 comments and replies" },
        { label: "Reach", value: "4 official posts", note: "36,000+ views on X, the director replying" },
        { label: "Takeaway", value: "Remove every hurdle", note: "A nickname was enough to join in" },
      ],
      reel: [
        { type: "image", src: "/work/raobahadur/hero.jpg", alt: "Rao Bahadur home page" },
        { type: "image", src: "/work/raobahadur/characters.jpg", alt: "Picking favourite characters" },
        { type: "image", src: "/work/raobahadur/theories.jpg", alt: "The fan theories board" },
        { type: "image", src: "/work/raobahadur/easter-egg.jpg", alt: "The insect easter egg" },
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
            { type: "image", src: "/work/raobahadur/hero.jpg", alt: "Rao Bahadur home page", caption: "The home page: root for the film, or see the buzz around it." },
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
            { type: "image", src: "/work/raobahadur/identify-modal.jpg", alt: "Identify yourself: an empty avatar and a nickname field", caption: "Asked for only on your first like, reply or post." },
            { type: "image", src: "/work/raobahadur/identify-avatar-modal.jpg", alt: "The avatar's face appears as the name is typed", caption: "The face is drawn from the name as you type it." },
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
            { type: "image", src: "/work/raobahadur/watched.jpg", alt: "Have you watched Rao Bahadur? Two cards: yes, or not yet", caption: "One question before any spoilers." },
            { type: "image", src: "/work/raobahadur/characters.jpg", alt: "Five character cards, each with a like count", caption: "Favourite characters, with like counts that update live." },
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
            { type: "image", src: "/work/raobahadur/easter-egg.jpg", alt: "Easter egg: the Insect of Doubt card over falling confetti", caption: "Found by searching “the insect”." },
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
            { type: "image", src: "/work/raobahadur/theories.jpg", alt: "The fan theories board, with tabs for trending, new and hidden details", caption: "Theories to read, like, reply to, save and share." },
            { type: "image", src: "/work/raobahadur/theory-trending.jpg", alt: "A theory trending through clicks and through replies", caption: "Tags show whether a theory is trending through clicks, likes or replies." },
            { type: "image", src: "/work/raobahadur/hero-debate.jpg", alt: "The home page with its Live debate banner", caption: "An open debate with the film team, announced on the home page." },
            { type: "image", src: "/work/raobahadur/debate-form.jpg", alt: "Open debate sign-up form", caption: "The debate sign-up: the only place that asks for real details, so the team could pick people and contact them." },
            { type: "image", src: "/work/raobahadur/admin-theories.jpg", alt: "Admin dashboard listing theories, comments and replies", caption: "The admin panel: users, theories, the debate and the buzz page." },
            { type: "image", src: "/work/raobahadur/my-theories.jpg", alt: "My theories and saved theories", caption: "Your own theories, and the ones you saved." },
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
            { type: "image", src: "/work/raobahadur/theory-hidden-detail.jpg", alt: "A theory page with its discussion and like count", caption: "A theory page. Likes and replies arrive without a refresh." },
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
            { type: "image", src: "/work/raobahadur/posts-jul-7.jpg", alt: "Two posts about the site from @RaoBahadurMovie on July 7" },
            { type: "image", src: "/work/raobahadur/posts-jul-8-16.jpg", alt: "Posts about the site from July 8 and July 16" },
          ],
          figures: [
            { type: "image", src: "/work/raobahadur/post-1.jpg", alt: "@RaoBahadurMovie: Loved #RaoBahadur? Visit raobahadur.in. Root for it. Root for good cinema.", caption: "July 7 · 13,985 views" },
            { type: "image", src: "/work/raobahadur/post-2.jpg", alt: "@RaoBahadurMovie: Think you've decoded #RaoBahadur? Share the easter eggs you found; @mahaisnotanoun will reply to the best ones.", caption: "July 7 · 7,450 views" },
            { type: "image", src: "/work/raobahadur/post-3.jpg", alt: "@RaoBahadurMovie: We're going through all of them and are quite amazed by them, with a fan's theory from the site", caption: "July 8 · 4,834 views" },
            { type: "image", src: "/work/raobahadur/post-4.jpg", alt: "@RaoBahadurMovie: Loved it or have mixed feelings? Join the #RaoBahadur Debate at raobahadur.in/debate", caption: "July 16 · 9,892 views" },
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
    disk: "#1f1f1f",
    ink: "#f5f1ea",
  },
  {
    id: "mutiny",
    title: "Mutiny Talent",
    kind: "Mobile app",
    role: "UI/UX + frontend",
    context: "Spotmies",
    summary:
      "A mobile app designed from scratch: the full UI/UX flow and architecture, then a polished React Native frontend.",
    highlights: [
      "Designed the complete UX flow and app architecture",
      "Built the frontend in React Native with efficient state management",
    ],
    stack: ["React Native", "UX architecture"],
    // Placeholder: swap for the real link.
    link: { href: "https://example.com", label: "example.com" },
    // Placeholder media: swap for real screenshots and clips.
    media: [
      { type: "video", src: "/work/demo-flower.mp4", poster: "/work/demo-flower.jpg", alt: "Mutiny Talent demo" },
      { type: "image", src: "/work/mutiny-1.jpg", alt: "Mutiny Talent screenshot 1" },
      { type: "image", src: "/work/mutiny-2.jpg", alt: "Mutiny Talent screenshot 2" },
    ],
    disk: "#e54b45",
    ink: "#fff8f3",
  },
  {
    id: "spotmies-web",
    title: "Spotmies · Amerox",
    kind: "Web experiences",
    role: "Design + Next.js",
    context: "Spotmies",
    summary:
      "Web experiences for Spotmies, Amerox.io and MyBodyQode (beta), with every micro-interaction built to scale across devices.",
    highlights: [
      "Designed and shipped three product websites",
      "Micro-interactions that hold up on every screen size",
    ],
    stack: ["Next.js", "Micro-interactions"],
    // Placeholder media: swap for real screenshots and clips.
    media: [
      { type: "image", src: "/work/spotmies-web-1.jpg", alt: "Spotmies · Amerox screenshot 1" },
      { type: "image", src: "/work/spotmies-web-2.jpg", alt: "Spotmies · Amerox screenshot 2" },
    ],
    disk: "#e9e2d4",
    ink: "#1a1a1a",
  },
  {
    id: "peddi",
    title: "Peddi",
    kind: "Roblox game world",
    role: "Product lifecycle",
    context: "Spotmies",
    summary:
      "An immersive Roblox game experience: I managed the whole product lifecycle and built the complete virtual environment around its core mechanics.",
    highlights: [
      "Built the full virtual environment from the base game mechanics",
      "Owned the project from concept to release",
    ],
    stack: ["Roblox", "Environment design"],
    // Placeholder media: swap for real screenshots and clips.
    media: [
      { type: "image", src: "/work/peddi-1.jpg", alt: "Peddi screenshot 1" },
      { type: "image", src: "/work/peddi-2.jpg", alt: "Peddi screenshot 2" },
    ],
    disk: "#2f6f5e",
    ink: "#f5f1ea",
  },
  {
    id: "tmn",
    title: "TMN · Satara News",
    kind: "Multilingual news platform",
    role: "UI/UX strategy",
    context: "Spotmies",
    summary:
      "A minimal design strategy for a multilingual news platform, with polished micro-interactions, guiding the development team on how to build them.",
    highlights: [
      "Minimal, multilingual reading experience",
      "Worked directly with developers on implementing the interactions",
    ],
    stack: ["UI/UX strategy", "Micro-interactions"],
    // Placeholder media: swap for real screenshots and clips.
    media: [
      { type: "image", src: "/work/tmn-1.jpg", alt: "TMN · Satara News screenshot 1" },
      { type: "image", src: "/work/tmn-2.jpg", alt: "TMN · Satara News screenshot 2" },
    ],
    disk: "#f0c44c",
    ink: "#1a1a1a",
  },
  {
    id: "samudragupt",
    title: "SamudraGupt-Q",
    kind: "Cyber-physical security prototype",
    role: "Solo: research, design + build",
    context: "Project",
    summary:
      "A working simulation of how a swarm of underwater drones could keep its links safe from future quantum computers, and notice when one of its drones is captured. Phones stand in for the drones; a live 3D dashboard shows the swarm.",
    highlights: [
      "Phones stream real motion data as drone nodes; shaking one plays a physical capture",
      "Quantum key bits, encrypted fleet averages and an AI agent that isolates hostile nodes",
      "An attacker console for breaking the system on purpose, live",
    ],
    stack: ["Three.js", "Node.js", "Socket.IO", "Python", "Flask", "Qiskit", "TenSEAL", "Stable Baselines3"],
    // Placeholder: swap for the real link.
    link: { href: "https://example.com", label: "example.com" },
    // Placeholder media for the hover preview: swap for real screenshots and clips.
    media: [
      { type: "image", src: "/work/samudragupt/architecture.jpg", alt: "SamudraGupt-Q system architecture" },
      { type: "image", src: "/work/samudragupt-1.jpg", alt: "SamudraGupt-Q screenshot 1" },
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
            { type: "card", title: "Command dashboard", note: "Recording coming soon" },
            { type: "image", src: "/work/samudragupt/architecture.jpg", alt: "System architecture: phones as drone nodes, a cloud aggregator, the command centre and the quantum layer" },
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
          figures: [{ type: "card", title: "Store now, decrypt later", note: "Illustration coming soon" }],
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
            { type: "image", src: "/work/samudragupt/architecture.jpg", alt: "System architecture diagram" },
            { type: "image", src: "/work/samudragupt/sequence.jpg", alt: "Sequence diagram: key exchange, encrypted telemetry and the AI agent's decision" },
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
            { type: "image", src: "/work/samudragupt/threat-flow.jpg", alt: "Flowchart of the threat response, from the quantum check to Protocol Omega" },
            { type: "card", title: "Drone and attacker consoles", note: "Recording coming soon" },
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
            { type: "card", title: "Kinetic strike → Protocol Omega", note: "Recording coming soon" },
            { type: "card", title: "Rogue node detected", note: "Recording coming soon" },
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
          figures: [{ type: "card", title: "Next steps", note: "Diagram coming soon" }],
        },
      ],
    },
    disk: "#23395b",
    ink: "#f5f1ea",
  },
  {
    id: "gesture",
    title: "Gesture Shop · Aura",
    kind: "Touchless spatial UI",
    role: "Frontend engineer",
    context: "Project",
    summary:
      "Touchless web interfaces for e-commerce and media, using AI hand tracking in place of clicks, with fluid gesture-based micro-interactions.",
    highlights: [
      "Navigation driven entirely by hand gestures",
      "Spatial, 3D interfaces for shopping and music playback",
    ],
    stack: ["Three.js", "AI hand tracking"],
    // Placeholder media: swap for real screenshots and clips.
    media: [
      { type: "video", src: "/work/demo-friday.mp4", poster: "/work/demo-friday.jpg", alt: "Gesture Shop · Aura demo" },
      { type: "image", src: "/work/gesture-1.jpg", alt: "Gesture Shop · Aura screenshot 1" },
      { type: "image", src: "/work/gesture-2.jpg", alt: "Gesture Shop · Aura screenshot 2" },
    ],
    disk: "#7a5cc7",
    ink: "#f5f1ea",
  },
  {
    id: "nova",
    title: "Nova UPI",
    kind: "Fintech app",
    role: "UI/UX engineer",
    context: "Project",
    summary:
      "The complete design system and frontend for a UPI payments app, built in a 48-hour sprint, tuned for transaction speed and retention.",
    highlights: [
      "Full design system in 48 hours",
      "Detailed micro-interactions, layout stacks and state transitions",
    ],
    stack: ["Design system", "Prototyping"],
    // Placeholder media: swap for real screenshots and clips.
    media: [
      { type: "image", src: "/work/nova-1.jpg", alt: "Nova UPI screenshot 1" },
      { type: "image", src: "/work/nova-2.jpg", alt: "Nova UPI screenshot 2" },
    ],
    disk: "#3d8bd6",
    ink: "#f5f1ea",
  },
  {
    id: "gym",
    title: "AI Gym Trainer",
    kind: "Computer vision app",
    role: "Lead developer",
    context: "Project",
    summary:
      "A real-time computer vision trainer that tracks your movement from a live camera feed and counts bicep curl reps, streamed through a custom Flask backend.",
    highlights: [
      "Real-time pose tracking and rep counting",
      "Live data streamed through a custom backend",
    ],
    stack: ["Python", "OpenCV", "MediaPipe", "Flask"],
    // Placeholder media: swap for real screenshots and clips.
    media: [
      { type: "video", src: "/work/demo-friday.mp4", poster: "/work/demo-friday.jpg", alt: "AI Gym Trainer demo" },
      { type: "image", src: "/work/gym-1.jpg", alt: "AI Gym Trainer screenshot 1" },
      { type: "image", src: "/work/gym-2.jpg", alt: "AI Gym Trainer screenshot 2" },
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
      screen: reel?.length ? reel : [{ type: "card", title: project.title, note: "Screens coming soon" }],
      part: null,
    },
  ];
  // Without a write-up, the overview's pictures are the reel again.
  if (!project.caseStudy) return channels;
  project.caseStudy.sections.forEach((section, part) => {
    const screen = section.screen ?? section.figures;
    if (screen?.length) channels.push({ label: section.label, screen, part });
  });
  return channels;
}
