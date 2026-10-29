import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "~/lib/seo";
import { getPosts } from "~/server/posts.server";

function escapeXml(text: string) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export const Route = createFileRoute("/blogs.rss")({
  server: {
    handlers: {
      GET: () => {
        const items = getPosts()
          .filter((post) => post.date)
          .map((post) => {
            const link = `${SITE_URL}/writing/${post.slug}`;
            return `    <item>
      <title>${escapeXml(post.title)}</title>
      <link>${link}</link>
      <guid>${link}</guid>
      <description>${escapeXml(post.description ?? post.title)}</description>
      <pubDate>${new Date(post.date!).toUTCString()}</pubDate>
    </item>`;
          })
          .join("\n");

        const rss = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Nischal Dahal</title>
    <link>${SITE_URL}/writing</link>
    <description>Writing by Nischal Dahal on web development, payments, deployment, and the tools I use.</description>
    <atom:link href="${SITE_URL}/blogs.rss" rel="self" type="application/rss+xml" />
    <language>en-us</language>
${items}
  </channel>
</rss>`;

        return new Response(rss, {
          headers: { "Content-Type": "application/rss+xml; charset=utf-8" },
        });
      },
    },
  },
});
