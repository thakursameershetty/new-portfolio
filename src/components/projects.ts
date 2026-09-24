// Projects shown as floppy disks in the Work section, drawn from Thakur's résumé (only what it
// states; add years, images and links as they're confirmed). `disk` is the disk's body
// colour and `ink` the colour of anything printed on it.

export type ProjectMedia =
  | { type: "image"; src: string; alt: string }
  | { type: "video"; src: string; poster: string; alt: string };

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
    kind: "3D security visualisation",
    role: "Lead designer + developer",
    context: "Project",
    summary:
      "A high-fidelity 3D interface for a quantum-resistant security framework for autonomous drone swarms, turning phones into live, interactive drone nodes.",
    highlights: [
      "Visualised E91 quantum key exchange, homomorphic encryption and an AI threat agent",
      "Fluid micro-interactions at 210ms latency",
    ],
    stack: ["Three.js", "IBM Qiskit"],
    // Placeholder: swap for the real link.
    link: { href: "https://example.com", label: "example.com" },
    // Placeholder media: swap for real screenshots and clips.
    media: [
      { type: "video", src: "/work/demo-flower.mp4", poster: "/work/demo-flower.jpg", alt: "SamudraGupt-Q demo" },
      { type: "image", src: "/work/samudragupt-1.jpg", alt: "SamudraGupt-Q screenshot 1" },
      { type: "image", src: "/work/samudragupt-2.jpg", alt: "SamudraGupt-Q screenshot 2" },
    ],
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
