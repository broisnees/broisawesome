import { Search01Icon } from "@hugeicons/core-free-icons";
import { useEffect, useRef } from "react";
import { Icon } from "./icon";

/**
 * Filter input: icon, soft surface, terracotta focus ring. "/" jumps to it
 * from anywhere on the page; Escape clears it.
 */
export function SearchField({
  label,
  defaultValue,
  onChange,
}: {
  label: string;
  defaultValue?: string;
  onChange: (value: string) => void;
}) {
  const input = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey) return;
      const target = e.target as HTMLElement;
      if (
        target.isContentEditable ||
        /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)
      )
        return;
      e.preventDefault();
      input.current?.focus();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <label className="field group -mx-3 flex h-10 cursor-text items-center gap-2.5 rounded-xl px-3">
      <Icon
        icon={Search01Icon}
        className="shrink-0 text-muted transition-[color] duration-150 ease-out group-focus-within:text-accent"
      />
      <input
        ref={input}
        type="search"
        aria-label={label}
        placeholder={label}
        defaultValue={defaultValue}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key !== "Escape") return;
          e.currentTarget.value = "";
          onChange("");
          e.currentTarget.blur();
        }}
        className="min-w-0 flex-1 bg-transparent text-fg outline-none [&::-webkit-search-cancel-button]:appearance-none"
      />
      <kbd className="hidden h-5 min-w-5 items-center justify-center rounded-md px-1.5 font-mono text-[0.6875rem] text-muted shadow-hairline-inset transition-[opacity] duration-150 ease-out group-focus-within:opacity-0 sm:inline-flex">
        /
      </kbd>
    </label>
  );
}
