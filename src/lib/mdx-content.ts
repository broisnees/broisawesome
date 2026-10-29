import { type ComponentType, use } from "react";
import type { MDXComponents } from "mdx/types";

type MdxContent = ComponentType<{ components?: MDXComponents }>;
type MdxModule = { default: MdxContent };

/**
 * Lazy MDX bodies, one chunk per page. A route loader calls `load(slug)` so the
 * chunk is ready before render (server and client navigation); on the first
 * hydration `useContent` suspends until the chunk arrives, and React keeps the
 * server HTML on screen meanwhile.
 */
function collection(
  loaders: Record<string, () => Promise<MdxModule>>,
  pathFor: (slug: string) => string,
) {
  const ready = new Map<string, MdxContent | undefined>();
  const pending = new Map<string, Promise<MdxContent | undefined>>();

  function load(slug: string) {
    let promise = pending.get(slug);
    if (!promise) {
      const loader = loaders[pathFor(slug)];
      promise = loader
        ? loader().then((mod) => mod.default)
        : Promise.resolve(undefined);
      promise.then((content) => ready.set(slug, content));
      pending.set(slug, promise);
    }
    return promise;
  }

  function useContent(slug: string) {
    return ready.has(slug) ? ready.get(slug) : use(load(slug));
  }

  return { load, useContent, has: (slug: string) => pathFor(slug) in loaders };
}

export const postContent = collection(
  import.meta.glob<MdxModule>("../content/*/route.mdx"),
  (slug) => `../content/${slug}/route.mdx`,
);

export const projectContent = collection(
  import.meta.glob<MdxModule>("../projects/*.mdx"),
  (slug) => `../projects/${slug}.mdx`,
);
