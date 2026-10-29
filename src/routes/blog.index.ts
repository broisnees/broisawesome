import { createFileRoute } from "@tanstack/react-router";

// Posts used to live under /blog. Keep old links working.
export const Route = createFileRoute("/blog/")({
  server: {
    handlers: {
      GET: ({ request }) =>
        Response.redirect(new URL("/writing", request.url), 301),
    },
  },
});
