// Projects shown as floppy disks in the Work section, drawn from Thakur's résumé (only what it
// states; add years, images and links as they're confirmed). `disk` is the disk's body
// colour and `ink` the colour of anything printed on it.

export type ProjectMedia =
  | { type: "image"; src: string; alt: string }
  | { type: "video"; src: string; poster: string; alt: string };

/**
 * What the case study's monitor shows: a still or clip, or (until the footage exists) a test
 * card naming what will go there.
 */
export type ScreenItem = ProjectMedia | { type: "card"; title: string; note: string };

/** One part of a case study, and one channel on its monitor. */
export interface CaseSection {
  id: string;
  /** Short name for the remote and the monitor's display. */
  label: string;
  heading: string;
  paragraphs: string[];
  points?: string[];
  /** Played on the monitor while this part is being read. */
  screen: ScreenItem[];
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
  /** The full write-up, part by part; projects without one get a single overview part. */
  caseStudy?: { timeframe: string; sections: CaseSection[] };
  disk: string;
  ink: string;
}

export const projects: Project[] = [
  {
    id: "raobahadur",
    title: "Rao Bahadur",
    kind: "Full stack web app",
    role: "Design + full stack",
    context: "Spotmies",
    summary:
      "A ready-to-use full stack web application, built fast and owned end to end, from the first design to the backend optimisations.",
    highlights: [
      "Complete ownership of the product, from design through to backend",
      "Shipped quickly in an agile, iterative way",
    ],
    stack: ["Design", "Frontend", "Backend"],
    link: { href: "https://raobahadur.in", label: "raobahadur.in" },
    // Placeholder media: swap for real screenshots and clips.
    media: [
      { type: "image", src: "/work/raobahadur-1.jpg", alt: "Rao Bahadur screenshot 1" },
      { type: "image", src: "/work/raobahadur-2.jpg", alt: "Rao Bahadur screenshot 2" },
    ],
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
          screen: [
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
          screen: [{ type: "card", title: "Store now, decrypt later", note: "Illustration coming soon" }],
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
          screen: [
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
          screen: [
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
          screen: [
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
          screen: [{ type: "card", title: "Next steps", note: "Diagram coming soon" }],
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
      paragraphs: [project.summary],
      points: project.highlights,
      screen: project.media?.length
        ? project.media
        : [{ type: "card", title: project.title, note: "Screens coming soon" }],
    },
  ];
}
