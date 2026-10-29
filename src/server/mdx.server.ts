import "@tanstack/react-start/server-only";
import { type ComponentType, createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { mdxComponents } from "~/components/mdx";
// Pages with a generated 1200x630 card in public/og (see scripts/og.mjs),
// as "writing/<slug>" or "projects/<slug>".
import ogManifest from "~/lib/og-manifest.json";

const cards: string[] = ogManifest;
const counts = new WeakMap<ComponentType, number>();

/** Words in a rendered MDX body, for read time and structured data. */
export function wordsIn(
  Content: ComponentType<{ components?: typeof mdxComponents }>,
) {
  let n = counts.get(Content);
  if (n === undefined) {
    // Same components as the page, so <Callout> and friends resolve.
    n = renderToStaticMarkup(
      createElement(Content, { components: mdxComponents }),
    )
      .replace(/<[^>]+>/g, " ")
      .split(/\s+/)
      .filter(Boolean).length;
    counts.set(Content, n);
  }
  return n;
}

export function readMinutes(words: number) {
  return Math.max(1, Math.round(words / 220));
}

/** The generated social card for a page, if there is one. */
export function cardFor(kind: "writing" | "projects", slug: string) {
  const key = `${kind}/${slug}`;
  return cards.includes(key) ? `/og/${key}.png` : undefined;
}
