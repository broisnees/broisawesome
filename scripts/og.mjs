// Builds the 1200x630 social cards in public/og with headless Chromium:
// one default card, one per published post, one per project write-up.
// Run after adding or retitling a post: `bun run og`.
import { execFileSync } from "node:child_process";
import { mkdirSync, readdirSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

const root = new URL("..", import.meta.url).pathname;
const out = join(root, "public/og");
const work = join(tmpdir(), `og-${process.pid}`);
const font = join(root, "node_modules/@fontsource-variable/inter/files/inter-latin-wght-normal.woff2");
const avatar = join(root, "public/avatar.jpg");

/** Frontmatter `key: value` pairs, one line each (all my files use that shape). */
function frontmatter(file) {
  const block = readFileSync(file, "utf8").match(/^---\n([\s\S]*?)\n---/)?.[1] ?? "";
  return Object.fromEntries(
    block
      .split("\n")
      .map((line) => line.match(/^(\w+):\s*(.*)$/))
      .filter(Boolean)
      .map(([, k, v]) => [k, v.replace(/^["']|["']$/g, "").trim()]),
  );
}

const escape = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

function card({ title, kicker, date, icon, subtitle }) {
  return `<!doctype html><html><head><meta charset="utf-8"><style>
@font-face { font-family: Inter; src: url("file://${font}") format("woff2"); font-weight: 100 900; }
* { margin: 0; box-sizing: border-box; }
html, body { width: 1200px; height: 630px; }
body {
  font-family: Inter, sans-serif; color: #fafafa; padding: 72px 80px;
  display: flex; flex-direction: column; justify-content: space-between;
  background: radial-gradient(900px 420px at 12% -10%, rgb(217 119 87 / 0.22), transparent 70%), #000;
}
.who { display: flex; align-items: center; gap: 16px; font-size: 28px; font-weight: 575; letter-spacing: -0.02em; }
.who img { width: 48px; height: 48px; border-radius: 50%; outline: 1px solid rgb(255 255 255 / 0.12); outline-offset: -1px; }
h1 { font-size: 68px; line-height: 1.08; font-weight: 575; letter-spacing: -0.03em; max-width: 1000px; text-wrap: balance;
     display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; }
.meta { display: flex; align-items: center; gap: 16px; font-size: 26px; color: #8b8f97; }
.dot { width: 8px; height: 8px; border-radius: 50%; background: #d97757; }
.icon { width: 112px; height: 112px; border-radius: 26px; overflow: hidden; margin-bottom: 36px; display: grid; place-items: center;
        background: #141416; box-shadow: inset 0 0 0 1px rgb(255 255 255 / 0.1), 0 24px 60px -20px rgb(217 119 87 / 0.35); }
.icon img { width: 100%; height: 100%; object-fit: cover; }
.icon svg { width: 54px; height: 54px; color: #fafafa; }
.sub { margin-top: 20px; font-size: 32px; line-height: 1.35; color: #9a9ea6; max-width: 960px; text-wrap: pretty;
       display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
</style></head><body>
<div class="who"><img src="file://${avatar}">Nischal Dahal</div>
<div>${icon ? `<div class="icon">${icon}</div>` : ""}<h1>${escape(title)}</h1>${subtitle ? `<p class="sub">${escape(subtitle)}</p>` : ""}</div>
<div class="meta"><span>nischal-dahal.com.np</span>${[kicker, date].filter(Boolean).map((t) => `<span class="dot"></span><span>${escape(t)}</span>`).join("")}</div>
</body></html>`;
}

function render(key, data) {
  const html = join(work, `${key.replace(/\//g, "_")}.html`);
  const png = join(out, `${key}.png`);
  mkdirSync(join(png, ".."), { recursive: true });
  writeFileSync(html, card(data));
  execFileSync("chromium", [
    "--headless=new", "--disable-gpu", "--hide-scrollbars", "--allow-file-access-from-files",
    `--user-data-dir=${join(work, "profile")}`, "--window-size=1200,630",
    "--virtual-time-budget=2000", `--screenshot=${png}`, `file://${html}`,
  ], { stdio: "ignore" });
  console.log(`og: ${key}`);
}

rmSync(out, { recursive: true, force: true });
mkdirSync(work, { recursive: true });

render("default", { title: "Full-stack engineer in Kathmandu. Projects and writing." });

const manifest = [];
const longDate = (iso) =>
  new Date(iso).toLocaleDateString("en-US", { timeZone: "UTC", year: "numeric", month: "long", day: "numeric" });

for (const slug of readdirSync(join(root, "src/content"))) {
  const fm = frontmatter(join(root, "src/content", slug, "route.mdx"));
  if (!fm.published || !fm.title) continue; // drafts get the default card
  render(`writing/${slug}`, { title: fm.title, kicker: "Writing", date: longDate(fm.published) });
  manifest.push(`writing/${slug}`);
}

// Projects come from src/lib/site.ts and their icons from project-icon.tsx:
// the real logo file when there is one, else the Hugeicon drawn inline.
const site = readFileSync(join(root, "src/lib/site.ts"), "utf8");
const field = (block, key) => block.match(new RegExp(`\\b${key}:\\s*"((?:[^"\\\\]|\\\\.)*)"`))?.[1];
const projects = [...site.matchAll(/\{\s*\n\s*name: "[^"]+",[\s\S]*?\n\s*\}/g)].map(([block]) => ({
  name: field(block, "name"),
  slug: field(block, "slug") ?? field(block, "name"),
  description: field(block, "description"),
  category: field(block, "category"),
}));
const categoryTitles = Object.fromEntries([...site.matchAll(/id: "(\w+)",\s*title: "([^"]+)"/g)].map(([, id, t]) => [id, t]));

const iconSource = readFileSync(join(root, "src/components/project-icon.tsx"), "utf8");
const mapOf = (name, value) => {
  const body = iconSource.match(new RegExp(`const ${name}[^=]*= \\{([\\s\\S]*?)\\n\\};`))?.[1] ?? "";
  return Object.fromEntries([...body.matchAll(new RegExp(`^\\s*"?([\\w-]+)"?: ${value},`, "gm"))].map(([, k, v]) => [k, v]));
};
const logos = mapOf("LOGOS", `"([^"]+)"`);
const hugeicons = mapOf("ICONS", "(\\w+)");
const icons = await import("@hugeicons/core-free-icons");
const kebab = (k) => k.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`);
function svgOf(name) {
  const nodes = icons[name];
  if (!nodes) return "";
  const body = nodes
    .map(([tag, attrs]) =>
      `<${tag} ${Object.entries(attrs)
        .filter(([k]) => k !== "key")
        .map(([k, v]) => `${kebab(k)}="${k === "strokeWidth" ? 1.75 : v}"`)
        .join(" ")}/>`)
    .join("");
  return `<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
}

for (const file of readdirSync(join(root, "src/projects"))) {
  if (file.startsWith("_") || !file.endsWith(".mdx")) continue;
  const slug = file.replace(/\.mdx$/, "");
  const project = projects.find((p) => p.slug === slug);
  if (!project) continue;
  const icon = logos[slug]
    ? `<img src="file://${join(root, "public", logos[slug])}">`
    : svgOf(hugeicons[slug]);
  render(`projects/${slug}`, {
    title: project.name,
    subtitle: project.description,
    kicker: categoryTitles[project.category] ?? "Project",
    icon,
  });
  manifest.push(`projects/${slug}`);
}

writeFileSync(join(root, "src/lib/og-manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);
rmSync(work, { recursive: true, force: true });
console.log(`og: ${manifest.length + 1} cards in public/og`);
