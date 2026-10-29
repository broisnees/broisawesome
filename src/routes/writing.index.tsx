import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { metaClass, PageHeader, RowBody, rowClass } from "~/components/list";
import { SearchField } from "~/components/search-field";
import { listPosts } from "~/lib/posts.functions";
import { absolute, AUTHOR, breadcrumbs, jsonLd, PERSON, seo } from "~/lib/seo";
import { formatDate } from "~/lib/site";

// `/writing?q=payment` filters the list. Anything malformed is dropped, not an error.
const searchSchema = z.object({
  q: z.string().trim().max(60).optional().catch(undefined),
});

export const Route = createFileRoute("/writing/")({
  validateSearch: searchSchema,
  loader: () => listPosts(),
  head: ({ loaderData: posts }) => ({
    ...seo({
      title: "Writing",
      description:
        "Posts by Nischal Dahal on React Router, Remix, payments in Nepal (Khalti, eSewa), Docker, deployment, and the tools I use.",
      path: "/writing",
    }),
    scripts: [
      jsonLd(
        {
          "@type": "Blog",
          "@id": `${absolute("/writing")}#blog`,
          url: absolute("/writing"),
          name: "Writing by Nischal Dahal",
          author: AUTHOR,
          blogPost: (posts ?? [])
            .filter((post) => post.date)
            .map((post) => ({
              "@type": "BlogPosting",
              headline: post.title,
              url: absolute(`/writing/${post.slug}`),
              datePublished: post.date,
            })),
        },
        PERSON,
        breadcrumbs([{ name: "Writing", path: "/writing" }]),
      ),
    ],
  }),
  component: Writing,
});

function Writing() {
  const posts = Route.useLoaderData();
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();

  const query = q?.toLowerCase();
  const matches = query
    ? posts.filter((post) =>
        `${post.title} ${post.description ?? ""}`.toLowerCase().includes(query),
      )
    : posts;

  const years = new Map<string, typeof matches>();
  for (const post of matches) {
    const year = post.date?.slice(0, 4) ?? "Drafts";
    years.set(year, [...(years.get(year) ?? []), post]);
  }

  return (
    <>
      <PageHeader
        title="Writing"
        description={
          <>
            Notes on things I built and figured out.{" "}
            <a href="/blogs.rss" className="link">
              RSS
            </a>
            .
          </>
        }
      />

      <SearchField
        label="Filter posts"
        defaultValue={q}
        onChange={(value) =>
          navigate({
            search: { q: value.trim() || undefined },
            replace: true,
          })
        }
      />

      {years.size === 0 && (
        <p className="mt-8 text-muted">Nothing matches “{q}”.</p>
      )}

      {[...years].map(([year, group]) => (
        <section key={year} className="mt-8">
          <h2 className={`mb-2 text-muted ${metaClass}`}>{year}</h2>
          <ul>
            {group.map((post) => (
              <li key={post.slug}>
                <Link
                  to="/writing/$slug"
                  params={{ slug: post.slug }}
                  className={rowClass}
                >
                  <RowBody
                    title={post.title}
                    detail={post.date && formatDate(post.date)}
                  />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </>
  );
}
