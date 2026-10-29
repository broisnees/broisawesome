export type Platform = "macOS" | "Windows" | "Linux" | "Web" | "Android";

export const PLATFORMS: Platform[] = [
  "macOS",
  "Windows",
  "Linux",
  "Web",
  "Android",
];

export type Category =
  | "apps"
  | "tools"
  | "mcp"
  | "skills"
  | "npm"
  | "extensions"
  | "setup";

/** Every project sits in exactly one of these; the filter on /projects is one each. */
export const CATEGORIES: {
  id: Category;
  title: string;
  /** Short name for the filter pill. */
  label: string;
  blurb: string;
}[] = [
  { id: "apps", title: "Apps", label: "Apps", blurb: "Desktop and web apps." },
  {
    id: "tools",
    title: "Developer tools",
    label: "Tools",
    blurb: "CLIs and things that live in the terminal.",
  },
  {
    id: "mcp",
    title: "MCP servers",
    label: "MCP",
    blurb: "Tools that give AI agents new abilities.",
  },
  {
    id: "skills",
    title: "Agent skills",
    label: "Skills",
    blurb: "Skills and plugins for Claude Code and other agents.",
  },
  {
    id: "npm",
    title: "npm packages",
    label: "npm",
    blurb: "Libraries to build on, published on npm.",
  },
  {
    id: "extensions",
    title: "Browser extensions",
    label: "Extensions",
    blurb: "Extensions for Chromium browsers, and a template to build one.",
  },
  {
    id: "setup",
    title: "Setup",
    label: "Setup",
    blurb: "My machine, keyboard, and agent setup.",
  },
];

export type Item = {
  name: string;
  /** URL segment for /projects/<slug>; defaults to the name. */
  slug?: string;
  /** Where the product lives: its site, or the repo when there's no site. */
  href: string;
  description: string;
  /** owner/name on GitHub, when `href` points somewhere else. */
  repo?: string;
  category: Category;
  platforms?: Platform[];
  /** One copyable command, taken from the repo README. */
  install?: string;
  /** Package name on npm (published by me). */
  npm?: string;
  /** Shown on the home page. */
  featured?: boolean;
};

const gh = (repo: string) => `https://github.com/broisnees/${repo}`;

