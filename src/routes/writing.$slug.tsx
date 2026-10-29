import { BookOpen01Icon, RoboticIcon } from "@hugeicons/core-free-icons";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { z } from "zod";
import { AgentView } from "~/components/agent-view";
import { Icon } from "~/components/icon";
import { Byline, Fact, More, PageHeader } from "~/components/list";
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
import { cn } from "~/lib/utils";

/** Slugs I've renamed, old to new, so shared links keep working. */
const RENAMED: Record<string, string> = {
  "hosting-mordern-application": "hosting-modern-applications",
};

// Agent mode (Markdown + copy) is the default; `?mode=read` shows the full post.
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
  loaderDeps: ({ search }) => ({ agent: search.mode !== "read" }),
  // Read mode needs the post's MDX chunk; agent mode needs its Markdown, loaded
  // up front so "Copy page" writes to the clipboard in the same click.
  loader: async ({ params, deps }) => {
    const data = { data: { slug: params.slug } };
    if (deps.agent) {
      const [post, markdown] = await Promise.all([
        getPost(data),
        getPostMarkdown(data),
      ]);
      return { post, markdown };
    }
    const [post] = await Promise.all([
      getPost(data),
      postContent.load(params.slug),
    ]);
    return { post, markdown: undefined };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { post } = loaderData;
    const description = post.description ?? `${post.title}, by Nischal Dahal.`;
    // Search indexes the formatted article, not the Markdown source that
    // agent mode (the default) shows.
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
  const { mode } = Route.useSearch();
  const agent = mode !== "read";

  return (
    <article>
      {/* Same top edge as every other page; the active "Writing" nav is the way back. */}
      <PageHeader title={post.title} description={post.description}>
        <Byline>
          <Fact>{post.date ? formatDate(post.date, "long") : "Draft"}</Fact>
          <Fact>{post.readMinutes} min read</Fact>
        </Byline>
        <ModeSwitch slug={post.slug} agent={agent} />
      </PageHeader>

      {agent && markdown !== undefined ? (
        <AgentView
          slug={post.slug}
          markdown={markdown}
          words={post.wordCount}
        />
      ) : (
        <MdxBody slug={post.slug} kind="writing" />
      )}

      <footer className="mt-16">
        <More to="/writing">All writing</More>
      </footer>
    </article>
  );
}

function ModeSwitch({ slug, agent }: { slug: string; agent: boolean }) {
  const option =
    "relative z-10 inline-flex h-8 w-24 items-center justify-center gap-1.5 rounded-full text-[0.8125rem] transition-[color] duration-200 ease-out";

  return (
    <nav
      aria-label="Reading mode"
      className="relative mt-7 inline-grid grid-cols-2 rounded-full bg-surface p-1 shadow-hairline-inset"
    >
      {/* One highlight that slides between the two halves. */}
      <span
        aria-hidden
        className={cn(
          "absolute inset-y-1 left-1 w-24 rounded-full bg-surface-hover shadow-raised transition-[translate] duration-300 ease-[cubic-bezier(0.23,1,0.32,1)]",
          !agent && "translate-x-full",
        )}
      />
      <Link
        to="/writing/$slug"
        params={{ slug }}
        search={{}}
        replace
        resetScroll={false}
        aria-current={agent ? "page" : undefined}
        className={cn(option, agent ? "text-fg" : "text-muted hover:text-fg")}
      >
        <Icon
          icon={RoboticIcon}
          size={14}
          className={cn(agent && "text-accent")}
        />
        Agent
      </Link>
      <Link
        to="/writing/$slug"
        params={{ slug }}
        search={{ mode: "read" }}
        replace
        resetScroll={false}
        aria-current={agent ? undefined : "page"}
        className={cn(option, agent ? "text-muted hover:text-fg" : "text-fg")}
      >
        <Icon
          icon={BookOpen01Icon}
          size={14}
          className={cn(!agent && "text-accent")}
        />
        Read
      </Link>
    </nav>
  );
}
