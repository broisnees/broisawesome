import { Await, createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { type LightboxPhoto, Lightbox, sized } from "~/components/lightbox";
import { PageHeader } from "~/components/list";
import { getGallery } from "~/lib/gallery.functions";
import { breadcrumbs, jsonLd, seo } from "~/lib/seo";

const ALBUM_URL = "https://photos.app.goo.gl/2RHWh9PyAGyRCZAP9";

export const Route = createFileRoute("/gallery")({
  // Not awaited: the header paints now and the grid streams in with the album.
  loader: () => ({ photos: getGallery() }),
  head: () => ({
    ...seo({
      title: "Gallery",
      description:
        "Photos from Nischal Dahal’s Google Photos album, 2023 to 2025.",
      path: "/gallery",
    }),
    scripts: [jsonLd(breadcrumbs([{ name: "Gallery", path: "/gallery" }]))],
  }),
  component: Gallery,
});

function Gallery() {
  const { photos } = Route.useLoaderData();

  return (
    <>
      <PageHeader
        title="Gallery"
        description={
          <>
            Photos from my album.{" "}
            <a href={ALBUM_URL} className="link">
              Open it in Google Photos
            </a>
            .
          </>
        }
      />
      {/* The grid spans the whole viewport, edge to edge. */}
      <div className="full-bleed">
        <Await promise={photos} fallback={<Placeholder />}>
          {(list) =>
            list.length > 0 ? (
              <Grid photos={list} />
            ) : (
              <p className="text-center text-muted">
                The album didn’t load. Try again in a minute.
              </p>
            )
          }
        </Await>
      </div>
    </>
  );
}

function Grid({ photos }: { photos: LightboxPhoto[] }) {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <>
      <ul className="gallery">
        {photos.map((photo, i) => (
          <li key={photo.id} className="break-inside-avoid">
            <button
              type="button"
              aria-label={`Open photo ${i + 1} of ${photos.length}`}
              onClick={() => setOpen(i)}
              className="gallery-item"
            >
              <GalleryImage photo={photo} />
            </button>
          </li>
        ))}
      </ul>
      {open !== null && (
        <Lightbox
          photos={photos}
          index={open}
          onIndex={setOpen}
          onClose={() => setOpen(null)}
        />
      )}
    </>
  );
}

/**
 * A 32px copy shows right away, blurred, holding the photo's exact shape. The
 * full photo only starts loading when it's about a screen away, then fades in
 * over the blur. Grayscale until hovered.
 */
function GalleryImage({ photo }: { photo: LightboxPhoto }) {
  const frame = useRef<HTMLDivElement>(null);
  const img = useRef<HTMLImageElement>(null);
  const [near, setNear] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const el = frame.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // A cached photo can finish before React attaches onLoad.
  useEffect(() => {
    if (img.current?.complete && img.current.naturalWidth > 0) setLoaded(true);
  }, [near]);

  return (
    <div
      ref={frame}
      className="gallery-frame"
      style={{ aspectRatio: `${photo.width} / ${photo.height}` }}
    >
      <img src={sized(photo.id, 32)} alt="" className="gallery-blur" />
      {near && (
        <img
          ref={img}
          src={sized(photo.id, 800)}
          srcSet={([400, 800, 1200] as const)
            .map((w) => `${sized(photo.id, w)} ${w}w`)
            .join(", ")}
          sizes="(min-width: 1280px) 25vw, (min-width: 640px) 33vw, 50vw"
          width={photo.width}
          height={photo.height}
          alt=""
          decoding="async"
          onLoad={() => setLoaded(true)}
          data-loaded={loaded || undefined}
          className="gallery-image"
        />
      )}
    </div>
  );
}

/** Shown for the moment before the album arrives. */
function Placeholder() {
  return (
    <ul aria-hidden className="gallery">
      {[4 / 3, 1, 3 / 4, 1, 4 / 3, 1, 3 / 4, 1].map((ratio, i) => (
        <li
          key={i}
          style={{ aspectRatio: ratio }}
          className="break-inside-avoid bg-surface"
        />
      ))}
    </ul>
  );
}
