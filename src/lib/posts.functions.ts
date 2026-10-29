import { notFound } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import {
  getPostMarkdown as readMarkdown,
  getPost as readPost,
  getPosts,
} from "~/server/posts.server";

/** Metadata for every published post, newest first. */
export const listPosts = createServerFn({ method: "GET" }).handler(() =>
  getPosts(),
);

/** One post's metadata and length; the body loads separately as MDX. */
export const getPost = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().regex(/^[a-z0-9-]+$/) }))
  .handler(({ data }) => {
    const post = readPost(data.slug);
    if (!post) throw notFound();
    return post;
  });

/** One post as plain Markdown, for agent mode. */
export const getPostMarkdown = createServerFn({ method: "GET" })
  .validator(z.object({ slug: z.string().regex(/^[a-z0-9-]+$/) }))
  .handler(({ data }) => {
    const markdown = readMarkdown(data.slug);
    if (markdown === undefined) throw notFound();
    return markdown;
  });
