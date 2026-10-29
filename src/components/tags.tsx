import {
  AiSparklesIcon,
  AndroidIcon,
  AppleIcon,
  AppStoreIcon,
  CommandLineIcon,
  DashboardSquare01Icon,
  Globe02Icon,
  McpServerIcon,
  NpmIcon,
  PuzzleIcon,
  Settings02Icon,
  WindowsNewIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import {
  CATEGORIES,
  type Category,
  type Filter,
  type Item,
  type Platform,
} from "~/lib/site";
import { LinuxIcon } from "./brand-icons";
import { Icon } from "./icon";

export const PLATFORM_ICONS: Record<Platform, IconSvgElement> = {
  macOS: AppleIcon,
  Windows: WindowsNewIcon,
  Linux: LinuxIcon,
  Web: Globe02Icon,
  Android: AndroidIcon,
};

export const CATEGORY_ICONS: Record<Category, IconSvgElement> = {
  apps: AppStoreIcon,
  tools: CommandLineIcon,
  mcp: McpServerIcon,
  skills: AiSparklesIcon,
  npm: NpmIcon,
  extensions: PuzzleIcon,
  setup: Settings02Icon,
};

/** "All", then one pill per category. */
export const FILTER_OPTIONS: {
  value: Filter | undefined;
  label: string;
  icon: IconSvgElement;
}[] = [
  { value: undefined, label: "All", icon: DashboardSquare01Icon },
  ...CATEGORIES.map((c) => ({
    value: c.id,
    label: c.label,
    icon: CATEGORY_ICONS[c.id],
  })),
];

/** An icon with a short label, for platforms and kinds. */
export function Tag({ icon, label }: { icon: IconSvgElement; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5">
      <Icon icon={icon} size={13} className="shrink-0" />
      {label}
    </span>
  );
}

/** Where something runs, and npm when it's published there (outside the npm category). */
export function ItemTags({ item }: { item: Item }) {
  const tags = [
    ...(item.platforms ?? []).map((p) => ({
      icon: PLATFORM_ICONS[p],
      label: p,
    })),
    ...(item.npm && item.category !== "npm"
      ? [{ icon: NpmIcon, label: "npm" }]
      : []),
  ];
  if (tags.length === 0) return null;
  return (
    <span className="flex flex-wrap gap-x-3 gap-y-1">
      {tags.map((t) => (
        <Tag key={t.label} {...t} />
      ))}
    </span>
  );
}
