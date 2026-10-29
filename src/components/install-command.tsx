import { CopyButton } from "./copy-button";

/** A one-line install command with a prompt and a copy button. */
export function InstallCommand({ command }: { command: string }) {
  return (
    <div className="flex h-11 items-center gap-2.5 rounded-xl bg-surface pr-1.5 pl-3.5 shadow-hairline-inset">
      <span
        aria-hidden
        className="font-mono text-[0.8125rem] text-accent select-none"
      >
        $
      </span>
      <code className="min-w-0 flex-1 overflow-x-auto font-mono text-[0.8125rem] whitespace-nowrap text-fg [scrollbar-width:none]">
        {command}
      </code>
      <CopyButton getText={() => command} label="Copy install command" />
    </div>
  );
}
