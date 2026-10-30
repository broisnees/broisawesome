import {
  ArrowUpRight01Icon,
  GithubIcon,
  NpmIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { Await, createFileRoute } from "@tanstack/react-router";
import { Suspense } from "react";
import { Icon } from "~/components/icon";
import { InstallCommand } from "~/components/install-command";
import { ProjectIcon, projectLogo } from "~/components/project-icon";
import { ProjectList } from "~/components/project-tile";
import { CATEGORY_ICONS, ItemTags, Tag } from "~/components/tags";
import { More, PageHeader } from "~/components/list";
import { MdxBody } from "~/components/mdx";
import { getStars } from "~/lib/github.functions";
import { projectContent } from "~/lib/mdx-content";
import { getProject } from "~/lib/projects.functions";
import { absolute, AUTHOR, breadcrumbs, jsonLd, PERSON, seo } from "~/lib/seo";
import {
  CATEGORIES,
  type Category,
  formatDate,
  type Item,
  PROJECTS,
  repoOf,
  slugOf,
} from "~/lib/site";

function categoryTitle(id: Category) {
  return CATEGORIES.find((c) => c.id === id)?.title ?? id;
}

/** The description's first clause, capped near 55 characters, for the <title>. */
export const Route = createFileRoute("/projects/$slug")({
  loader: async ({ params }) => {
    const [project] = await Promise.all([
      getProject({ data: { slug: params.slug } }),
      projectContent.load(params.slug),
    ]);
    // Not awaited: the page renders now and the star count streams in.
    return { project, stars: getStars() };
  },
  head: ({ loaderData }) => {
    if (!loaderData) return {};
    const { project } = loaderData;
    const repo = repoOf(project);
    const page = absolute(`/projects/${project.slug}`);
    const logo = projectLogo(project.slug);
    const library = project.category === "npm";
    const links = [
      project.href.includes("github.com") ? undefined : project.href,
      repo && `https://github.com/${repo}`,
      project.npm && `https://www.npmjs.com/package/${project.npm}`,
    ].filter((x): x is string => Boolean(x));

    return {
      ...seo({
        // "eWiz: Menu bar battery care for Apple silicon Macs | Nischal Dahal"
        title: project.metaTitle,
        description: project.metaDescription,
        path: `/projects/${project.slug}`,
        type: project.hasWriteup ? "article" : "website",
        publishedTime: project.published,
        image: project.image,
        imageAlt: project.name,
        // A page with only a one-liner is too thin to rank; it joins the
        // index once it has a write-up.
        noindex: !project.hasWriteup,
      }),
      scripts: [
        jsonLd(
          library
            ? {
                "@type": "SoftwareSourceCode",
                "@id": `${page}#project`,
                name: project.name,
                description: project.metaDescription,
                url: page,
                ...(repo
                  ? { codeRepository: `https://github.com/${repo}` }
                  : {}),
                ...(logo ? { image: absolute(logo) } : {}),
                sameAs: links,
                author: AUTHOR,
              }
            : {
                "@type": "SoftwareApplication",
                "@id": `${page}#project`,
                name: project.name,
                description: project.metaDescription,
                url: page,
                applicationCategory:
                  project.category === "apps"
                    ? "UtilitiesApplication"
                    : "DeveloperApplication",
                ...(project.platforms?.length
                  ? { operatingSystem: project.platforms.join(", ") }
                  : {}),
                ...(logo ? { image: absolute(logo) } : {}),
                ...(project.install ? { installUrl: page } : {}),
                sameAs: links,
                author: AUTHOR,
              },
          PERSON,
          breadcrumbs([
            { name: "Projects", path: "/projects" },
            {
              name: categoryTitle(project.category),
              path: `/projects?filter=${project.category}`,
            },
            { name: project.name, path: `/projects/${project.slug}` },
          ]),
        ),
      ],
    };
  },
  component: ProjectPage,
});

const pill =
  "inline-flex h-8 items-center gap-1.5 rounded-full bg-surface px-3.5 text-sm text-fg shadow-hairline-inset transition-[background-color,scale] duration-150 ease-out hover:bg-surface-hover active:scale-[0.96]";

function ProjectPage() {
  const { project, stars } = Route.useLoaderData();
  const repo = repoOf(project);
  const isGitHub = project.href.includes("github.com");

  return (
    // data-enhanced tells the safis runtime (MDX figures) this article is
    // already done; otherwise it adds heading anchors before React hydrates.
    <article data-enhanced="1">
      <ProjectIcon
        item={project}
        size={64}
        className="mx-auto mb-6 shadow-raised"
      />
      <PageHeader title={project.name} description={project.description}>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
          {!isGitHub && (
            <a href={project.href} className={pill}>
              Visit
              <Icon
                icon={ArrowUpRight01Icon}
                size={14}
                className="text-muted"
              />
            </a>
          )}
          {repo && (
            <a href={`https://github.com/${repo}`} className={pill}>
              <Icon icon={GithubIcon} size={14} className="text-muted" />
              GitHub
              {/* Streams in after the page; empty for private repos. */}
              {/* Its own boundary: Await adds none for a null fallback, and the
                  whole page would hide while the stars load. */}
              <Suspense fallback={null}>
                <Await promise={stars} fallback={null}>
                  {(counts) =>
                    counts[repo] ? (
                      <span className="flex items-center gap-1 text-muted tabular-nums">
                        <Icon icon={StarIcon} size={13} />
                        {counts[repo]}
                      </span>
                    ) : null
                  }
                </Await>
              </Suspense>
            </a>
          )}
          {project.npm && (
            <a
              href={`https://www.npmjs.com/package/${project.npm}`}
              className={pill}
            >
              <Icon icon={NpmIcon} size={14} className="text-muted" />
              npm
            </a>
          )}
        </div>
        <div className="mt-5 flex flex-wrap items-center justify-center gap-x-3 gap-y-1.5 text-sm text-muted tabular-nums">
          <Tag
            icon={CATEGORY_ICONS[project.category]}
            label={categoryTitle(project.category)}
          />
          <ItemTags item={project} />
          {project.hasWriteup && project.published && (
            <span>
              {formatDate(project.published, "long")} · {project.readMinutes}{" "}
              min read
            </span>
          )}
        </div>
      </PageHeader>

      {project.install && (
        <section aria-label="Install" className="mb-12">
          <h2 className="mb-2 text-sm text-muted">Install</h2>
          <InstallCommand command={project.install} />
        </section>
      )}

      {project.hasWriteup ? (
        <MdxBody slug={project.slug} kind="projects" />
      ) : (
        <p className="text-center text-muted">
          I haven’t written this one up yet.
        </p>
      )}

      <Related project={project} />

      <footer className="mt-10">
        <More to="/projects">All projects</More>
      </footer>
    </article>
  );
}

/** Up to four more from the same category, so readers (and crawlers) keep going. */
function Related({ project }: { project: Item & { slug: string } }) {
  const related = PROJECTS.filter(
    (p) => p.category === project.category && slugOf(p) !== project.slug,
  ).slice(0, 4);
  if (related.length === 0) return null;
  return (
    <section aria-labelledby="related" className="mt-16">
      <h2 id="related" className="mb-1 text-sm font-[550] text-fg">
        More {categoryTitle(project.category).toLowerCase()}
      </h2>
      <ProjectList items={related} />
    </section>
  );
}
