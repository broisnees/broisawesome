import { createMiddleware, createStart } from "@tanstack/react-start";

/** One canonical host: www.nischal-dahal.com.np 301s to the bare domain. */
const canonicalHost = createMiddleware().server(({ request, next }) => {
  const host = request.headers.get("host") ?? new URL(request.url).host;
  if (host.startsWith("www.")) {
    const url = new URL(request.url);
    url.host = host.slice(4);
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }
  return next();
});

// Every page is content for readers and crawlers, so every route renders in
// full on the server. Slow, non-critical data streams in through <Await>.
export const startInstance = createStart(() => ({
  defaultSsr: true,
  requestMiddleware: [canonicalHost],
}));
