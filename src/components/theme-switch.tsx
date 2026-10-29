import {
  ComputerIcon,
  Moon02Icon,
  Sun03Icon,
} from "@hugeicons/core-free-icons";
import { rootRouteId, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { cn } from "~/lib/utils";
import { Icon } from "./icon";
import { setTheme, type Theme, THEMES } from "~/lib/theme.functions";

const ICONS = { system: ComputerIcon, light: Sun03Icon, dark: Moon02Icon };

/**
 * Swap the theme on <html> in one frame. Every color transition would
 * otherwise fire at once and smear the switch, so they're off for the swap.
 */
function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const freeze = document.createElement("style");
  freeze.textContent = "*,*::before,*::after{transition:none!important}";
  document.head.appendChild(freeze);

  if (theme === "system") delete root.dataset.theme;
  else root.dataset.theme = theme;

  void root.offsetHeight;
  requestAnimationFrame(() => freeze.remove());
}

export function ThemeSwitch({ theme }: { theme: Theme }) {
  const router = useRouter();
  const save = useServerFn(setTheme);
  const [current, setCurrent] = useState(theme);

  async function choose(next: Theme) {
    if (next === current) return;
    setCurrent(next);
    applyTheme(next);
    await save({ data: next });
    // Refresh the root loader so <html> and theme-color agree with the cookie.
    await router.invalidate({ filter: (m) => m.routeId === rootRouteId });
  }

  return (
    <div
      role="group"
      aria-label="Theme"
      className="flex rounded-[10px] bg-surface p-0.5 shadow-hairline-inset"
    >
      {THEMES.map((t) => (
        <button
          key={t}
          type="button"
          aria-label={`${t[0].toUpperCase()}${t.slice(1)} theme`}
          aria-pressed={current === t}
          onClick={() => choose(t)}
          className={cn(
            "grid size-7 place-items-center rounded-lg text-muted transition-[color,background-color,scale] duration-150 ease-out hover:text-fg active:scale-[0.96]",
            current === t && "bg-surface-hover text-fg shadow-raised",
          )}
        >
          <Icon icon={ICONS[t]} size={15} />
        </button>
      ))}
    </div>
  );
}
