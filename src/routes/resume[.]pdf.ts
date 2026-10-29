import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/resume.pdf")({
  server: {
    handlers: {
      GET: ({ request }) =>
        Response.redirect(new URL("/pdfs/resume.pdf", request.url), 302),
    },
  },
});
