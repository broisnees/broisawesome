import { createFileRoute } from "@tanstack/react-router";

// An even older URL shape for posts.
export const Route = createFileRoute("/blogs/$slug")({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        Response.redirect(new URL(`/writing/${params.slug}`, request.url), 301),
    },
  },
});