export const PROJECTS: Item[] = [
  // Apps
  {
    name: "stroke.click",
    slug: "stroke",
    href: "https://stroke.click",
    description: "A fast, minimal desktop database client.",
    category: "apps",
    featured: true,
    platforms: ["macOS", "Windows", "Linux"],
  },
  {
    name: "eWiz",
    slug: "ewiz",
    href: "https://ewiz.app",
    description:
      "Menu bar battery care for Apple silicon Macs: a charge limit that holds even asleep, and heat-aware charging.",
    category: "apps",
    featured: true,
    platforms: ["macOS"],
  },
  {
    name: "deck",
    href: gh("deck"),
    description:
      "Terminals, a browser and your coding agents in one native Mac window.",
    category: "apps",
    featured: true,
    platforms: ["macOS"],
  },
  {
    name: "decibel",
    href: gh("decibel"),
    description:
      "Volume boost, a 10-band EQ, per-app volume and media controls in the Mac menu bar.",
    category: "apps",
    featured: true,
    platforms: ["macOS"],
  },
  {
    name: "cool-notch",
    href: gh("cool-notch"),
    description:
      "Turns the MacBook notch into a living surface: live activities, HUDs and widgets.",
    category: "apps",
    platforms: ["macOS"],
  },
  {
    name: "claudebot",
    href: gh("claudebot"),
    description:
      "A pixel desktop pet modeled on Clawd, the critter from Claude Code.",
    category: "apps",
    platforms: ["macOS", "Windows", "Linux"],
  },
  {
    name: "commit-rank",
    href: gh("commit-rank"),
    description:
      "GitHub leaderboards: commits, pull requests and reviews ranked by country.",
    category: "apps",
    platforms: ["Web"],
  },
  {
    name: "bill",
    href: gh("bill"),
    description: "IRD-compliant invoicing for Nepali businesses.",
    category: "apps",
    platforms: ["Web", "Android"],
  },
  {
    name: "discerns.app",
    slug: "discerns",
    href: "https://discerns.app",
    repo: "broisnees/discerns",
    description:
      "The shared clipboard for your team and your AI agents: prompts, memories, snippets and env files in one place.",
    category: "apps",
    platforms: ["Web"],
  },
  {
    name: "zorail",
    href: gh("zorail"),
    description: "Self-hosted disposable inboxes for organizations.",
    category: "apps",
    platforms: ["macOS", "Linux", "Windows"],
    install:
      "curl -fsSL https://raw.githubusercontent.com/broisnees/zorail/main/scripts/install-cli.sh | bash",
  },
  {
    name: "smooly",
    href: gh("smooly"),
    description: "Better scrolling and mouse feel on Windows.",
    category: "apps",
    platforms: ["Windows"],
  },
  {
    name: "smooly-linux",
    href: gh("smooly-linux"),
    description:
      "Momentum scrolling, button remapping and gestures for Hyprland.",
    category: "apps",
    platforms: ["Linux"],
  },
  {
    name: "snipost",
    href: gh("snipost"),
    description:
      "A minimal screenshot tool for macOS: snip, auto-beautify, post.",
    category: "apps",
    platforms: ["macOS"],
  },
  {
    name: "strata",
    href: gh("strata"),
    description: "A calmer Activity Monitor for macOS.",
    category: "apps",
    platforms: ["macOS"],
  },
  {
    name: "panespace",
    href: gh("panespace"),
    description: "An i3-style tiling window manager for macOS.",
    category: "apps",
    featured: true,
    platforms: ["macOS"],
  },
  {
    name: "rzen",
    href: gh("rzen"),
    description: "A fast, memory-lean, Zen-style browser in Rust.",
    category: "apps",
    platforms: ["macOS"],
  },
  {
    name: "vacora",
    href: gh("vacora"),
    description:
      "Checks brand and product name availability across 100+ platforms.",
    category: "apps",
    platforms: ["Web"],
  },
  {
    name: "torendo",
    href: gh("torendo"),
    description: "A NEPSE market analyzer built with Streamlit.",
    category: "apps",
    platforms: ["Web"],
  },

  // Developer tools
  {
    name: "phobos",
    href: gh("phobos"),
    description: "The best token is the token never spent.",
    category: "skills",
    platforms: ["macOS", "Linux", "Windows"],
    install:
      "git clone https://github.com/broisnees/phobos.git ~/src/phobos && bash ~/src/phobos/install.sh",
  },
  {
    name: "zap",
    href: gh("zap"),
    description:
      "A cross-platform universal package manager that detects your system.",
    category: "tools",
    platforms: ["macOS", "Linux", "Windows"],
    install:
      "curl -fsSL https://raw.githubusercontent.com/broisnees/zap/master/install.sh | bash",
  },
  {
    name: "paper",
    href: gh("paper"),
    description:
      "Terminal wallpaper manager that searches Wallhaven, Unsplash and Pexels.",
    category: "tools",
    platforms: ["Linux", "macOS", "Windows"],
    install:
      "curl -fsSL https://raw.githubusercontent.com/broisnees/paper/master/install.sh | bash",
  },
  {
    name: "ezyenv",
    href: gh("ezyenv"),
    description: "Generates .env.example files from your .env files.",
    category: "tools",
    install: "npx ezyenv",
    npm: "ezyenv",
  },
  {
    name: "selfaction",
    href: gh("selfaction"),
    description:
      "Self-hosted runners and cache, compatible with GitHub Actions.",
    category: "tools",
    platforms: ["macOS", "Linux"],
    install: "go install github.com/broisnees/selfaction@latest",
  },

  // MCP servers
  {
    name: "wasper",
    href: "https://studio.stroke.click",
    repo: "broisnees/wasper",
    description: "Host an MCP server and API proxy from any OpenAPI spec.",
    category: "mcp",
    platforms: ["macOS", "Linux"],
    install: "npm install -g wasper-cli",
    npm: "wasper-cli",
  },
  {
    name: "azure-mcp",
    href: gh("azure-mcp"),
    description: "Interact with Azure Boards through MCP tools.",
    category: "mcp",
    install: "npx azure-board-mcp install",
    npm: "azure-board-mcp",
  },
  {
    name: "vite-mcp",
    href: gh("vite-mcp"),
    description:
      "A Vite plugin that gives MCP clients access to the browser during development.",
    category: "mcp",
    install: "npm install vite-mcp",
    npm: "vite-mcp",
  },
  {
    name: "registry-mcp",
    href: gh("registry-mcp"),
    description:
      "Search npm, JSR, Deno and other registries from one MCP tool.",
    category: "mcp",
  },

  // Libraries
  {
    name: "prisma-type-generator",
    href: gh("prisma-type-generator"),
    description: "A type generator for Prisma.",
    category: "npm",
    install: "npm install prisma-type-generator",
    npm: "prisma-type-generator",
  },
  {
    name: "mailcheckr",
    href: gh("mailcheckr"),
    description:
      "Email validation: syntax, typos, disposable domains, MX records, and optional SMTP probing.",
    category: "npm",
    install: "bun add mailcheckr",
    npm: "mailcheckr",
  },
  {
    name: "envnest",
    href: gh("nestenv"),
    description: "Type-safe environment variable validation for NestJS.",
    category: "npm",
    install: "npm install envnest",
    npm: "envnest",
  },

  // Agent skills
  {
    name: "safis.fyi",
    slug: "safis",
    href: "https://safis.fyi",
    repo: "broisnees/safis",
    description:
      "An agent skill that teaches an idea by building a page you can drag, turn, and cut open.",
    category: "skills",
    install: "npx skills add broisnees/safis -g",
  },
  {
    name: "claude-sudo",
    href: gh("claude-sudo"),
    description:
      "A sudo mode for Claude Code: no approval prompt on every tool call, and sudo just works.",
    category: "skills",
    install:
      "curl -fsSL https://raw.githubusercontent.com/broisnees/claude-sudo/main/install.sh | bash",
  },

  // Browser extensions
  {
    name: "where2search",
    href: gh("where2search"),
    description:
      "Search a term across AI tools and search engines from one place.",
    category: "extensions",
  },
  {
    name: "chrome-extension-template",
    href: gh("chrome-extension-template"),
    description: "A starting point for building Chrome extensions.",
    category: "extensions",
  },

  // Setup
  {
    name: "dotfiles",
    href: gh("dotfiles"),
    description: "Shell, editor, and Omarchy/Hyprland desktop config.",
    category: "setup",
    platforms: ["Linux"],
    install:
      "git clone https://github.com/broisnees/dotfiles.git ~/dotfiles && ~/dotfiles/install.sh",
  },
  {
    name: "keyboard",
    href: gh("keyboard"),
    description:
      "Epomaker TH40 on my own QMK firmware. Three lamps show what Claude Code is doing.",
    category: "setup",
    install:
      "git clone https://github.com/broisnees/keyboard.git && cd keyboard && ./setup.sh",
  },
  {
    name: "skills",
    href: gh("skills"),
    description: "Claude skills that write in my voice and strip the AI tells.",
    category: "skills",
    install:
      "git clone https://github.com/broisnees/skills.git ~/src/claude-skills && bash ~/src/claude-skills/me/install.sh",
  },
  {
    name: "tower",
    href: gh("tower"),
    description:
      "A control plane for the Claude Code and Codex agents I run in tmux.",
    category: "setup",
    platforms: ["Linux"],
    install:
      "git clone https://github.com/broisnees/tower ~/tower && cd ~/tower && make install",
  },
  {
    name: "connect-mcp",
    href: gh("connect-mcp"),
    description:
      "An MCP server that gives Claude a shell on my remote machines.",
    category: "setup",
  },
  {
    name: "pcvison",
    href: gh("pcvison"),
    description:
      "Lets Claude see and drive my Linux desktop, and read what the machine is doing.",
    category: "setup",
    platforms: ["Linux"],
  },
];

