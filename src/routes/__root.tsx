import {
  createRootRoute,
  HeadContent,
  Link,
  Outlet,
  Scripts,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { GitHubMark } from "~/components/brand-icons";
import { Icon } from "~/components/icon";
import { KathmanduTime } from "~/components/kathmandu-time";
import { metaClass, PageHeader } from "~/components/list";
import { SayHi } from "~/components/say-hi";
import { ThemeSwitch } from "~/components/theme-switch";
import { SITE_URL } from "~/lib/seo";
import { getTheme, type Theme } from "~/lib/theme.functions";
import appCss from "~/styles.css?url";
// Same file the stylesheet uses, so the preload is the one the text needs.
import interLatin from "@fontsource-variable/inter/files/inter-latin-opsz-normal.woff2?url";

const BG = { light: "#ffffff", dark: "#000000" };

/** Browser chrome color: pinned for an explicit choice, per scheme for system. */
function themeColor(theme: Theme) {
  if (theme !== "system") return [{ name: "theme-color", content: BG[theme] }];
  return (["light", "dark"] as const).map((scheme) => ({
    name: "theme-color",
    content: BG[scheme],
    media: `(prefers-color-scheme: ${scheme})`,
  }));
}

export const Route = createRootRoute({
  loader: async () => ({ theme: await getTheme() }),
  head: ({ loaderData }) => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { name: "color-scheme", content: "light dark" },
      ...themeColor(loaderData?.theme ?? "system"),
      {
        name: "google-site-verification",
        content: "edGz_5Jr5VsLbGpxvQ3AZBAKtuEyNBgc_qtdthOPJKU",
      },
    ],
    links: [
      {
        rel: "preload",
        href: interLatin,
        as: "font",
        type: "font/woff2",
        crossOrigin: "anonymous",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", sizes: "any" },
      {
        rel: "icon",
        type: "image/png",
        sizes: "32x32",
        href: "/favicon-32x32.png",
      },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
      { rel: "manifest", href: "/site.webmanifest" },
      {
        rel: "alternate",
        type: "application/rss+xml",
        title: "Nischal Dahal (RSS)",
        href: `${SITE_URL}/blogs.rss`,
      },
      {
        rel: "alternate",
        type: "application/feed+json",
        title: "Nischal Dahal (JSON Feed)",
        href: `${SITE_URL}/feed.json`,
      },
    ],
    scripts: [
      {
        // Scrollbar width, for full-bleed sections (gallery) that span the
        // viewport minus the scrollbar without a sideways scroll.
        children:
          "document.documentElement.style.setProperty('--sbw',innerWidth-document.documentElement.clientWidth+'px')",
      },
      {
        src: "https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6430477215422762",
        async: true,
        crossOrigin: "anonymous",
      },
      {
        children: `window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', 'G-L2HXER3J9C');`,
      },
    ],
  }),
  shellComponent: RootDocument,
  component: Outlet,
  notFoundComponent: NotFound,
  errorComponent: ({ error }) => (
    <Message title="Something broke." body="Try again in a moment.">
      {import.meta.env.DEV && (
        <pre className="mt-8 overflow-x-auto rounded-lg bg-surface p-4 font-mono text-xs">
          {error instanceof Error ? error.stack : String(error)}
        </pre>
      )}
    </Message>
  ),
});

const NAV = [
  { to: "/writing", label: "Writing" },
  { to: "/projects", label: "Projects" },
  { to: "/about", label: "About" },
  { to: "/links", label: "Links" },
] as const;

/** The full HTML document. Header and main wrap every page, 404s included. */
function RootDocument({ children }: { children: ReactNode }) {
  // Undefined when the root itself errored; fall back to following the OS.
  const theme = Route.useLoaderData()?.theme ?? "system";

  return (
    <html
      lang="en"
      data-theme={theme === "system" ? undefined : theme}
      suppressHydrationWarning
    >
      <head>
        <HeadContent />
      </head>
      {/* Extensions (e.g. "vsc-initialized") write to <body>; ignore that in hydration. */}
      <body
        className="min-h-dvh font-sans text-base/[1.6] antialiased"
        suppressHydrationWarning
      >
        {/* 38rem of text at 17px keeps lines near 70 characters. */}
        <div className="mx-auto max-w-[38rem] px-5 pt-6 pb-10 sm:px-6 sm:pt-8">
          <a
            href="#main"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-50 focus:rounded-md focus:bg-bg focus:px-3 focus:py-2"
          >
            Skip to content
          </a>
          <header className="flex flex-wrap items-center gap-x-5 gap-y-2">
            <Link
              to="/"
              className="mr-auto font-[575] tracking-[-0.02em] text-fg"
            >
              Nischal Dahal
            </Link>
            {/* Link padding hangs outside the column so the words sit on its edges. */}
            <nav
              aria-label="Main"
              className="order-last -mx-2 flex w-full text-sm text-muted sm:order-none sm:w-auto"
            >
              {NAV.map((item) => (
                <Link
                  key={item.to}
                  to={item.to}
                  className="relative rounded-md px-2 py-1 transition-[color] duration-150 ease-out hover:text-fg"
                  activeProps={{
                    className:
                      "text-fg after:absolute after:-bottom-0.5 after:left-1/2 after:size-1 after:-translate-x-1/2 after:rounded-full after:bg-accent",
                  }}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="flex items-center gap-1.5">
              <a
                href="https://github.com/broisnees"
                target="_blank"
                rel="noreferrer"
                aria-label="GitHub"
                className="grid size-8 place-items-center rounded-full text-muted transition-[color,background-color,scale] duration-150 ease-out hover:bg-surface-hover hover:text-fg active:scale-[0.96]"
              >
                <Icon icon={GitHubMark} size={17} />
              </a>
              <SayHi />
            </div>
          </header>
          <main id="main" className="mt-16 sm:mt-24">
            {children}
          </main>
          <footer className="mt-28 flex flex-wrap items-center justify-between gap-4 border-t border-line pt-6">
            <span className={`text-muted ${metaClass}`}>
              Kathmandu <KathmanduTime />
            </span>
            <ThemeSwitch theme={theme} />
          </footer>
        </div>
        <Scripts />
      </body>
    </html>
  );
}

function NotFound() {
  return (
    <Message title="Nothing here." body="This page moved or never existed." />
  );
}

function Message({
  title,
  body,
  children,
}: {
  title: string;
  body: string;
  children?: ReactNode;
}) {
  return (
    <>
      <PageHeader
        title={title}
        description={
          <>
            {body}{" "}
            <Link to="/" className="link text-fg">
              Back home
            </Link>
            .
          </>
        }
      />
      {children}
    </>
  );
}
