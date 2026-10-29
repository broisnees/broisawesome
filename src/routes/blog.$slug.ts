import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/blog/$slug")({
  server: {
    handlers: {
      GET: ({ request, params }) =>
        Response.redirect(new URL(`/writing/${params.slug}`, request.url), 301),
    },
  },
});
