import {
  ChatGptIcon,
  ClaudeIcon,
  File01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { track } from "~/lib/analytics";
import { absolute } from "~/lib/seo";
import { CopyTextButton } from "./copy-button";
import { Icon } from "./icon";

const button =
  "inline-flex h-8 items-center gap-1.5 rounded-full bg-surface px-3 text-[0.8125rem] text-muted shadow-hairline-inset transition-[color,background-color,scale] duration-150 ease-out hover:bg-surface-hover hover:text-fg active:scale-[0.96]";

function OpenIn({
  href,
  icon,
  label,
}: {
  href: string;
  icon: IconSvgElement;
  label: string;
}) {
  return (
    <a href={href} target="_blank" rel="noopener" className={button}>
      <Icon icon={icon} size={14} />
      {label}
    </a>
  );
}

/** Under the byline: copy the post as Markdown, or hand it to Claude or ChatGPT. */
export function PostActions({
  slug,
  markdown,
}: {
  slug: string;
  markdown: string;
}) {
  const mdUrl = absolute(`/writing/${slug}.md`);
  const prompt = encodeURIComponent(
    `Read ${mdUrl} and be ready to answer questions about it.`,
  );

  return (
    <section
      aria-label="Copy or share this post"
      className="mt-5 flex flex-wrap items-center gap-2"
    >
      <CopyTextButton
        text={markdown}
        label="Copy page"
        className={button}
        onCopy={() => track("post_copied", { slug })}
      />
      <OpenIn
        href={`https://claude.ai/new?q=${prompt}`}
        icon={ClaudeIcon}
        label="Open in Claude"
      />
      <OpenIn
        href={`https://chatgpt.com/?q=${prompt}`}
        icon={ChatGptIcon}
        label="Open in ChatGPT"
      />
      <a
        href={`/writing/${slug}.md`}
        target="_blank"
        rel="noopener"
        className={button}
      >
        <Icon icon={File01Icon} size={14} />
        Markdown
      </a>
    </section>
  );
}
