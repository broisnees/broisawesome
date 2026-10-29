import { createFileRoute } from "@tanstack/react-router";
import { albumPhotoSource } from "~/server/gallery.server";

// 32 is the blurred placeholder; the rest are srcset steps and the viewer.
const WIDTHS = new Set([32, 400, 800, 1200, 2048]);
const MONTH = 60 * 60 * 24 * 30;

/**
 * Album photos, served from my domain. Linking Google's URLs straight from the
 * page breaks in some browsers, so the Worker fetches them instead. Only photos
 * in my album, only at fixed widths, so this isn't an open proxy; Cloudflare
 * keeps a copy at the edge for a month.
 */
export const Route = createFileRoute("/photos/$id")({
  server: {
    handlers: {
      GET: async ({ params, request }) => {
        const width = Number(new URL(request.url).searchParams.get("w") ?? 800);
        if (!WIDTHS.has(width))
          return new Response("Bad width", { status: 400 });

        const src = await albumPhotoSource(params.id);
        if (!src) return new Response("Not found", { status: 404 });

        const upstream = await fetch(`${src}=w${width}`, {
          cf: { cacheEverything: true, cacheTtl: MONTH },
        });
        if (!upstream.ok || !upstream.body) {
          return new Response("Photo unavailable", { status: 502 });
        }
        return new Response(upstream.body, {
          headers: {
            "Content-Type":
              upstream.headers.get("content-type") ?? "image/jpeg",
            "Cache-Control": `public, max-age=${MONTH}, immutable`,
          },
        });
      },
    },
  },
});
