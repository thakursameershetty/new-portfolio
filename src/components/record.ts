import { monthOf, type TimelineItem } from "./AboutTimeline";

// Everything below the statement comes from the résumé (public/resume.pdf), and only what
// it states: keep the two in step when either changes. (Practice, the Figma explorations,
// is the owner's own addition.)
export interface Entry {
  title: string;
  detail?: string;
  when?: string;
  /** Its place on the timeline, for entries with dates. */
  timeline?: Omit<TimelineItem, "id" | "tone">;
}

// Hackathons share a lane, each a single month, drawn as a solid mark.
function oneMonth(year: number, month: number) {
  return {
    lane: "hackathons",
    group: "Hackathons",
    from: monthOf(year, month),
    to: monthOf(year, month),
  };
}

// `compact` groups (the toolkit) put each label and its list on one line. `tone` colours the
// group's bars on the timeline, and a swatch by its heading keys the two together.
export const record: {
  heading: string;
  tone?: TimelineItem["tone"];
  compact?: boolean;
  /** Show by its heading how many years its first entry has run (Figma: 5+ yrs). */
  years?: boolean;
  entries: Entry[];
}[] = [
    {
      heading: "Experience",
      tone: "work",
      years: true,
      entries: [
        {
          title: "Spotmies LLP",
          detail:
            "UI/UX designer at a product studio serving 40+ startups. I design client apps and websites end to end, and grew the role into building them too, from the first screen to the backend.",
          when: "Dec 2025 – now",
          timeline: { short: "Spotmies", lane: "work", from: monthOf(2025, 12), to: "now" },
        },
      ],
    },
    {
      heading: "Education",
      tone: "study",
      entries: [
        {
          title: "B.Tech, Computer Science",
          detail: "Gayatri Vidya Parishad College · CGPA 8.54",
          when: "2023 – 2026",
          timeline: { short: "B.Tech", lane: "study", from: monthOf(2023, 8), to: monthOf(2026, 6) },
        },
        {
          title: "Diploma, Electrical & Electronics",
          detail: "Government Polytechnic Visakhapatnam",
          when: "2020 – 2023",
          timeline: { short: "Diploma", lane: "study", from: monthOf(2020, 3), to: monthOf(2023, 5) },
        },
      ],
    },
    {
      heading: "Hackathons",
      tone: "event",
      entries: [
        {
          title: "Smart India Hackathon",
          detail: "National selection · YatraSarthi, AI train traffic management for Indian Railways",
          when: "Nov 2025",
          timeline: { short: "SIH", ...oneMonth(2025, 11) },
        },
        {
          title: "Hack With Vizag 3.0",
          detail: "36-hour hackathon · CogniScan, AI for cognitive assessment",
          when: "Sep 2025",
          timeline: { short: "HWV", ...oneMonth(2025, 9) },
        },
        {
          title: "Tutedude Hackathon",
          detail: "Solo Traveler App: the high-fidelity design, from our team's user research, in under 24 hours",
          when: "Jul 2025",
          timeline: { short: "Tutedude", ...oneMonth(2025, 7) },
        },
        {
          title: "GDG IWD",
          detail: "24-hour hackathon · MindBridge, AI for accessibility",
          when: "Mar 2025",
          timeline: { short: "GDG", ...oneMonth(2025, 3) },
        },
      ],
    },
    {
      heading: "Practice",
      tone: "practice",
      years: true,
      entries: [
        {
          title: "Figma, self-taught",
          detail:
            "Self-taught, and still exploring: small interactions and ideas, tried out as prototypes.",
          when: "Jun 2021 – now",
          timeline: {
            short: "Figma practice",
            lane: "practice",
            from: monthOf(2021, 6),
            to: "now",
            wavy: true,
            // Learning until then; fluent (and still practising) after.
            settles: monthOf(2022, 2),
            logo: "figma",
            href: "/playground",
          },
        },
      ],
    },
    {
      heading: "Toolkit",
      compact: true,
      entries: [
        { title: "Design", detail: "Figma, design systems, wireframing, After Effects" },
        { title: "Motion", detail: "Framer Motion, React Reanimated" },
        { title: "Frontend", detail: "React, Next.js, TypeScript, React Native, Three.js" },
        { title: "Backend", detail: "Node.js, Express, Python, Flask, Prisma, MongoDB" },
        { title: "AI", detail: "OpenCV, MediaPipe, scikit-learn, Gemini API" },
      ],
    },
  ];

export const timelineItems: TimelineItem[] = record.flatMap((group) =>
  group.entries.flatMap((entry) =>
    entry.timeline && group.tone
      ? [{ id: entry.title, tone: group.tone, ...entry.timeline }]
      : [],
  ),
);

