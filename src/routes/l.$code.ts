import { createFileRoute } from "@tanstack/react-router";

/** Short links: /l/github, /l/x, ... tagged with UTM params on the way out. */
const LINKS: Record<string, string> = {
  github: "https://github.com/broisnees",
  linkedin: "https://linkedin.com/in/broisnischal",
  twitter: "https://twitter.com/broisnees",
  x: "https://x.com/broisnees",
  discord: "https://discord.com/users/broisnees",
  youtube: "https://youtube.com/@broisnees",
};

export const Route = createFileRoute("/l/$code")({
  server: {
    handlers: {
      GET: ({ request, params }) => {
        const code = params.code.toLowerCase();
        const url = LINKS[code];
        if (!url) return new Response("Link not found", { status: 404 });

        const target = new URL(url);
        target.searchParams.set("utm_source", "portfolio");
        target.searchParams.set("utm_medium", "referral");
        target.searchParams.set("utm_campaign", `link_${code}`);
        const referrer = request.headers.get("referer");
        if (referrer && URL.canParse(referrer)) {
          target.searchParams.set("ref", new URL(referrer).hostname);
        }
        return Response.redirect(target.toString(), 301);
      },
    },
  },
});
