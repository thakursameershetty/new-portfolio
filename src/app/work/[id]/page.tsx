import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProjectView } from "@/components/ProjectView";
import { PageSound } from "@/components/SiteIntro";
import { projects } from "@/components/projects";
import { jsonLd, projectImage, projectJsonLd } from "@/components/site";
import styles from "./page.module.css";

// A project's file as a page of its own, for links shared or opened directly. From the site,
// the disks open the same view over the home page instead (Work.tsx), at this same URL.
export const dynamicParams = false;

export function generateStaticParams() {
  return projects.map((project) => ({ id: project.id }));
}

export async function generateMetadata({
  params,
}: PageProps<"/work/[id]">): Promise<Metadata> {
  const { id } = await params;
  const project = projects.find((entry) => entry.id === id);
  if (!project) return {};
  const url = `/work/${project.id}`;
  // Its own picture, or the site's link preview (a page's own openGraph replaces the one it
  // would inherit).
  const image = projectImage(project) ?? "/opengraph-image";
  const title = `${project.title}: ${project.kind}`;
  return {
    title,
    description: project.summary,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: `${title} — Thakur Sameer Shetty`,
      description: project.summary,
      images: [{ url: image, alt: project.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — Thakur Sameer Shetty`,
      description: project.summary,
      images: [image],
    },
  };
}

export default async function ProjectPage({ params }: PageProps<"/work/[id]">) {
  const { id } = await params;
  const project = projects.find((entry) => entry.id === id);
  if (!project) notFound();
  // Its own sound, as on /about: a shared link hears the case study as the home page's
  // overlay does, with the sound key beside the hints switch.
  return (
    <PageSound>
      <main className={styles.page}>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: jsonLd(projectJsonLd(project)) }}
        />
        <ProjectView project={project} />
      </main>
    </PageSound>
  );
}
