import { createFileRoute, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { PostActions } from "~/components/post-actions";
import { Byline, Fact, More } from "~/components/list";
import { MdxBody } from "~/components/mdx";
import { postContent } from "~/lib/mdx-content";
import { getPost, getPostMarkdown } from "~/lib/posts.functions";
import {
  absolute,
  AUTHOR,
  breadcrumbs,
  jsonLd,
  PERSON,
  readPath,
  seo,
} from "~/lib/seo";
import { formatDate } from "~/lib/site";

/** Slugs I've renamed, old to new, so shared links keep working. */
const RENAMED: Record<string, string> = {
  "hosting-mordern-application": "hosting-modern-applications",
};

// Posts used to have an agent mode and a read mode. Old `?mode=` links still
// parse; the page is the same either way.
const searchSchema = z.object({
  mode: z.enum(["agent", "read"]).optional().catch(undefined),
});

export const Route = createFileRoute("/writing/$slug")({
  validateSearch: searchSchema,
  beforeLoad: ({ params }) => {
    const to = RENAMED[params.slug];
    if (to) {
      throw redirect({
        to: "/writing/$slug",
        params: { slug: to },
        statusCode: 301,
      });
    }
  },
  // The MDX chunk for the post, and its Markdown up front so "Copy page" can
  // write to the clipboard in the same click.
  loader: async ({ params }) => {
    const data = { data: { slug: params.slug } };
    const [post, markdown] = await Promise.all([
      getPost(data),
      getPostMarkdown(data),
      postContent.load(params.slug),
    ]);
    return { post, markdown };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { post } = loaderData;
    const description = post.description ?? `${post.title}, by Nischal Dahal.`;
    const path = readPath(post.slug);
    return {
      ...seo({
        title: post.title,
        description,
        path,
        type: "article",
        publishedTime: post.date,
        image: post.image,
        imageAlt: post.title,
      }),
      scripts: post.date
        ? [
            jsonLd(
              {
                "@type": "BlogPosting",
                "@id": `${absolute(path)}#article`,
                headline: post.title,
                description,
                datePublished: post.date,
                dateModified: post.date,
                url: absolute(path),
                mainEntityOfPage: absolute(path),
                ...(post.image ? { image: absolute(post.image) } : {}),
                inLanguage: "en",
                wordCount: post.wordCount,
                author: AUTHOR,
                publisher: AUTHOR,
              },
              PERSON,
              breadcrumbs([
                { name: "Writing", path: "/writing" },
                { name: post.title, path },
              ]),
            ),
          ]
        : [],
    };
  },
  component: PostPage,
});

function PostPage() {
  const { post, markdown } = Route.useLoaderData();

  return (
    <article>
      {/* Left-aligned like the post body. */}
      <header className="mb-10">
        <h1 className="display text-[2rem]/[1.15] text-balance sm:text-[2.25rem]/[1.12]">
          {post.title}
        </h1>
        {post.description && (
          <p className="mt-3 text-lg/[1.6] tracking-[-0.01em] text-pretty text-muted">
            {post.description}
          </p>
        )}
        <div className="mt-6 border-b border-(--hairline) pb-6">
          <Byline className="mt-0 justify-start">
            <Fact>{post.date ? formatDate(post.date, "long") : "Draft"}</Fact>
            <Fact>{post.readMinutes} min read</Fact>
          </Byline>
          {markdown !== undefined && (
            <PostActions slug={post.slug} markdown={markdown} />
          )}
        </div>
      </header>

      <MdxBody slug={post.slug} kind="writing" />

      <footer className="mt-16">
        <More to="/writing">All writing</More>
      </footer>
    </article>
  );
}
