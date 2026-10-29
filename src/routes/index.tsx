import { createFileRoute, Link } from "@tanstack/react-router";
import { More, RowBody, rowClass, Section } from "~/components/list";
import { listPosts } from "~/lib/posts.functions";
import { jsonLd, PERSON, seo, WEBSITE } from "~/lib/seo";
import { ProjectList } from "~/components/project-tile";
import { FEATURED, formatDate, SETUP } from "~/lib/site";

export const Route = createFileRoute("/")({
  loader: () => listPosts(),
  head: () => ({
    ...seo({
      description:
        "Nischal Dahal (@broisnees) is a full-stack engineer in Kathmandu, Nepal, building tools like Stroke and writing about web development.",
      path: "/",
      type: "profile",
    }),
    scripts: [jsonLd(WEBSITE, PERSON)],
  }),
  component: Home,
});

function Home() {
  const posts = Route.useLoaderData().slice(0, 5);

  return (
    <>
      <h1 className="sr-only">Nischal Dahal</h1>
      <div className="space-y-4 text-[1.0625rem]/[1.6] tracking-[-0.01em] text-pretty">
        <p>
          <strong className="font-[575] text-fg">
            I’m an AI/ML-based full-stack engineer in Kathmandu.
          </strong>{" "}
          Platform-agnostic, allergic to bloat, and I pipe things into{" "}
          <code className="code-inline">{"<(...)"}</code> for fun.
        </p>
        <p>
          <strong className="font-[575] text-fg">By day</strong> I lead projects
          at AITC International, across web, Flutter apps and infra.{" "}
          <strong className="font-[575] text-fg">On the side</strong> I build my
          own tools, like{" "}
          <a href="https://stroke.click" className="link">
            Stroke
          </a>
          , a fast desktop database client.
        </p>
      </div>

      <Section title="Projects">
        <ProjectList items={FEATURED} />
        <More to="/projects">All projects</More>
      </Section>

      <Section title="Setup">
        <p className="-mt-2 mb-4 text-pretty text-muted">
          My machine, keyboard, and agent setup.
        </p>
        <ProjectList items={SETUP} />
      </Section>

      {posts.length > 0 && (
        <Section title="Writing">
          <ul>
            {posts.map((post) => (
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
          <More to="/writing">All writing</More>
        </Section>
      )}

      <Section title="More">
        <p className="text-[1.0625rem]/[1.6] tracking-[-0.01em] text-pretty">
          More of my code lives on{" "}
          <a href="https://github.com/broisnees" className="link">
            GitHub
          </a>
          , and I post on{" "}
          <a href="https://x.com/broisnees" className="link">
            X
          </a>
          . Everything else is on the{" "}
          <Link to="/links" className="link">
            links
          </Link>{" "}
          page.
        </p>
      </Section>
    </>
  );
}
