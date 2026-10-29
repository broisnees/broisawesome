import { cloudflare } from "@cloudflare/vite-plugin";
import mdx from "@mdx-js/rollup";
import tailwindcss from "@tailwindcss/vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { rehypePrettyCode } from "rehype-pretty-code";
import rehypeSlug from "rehype-slug";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

type MdNode = {
  type: string;
  lang?: string;
  meta?: string;
  value?: string;
  children?: MdNode[];
};

/**
 * A fence whose first line is only a filename comment (`// env.common.ts`,
 * `# .env`, `# /Dockerfile`) gets that filename as its title instead, so the
 * code block can show it in a header rather than as a line of code.
 */
function remarkCodeTitles() {
  const filename =
    /^\s*(?:\/\/|#)\s*\/?((?:[\w@-]+\/)*(?:[\w@-]*\.[\w.-]+|Dockerfile|Makefile))\s*$/;
  const walk = (node: MdNode) => {
    if (node.type === "code" && node.value && !/title=/.test(node.meta ?? "")) {
      const [first, ...rest] = node.value.split("\n");
      const match = first.match(filename);
      if (match && rest.length > 0) {
        if (rest[0].trim() === "") rest.shift();
        node.value = rest.join("\n");
        node.meta = `${node.meta ?? ""} title="${match[1]}"`.trim();
      }
    }
    node.children?.forEach(walk);
  };
  return walk;
}

/**
 * @mdx-js/rollup ignores the query when matching ids, so `post.mdx?raw` would
 * get compiled too. Let `?raw` through untouched: agent mode needs the source.
 */
function skipRawImports(
  plugin: ReturnType<typeof mdx>,
): ReturnType<typeof mdx> {
  const transform = plugin.transform as (
    this: unknown,
    code: string,
    id: string,
  ) => unknown;
  return {
    ...plugin,
    transform(this: unknown, code: string, id: string) {
      if (id.includes("?raw")) return null;
      return transform.call(this, code, id);
    },
  } as ReturnType<typeof mdx>;
}

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
    // MDX files aren't part of the TS project, so give "~/" a plain alias too.
    alias: { "~": fileURLToPath(new URL("./src", import.meta.url)) },
  },
  plugins: [
    // The Worker runs the SSR environment; Start owns routing and server fns.
    cloudflare({ viteEnvironment: { name: "ssr" } }),
    {
      enforce: "pre",
      ...skipRawImports(
        mdx({
          remarkPlugins: [
            remarkFrontmatter,
            remarkMdxFrontmatter,
            remarkGfm,
            remarkCodeTitles,
          ],
          rehypePlugins: [
            rehypeSlug,
            () =>
              rehypePrettyCode({
                // Both themes ship as CSS variables; styles.css picks one per scheme.
                theme: { light: "github-light", dark: "vesper" },
                keepBackground: false,
              }),
          ],
        }),
      ),
    },
    tailwindcss(),
    tanstackStart(),
    viteReact(),
  ],
});
