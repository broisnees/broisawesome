import "@tanstack/react-start/server-only";

/** My public Google Photos album (the share link anyone can open). */
export const ALBUM_URL = "https://photos.app.goo.gl/2RHWh9PyAGyRCZAP9";

/** What the page gets: no Google URLs, just an id served by /photos/<id>. */
export type Photo = { id: string; width: number; height: number };

type AlbumPhoto = Photo & { src: string };

const HOUR = 60 * 60 * 1000;
let cache: { at: number; photos: AlbumPhoto[] } | undefined;

/**
 * Reads the album's public share page. Google's Library API can't read albums
 * an app didn't create, but the share page lists every photo as
 * ["https://lh3.googleusercontent.com/pw/…", width, height]. Cached for an
 * hour per isolate; a failed read falls back to the last good list.
 */
/** Shared by every Worker isolate, so a cold isolate doesn't refetch the 1MB page. */
const EDGE_KEY = "https://nischal-dahal.com.np/__cache/album-v1";

/** Cloudflare's per-colo cache. The DOM typings don't know `caches.default`. */
const edgeCache = () => (caches as unknown as { default: Cache }).default;

async function readAlbum(): Promise<AlbumPhoto[]> {
  if (cache && Date.now() - cache.at < HOUR) return cache.photos;
  try {
    const hit = await edgeCache().match(EDGE_KEY);
    if (hit) {
      const photos = (await hit.json()) as AlbumPhoto[];
      cache = { at: Date.now(), photos };
      return photos;
    }
  } catch {
    // No edge cache here (or a bad entry): read the album directly.
  }
  try {
    const res = await fetch(ALBUM_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (nischal-dahal.com.np)" },
      redirect: "follow",
    });
    if (!res.ok) return cache?.photos ?? [];
    const html = await res.text();

    const seen = new Set<string>();
    const photos: AlbumPhoto[] = [];
    for (const [, src, w, h] of html.matchAll(
      /\["(https:\/\/lh3\.googleusercontent\.com\/pw\/[\w-]+)",(\d+),(\d+)/g,
    )) {
      if (seen.has(src)) continue;
      seen.add(src);
      const id = src.slice(src.lastIndexOf("/") + 1);
      photos.push({ id, src, width: Number(w), height: Number(h) });
    }

    if (photos.length > 0) {
      cache = { at: Date.now(), photos };
      await edgeCache()
        .put(
          EDGE_KEY,
          Response.json(photos, {
            headers: { "Cache-Control": `public, max-age=${HOUR / 1000}` },
          }),
        )
        .catch(() => {});
    }
    return photos;
  } catch {
    return cache?.photos ?? [];
  }
}

/** The album for the page: ids and sizes only. */
export async function fetchAlbum(): Promise<Photo[]> {
  return (await readAlbum()).map(({ id, width, height }) => ({
    id,
    width,
    height,
  }));
}

/** Google's URL for one photo in my album, or undefined if it isn't in it. */
export async function albumPhotoSource(id: string) {
  return (await readAlbum()).find((photo) => photo.id === id)?.src;
}
