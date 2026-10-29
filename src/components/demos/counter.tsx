import { useState } from "react";

/** The smallest interactive demo: proof that MDX write-ups hydrate. Copy it as a starting point. */
export function Counter() {
  const [count, setCount] = useState(0);
  return (
    <div className="flex items-center gap-3 rounded-xl bg-surface p-3 shadow-hairline-inset">
      <button
        type="button"
        onClick={() => setCount((n) => n + 1)}
        className="button-accent h-8 px-3.5 text-sm"
      >
        Click
      </button>
      <span className="text-muted tabular-nums">Clicked {count} times</span>
    </div>
  );
}
