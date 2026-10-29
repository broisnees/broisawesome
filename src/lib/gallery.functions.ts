import { createServerFn } from "@tanstack/react-start";
import { fetchAlbum } from "~/server/gallery.server";

/** Every photo in my shared album, with its size for a no-jump layout. */
export const getGallery = createServerFn({ method: "GET" }).handler(() =>
  fetchAlbum(),
);
