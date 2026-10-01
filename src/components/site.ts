// Who the site is and where it lives: one place for the metadata, the structured data
// (JSON-LD) for search engines, the sitemap, and the Contact section's links.

import type { Project } from "./projects";

export const site = {
  url: "https://thakursameershetty.com",
  name: "Thakur Sameer Shetty",
  shortName: "Thakur",
  jobTitle: "Product Designer",
  title: "Thakur Sameer Shetty — Product Designer",
  description:
    "Making things feel right. Product designer who prototypes in code: research, interfaces and micro-interactions, from Figma to production.",
  photo: "/about/id/photo.webp",
  location: { city: "Visakhapatnam", region: "Andhra Pradesh", country: "IN" },
  links: {
    linkedin: "https://www.linkedin.com/in/thakur-sameer-shetty-tammana/",
    threads: "https://www.threads.com/@thakur.sameer.shetty",
    github: "https://github.com/thakursameershetty",
  },
};

export const absolute = (path: string) => new URL(path, site.url).toString();

// A project's picture for link previews: its first still, or a clip's poster.
export function projectImage(project: Project) {
  const first = project.media?.find(
    (item) => item.type === "image" || item.type === "video",
  );
  if (!first) return undefined;
  return first.type === "video" ? first.poster : first.src;
}

const person = {
  "@type": "Person",
  "@id": `${site.url}/#person`,
  name: site.name,
  alternateName: site.shortName,
  url: site.url,
  image: absolute(site.photo),
  jobTitle: site.jobTitle,
  description: site.description,
  worksFor: {
    "@type": "Organization",
    name: "Spotmies LLP",
    url: "https://www.spotmies.com",
  },
  alumniOf: [
    {
      "@type": "CollegeOrUniversity",
      name: "Gayatri Vidya Parishad College for Degree & P.G. Courses",
    },
    {
      "@type": "EducationalOrganization",
      name: "Government Polytechnic Visakhapatnam",
    },
  ],
  address: {
    "@type": "PostalAddress",
    addressLocality: site.location.city,
    addressRegion: site.location.region,
    addressCountry: site.location.country,
  },
  knowsAbout: [
    "Product design",
    "UI/UX design",
    "Interaction design",
    "Micro-interactions",
    "Prototyping",
    "Figma",
    "React",
    "Next.js",
    "Three.js",
  ],
  sameAs: Object.values(site.links),
};

/** Home: the site and the person it's about. */
export const homeJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    person,
    {
      "@type": "WebSite",
      "@id": `${site.url}/#website`,
      url: site.url,
      name: site.name,
      description: site.description,
      inLanguage: "en",
      publisher: { "@id": `${site.url}/#person` },
    },
  ],
};

/** About: a profile page, about the same person. */
export const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "ProfilePage",
  url: absolute("/about"),
  mainEntity: person,
};

/** A case study, made by that person. */
export function projectJsonLd(project: Project) {
  const image = projectImage(project);
  return {
    "@context": "https://schema.org",
    "@type": "CreativeWork",
    name: project.title,
    headline: project.caseStudy?.headline ?? project.title,
    description: project.summary,
    url: absolute(`/work/${project.id}`),
    ...(image && { image: absolute(image) }),
    genre: project.kind,
    keywords: project.stack.join(", "),
    creator: { "@id": `${site.url}/#person` },
    author: { "@type": "Person", name: site.name, url: site.url },
  };
}

// Safe inside a <script>: no "<" to close the tag early.
export const jsonLd = (data: unknown) =>
  JSON.stringify(data).replace(/</g, "\\u003c");
