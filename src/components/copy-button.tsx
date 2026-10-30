import { Copy01Icon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useState } from "react";
import { cn } from "~/lib/utils";
import { Icon } from "./icon";

/** Copies `getText()`; the icon swaps to a tick for 1.5s. */
export function CopyButton({
  getText,
  label = "Copy code",
  onCopy,
}: {
  getText: () => string;
  label?: string;
  onCopy?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(getText());
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  // Both icons stay mounted; the swap is a short scale, fade and blur.
  const swap =
    "absolute transition-[opacity,scale,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)]";
  const shown = "scale-100 opacity-100 blur-0";
  const hidden = "scale-[0.25] opacity-0 blur-[4px]";

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={copied ? "Copied" : label}
      className="relative grid size-7 place-items-center rounded-md text-muted transition-[color,background-color,scale] duration-150 ease-out hover:bg-surface-hover hover:text-fg active:scale-[0.96]"
    >
      <Icon
        icon={Copy01Icon}
        size={14}
        className={cn(swap, copied ? hidden : shown)}
      />
      <Icon
        icon={Tick02Icon}
        size={14}
        className={cn(swap, "text-accent", copied ? shown : hidden)}
      />
    </button>
  );
}

/** A labeled copy button for whole documents ("Copy page" → "Copied"). */
export function CopyTextButton({
  text,
  label,
  className,
  onCopy,
}: {
  text: string;
  label: string;
  className?: string;
  onCopy?: () => void;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(text);
    onCopy?.();
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  }

  return (
    <button type="button" onClick={copy} className={className}>
      <span className="relative grid size-4 place-items-center">
        <Icon
          icon={Copy01Icon}
          size={15}
          className={cn(
            "absolute transition-[opacity,scale,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
            copied
              ? "scale-[0.25] opacity-0 blur-[4px]"
              : "scale-100 opacity-100 blur-0",
          )}
        />
        <Icon
          icon={Tick02Icon}
          size={15}
          className={cn(
            "absolute transition-[opacity,scale,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)]",
            copied
              ? "scale-100 opacity-100 blur-0"
              : "scale-[0.25] opacity-0 blur-[4px]",
          )}
        />
      </span>
      {/* Both labels share one grid cell, so the button keeps the width of the
          longer one and nothing next to it shifts when the label swaps. */}
      <span className="grid">
        <span
          className={cn(
            "col-start-1 row-start-1 transition-opacity duration-150",
            copied && "opacity-0",
          )}
        >
          {label}
        </span>
        <span
          aria-hidden
          className={cn(
            "col-start-1 row-start-1 transition-opacity duration-150",
            !copied && "opacity-0",
          )}
        >
          Copied
        </span>
      </span>
      <span aria-live="polite" className="sr-only">
        {copied ? "Copied" : ""}
      </span>
    </button>
  );
}
