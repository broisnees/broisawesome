import {
  ApiIcon,
  BrowserIcon,
  Camera01Icon,
  ChartUpIcon,
  Coins01Icon,
  ComputerTerminal01Icon,
  DatabaseSync01Icon,
  Invoice01Icon,
  KanbanIcon,
  Key01Icon,
  KeyboardIcon,
  LaptopIcon,
  Layers01Icon,
  LayoutGridIcon,
  MailOpen01Icon,
  MailValidation01Icon,
  Mouse01Icon,
  PackageIcon,
  PackageSearchIcon,
  Image02Icon,
  Plug01Icon,
  PuzzleIcon,
  QuillWrite01Icon,
  RankingIcon,
  SearchList01Icon,
  SecurityCheckIcon,
  Activity01Icon,
  FileScriptIcon,
  Tag01Icon,
  ViewIcon,
  VolumeHighIcon,
  WorkflowSquare01Icon,
  ZapIcon,
  MouseLeftClick01Icon,
  Robot01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { type Item, slugOf } from "~/lib/site";
import { cn } from "~/lib/utils";
import { CATEGORY_ICONS } from "./tags";
import { Icon } from "./icon";

/**
 * Real app icons, self-hosted in public/project-icons: from each product's site
 * or its repo (AppIcon sets, .icns, Tauri icons), sized to 96px.
 */
const LOGOS: Record<string, string> = {
  stroke: "/project-icons/stroke.png",
  ewiz: "/project-icons/ewiz.png",
  discerns: "/project-icons/discerns.svg",
  safis: "/project-icons/safis.svg",
  // No official icon yet: a mark of the moon Phobos orbiting Mars.
  phobos: "/project-icons/phobos.svg",
  // My own mark: a root prompt (#), which is what sudo gets you.
  "claude-sudo": "/project-icons/claude-sudo.svg",
  deck: "/project-icons/deck.png",
  decibel: "/project-icons/decibel.png",
  "cool-notch": "/project-icons/cool-notch.png",
  claudebot: "/project-icons/claudebot.png",
  snipost: "/project-icons/snipost.png",
  strata: "/project-icons/strata.png",
  panespace: "/project-icons/panespace.png",
  rzen: "/project-icons/rzen.png",
  "commit-rank": "/project-icons/commit-rank.png",
  selfaction: "/project-icons/selfaction.png",
};

/** Everything else gets a Hugeicon that says what it does. */
const ICONS: Record<string, IconSvgElement> = {
  deck: ComputerTerminal01Icon,
  decibel: VolumeHighIcon,
  "cool-notch": LaptopIcon,
  claudebot: Robot01Icon,
  "commit-rank": RankingIcon,
  bill: Invoice01Icon,
  zorail: MailOpen01Icon,
  smooly: Mouse01Icon,
  "smooly-linux": MouseLeftClick01Icon,
  snipost: Camera01Icon,
  strata: Activity01Icon,
  panespace: LayoutGridIcon,
  rzen: BrowserIcon,
  vacora: Tag01Icon,
  torendo: ChartUpIcon,
  phobos: Coins01Icon,
  zap: PackageIcon,
  paper: Image02Icon,
  ezyenv: FileScriptIcon,
  selfaction: WorkflowSquare01Icon,
  wasper: ApiIcon,
  "azure-mcp": KanbanIcon,
  "vite-mcp": ZapIcon,
  "registry-mcp": PackageSearchIcon,
  "claude-sudo": Key01Icon,
  skills: QuillWrite01Icon,
  "prisma-type-generator": DatabaseSync01Icon,
  mailcheckr: MailValidation01Icon,
  envnest: SecurityCheckIcon,
  "chrome-extension-template": PuzzleIcon,
  where2search: SearchList01Icon,
  dotfiles: ComputerTerminal01Icon,
  keyboard: KeyboardIcon,
  tower: Layers01Icon,
  "connect-mcp": Plug01Icon,
  pcvison: ViewIcon,
};

/** The real icon's path for a project, if it has one (for search and social cards). */
export function projectLogo(slug: string) {
  return LOGOS[slug];
}

/** A project's square tile: its real icon when it has one, else a Hugeicon. */
export function ProjectIcon({
  item,
  size = 40,
  className,
}: {
  item: Item;
  size?: number;
  className?: string;
}) {
  const slug = slugOf(item);
  const logo = LOGOS[slug];
  return (
    <span
      style={{ width: size, height: size }}
      className={cn(
        "grid shrink-0 place-items-center overflow-hidden rounded-[22%] bg-surface-hover text-fg shadow-hairline-inset",
        className,
      )}
    >
      {logo ? (
        <img
          src={logo}
          alt=""
          width={size}
          height={size}
          className="size-full object-cover"
        />
      ) : (
        <Icon
          icon={ICONS[slug] ?? CATEGORY_ICONS[item.category]}
          size={Math.round(size * 0.45)}
        />
      )}
    </span>
  );
}
