import { createFileRoute } from "@tanstack/react-router";
import { getPostMarkdown } from "~/server/posts.server";

/** /writing/<slug>.md: the post as plain Markdown, for agents and curl. */
export const Route = createFileRoute("/writing/{$slug}.md")({
  server: {
    handlers: {
      GET: ({ params }) => {
        const markdown = getPostMarkdown(params.slug);
        if (markdown === undefined) {
          return new Response("Not found", { status: 404 });
        }
        return new Response(markdown, {
          headers: {
            "Content-Type": "text/markdown; charset=utf-8",
            "Cache-Control": "public, max-age=300",
          },
        });
      },
    },
  },
});
