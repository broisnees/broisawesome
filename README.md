# nischal-dahal.com.np

My personal site: projects, writing, a photo gallery, and links. TanStack Start on a Cloudflare Worker.

## Run

```bash
bun install
bun run dev        # http://localhost:5173
bun run build      # production build into dist/
bun run og         # regenerate social cards (after adding or retitling a post)
bun run deploy     # build + wrangler deploy
```

`GITHUB_TOKEN` in `.dev.vars` (and as a Worker secret in production) turns on GitHub star counts. Without it the counts don't render.

**Say hi** (the header popover, and `curl -d "hey" https://nischal-dahal.com.np/hi`) delivers to my phone through a Telegram bot. Visitors can leave an email or a phone number for a reply. It needs two Worker secrets:

1. Create a bot with [@BotFather](https://t.me/BotFather) and copy its token.
2. Message the bot once, then read my chat id from `https://api.telegram.org/bot<token>/getUpdates` (`message.chat.id`).
3. `wrangler secret put TELEGRAM_BOT_TOKEN` and `wrangler secret put TELEGRAM_CHAT_ID`.

Without them, dev logs each message to the terminal and production answers 503. The `HI_LIMIT` binding in `wrangler.jsonc` caps it at 5 messages a minute per IP.

## Writing a post

Add `src/content/<slug>/route.mdx`:

```mdx
---
title: Sentence-case title
description: One or two sentences, ends with a period.
published: 2026-10-29
---
```

No `published` date means draft: visible in dev, hidden in production. Then run `bun run og` for its social card.

## Writing up a project

Every project in `src/lib/site.ts` already has a page at `/projects/<slug>` with its links, install command and platforms. Copy `src/projects/_template.mdx` to `src/projects/<slug>.mdx` and write the story; the page picks it up, gets indexed, and joins the sitemap. Without a write-up the page stays `noindex`. Its frontmatter `description` becomes the search snippet, and an optional `title` replaces "name: one-liner" in search when that runs past about 60 characters. Run `bun run og` for its social card (icon, name and one-liner).

Posts and write-ups are real MDX: import any React component and it hydrates (see `src/components/demos/counter.tsx`). `<Callout>` works without an import, and fenced code gets a language label and a copy button.

## Layout

```
src/
  routes/          file-based routes (pages, feeds, redirects)
  content/         posts, one MDX file per folder
  projects/        project write-ups (MDX); "_" files are templates
  server/          *.server.ts: server-only code (MDX metadata, GitHub, Google Photos)
  lib/             *.functions.ts server functions, site data, SEO helpers
  components/      shared UI, MDX components, demos
  styles.css       tokens (light-dark), post typography, code blocks, viewer
scripts/og.mjs     1200x630 cards with headless Chromium
```

- Every page renders fully on the server (`defaultSsr: true` in `src/start.ts`), which also 301s `www.` to the bare domain.
- Star counts on /projects and the photos on /gallery stream in after the page paints.
- Posts open in agent mode (Markdown, token count, Copy page, Open in Claude/ChatGPT); `?mode=read` shows the full post. Every post is also plain Markdown at `/writing/<slug>.md`.
- /writing takes `?q=`, /projects takes `?filter=<category>` (apps, tools, mcp, skills, npm, extensions, setup), both validated.
- The gallery reads my shared Google Photos album's public page (cached an hour) and serves the photos from `/photos/<id>` through the Worker, edge-cached; the Library API can't read albums an app didn't create.
- Old /blog/* and /blogs/* URLs 301 to /writing/*.
