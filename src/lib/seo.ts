export const SITE_URL = "https://nischal-dahal.com.np";
export const NAME = "Nischal Dahal";

const HANDLE = "@broisnees";
/** 1200x630 card for pages without their own; built by `bun run og`. */
const DEFAULT_IMAGE = "/og/default.png";

export function absolute(path: string) {
  return new URL(path, SITE_URL).href;
}

/** A post's canonical URL. */
export const readPath = (slug: string) => `/writing/${slug}`;

type Seo = {
  /** Page name; the site name is appended. Omit on the home page. */
  title?: string;
  description: string;
  path: string;
  type?: "website" | "article" | "profile";
  publishedTime?: string;
  image?: string;
  imageAlt?: string;
  /** Keep thin pages (e.g. a project with no write-up yet) out of search. */
  noindex?: boolean;
};

/** Meta tags and canonical link for a route's `head()`. */
export function seo({
  title,
  description,
  path,
  type = "website",
  publishedTime,
  image = DEFAULT_IMAGE,
  imageAlt,
  noindex = false,
}: Seo) {
  const fullTitle = title
    ? `${title} | ${NAME}`
    : `${NAME} · Full-stack engineer in Kathmandu`;
  const url = absolute(path);
  const imageUrl = absolute(image);
  const alt = imageAlt ?? title ?? NAME;

  return {
    meta: [
      { title: fullTitle },
      { name: "description", content: description },
      { name: "author", content: NAME },
      ...(noindex ? [{ name: "robots", content: "noindex, follow" }] : []),
      { property: "og:type", content: type },
      { property: "og:site_name", content: NAME },
      { property: "og:locale", content: "en_US" },
      { property: "og:url", content: url },
      { property: "og:title", content: fullTitle },
      { property: "og:description", content: description },
      { property: "og:image", content: imageUrl },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: alt },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:site", content: HANDLE },
      { name: "twitter:creator", content: HANDLE },
      { name: "twitter:title", content: fullTitle },
      { name: "twitter:description", content: description },
      { name: "twitter:image", content: imageUrl },
      { name: "twitter:image:alt", content: alt },
      ...(publishedTime
        ? [
            { property: "article:published_time", content: publishedTime },
            { property: "article:author", content: SITE_URL },
          ]
        : []),
    ],
    links: [{ rel: "canonical", href: url }],
  };
}

/** One JSON-LD script holding every node for the page, linked by @id. */
export function jsonLd(...nodes: Record<string, unknown>[]) {
  return {
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@graph": nodes,
    }),
  };
}

const PERSON_ID = `${SITE_URL}/#person`;
const WEBSITE_ID = `${SITE_URL}/#website`;

export const PERSON = {
  "@type": "Person",
  "@id": PERSON_ID,
  name: NAME,
  alternateName: ["broisnees", "broisnischal"],
  url: SITE_URL,
  image: absolute("/avatar.jpg"),
  jobTitle: "Full-stack engineer",
  worksFor: { "@type": "Organization", name: "AITC International" },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Kathmandu",
    addressCountry: "NP",
  },
  sameAs: [
    "https://github.com/broisnees",
    "https://x.com/broisnees",
    "https://instagram.com/broisnees",
    "https://www.npmjs.com/~broisnees",
    "https://pub.dev/publishers/nischal-dahal.com.np/packages",
  ],
};

export const WEBSITE = {
  "@type": "WebSite",
  "@id": WEBSITE_ID,
  url: SITE_URL,
  name: NAME,
  description: "Projects and writing by Nischal Dahal, a full-stack engineer.",
  inLanguage: "en",
  publisher: { "@id": PERSON_ID },
};

export const AUTHOR = { "@id": PERSON_ID };

/** Home > ... trail, for search result breadcrumbs. */
export function breadcrumbs(trail: { name: string; path: string }[]) {
  return {
    "@type": "BreadcrumbList",
    itemListElement: [{ name: "Home", path: "/" }, ...trail].map((item, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: item.name,
      item: absolute(item.path),
    })),
  };
}
