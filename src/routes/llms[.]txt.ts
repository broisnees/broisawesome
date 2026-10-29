import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "~/lib/seo";
import { CATEGORIES, PROJECTS, slugOf } from "~/lib/site";
import { getPosts } from "~/server/posts.server";

export const Route = createFileRoute("/llms.txt")({
  server: {
    handlers: {
      GET: () => {
        const posts = getPosts()
          .filter((post) => post.date)
          .map(
            (post) =>
              `- [${post.title}](${SITE_URL}/writing/${post.slug}.md) (${post.date})`,
          )
          .join("\n");

        const projects = CATEGORIES.map((category) => {
          const items = PROJECTS.filter((p) => p.category === category.id)
            .map(
              (p) =>
                `- [${p.name}](${SITE_URL}/projects/${slugOf(p)}): ${p.description}`,
            )
            .join("\n");
          return `### ${category.title}\n\n${items}`;
        }).join("\n\n");

        const text = `# Nischal Dahal

> Full-stack engineer in Kathmandu, Nepal. @broisnees on GitHub and X. Personal site with projects and writing.

## Pages

- [Home](${SITE_URL}/): short intro, top projects, latest posts
- [Writing](${SITE_URL}/writing): every post, grouped by year
- [Projects](${SITE_URL}/projects): products, tools, libraries, and my setup repos; each has a page at /projects/<slug>
- [Gallery](${SITE_URL}/gallery): photos from my Google Photos album
- [About](${SITE_URL}/about): what I do now and how to reach me
- [Links](${SITE_URL}/links): profiles (GitHub, X, npm, and more)
- [Resume](${SITE_URL}/resume.pdf)

## Writing

Each post is also plain Markdown at /writing/<slug>.md (linked below).

${posts}

## Projects

${projects}

## Contact

- Email: broisnees@gmail.com
- Say hi without email: POST ${SITE_URL}/hi with a plain-text body, or form or JSON fields \`message\` and \`contact\` (an email or phone number; rate limited). It reaches my phone.

## Feeds

- RSS: ${SITE_URL}/blogs.rss
- JSON Feed: ${SITE_URL}/feed.json
- Sitemap: ${SITE_URL}/sitemap.xml
`;

        return new Response(text, {
          headers: { "Content-Type": "text/plain; charset=utf-8" },
        });
      },
    },
  },
});
