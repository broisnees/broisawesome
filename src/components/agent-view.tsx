import {
  AiMagicIcon,
  ArrowDown01Icon,
  ArrowRight02Icon,
  ArrowUp01Icon,
  ChatGptIcon,
  ClaudeIcon,
  File01Icon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { absolute } from "~/lib/seo";
import { cn } from "~/lib/utils";
import { CopyTextButton } from "./copy-button";
import { Icon } from "./icon";

/** Rough token count: about four characters per token for English and code. */
function tokens(text: string) {
  const n = Math.round(text.length / 4);
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);
}

/** Markdown, lightly colored by line: headings, quotes, lists and code read apart. */
function MarkdownLines({ markdown }: { markdown: string }) {
  let inFence = false;
  return markdown.split("\n").map((line, i) => {
    let kind = "text";
    if (/^```/.test(line)) {
      inFence = !inFence;
      kind = "fence";
    } else if (inFence) kind = "code";
    else if (/^#{1,6} /.test(line)) kind = "heading";
    else if (/^> /.test(line)) kind = "quote";
    else if (/^\s*([-*+]|\d+\.) /.test(line)) kind = "list";
    else if (/^Source: /.test(line)) kind = "meta";
    return (
      <span key={i} className={`md-line md-${kind}`}>
        {line || " "}
        {"\n"}
      </span>
    );
  });
}

const ghost =
  "inline-flex h-9 items-center gap-2 rounded-full px-3.5 text-sm text-fg shadow-hairline-inset transition-[background-color,scale] duration-150 ease-out hover:bg-surface-hover active:scale-[0.96]";

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
    <a href={href} target="_blank" rel="noreferrer" className={ghost}>
      <Icon icon={icon} size={15} />
      {label}
    </a>
  );
}

/**
 * Agent mode: the post as Markdown, laid out like a document rather than a
 * card. A toolbar to copy it or hand it to Claude or ChatGPT, then the source.
 */
export function AgentView({
  slug,
  markdown,
  words,
}: {
  slug: string;
  markdown: string;
  words: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const mdUrl = absolute(`/writing/${slug}.md`);
  const prompt = encodeURIComponent(
    `Read ${mdUrl} and be ready to answer questions about it.`,
  );
  const lines = markdown.split("\n").length;

  return (
    <section aria-label="This post as Markdown">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted tabular-nums">
        <Icon icon={AiMagicIcon} size={15} className="text-accent" />
        <span className="font-[550] text-fg">Markdown for agents</span>
        <span aria-hidden>·</span>
        <span>≈ {tokens(markdown)} tokens</span>
        <span aria-hidden>·</span>
        <span>{words.toLocaleString("en-US")} words</span>
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <CopyTextButton
          text={markdown}
          label="Copy page"
          className="button-accent h-9 gap-2 px-4 text-sm"
        />
        <OpenIn
          href={`https://claude.ai/new?q=${prompt}`}
          icon={ClaudeIcon}
          label="Claude"
        />
        <OpenIn
          href={`https://chatgpt.com/?q=${prompt}`}
          icon={ChatGptIcon}
          label="ChatGPT"
        />
        <a href={`/writing/${slug}.md`} className={ghost}>
          <Icon icon={File01Icon} size={15} />
          .md
        </a>
      </div>

      <pre
        aria-label="Markdown source"
        className={cn("agent-source", expanded && "agent-source-open")}
      >
        <MarkdownLines markdown={markdown} />
      </pre>

      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          aria-expanded={expanded}
          className="inline-flex h-8 items-center gap-1.5 text-sm text-muted transition-[color] duration-150 ease-out hover:text-fg"
        >
          <Icon icon={expanded ? ArrowUp01Icon : ArrowDown01Icon} size={14} />
          {expanded ? "Show less" : `Show all ${lines} lines`}
        </button>
        <Link
          to="/writing/$slug"
          params={{ slug }}
          search={{ mode: "read" }}
          replace
          resetScroll={false}
          className="group inline-flex h-8 items-center gap-1.5 text-sm text-muted transition-[color] duration-150 ease-out hover:text-fg"
        >
          Read the full post
          <Icon
            icon={ArrowRight02Icon}
            size={14}
            className="text-accent transition-[translate] duration-150 ease-out group-hover:translate-x-0.5"
          />
        </Link>
      </div>
    </section>
  );
}
