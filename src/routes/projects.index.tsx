import { createFileRoute, Link } from "@tanstack/react-router";
import { z } from "zod";
import { Icon } from "~/components/icon";
import { PageHeader } from "~/components/list";
import { ProjectList } from "~/components/project-tile";
import { CATEGORY_ICONS, FILTER_OPTIONS } from "~/components/tags";
import { getStars } from "~/lib/github.functions";
import { absolute, AUTHOR, breadcrumbs, jsonLd, seo } from "~/lib/seo";
import { CATEGORIES, FILTERS, type Filter, PROJECTS, slugOf } from "~/lib/site";
import { cn } from "~/lib/utils";

// `/projects?filter=mcp` shows one category; anything else is ignored.
const searchSchema = z.object({
  filter: z.enum(FILTERS).optional().catch(undefined),
});

export const Route = createFileRoute("/projects/")({
  validateSearch: searchSchema,
  loaderDeps: ({ search }) => ({ filter: search.filter }),
  // Not awaited: the list renders right away and star counts stream in after.
  loader: ({ deps }) => ({ stars: getStars(), filter: deps.filter }),
  // Each category is its own page for search: its own title, description
  // and canonical URL (/projects?filter=skills).
  head: ({ loaderData }) => {
    const category = CATEGORIES.find((c) => c.id === loaderData?.filter);
    const path = category ? `/projects?filter=${category.id}` : "/projects";
    const items = category
      ? PROJECTS.filter((p) => p.category === category.id)
      : PROJECTS;
    const names = items
      .slice(0, 5)
      .map((p) => p.name)
      .join(", ");
    return {
      ...seo({
        title: category ? `${category.title} by Nischal Dahal` : "Projects",
        description: category
          ? `${category.blurb} ${names}${items.length > 5 ? " and more" : ""}.`
          : "Apps, developer tools, MCP servers, agent skills and npm packages by Nischal Dahal: Stroke, eWiz, deck, panespace, safis and more.",
        path,
      }),
      scripts: [
        jsonLd(
          {
            "@type": "CollectionPage",
            name: category ? category.title : "Projects",
            url: absolute(path),
            author: AUTHOR,
            mainEntity: {
              "@type": "ItemList",
              itemListElement: items.map((p, i) => ({
                "@type": "ListItem",
                position: i + 1,
                name: p.name,
                url: absolute(`/projects/${slugOf(p)}`),
              })),
            },
          },
          breadcrumbs([
            { name: "Projects", path: "/projects" },
            ...(category ? [{ name: category.title, path }] : []),
          ]),
        ),
      ],
    };
  },
  component: Projects,
});

const count = (filter?: Filter) =>
  filter
    ? PROJECTS.filter((p) => p.category === filter).length
    : PROJECTS.length;

function Projects() {
  const { filter } = Route.useSearch();
  const { stars } = Route.useLoaderData();
  const categories = filter
    ? CATEGORIES.filter((c) => c.id === filter)
    : CATEGORIES;

  return (
    <>
      <PageHeader
        title="Projects"
        description="Apps, developer tools, agent skills and packages I’ve built."
      />

      {/* A directory: categories on the left, projects on the right. On
          narrow screens the categories become one swipeable row on top. */}
      <div className="directory">
        <Categories current={filter} />
        <div className="min-w-0">
          {categories.map((category) => {
            const items = PROJECTS.filter((p) => p.category === category.id);
            return (
              <section
                key={category.id}
                aria-labelledby={`cat-${category.id}`}
                className="mb-10 last:mb-0"
              >
                <h2
                  id={`cat-${category.id}`}
                  className="mb-1 flex items-baseline gap-2 text-sm"
                >
                  <span className="font-[550] text-fg">{category.title}</span>
                  <span className="truncate text-muted">{category.blurb}</span>
                </h2>
                <ProjectList items={items} stars={stars} />
              </section>
            );
          })}
        </div>
      </div>
    </>
  );
}

function Categories({ current }: { current?: Filter }) {
  return (
    <nav aria-label="Categories" className="directory-nav">
      {FILTER_OPTIONS.map((option) => {
        const active = current === option.value;
        return (
          <Link
            key={option.label}
            to="/projects"
            search={option.value ? { filter: option.value } : {}}
            replace
            resetScroll={false}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex h-9 shrink-0 items-center gap-2.5 rounded-lg px-2.5 text-sm whitespace-nowrap text-muted transition-[color,background-color] duration-150 ease-out hover:bg-surface-hover hover:text-fg",
              active && "bg-surface-hover text-fg",
            )}
          >
            <Icon
              icon={option.value ? CATEGORY_ICONS[option.value] : option.icon}
              size={15}
              className={cn("shrink-0", active && "text-accent")}
            />
            <span className="flex-1">{option.label}</span>
            <span className="text-xs text-muted tabular-nums">
              {count(option.value)}
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
