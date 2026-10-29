import { createFileRoute } from "@tanstack/react-router";
import { readPath, SITE_URL } from "~/lib/seo";
import { CATEGORIES } from "~/lib/site";
import { getPosts } from "~/server/posts.server";
import { writtenProjects } from "~/server/projects.server";

const PAGES = ["/", "/writing", "/projects", "/gallery", "/about", "/links"];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: () => {
        const today = new Date().toISOString().slice(0, 10);
        const entries = [
          ...PAGES.map((path) => ({
            loc: `${SITE_URL}${path}`,
            lastmod: today,
          })),
          // Each category is its own page (own title and canonical).
          ...CATEGORIES.map((category) => ({
            loc: `${SITE_URL}/projects?filter=${category.id}`,
            lastmod: today,
          })),
          ...writtenProjects().map((slug) => ({
            loc: `${SITE_URL}/projects/${slug}`,
            lastmod: today,
          })),
          ...getPosts()
            .filter((post) => post.date)
            .map((post) => ({
              loc: `${SITE_URL}${readPath(post.slug)}`,
              lastmod: post.date!,
            })),
        ];

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${entries.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod></url>`).join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: { "Content-Type": "application/xml; charset=utf-8" },
        });
      },
    },
  },
});
