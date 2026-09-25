import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectView } from "@/components/ProjectView";
import { projects } from "@/components/projects";
import styles from "./page.module.css";

// A project's file as a page of its own, for links shared or opened directly. From the site,
// the disks open the same view over the home page instead (Work.tsx), at this same URL.
export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ id: project.id }));
}

export async function generateMetadata({ params }: PageProps<"/work/[id]">): Promise<Metadata> {
  const { id } = await params;
  const project = projects.find((entry) => entry.id === id);
  if (!project) return {};
  return {
    title: `${project.title} — Thakur Sameer Shetty`,
    description: project.summary,
  };
}

export default async function ProjectPage({ params }: PageProps<"/work/[id]">) {
  const { id } = await params;
  const project = projects.find((entry) => entry.id === id);
  if (!project) notFound();
  return (
    <main className={styles.page}>
      <ProjectView project={project} />
    </main>
  );
}
