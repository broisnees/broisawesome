import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowUpRight01Icon,
  DartIcon,
  FileAttachmentIcon,
  GithubIcon,
  Image01Icon,
  InstagramIcon,
  NewTwitterIcon,
  NpmIcon,
  RssIcon,
  SourceCodeIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { Icon } from "~/components/icon";
import { PageHeader } from "~/components/list";
import { breadcrumbs, jsonLd, seo } from "~/lib/seo";
import { PROFILES } from "~/lib/site";

export const Route = createFileRoute("/links")({
  head: () => ({
    ...seo({
      title: "Links",
      description:
        "Where to find Nischal Dahal (@broisnees): GitHub, X, npm, and more.",
      path: "/links",
    }),
    scripts: [jsonLd(breadcrumbs([{ name: "Links", path: "/links" }]))],
  }),
  component: Links,
});

const ICONS: Record<string, IconSvgElement> = {
  GitHub: GithubIcon,
  X: NewTwitterIcon,
  Instagram: InstagramIcon,
  npm: NpmIcon,
  "Dart pub": DartIcon,
  Gists: SourceCodeIcon,
  Gallery: Image01Icon,
  Resume: FileAttachmentIcon,
  RSS: RssIcon,
};

function Links() {
  return (
    <>
      <PageHeader title="Links" description="Where else to find me." />
      <ul className="grid gap-2 sm:grid-cols-2">
        {PROFILES.map((p) => (
          <li key={p.name}>
            <a
              href={p.href}
              className="group flex items-center gap-3.5 rounded-xl bg-surface px-4 py-3 shadow-hairline-inset transition-[background-color] duration-150 ease-out hover:bg-surface-hover"
            >
              <span className="grid size-9 shrink-0 place-items-center rounded-lg bg-surface-hover text-fg shadow-hairline-inset">
                <Icon icon={ICONS[p.name] ?? ArrowUpRight01Icon} size={17} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-[550] text-fg">{p.name}</span>
                <span className="block truncate text-sm text-muted">
                  {p.handle}
                </span>
              </span>
              <Icon
                icon={ArrowUpRight01Icon}
                className="shrink-0 text-muted transition-[color,translate] duration-150 ease-out group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-accent"
              />
            </a>
          </li>
        ))}
      </ul>
    </>
  );
}
