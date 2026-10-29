import {
  ArrowRight01Icon,
  NpmIcon,
  StarIcon,
} from "@hugeicons/core-free-icons";
import { Await, Link } from "@tanstack/react-router";
import { Suspense } from "react";
import { type Item, repoOf, slugOf } from "~/lib/site";
import { cn } from "~/lib/utils";
import { Icon } from "./icon";
import { ProjectIcon } from "./project-icon";
import { PLATFORM_ICONS } from "./tags";

/** Where it runs, as small muted icons; the words go to screen readers. */
function Runs({ item }: { item: Item }) {
  const marks = [
    ...(item.platforms ?? []).map((p) => ({
      icon: PLATFORM_ICONS[p],
      label: p,
    })),
    ...(item.npm && item.category !== "npm"
      ? [{ icon: NpmIcon, label: "npm" }]
      : []),
  ];
  if (marks.length === 0) return null;
  return (
    <span className="flex items-center gap-1.5 text-muted">
      <span className="sr-only">{marks.map((m) => m.label).join(", ")}</span>
      {marks.map((m) => (
        <Icon key={m.label} icon={m.icon} size={14} />
      ))}
    </span>
  );
}

/**
 * One project as a directory row: app icon, name, one line of what it is,
 * where it runs. Stars (only above 30) stream into the right edge without
 * moving anything; the row is already its full height.
 */
export function ProjectRow({
  item,
  stars,
}: {
  item: Item;
  stars?: Promise<Record<string, number>>;
}) {
  const repo = repoOf(item);
  return (
    <Link
      to="/projects/$slug"
      params={{ slug: slugOf(item) }}
      className="group -mx-3 flex items-center gap-3.5 rounded-xl px-3 py-2.5 transition-[background-color] duration-150 ease-out hover:bg-surface-hover"
    >
      <ProjectIcon item={item} size={40} />
      <span className="min-w-0 flex-1">
        <span className="block truncate font-[550] text-fg">{item.name}</span>
        <span className="block text-sm/[1.45] text-pretty text-muted sm:truncate">
          {item.description}
        </span>
      </span>
      <span className="hidden shrink-0 items-center gap-3 sm:flex">
        {repo && stars && (
          // Its own boundary: Await adds none for a null fallback, and the
          // whole page would hide while the stars load.
          <Suspense fallback={null}>
            <Await promise={stars} fallback={null}>
              {(counts) =>
                counts[repo] ? (
                  <span
                    aria-label={`${counts[repo]} GitHub stars`}
                    className="flex items-center gap-1 text-[0.8125rem] text-muted tabular-nums"
                  >
                    <Icon icon={StarIcon} size={13} />
                    {counts[repo]}
                  </span>
                ) : null
              }
            </Await>
          </Suspense>
        )}
        <Runs item={item} />
        <Icon
          icon={ArrowRight01Icon}
          size={15}
          className="text-faint transition-[color,translate] duration-150 ease-out group-hover:translate-x-0.5 group-hover:text-accent"
        />
      </span>
    </Link>
  );
}

export function ProjectList({
  items,
  stars,
  className,
}: {
  items: Item[];
  stars?: Promise<Record<string, number>>;
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-col", className)}>
      {items.map((item) => (
        <li key={item.name}>
          <ProjectRow item={item} stars={stars} />
        </li>
      ))}
    </ul>
  );
}
