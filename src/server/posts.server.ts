import type { MDXComponents } from "mdx/types";
import type { ComponentType } from "react";
import { SITE_URL } from "~/lib/seo";
import { cardFor, readMinutes, wordsIn } from "./mdx.server";

type Frontmatter = {
  title?: string;
  description?: string;
  published?: string;
  image?: string;
};

type PostModule = {
  default: ComponentType<{ components?: MDXComponents }>;
  frontmatter?: Frontmatter;
};

export type Post = {
  slug: string;
  title: string;
  description?: string;
  /** ISO date (YYYY-MM-DD). Posts without one are drafts. */
  date?: string;
  image?: string;
};

// Server-side only for metadata and word counts. The body itself loads in the
// browser per post (src/lib/mdx-content.ts), so interactive MDX hydrates.
const modules = import.meta.glob<PostModule>("../content/*/route.mdx", {
  eager: true,
});

const entries = Object.entries(modules).map(([path, mod]) => {
  const fm = mod.frontmatter ?? {};
  const slug = path.replace(/^\.\.\/content\/|\/route\.mdx$/g, "");
  const post: Post = {
    slug,
    title: fm.title?.trim() || slug.replace(/-/g, " "),
    description: fm.description?.trim() || undefined,
    date: fm.published
      ? new Date(fm.published).toISOString().slice(0, 10)
      : undefined,
    // A generated 1200x630 card beats an arbitrary in-post image for sharing.
    image: cardFor("writing", slug) ?? fm.image,
  };
  return { post, Content: mod.default };
});

const visible = entries.filter((e) => import.meta.env.DEV || e.post.date);

/** Published posts, newest first. Drafts show up only in dev. */
export function getPosts(): Post[] {
  return visible
    .map((e) => e.post)
    .sort((a, b) => (b.date ?? "").localeCompare(a.date ?? ""));
}

/** One post's metadata, with its length. */
export function getPost(slug: string) {
  const entry = visible.find((e) => e.post.slug === slug);
  if (!entry) return undefined;
  const wordCount = wordsIn(entry.Content);
  return { ...entry.post, wordCount, readMinutes: readMinutes(wordCount) };
}

// The same files as plain text, for agent mode's "Copy page".
const sources = import.meta.glob<string>("../content/*/route.mdx", {
  eager: true,
  query: "?raw",
  import: "default",
});

/**
 * A post as clean Markdown for an LLM: a title, the description as a quote,
 * the canonical URL, then the body with frontmatter, MDX imports/exports and
 * JSX comments taken out.
 */
export function getPostMarkdown(slug: string) {
  const entry = visible.find((e) => e.post.slug === slug);
  const source = sources[`../content/${slug}/route.mdx`];
  if (!entry || source === undefined) return undefined;
  const body = source
    .replace(/^---\n[\s\S]*?\n---\n/, "")
    .replace(/^(import|export) .*$/gm, "")
    .replace(/\{\/\*[\s\S]*?\*\/\}/g, "")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
  const { title, description, date } = entry.post;
  return [
    `# ${title}`,
    description && `> ${description}`,
    `Source: ${SITE_URL}/writing/${slug}${date ? ` (${date})` : ""}`,
    body,
  ]
    .filter(Boolean)
    .join("\n\n");
}
