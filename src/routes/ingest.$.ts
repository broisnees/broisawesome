import { createFileRoute } from "@tanstack/react-router";

// PostHog through my own domain: ad blockers drop requests to *.posthog.com,
// not to /ingest. Scripts and config come from the assets host.
const API = "https://us.i.posthog.com";
const ASSETS = "https://us-assets.i.posthog.com";

export const Route = createFileRoute("/ingest/$")({
  server: {
    handlers: {
      ANY: async ({ request }) => {
        const { pathname, search } = new URL(request.url);
        const path = pathname.replace(/^\/ingest/, "");
        const origin = /^\/(static|array)\//.test(path) ? ASSETS : API;

        const headers = new Headers(request.headers);
        headers.delete("cookie");
        headers.delete("host");
        // Without this every visitor geolocates to the Worker.
        const ip = request.headers.get("cf-connecting-ip");
        if (ip) headers.set("x-forwarded-for", ip);

        const hasBody = !["GET", "HEAD"].includes(request.method);
        const res = await fetch(origin + path + search, {
          method: request.method,
          headers,
          body: hasBody ? request.body : undefined,
          redirect: "manual",
        });
        // Fresh headers, so the framework can add its own.
        return new Response(res.body, res);
      },
    },
  },
});
