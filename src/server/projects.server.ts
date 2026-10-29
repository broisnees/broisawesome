import type { MDXComponents } from "mdx/types";
import type { ComponentType } from "react";
import { ALL_PROJECTS, findProject, slugOf } from "~/lib/site";
import { cardFor, readMinutes, wordsIn } from "./mdx.server";

type Frontmatter = {
  /** A short search title, when "name: one-liner" runs past ~60 characters. */
  title?: string;
  /** When the write-up went up (YYYY-MM-DD). */
  published?: string;
  /** A fuller sentence for search results (the page itself shows the one-liner). */
  description?: string;
};

type WriteupModule = {
  default: ComponentType<{ components?: MDXComponents }>;
  frontmatter?: Frontmatter;
};

// Write-ups live in src/projects/<slug>.mdx. Files starting with "_" are templates.
const writeups = import.meta.glob<WriteupModule>("../projects/*.mdx", {
  eager: true,
});

function writeupFor(slug: string) {
  return writeups[`../projects/${slug}.mdx`];
}

/** One project's page data: the item from site.ts plus its write-up, if any. */
export function getProjectPage(slug: string) {
  const item = findProject(slug);
  if (!item) return undefined;
  const writeup = writeupFor(slug);
  const wordCount = writeup ? wordsIn(writeup.default) : 0;
  return {
    ...item,
    slug,
    // The page keeps the short one-liner; search gets the write-up's fuller sentence.
    metaDescription: writeup?.frontmatter?.description ?? item.description,
    metaTitle:
      writeup?.frontmatter?.title ??
      `${item.name}: ${item.description.replace(/\.$/, "")}`,
    published: writeup?.frontmatter?.published,
    hasWriteup: Boolean(writeup),
    wordCount,
    readMinutes: writeup ? readMinutes(wordCount) : 0,
    image: cardFor("projects", slug),
  };
}

/** Slugs with a written-up page: the ones worth indexing. */
export function writtenProjects() {
  return ALL_PROJECTS.map(slugOf).filter((slug) => writeupFor(slug));
}
