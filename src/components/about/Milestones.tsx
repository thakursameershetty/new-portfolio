import Link from "next/link";
import { PrototypesLink } from "../Explorations";
import styles from "./Milestones.module.css";

// The longer timeline on the About page, newest first. Only what the case studies and the
// résumé say; `project` links a milestone to its case study at /work/[id].
type Tone = "work" | "study" | "event" | "project" | "practice";

interface Milestone {
  when: string;
  tone: Tone;
  title: string;
  detail: string;
  project?: string;
  /** Links to the Figma prototypes in place of a case study. */
  prototypes?: boolean;
}

const milestones: Milestone[] = [
  {
    when: "Sep 2026",
    tone: "work",
    title: "MutinyX, version 2",
    detail:
      "Redesigned the creator app in five days in August, dark with the MutinyX yellow, and built its frontend in September.",
    project: "mutiny",
  },
  {
    when: "Jul 2026",
    tone: "work",
    title: "Rao Bahadur",
    detail:
      "A fan site and admin panel for the film's release, designed and built alone in six days. Fans posted 271 theories.",
    project: "raobahadur",
  },
  {
    when: "Jun 2026",
    tone: "study",
    title: "Graduated: B.Tech, Computer Science",
    detail:
      "Gayatri Vidya Parishad College, CGPA 8.54. The final-year project was SamudraGupt-Q, a security simulation for underwater drone swarms, built alone.",
    project: "samudragupt",
  },
  {
    when: "Jun 2026",
    tone: "work",
    title: "Peddi on Roblox",
    detail:
      "Co-built the game world for the film's launch, announced by its official X account.",
    project: "peddi",
  },
  {
    when: "May 2026",
    tone: "work",
    title: "TMN · Satara Today",
    detail:
      "Designed a news app and website that work in English and Marathi alike.",
    project: "tmn",
  },
  {
    when: "Apr 2026",
    tone: "project",
    title: "The Newspaper",
    detail:
      "A news app I designed on my own as a draft, in light and dark. Parts of it went into TMN · Satara Today the next month.",
    project: "the-newspaper",
  },
  {
    when: "Mar 2026",
    tone: "work",
    title: "MutinyX, version 1",
    detail:
      "About 35 screens designed in three days at the end of February, then some of them built in React Native with the team in March. My first big project at Spotmies.",
    project: "mutiny",
  },
  {
    when: "Feb 2026",
    tone: "work",
    title: "Spotmies' own website",
    detail:
      "Researched, designed and built in Next.js, replacing a stock-photo template.",
    project: "spotmies",
  },
  {
    when: "Dec 2025",
    tone: "work",
    title: "Joined Spotmies",
    detail:
      "Hired as a UI/UX designer. First project: refining Amero X, a crypto trading platform, and building its landing page.",
    project: "amerox",
  },
  {
    when: "Nov 2025",
    tone: "event",
    title: "Smart India Hackathon",
    detail:
      "Researched and pitched YatraSarthi, an AI idea for managing train traffic on Indian Railways. It didn't go through to the next round, but the judges praised the idea and the pitch.",
  },
  {
    when: "Sep 2025",
    tone: "event",
    title: "Hack With Vizag 3.0",
    detail: "36 hours on CogniScan, AI for cognitive assessment.",
  },
  {
    when: "Jul 2025",
    tone: "event",
    title: "Tutedude Hackathon",
    detail:
      "Designed 19 high-fidelity screens for a solo travel app in under 24 hours, from our team's survey and interviews.",
  },
  {
    when: "Apr 2025",
    tone: "project",
    title: "AI Gym Trainer",
    detail:
      "A fitness dashboard whose camera counts your bicep curls, built with MediaPipe and Flask.",
    project: "gym",
  },
  {
    when: "Mar 2025",
    tone: "event",
    title: "GDG IWD hackathon",
    detail: "24 hours on MindBridge, AI for accessibility.",
  },
  {
    when: "Aug 2023",
    tone: "study",
    title: "Started a B.Tech in Computer Science",
    detail: "After the diploma, on to computer science.",
  },
  {
    when: "May 2023",
    tone: "study",
    title: "Diploma, Electrical & Electronics",
    detail: "Government Polytechnic Visakhapatnam, 2020 to 2023, with 80%.",
  },
  {
    when: "Jun 2021",
    title: "Started designing in Figma",
    tone: "practice",
    detail:
      "Self-taught, trying out small interactions and ideas as prototypes. I haven't stopped since.",
    prototypes: true,
  },
];

/** Month by month, newest first: what shipped, what was learned, and where to read more. */
export function Milestones() {
  return (
    <ol className={styles.list}>
      {milestones.map((milestone) => (
        <li
          key={`${milestone.when}-${milestone.title}`}
          className={styles.item}
          style={
            {
              "--tone": `var(--tone-${milestone.tone})`,
              "--fill": `var(--tone-${milestone.tone}-fill, var(--tone-${milestone.tone}))`,
            } as React.CSSProperties
          }
        >
          <span className={styles.when}>{milestone.when}</span>
          <span aria-hidden="true" className={styles.dot} />
          <div className={styles.body}>
            <h4 className={styles.title}>{milestone.title}</h4>
            <p className={styles.detail}>{milestone.detail}</p>
            {milestone.project && (
              <Link
                href={`/work/${milestone.project}`}
                className={styles.link}
                data-feel="tap"
              >
                Case study
                <svg
                  aria-hidden="true"
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            )}
            {milestone.prototypes && (
              <PrototypesLink className={styles.prototypes} />
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
