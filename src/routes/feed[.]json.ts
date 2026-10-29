import { createFileRoute } from "@tanstack/react-router";
import { SITE_URL } from "~/lib/seo";
import { getPosts } from "~/server/posts.server";

export const Route = createFileRoute("/feed.json")({
  server: {
    handlers: {
      GET: () =>
        Response.json(
          {
            version: "https://jsonfeed.org/version/1.1",
            title: "Nischal Dahal",
            home_page_url: SITE_URL,
            feed_url: `${SITE_URL}/feed.json`,
            description:
              "Writing by Nischal Dahal on web development, payments, deployment, and the tools I use.",
            icon: "https://avatars.githubusercontent.com/u/98168009?v=4",
            authors: [
              { name: "Nischal Dahal", url: "https://x.com/broisnees" },
            ],
            items: getPosts()
              .filter((post) => post.date)
              .map((post) => ({
                id: post.slug,
                url: `${SITE_URL}/writing/${post.slug}`,
                title: post.title,
                content_text: post.description ?? post.title,
                date_published: post.date,
              })),
          },
          {
            headers: { "Content-Type": "application/feed+json; charset=utf-8" },
          },
        ),
    },
  },
});
