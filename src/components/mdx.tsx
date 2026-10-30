import type { MDXComponents } from "mdx/types";
import { CommandLineIcon, File01Icon } from "@hugeicons/core-free-icons";
import {
  Children,
  type ComponentProps,
  isValidElement,
  type ReactNode,
  Suspense,
  useRef,
} from "react";
import { postContent, projectContent } from "~/lib/mdx-content";
import { CopyButton } from "./copy-button";
import { Icon } from "./icon";

const TERMINAL = new Set(["bash", "sh", "shell", "zsh", "console"]);

/**
 * Fenced code, as rehype-pretty-code emits it: <figure> holding an optional
 * <figcaption> title (from a filename comment, see vite.config.ts) and the
 * <pre>. With a title there's a slim header; without one, just the code and
 * a copy button that shows on hover.
 */
function CodeFigure({ children, ...props }: ComponentProps<"figure">) {
  const body = useRef<HTMLDivElement>(null);
  if (!("data-rehype-pretty-code-figure" in props)) {
    return <figure {...props}>{children}</figure>;
  }

  let title: ReactNode = null;
  let language: string | undefined;
  const code: ReactNode[] = [];
  Children.forEach(children, (child) => {
    if (!isValidElement<Record<string, unknown>>(child)) return;
    if ("data-rehype-pretty-code-title" in child.props) {
      title = child.props.children as ReactNode;
    } else {
      language ??= child.props["data-language"] as string | undefined;
      code.push(child);
    }
  });

  const copy = (
    <CopyButton
      getText={() => body.current?.querySelector("pre")?.textContent ?? ""}
    />
  );

  return (
    <figure {...props} className="code-figure">
      {title && (
        <figcaption className="code-title">
          <Icon
            icon={
              language && TERMINAL.has(language) ? CommandLineIcon : File01Icon
            }
            size={14}
          />
          <span className="min-w-0 flex-1 truncate">{title}</span>
          {copy}
        </figcaption>
      )}
      <div ref={body} className="code-body">
        {code}
        {!title && <div className="code-copy">{copy}</div>}
      </div>
    </figure>
  );
}

/** A highlighted aside: `<Callout>` in MDX, no import needed. */
export function Callout({
  title,
  children,
}: {
  title?: string;
  children: ReactNode;
}) {
  return (
    <aside className="callout">
      {title && <p className="callout-title">{title}</p>}
      {children}
    </aside>
  );
}

export const mdxComponents: MDXComponents = {
  figure: CodeFigure,
  img: (props) => <img loading="lazy" decoding="async" {...props} />,
  a: ({ href = "", ...props }) =>
    /^https?:/.test(href) ? (
      <a href={href} target="_blank" rel="noopener" {...props} />
    ) : (
      <a href={href} {...props} />
    ),
  Callout,
};

function Body({ slug, source }: { slug: string; source: typeof postContent }) {
  const Content = source.useContent(slug);
  return Content ? <Content components={mdxComponents} /> : null;
}

/** A post or project write-up, rendered as live React so MDX can be interactive. */
export function MdxBody({
  slug,
  kind,
}: {
  slug: string;
  kind: "writing" | "projects";
}) {
  return (
    <div className="post">
      <Suspense fallback={null}>
        <Body
          slug={slug}
          source={kind === "writing" ? postContent : projectContent}
        />
      </Suspense>
    </div>
  );
}