/** Home page highlights, in this order. */
const FEATURED_ORDER = [
  "stroke",
  "safis",
  "ewiz",
  "deck",
  "panespace",
  "decibel",
];
export const FEATURED = FEATURED_ORDER.flatMap(
  (slug) => PROJECTS.find((p) => (p.slug ?? p.name) === slug) ?? [],
);
export const SETUP = PROJECTS.filter((p) => p.category === "setup");

/** /projects?filter=<category> */
export const FILTERS = [
  "apps",
  "tools",
  "mcp",
  "skills",
  "npm",
  "extensions",
  "setup",
] as const satisfies readonly Category[];
export type Filter = (typeof FILTERS)[number];

export const PROFILES: { name: string; handle: string; href: string }[] = [
  {
    name: "GitHub",
    handle: "@broisnees",
    href: "https://github.com/broisnees",
  },
  { name: "X", handle: "@broisnees", href: "https://x.com/broisnees" },
  {
    name: "Instagram",
    handle: "@broisnees",
    href: "https://instagram.com/broisnees",
  },
  {
    name: "npm",
    handle: "~neeswebservice",
    href: "https://www.npmjs.com/~neeswebservice",
  },
  {
    name: "Dart pub",
    handle: "nischal-dahal.com.np",
    href: "https://pub.dev/publishers/nischal-dahal.com.np/packages",
  },
  {
    name: "Gists",
    handle: "@broisnees",
    href: "https://gist.github.com/broisnees",
  },
  { name: "Gallery", handle: "Photos from my album", href: "/gallery" },
  { name: "Resume", handle: "PDF", href: "/resume.pdf" },
  { name: "RSS", handle: "Writing feed", href: "/blogs.rss" },
];

/** Every project gets a page at /projects/<slug>. */
export const ALL_PROJECTS = PROJECTS;

export function slugOf(item: Item) {
  return item.slug ?? item.name;
}

export function findProject(slug: string) {
  return PROJECTS.find((item) => slugOf(item) === slug);
}

/** `owner/name` for every item that lives on GitHub. */
export function repoOf(item: Item) {
  return item.repo ?? item.href.match(/github\.com\/([^/]+\/[^/?#]+)/)?.[1];
}

export function formatDate(iso: string, style: "short" | "long" = "short") {
  return new Date(iso).toLocaleDateString("en-US", {
    timeZone: "UTC",
    year: "numeric",
    month: style === "long" ? "long" : "short",
    day: style === "long" ? "numeric" : undefined,
  });
}
