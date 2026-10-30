// Figures for "How I rendered a million rows with no lag". Every constant here
// is copied from Stroke's grid (db-studio): DataTable.svelte, row-window.js,
// StudioShell.svelte. The drawings are simplified; the numbers are not.
import "@safis/core/scoped.css";
import type { Control, FigureSpec, G, Values } from "@safis/core";

type Gx = G & { ease(key: string, target: number): number };
type Spec = FigureSpec;

const ROWS = 1_000_000;
const SPACINGS = [
  { value: 19, label: "dense" },
  { value: 22, label: "compact" },
  { value: 28, label: "standard" },
  { value: 36, label: "relaxed" },
  { value: 44, label: "spacious" },
];
const BROWSER_MAX_PX = 33_500_000; // "Browser engines cap ... at ~33.5M px"
const MAX_SCROLL_PX = 24_000_000; // DataTable.svelte
const HEADER_H = 30;

// row-window.js and StudioShell.svelte
const WINDOW_TARGET_BYTES = 2_000_000;
const WINDOW_ROWS_MIN = 100;
const WINDOW_ROWS_MAX = 10_000;
const WINDOW_KEEP_ROWS = 80_000;
const WINDOW_MAX_INFLIGHT = 3;
const WINDOW_PREFETCH = 4;
const WINDOW_SLOW_MS = 400;
const EVICT_DEBOUNCE_MS = 300;

const fmt = (n: number) => Math.round(n).toLocaleString("en-US");
const clamp = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));
const mpx = (px: number) => `${(px / 1e6).toFixed(1)}M px`;
const bytes = (b: number) =>
  b >= 1e9
    ? `${(b / 1e9).toFixed(1)} GB`
    : b >= 1e6
      ? `${(b / 1e6).toFixed(1)} MB`
      : b >= 1e3
        ? `${(b / 1e3).toFixed(1)} KB`
        : `${Math.round(b)} B`;

const spacingControl = (value = 28): Control => ({
  key: "rowH",
  label: "Row spacing",
  type: "choice",
  options: SPACINGS,
  value,
});

// ── The table: rows of the `events` fixture, made up from the row index ──────

function hash(i: number) {
  let h = Math.imul(i ^ 0x9e3779b9, 0x85ebca6b);
  h ^= h >>> 13;
  h = Math.imul(h, 0xc2b2ae35);
  return (h ^ (h >>> 16)) >>> 0;
}
const KINDS = ["view", "click", "search", "purchase", "signup", "error"];
const T0 = Date.UTC(2025, 0, 1);

const COLUMNS: { name: string; width: number; cell: (i: number) => string }[] =
  [
    { name: "id", width: 74, cell: (i) => String(i + 1) },
    {
      name: "ts",
      width: 152,
      cell: (i) =>
        new Date(T0 + i * 31_000).toISOString().slice(0, 19).replace("T", " "),
    },
    { name: "kind", width: 78, cell: (i) => KINDS[hash(i) % KINDS.length] },
    {
      name: "device_id",
      width: 84,
      cell: (i) => String(1000 + (hash(i) % 9000)),
    },
    {
      name: "amount",
      width: 80,
      cell: (i) =>
        hash(i + 7) % 5 ? ((hash(i + 3) % 100_000) / 100).toFixed(2) : "NULL",
    },
    { name: "latency_ms", width: 90, cell: (i) => String(hash(i + 11) % 900) },
  ];

type RowLook = "row" | "ghost" | "skeleton";

/**
 * Draws a grid into `box`: a header, then rows from virtual offset `top`
 * (pixels into the body). `look(i)` picks how each row is drawn and `tint(i)`
 * an optional fill behind it.
 */
function drawTable(
  g: G,
  box: [number, number, number, number],
  o: {
    top: number;
    rowH: number;
    rows?: number;
    header?: boolean;
    look?: (i: number) => RowLook;
    tint?: (i: number) => string | null;
    size?: number;
  },
) {
  const [x, y, w, h] = box;
  const rowH = o.rowH;
  const total = o.rows ?? ROWS;
  const headH = o.header === false ? 0 : 24;
  const size = o.size ?? 11.5;
  const scale = Math.min(1, w / 560);
  const cols: {
    name: string;
    x: number;
    w: number;
    cell: (i: number) => string;
  }[] = [];
  let cx = x + 8;
  for (const c of COLUMNS) {
    const cw = c.width * Math.max(scale, 0.82);
    if (cx + cw > x + w + 30) break;
    cols.push({ ...c, x: cx, w: cw });
    cx += cw;
  }
  g.clip([x, y, w, h], () => {
    g.rect(x, y, w, h, { fill: "bg" });
    const bodyY = y + headH;
    const first = Math.max(0, Math.floor(o.top / rowH));
    const shift = o.top - first * rowH;
    for (
      let i = first, ry = bodyY - shift;
      ry < y + h && i < total;
      i++, ry += rowH
    ) {
      const look = o.look ? o.look(i) : "row";
      const tint = o.tint?.(i);
      if (tint) g.rect(x, ry, w, rowH, { fill: tint });
      g.line([x, ry + rowH], [x + w, ry + rowH], { stroke: "grid", width: 1 });
      const ty = ry + rowH / 2;
      for (const c of cols) {
        if (look === "skeleton") {
          const sw = Math.min(c.w - 16, 18 + (hash(i * 7 + c.x) % 40));
          g.rect(c.x, ty - 4, sw, 8, { fill: g.rgba("muted", 0.16), r: 4 });
          continue;
        }
        const text = c.cell(i);
        const max = Math.floor((c.w - 12) / (size * 0.6));
        g.text(
          text.length > max ? `${text.slice(0, Math.max(1, max - 1))}…` : text,
          [c.x, ty],
          {
            align: "left",
            font: "mono",
            size,
            baseline: "middle",
            color: c.name === "id" ? "muted" : "ink",
            alpha: look === "ghost" ? 0.28 : 1,
          },
        );
      }
    }
    if (headH) {
      g.rect(x, y, w, headH, { fill: "bg" });
      for (const c of cols) {
        g.text(c.name, [c.x, y + headH / 2], {
          align: "left",
          size: 11,
          weight: 600,
          baseline: "middle",
          color: "muted",
        });
      }
      g.line([x, y + headH], [x + w, y + headH], { stroke: "faint", width: 1 });
    }
  });
  g.rect(x, y, w, h, { stroke: "faint", width: 1 });
}

// ── 1. What's on screen ───────────────────────────────────────────────────────

export const scale: Spec = {
  aspect: (w) => (w < 520 ? 1.05 : 1.7),
  controls: [
    {
      key: "row",
      label: "Scroll to row",
      min: 0,
      max: ROWS - 12,
      step: 1,
      value: 412_000,
      color: "blue",
      format: (n: number) => fmt(n + 1),
    },
  ],
  caption:
    "The whole table on the left, drawn to scale; the blue sliver is what fits on screen at once.",
  status: (_s, v) => `rows ${fmt(v.row + 1)} to ${fmt(v.row + 12)} on screen`,
  draw(g, _s, v) {
    const top = 26;
    const barH = g.h - top - 14;
    const barX = 20;
    g.rect(barX, top, 22, barH, { fill: "grid", stroke: "faint", width: 1 });
    const wy = top + (v.row / ROWS) * barH;
    g.rect(barX - 3, wy - 1.5, 28, 3, { fill: "blue" });
    g.label("1,000,000 rows", [barX - 4, top - 10], {
      align: "left",
      color: "muted",
    });
    const tx = 92;
    const box: [number, number, number, number] = [
      tx,
      top,
      g.w - tx - 12,
      Math.min(barH, 12 * 22 + 24),
    ];
    g.line([barX + 25, wy - 1.5], [tx, top], {
      stroke: "blue",
      width: 1,
      dash: [3, 3],
    });
    g.line([barX + 25, wy + 1.5], [tx, top + box[3]], {
      stroke: "blue",
      width: 1,
      dash: [3, 3],
    });
    drawTable(g, box, { top: v.row * 22, rowH: 22 });
  },
};

// ── 2. Paint only the rows in view ────────────────────────────────────────────

export const paint: Spec = {
  aspect: (w) => (w < 520 ? 0.95 : 1.55),
  controls: [
    {
      key: "top",
      label: "scrollTop",
      min: 0,
      max: 3000,
      step: 1,
      value: 500,
      unit: " px",
      color: "blue",
    },
    spacingControl(),
  ],
  caption:
    "The canvas is the frame. Rows above and below it exist only as arithmetic; the painter draws the rows the frame cuts through, and nothing else.",
  status: (_s, v) => {
    const first = Math.floor(v.top / v.rowH);
    const shift = v.top - first * v.rowH;
    const n = Math.ceil((FRAME_H + shift) / v.rowH);
    return `painted ${n} rows, from row ${fmt(first)}`;
  },
  draw(g, _s, v) {
    const narrow = g.w < 520;
    const fx = 14;
    const fw = narrow ? g.w - 28 : g.w * 0.58;
    const fy = 40;
    const fh = Math.min(FRAME_H, g.h - fy - (narrow ? 120 : 30));
    const first = Math.floor(v.top / v.rowH);
    const shift = v.top - first * v.rowH;
    // Ghost rows outside the frame: not painted, only computed.
    drawTable(g, [fx, 6, fw, fy - 6], {
      top: v.top - (fy - 6),
      rowH: v.rowH,
      header: false,
      look: () => "ghost",
    });
    drawTable(g, [fx, fy, fw, fh], { top: v.top, rowH: v.rowH, header: false });
    drawTable(g, [fx, fy + fh, fw, g.h - fy - fh - (narrow ? 100 : 6)], {
      top: v.top + fh,
      rowH: v.rowH,
      header: false,
      look: () => "ghost",
    });
    g.rect(fx, fy, fw, fh, { stroke: "blue", width: g.lit("frame") ? 3.5 : 2 });
    g.label(
      "the canvas",
      [narrow ? fx : fx + fw + 18, narrow ? fy + fh + 14 : fy - 2],
      {
        color: "blue",
        align: "left",
      },
    );
    const n = Math.ceil((fh + shift) / v.rowH);
    const lines = [
      `scrollTop = ${v.top}`,
      `first = ⌊${v.top} / ${v.rowH}⌋ = ${first}`,
      `shift = ${v.top} − ${first}×${v.rowH} = ${shift}`,
      `rows painted = ${n}`,
      `rows skipped = ${fmt(ROWS - n)}`,
    ];
    const lx = narrow ? 14 : fx + fw + 18;
    const ly = narrow ? g.h - 92 : fy + 18;
    lines.forEach((t, i) =>
      g.text(t, [lx, ly + i * 19], {
        align: "left",
        font: "mono",
        size: 12,
        color: i === 1 ? "blue" : i === 4 ? "muted" : "ink",
      }),
    );
  },
};
const FRAME_H = 300;

// ── 3. The browser's scroll limit ─────────────────────────────────────────────

export const cap: Spec = {
  aspect: (w) => (w < 520 ? 1 : 1.6),
  controls: [
    {
      key: "lg",
      label: "Rows",
      min: 5,
      max: Math.log10(5_000_000),
      step: 0.001,
      value: 6,
      color: "blue",
      format: (x: number) => fmt(10 ** x),
      marks: [
        { value: 6, label: "1M" },
        { value: Math.log10(5_000_000), label: "5M" },
      ],
    },
    spacingControl(),
    {
      key: "compress",
      label: "Compress the scroll range",
      type: "toggle",
      value: false,
      color: "green",
    },
  ],
  caption:
    "A spacer as tall as every row would need (left) against what the browser will scroll (right). Past the limit, the rows above the red line can't be reached; compressed, the whole table fits in 24M px.",
  status: (_s, v) => {
    const rows = 10 ** v.lg;
    const content = HEADER_H + rows * v.rowH + 2 * v.rowH;
    if (v.compress) {
      const sc =
        content <= MAX_SCROLL_PX ? 1 : (content - 800) / (MAX_SCROLL_PX - 800);
      return `needs ${mpx(content)} · scroll ${mpx(Math.min(content, MAX_SCROLL_PX))} · ×${sc.toFixed(2)}`;
    }
    const reach = Math.floor((BROWSER_MAX_PX - HEADER_H - 2 * v.rowH) / v.rowH);
    return content > BROWSER_MAX_PX
      ? `rows past ~${fmt(reach)} unreachable`
      : `needs ${mpx(content)}, fits`;
  },
  draw(g, _s, v) {
    const gx = g as Gx;
    const rows = 10 ** v.lg;
    const content = HEADER_H + rows * v.rowH + 2 * v.rowH;
    const yMax = Math.max(content, BROWSER_MAX_PX) * 1.08;
    const base = g.h - 26;
    const top = 26;
    const Y = (px: number) => base - (px / yMax) * (base - top);
    const bw = Math.min(110, g.w * 0.2);
    const ax = g.w * 0.22;
    const bx = g.w * 0.62;
    const shown = v.compress
      ? Math.min(content, MAX_SCROLL_PX)
      : Math.min(content, BROWSER_MAX_PX);
    const hC = gx.ease("content", content);
    const hS = gx.ease("shown", shown);
    g.rect(ax, Y(hC), bw, base - Y(hC), {
      fill: g.rgba("blue", 0.18),
      stroke: "blue",
      width: 1.5,
    });
    if (!v.compress && content > BROWSER_MAX_PX) {
      g.rect(ax, Y(hC), bw, Y(BROWSER_MAX_PX) - Y(hC), {
        hatch: g.rgba("red", 0.6),
        stroke: "red",
        width: 1.5,
      });
      g.label("unreachable", [ax + bw + 8, (Y(hC) + Y(BROWSER_MAX_PX)) / 2], {
        align: "left",
        color: "red",
      });
    }
    g.rect(bx, Y(hS), bw, base - Y(hS), {
      fill: g.rgba(v.compress ? "green" : "muted", 0.18),
      stroke: v.compress ? "green" : "muted",
      width: 1.5,
    });
    if (v.compress && content > MAX_SCROLL_PX) {
      g.line([ax + bw, Y(hC)], [bx, Y(hS)], {
        stroke: "green",
        width: 1,
        dash: [4, 4],
      });
      g.line([ax + bw, base], [bx, base], {
        stroke: "green",
        width: 1,
        dash: [4, 4],
      });
    }
    const limit = (px: number, text: string, color: string) => {
      g.line([12, Y(px)], [g.w - 12, Y(px)], {
        stroke: color,
        width: 1,
        dash: [6, 5],
      });
      g.label(text, [g.w - 12 - g.measure(text, { size: 12.5 }), Y(px) - 8], {
        align: "left",
        color,
      });
    };
    limit(BROWSER_MAX_PX, "browser limit ≈ 33.5M px", "red");
    if (v.compress) limit(MAX_SCROLL_PX, "Stroke's cap: 24M px", "green");
    g.line([12, base], [g.w - 12, base], { stroke: "ink", width: 1 });
    g.label("height the rows need", [ax, base + 16], {
      align: "left",
      color: "blue",
    });
    g.label(
      v.compress ? "spacer (compressed)" : "what scrolls",
      [bx, base + 16],
      { align: "left", color: v.compress ? "green" : "muted" },
    );
  },
};

// ── 4. Physical and virtual scroll ────────────────────────────────────────────

const VIEW_H = 800;
let mapP: { x0: number; x1: number; y: number } | null = null;

export const map: Spec = {
  aspect: (w) => (w < 520 ? 1.2 : 2.2),
  state: () => ({ frac: 0.5 }),
  controls: [
    {
      key: "rows",
      label: "Rows",
      type: "choice",
      options: [
        { value: 1_000_000, label: "1M" },
        { value: 5_000_000, label: "5M" },
      ],
      value: 1_000_000,
    },
  ],
  caption:
    "Top: the 24M px the browser actually scrolls. Bottom: the table's real height. Drag the thumb; every physical pixel stands for a fixed number of virtual ones.",
  status: (s, v) => {
    const content = HEADER_H + v.rows * 28 + 56;
    const sc = (content - VIEW_H) / (MAX_SCROLL_PX - VIEW_H);
    const virt = s.frac * (content - VIEW_H);
    return `scale ×${sc.toFixed(2)} · row ${fmt(Math.floor(virt / 28))}`;
  },
  draw(g, s, v) {
    const content = HEADER_H + v.rows * 28 + 56;
    const sc = (content - VIEW_H) / (MAX_SCROLL_PX - VIEW_H);
    const x0 = 20;
    const x1 = g.w - 20;
    const yP = g.h * 0.3;
    const yV = g.h * 0.72;
    mapP = { x0, x1, y: yP };
    const ruler = (y: number, label: string, max: number, color: string) => {
      g.line([x0, y], [x1, y], { stroke: color, width: 2 });
      for (let i = 0; i <= 4; i++) {
        const x = x0 + ((x1 - x0) * i) / 4;
        g.line([x, y - 4], [x, y + 4], { stroke: color, width: 1 });
        g.text(mpx((max * i) / 4).replace(" px", ""), [x, y + 16], {
          size: 10.5,
          align: "center",
          color: "muted",
        });
      }
      g.label(label, [x0, y - 14], { align: "left", color });
    };
    ruler(
      yP,
      "physical scrollTop (what the browser scrolls)",
      MAX_SCROLL_PX,
      "ink",
    );
    ruler(yV, "virtual offset (where the rows are)", content, "blue");
    const xp = x0 + s.frac * (x1 - x0);
    const virt = s.frac * (content - VIEW_H);
    const xv = x0 + (virt / content) * (x1 - x0);
    g.line([xp, yP], [xv, yV], { stroke: "blue", width: 1.5, dash: [4, 4] });
    g.handle([xp, yP], { color: "ink" });
    g.circle([xv, yV], 5, { fill: "blue" });
    g.chip(`1 px → ${sc.toFixed(2)} px`, [g.w / 2 - 40, (yP + yV) / 2 - 10], {
      color: "green",
    });
  },
  drag: {
    hit: (p, s) => {
      if (!mapP) return false;
      const xp = mapP.x0 + s.frac * (mapP.x1 - mapP.x0);
      return (
        Math.hypot(p[0] - xp, p[1] - mapP.y) < 28 ||
        Math.abs(p[1] - mapP.y) < 16
      );
    },
    move: (p, s) => {
      if (mapP) s.frac = clamp((p[0] - mapP.x0) / (mapP.x1 - mapP.x0), 0, 1);
    },
  },
};

// ── 5. Blitting ───────────────────────────────────────────────────────────────

export const blit: Spec = {
  aspect: (w) => (w < 520 ? 1 : 1.75),
  state: () => ({ top: 0, acc: 0, dy: 0 }),
  controls: [
    {
      key: "speed",
      label: "Scroll per frame",
      min: 1,
      max: 60,
      step: 1,
      value: 6,
      unit: " px",
      color: "green",
    },
    {
      key: "blit",
      label: "Copy the last frame",
      type: "toggle",
      value: true,
      color: "green",
    },
  ],
  caption:
    "One frame of a scroll. With the copy on, the old pixels move up and only the green strip is painted fresh; with it off, every row is painted again.",
  status: (s, v) => {
    const { painted, total, cols } = blitCounts(s, v);
    return `painted ${painted} of ${total} rows · ${painted * cols} fillText calls`;
  },
  step(dt, s, v) {
    s.acc += dt * 60;
    while (s.acc >= 1) {
      s.acc -= 1;
      s.top += v.speed;
      s.dy = v.speed;
    }
  },
  draw(g, s, v) {
    const box: [number, number, number, number] = [
      14,
      14,
      g.w - 28,
      Math.min(g.h - 28, BLIT_H + 24),
    ];
    const bodyTop = box[1] + 24;
    const dy = s.dy || v.speed;
    const stripY = box[1] + box[3] - dy;
    drawTable(g, box, {
      top: s.top,
      rowH: 28,
      tint: (i) => {
        if (!v.blit) return g.rgba("green", 0.16);
        const ry = bodyTop + i * 28 - s.top;
        return ry + 28 > stripY ? g.rgba("green", 0.22) : null;
      },
    });
    if (v.blit) {
      g.line([box[0], stripY], [box[0] + box[2], stripY], {
        stroke: "green",
        width: 1.5,
      });
      g.arrow(
        [box[0] + box[2] - 26, bodyTop + 70],
        [box[0] + box[2] - 26, bodyTop + 70 - Math.max(12, dy * 2)],
        {
          stroke: "green",
          width: 2,
        },
      );
    }
  },
};
const BLIT_H = 280;
function blitCounts(s: { dy: number }, v: Values) {
  const total = Math.ceil(BLIT_H / 28) + 1;
  const dy = s.dy || v.speed;
  const painted = v.blit ? Math.min(total, Math.ceil(dy / 28) + 1) : total;
  return { painted, total, cols: COLUMNS.length };
}

// ── 6. Measuring only the head of a long string ───────────────────────────────

const LONG =
  "Stroke is a fast desktop database client. This cell holds a long description, the kind a docs table or a JSON column is full of, far wider than any column will ever show. ".repeat(
    12,
  );
const TEXTS: Record<string, string> = {
  uuid: "7f9c24e5-3b8a-4d1e-9a6f-2c5d8e1b4a73",
  long: LONG,
};

export const trunc: Spec = {
  aspect: (w) => (w < 520 ? 1.15 : 2),
  controls: [
    {
      key: "w",
      label: "Column width",
      min: 48,
      max: 420,
      step: 1,
      value: 180,
      unit: " px",
      color: "blue",
    },
    {
      key: "text",
      label: "Cell",
      type: "choice",
      options: [
        { value: "uuid", label: "uuid" },
        { value: "long", label: "long text" },
      ],
      value: "long",
    },
  ],
  caption:
    "Top: the cell as drawn. Bottom: the cell's text as a bar of characters, blue for what shows, purple for what gets measured, gray for what is never measured.",
  status: (_s, v) => {
    const r = truncModel(v, 7.2);
    return r.fast
      ? `fits: ${r.len} chars, nothing measured`
      : `shows ${r.shown} · measures ${r.measured} of ${r.len}`;
  },
  draw(g, _s, v) {
    const glyph = g.measure("0", { font: "mono", size: 13 });
    const r = truncModel(v, glyph);
    const text = TEXTS[v.text];
    const cx = 16;
    const cy = 28;
    const cw = Math.min(v.w, g.w - 32);
    g.rect(cx, cy, cw, 30, { stroke: "blue", width: 1.5 });
    const out = r.fast ? text : `${text.slice(0, r.shown)}…`;
    g.clip([cx, cy, cw, 30], () =>
      g.text(out, [cx + 10, cy + 15], {
        align: "left",
        font: "mono",
        size: 13,
        baseline: "middle",
      }),
    );
    g.label("the cell", [cx, cy - 10], { align: "left", color: "blue" });
    const by = g.h * 0.62;
    const bw = g.w - 32;
    const X = (n: number) => cx + (n / r.len) * bw;
    g.rect(cx, by, bw, 18, { fill: g.rgba("muted", 0.14) });
    if (!r.fast)
      g.rect(cx, by, X(r.measured) - cx, 18, { fill: g.rgba("purple", 0.35) });
    g.rect(cx, by, Math.max(2, X(r.shown) - cx), 18, { fill: "blue" });
    g.label(
      `${r.len} characters${v.text === "long" ? " (display cap: 400)" : ""}`,
      [cx, by - 10],
      { align: "left", color: "muted" },
    );
    if (!r.fast) {
      g.text(
        `measured: ${r.measured}`,
        [Math.min(X(r.measured), g.w - 110), by + 34],
        { align: "left", size: 12, color: "purple" },
      );
    }
  },
};
function truncModel(v: Values, glyph: number) {
  // The display string is capped at CELL_DISPLAY_LIMIT = 400 characters.
  const len = Math.min(400, TEXTS[v.text].length);
  const maxW = v.w - 20;
  const fast = len * glyph <= maxW;
  // On a miss only the head is measured: ceil(maxW / glyphW) * 4 + 16.
  const measured = Math.min(len, Math.ceil(maxW / glyph) * 4 + 16);
  const shown = Math.max(0, Math.floor((maxW - glyph) / glyph));
  return { len, fast, measured, shown: fast ? len : shown };
}

// ── 7. The frame budget ───────────────────────────────────────────────────────

export const budget: Spec = {
  aspect: (w) => (w < 520 ? 1.5 : 3.2),
  controls: [
    {
      key: "when",
      label: "Truncation cache",
      type: "choice",
      options: [
        { value: 0, label: "before" },
        { value: 1, label: "after" },
      ],
      value: 0,
    },
  ],
  caption:
    "Measured on a table with pgvector embeddings, scrolling at 60 Hz. The dashed line is one frame: 16.6 ms.",
  status: (_s, v) => (v.when ? "p95 frame 17 ms" : "p95 frame 22 ms"),
  draw(g, _s, v) {
    const gx = g as Gx;
    const x0 = Math.min(118, g.w * 0.3);
    const x1 = g.w - 18;
    const X = (ms: number) => x0 + (ms / (g.w < 520 ? 30 : 24)) * (x1 - x0);
    const rows = [
      { label: "frame (p95)", ms: v.when ? 17 : 22 },
      { label: "draw()", ms: v.when ? 8.7 : 11.7 },
    ];
    const rh = 26;
    const y0 = 34;
    rows.forEach((r, i) => {
      const y = y0 + i * (rh + 22);
      const w = gx.ease(`bar${i}`, r.ms);
      g.text(r.label, [x0 - 10, y + rh / 2], {
        size: 12.5,
        align: "right",
        baseline: "middle",
      });
      g.rect(x0, y, X(w) - x0, rh, { fill: g.rgba("ink", 0.12) });
      g.text(`${r.ms} ms`, [X(w) + 6, y + rh / 2], {
        align: "left",
        size: 12,
        baseline: "middle",
        color: "muted",
      });
      if (i === 1) {
        const m = gx.ease("measure", v.when ? 0.46 : 3.08);
        g.rect(x0, y, X(m) - x0, rh, { fill: "purple" });
        const f = gx.ease("fill", v.when ? 4.8 : 0);
        if (f > 0.05)
          g.rect(X(m), y, X(m + f) - X(m), rh, { fill: g.rgba("blue", 0.75) });
      }
    });
    g.line([X(16.6), 20], [X(16.6), y0 + 2 * (rh + 22) - 10], {
      stroke: "red",
      width: 1.5,
      dash: [5, 4],
    });
    g.label("16.6 ms", [X(16.6) + 4, 22], { align: "left", color: "red" });
    const ly = g.h - 18;
    g.rect(x0, ly - 6, 10, 10, { fill: "purple" });
    g.text(`measureText ${v.when ? "0.46" : "3.08"} ms`, [x0 + 16, ly], {
      align: "left",
      size: 12,
      baseline: "middle",
    });
    if (v.when) {
      const lx = x0 + 190;
      g.rect(lx, ly - 6, 10, 10, { fill: g.rgba("blue", 0.75) });
      g.text("fillText 4.8 ms", [lx + 16, ly], {
        align: "left",
        size: 12,
        baseline: "middle",
      });
    }
  },
};

// ── The window fetcher, as StudioShell.svelte runs it ─────────────────────────

type WinState = {
  t: number; // seconds
  pos: number; // first visible row
  dir: number;
  loaded: Set<number>;
  fetching: Map<number, number>; // window -> finish time
  queue: number[];
  avgMs: number;
  slow: boolean;
  evictAt: number;
  lastRange: string;
};

function winState(pos = 0): WinState {
  return {
    t: 0,
    pos,
    dir: 1,
    loaded: new Set(),
    fetching: new Map(),
    queue: [],
    avgMs: 0,
    slow: false,
    evictAt: Infinity,
    lastRange: "",
  };
}

const VISIBLE_ROWS = 30;

/** handleVisibleRange + pumpWindowQueue + fetchWindow + evictFarWindows. */
function winTick(s: WinState, rowsPerWin: number, latencyMs: number) {
  const nWin = Math.ceil(ROWS / rowsPerWin);
  const firstW = Math.floor(s.pos / rowsPerWin);
  const lastW = Math.floor(
    Math.min(ROWS - 1, s.pos + VISIBLE_ROWS) / rowsPerWin,
  );
  const range = `${firstW}:${lastW}`;
  if (range !== s.lastRange) {
    s.lastRange = range;
    const ahead = s.slow ? 1 : WINDOW_PREFETCH;
    const want: number[] = [];
    for (let w = firstW; w <= lastW; w++) want.push(w);
    for (let i = 1; i <= ahead; i++)
      want.push(s.dir >= 0 ? lastW + i : firstW - i);
    want.push(s.dir >= 0 ? firstW - 1 : lastW + 1);
    s.queue = want.filter(
      (w) => w >= 0 && w < nWin && !s.loaded.has(w) && !s.fetching.has(w),
    );
    s.evictAt = s.t + EVICT_DEBOUNCE_MS / 1000;
  }
  for (const [w, done] of s.fetching) {
    if (s.t >= done) {
      s.fetching.delete(w);
      s.loaded.add(w);
      const ms = latencyMs * (0.8 + (hash(w) % 400) / 1000);
      s.avgMs = s.avgMs ? s.avgMs * 0.65 + ms * 0.35 : ms;
      s.slow = s.avgMs > WINDOW_SLOW_MS;
    }
  }
  const max = s.slow ? 1 : WINDOW_MAX_INFLIGHT;
  while (s.fetching.size < max && s.queue.length) {
    const w = s.queue.shift()!;
    if (s.loaded.has(w) || s.fetching.has(w)) continue;
    s.fetching.set(
      w,
      s.t + (latencyMs * (0.8 + (hash(w) % 400) / 1000)) / 1000,
    );
  }
  if (s.t >= s.evictAt) {
    s.evictAt = Infinity;
    const keep = Math.max(3, Math.round(WINDOW_KEEP_ROWS / rowsPerWin));
    for (const w of [...s.loaded])
      if (w < firstW - keep || w > lastW + keep) s.loaded.delete(w);
  }
}

function drawWindows(
  g: G,
  s: WinState,
  rowsPerWin: number,
  box: [number, number, number, number],
) {
  const [x, y, w, h] = box;
  const nWin = Math.ceil(ROWS / rowsPerWin);
  const cw = w / nWin;
  for (let i = 0; i < nWin; i++) {
    const cx = x + i * cw;
    if (s.loaded.has(i)) g.rect(cx, y, cw - 0.6, h, { fill: "blue" });
    else if (s.fetching.has(i)) {
      const pulse = 0.35 + 0.3 * Math.sin(s.t * 10 + i);
      g.rect(cx, y, cw - 0.6, h, { fill: g.rgba("purple", pulse + 0.2) });
    } else g.rect(cx, y, cw - 0.6, h, { fill: g.rgba("muted", 0.12) });
  }
  const vx = x + (s.pos / ROWS) * w;
  g.rect(vx - 1.5, y - 6, 3 + (VISIBLE_ROWS / ROWS) * w, h + 12, {
    stroke: "ink",
    width: g.lit("screen") ? 3.5 : 2,
  });
  const keep = Math.max(3, Math.round(WINDOW_KEEP_ROWS / rowsPerWin));
  const fw = Math.floor(s.pos / rowsPerWin);
  const kx0 = x + Math.max(0, fw - keep) * cw;
  const kx1 = x + Math.min(nWin, fw + 1 + keep) * cw;
  g.line([kx0, y + h + 12], [kx1, y + h + 12], { stroke: "green", width: 2 });
  g.label("kept", [kx0, y + h + 26], { align: "left", color: "green" });
}

// ── 8. Windows ────────────────────────────────────────────────────────────────

let winBox: [number, number, number, number] | null = null;

export const windows: Spec = {
  aspect: (w) => (w < 520 ? 1.6 : 3.2),
  state: () => winState(80_000),
  controls: [
    {
      key: "speed",
      label: "Scroll speed",
      min: 0,
      max: 120_000,
      step: 1000,
      value: 30_000,
      color: "ink",
      format: (n: number) => `${fmt(n)} rows/s`,
    },
    {
      key: "latency",
      label: "Window fetch",
      min: 20,
      max: 1200,
      step: 10,
      value: 120,
      unit: " ms",
      color: "purple",
    },
  ],
  presets: [
    { label: "Local database", set: { latency: 60 } },
    { label: "Slow remote", set: { latency: 900 } },
  ],
  caption:
    "All 1,000,000 rows as 100 windows of 10,000. Blue windows are in memory, purple ones are on their way, gray ones are empty slots in the array. The black box is the screen; drag it.",
  status: (s: WinState) =>
    `${s.loaded.size} windows held (${fmt(s.loaded.size * 10_000)} rows) · ${s.fetching.size} in flight${s.slow ? " · slow mode" : ""}`,
  step(dt, s: WinState, v) {
    s.t += dt;
    if (v.speed > 0) {
      s.pos += s.dir * v.speed * dt;
      if (s.pos > ROWS - VISIBLE_ROWS) {
        s.pos = ROWS - VISIBLE_ROWS;
        s.dir = -1;
      }
      if (s.pos < 0) {
        s.pos = 0;
        s.dir = 1;
      }
    }
    winTick(s, 10_000, v.latency);
  },
  draw(g, s: WinState) {
    const gx = g as Gx;
    winBox = [16, 40, g.w - 32, 34];
    gx.label(`row ${fmt(s.pos + 1)}`, [16 + (s.pos / ROWS) * (g.w - 32), 24], {
      color: "ink",
    });
    drawWindows(gx, s, 10_000, winBox);
    const ly = g.h - 22;
    const legend: [string, string][] = [
      ["blue", "in memory"],
      ["purple", "fetching"],
      ["muted", "empty slot"],
    ];
    let lx = 16;
    for (const [c, t] of legend) {
      g.rect(lx, ly - 6, 10, 10, {
        fill: c === "muted" ? g.rgba("muted", 0.25) : c,
      });
      g.text(t, [lx + 15, ly], { align: "left", size: 12, baseline: "middle" });
      lx += g.measure(t, { size: 12 }) + 38;
    }
  },
  drag: {
    hit: (p) =>
      !!winBox && p[1] > winBox[1] - 20 && p[1] < winBox[1] + winBox[3] + 20,
    move: (p, s: WinState) => {
      if (!winBox) return;
      const pos = clamp(
        ((p[0] - winBox[0]) / winBox[2]) * ROWS,
        0,
        ROWS - VISIBLE_ROWS,
      );
      s.dir = pos >= s.pos ? 1 : -1;
      s.pos = pos;
    },
  },
};

// ── 9. Window size from bytes ─────────────────────────────────────────────────

export const sizing: Spec = {
  aspect: (w) => (w < 520 ? 1.2 : 2.8),
  controls: [
    {
      key: "lg",
      label: "Bytes per row",
      min: 1.5,
      max: 5,
      step: 0.01,
      value: Math.log10(120),
      color: "blue",
      format: (x: number) => bytes(10 ** x),
      marks: [
        { value: Math.log10(120), label: "narrow" },
        { value: Math.log10(17_000), label: "embedding" },
      ],
    },
  ],
  caption:
    "The size of one response: all 1,000,000 rows in one go, against one window. The window's row count moves so its size stays near 2 MB.",
  status: (_s, v) => {
    const bpr = 10 ** v.lg;
    const rows = clamp(
      Math.round(WINDOW_TARGET_BYTES / bpr),
      WINDOW_ROWS_MIN,
      WINDOW_ROWS_MAX,
    );
    return `window: ${fmt(rows)} rows × ${bytes(bpr)} = ${bytes(rows * bpr)}`;
  },
  draw(g, _s, v) {
    const bpr = 10 ** v.lg;
    const rows = clamp(
      Math.round(WINDOW_TARGET_BYTES / bpr),
      WINDOW_ROWS_MIN,
      WINDOW_ROWS_MAX,
    );
    const page = ROWS * bpr;
    const win = rows * bpr;
    const x0 = 16;
    const bw = g.w - 32;
    const bar = (
      y: number,
      frac: number,
      color: string,
      label: string,
      value: string,
    ) => {
      g.label(label, [x0, y - 10], { align: "left", color: "muted" });
      g.rect(x0, y, bw, 22, { fill: g.rgba("muted", 0.08) });
      g.rect(x0, y, Math.max(2, bw * frac), 22, { fill: color });
      g.text(value, [x0 + Math.max(2, bw * frac) + 8, y + 11], {
        align: "left",
        size: 12.5,
        baseline: "middle",
        color: "ink",
        halo: true,
      });
    };
    bar(
      34,
      g.w < 520 ? 0.7 : 0.86,
      g.rgba("red", 0.55),
      "one page of 1,000,000 rows",
      bytes(page),
    );
    bar(
      98,
      (win / page) * (g.w < 520 ? 0.7 : 0.86),
      "blue",
      `one window: ${fmt(rows)} rows`,
      bytes(win),
    );
    const note =
      rows === WINDOW_ROWS_MAX
        ? "rows hit the 10,000 maximum"
        : rows === WINDOW_ROWS_MIN
          ? "rows hit the 100 minimum"
          : "rows = 2 MB ÷ bytes per row";
    g.text(note, [x0, g.h - 18], { align: "left", size: 12, color: "muted" });
  },
};

// ── 10. OFFSET against a key ──────────────────────────────────────────────────

export const offset: Spec = {
  aspect: (w) => (w < 520 ? 1.2 : 2.2),
  controls: [
    {
      key: "start",
      label: "Window starts at row",
      min: 0,
      max: 995_000,
      step: 5000,
      value: 995_000,
      color: "blue",
      format: (n: number) => fmt(n),
    },
    {
      key: "how",
      label: "Query",
      type: "choice",
      options: [
        { value: "offset", label: "LIMIT … OFFSET" },
        { value: "key", label: "WHERE id > last" },
      ],
      value: "offset",
    },
  ],
  caption:
    "The primary key index as one long strip. OFFSET reads every entry before the window and throws it away (red); a key lookup goes down the tree to the first row it needs.",
  status: (_s, v) =>
    v.how === "offset"
      ? `${fmt(v.start + 5000)} index entries read for 5,000 rows`
      : `a few tree levels, then 5,000 entries`,
  draw(g, _s, v) {
    const gx = g as Gx;
    const x0 = 16;
    const w = g.w - 32;
    const sy = g.h - 54;
    const X = (r: number) => x0 + (r / ROWS) * w;
    g.rect(x0, sy, w, 20, { fill: g.rgba("muted", 0.12) });
    const walked = gx.ease("walk", v.how === "offset" ? v.start : 0);
    if (walked > 0)
      g.rect(x0, sy, X(walked) - x0, 20, {
        hatch: g.rgba("red", 0.7),
        fill: g.rgba("red", 0.12),
      });
    g.rect(
      X(v.start),
      sy - 4,
      Math.max(3, X(v.start + 5000) - X(v.start)),
      28,
      { fill: "blue" },
    );
    g.label("primary key index, id 1 to 1,000,000", [x0, sy + 38], {
      align: "left",
      color: "muted",
    });
    if (v.how === "key") {
      // An illustrative B-tree: a root, an inner level, and the leaves.
      const root: [number, number] = [g.w / 2, 26];
      const inner: [number, number][] = [0.15, 0.4, 0.65, 0.9].map((f) => [
        x0 + f * w,
        70,
      ]);
      const target = X(v.start);
      const pick = inner.reduce((a, b) =>
        Math.abs(b[0] - target) < Math.abs(a[0] - target) ? b : a,
      );
      g.rect(root[0] - 22, root[1] - 9, 44, 18, {
        stroke: "ink",
        width: 1.5,
        r: 3,
      });
      for (const n of inner) {
        g.rect(n[0] - 18, n[1] - 8, 36, 16, {
          stroke: "faint",
          width: 1.2,
          r: 3,
        });
        g.line([root[0], root[1] + 9], [n[0], n[1] - 8], {
          stroke: n === pick ? "blue" : "faint",
          width: n === pick ? 2 : 1,
        });
      }
      g.arrow([pick[0], pick[1] + 8], [target + 2, sy - 6], {
        stroke: "blue",
        width: 2,
      });
      g.label(
        `WHERE id > ${fmt(v.start)}`,
        [Math.min(target + 8, g.w - 150), (pick[1] + sy) / 2],
        { align: "left", color: "blue" },
      );
    } else {
      g.label(`OFFSET ${fmt(v.start)}`, [x0, sy - 14], {
        align: "left",
        color: "red",
      });
    }
  },
};

// ── 11. Don't wait for the count ──────────────────────────────────────────────

export const count: Spec = {
  aspect: (w) => (w < 520 ? 1.2 : 3),
  state: () => ({ t: 0 }),
  controls: [
    {
      key: "cache",
      label: "Database cache",
      type: "choice",
      options: [
        { value: 182, label: "cold" },
        { value: 32, label: "warm" },
      ],
      value: 182,
    },
    {
      key: "wait",
      label: "Wait for the count before drawing",
      type: "toggle",
      value: false,
      color: "red",
    },
  ],
  caption:
    "One filtered page of the 1M-row events table: the rows take 0.79 ms, an exact COUNT(*) takes 182 ms cold or 32 ms warm. The grid draws when its rows arrive unless it waits for the count.",
  status: (_s, v) =>
    `rows on screen at ${v.wait ? `${v.cache} ms` : "0.79 ms"}`,
  draw(g, _s, v) {
    const gx = g as Gx;
    const x0 = 86;
    const x1 = g.w - 20;
    const X = (ms: number) => x0 + (ms / (g.w < 520 ? 250 : 200)) * (x1 - x0);
    const lane = (
      y: number,
      label: string,
      ms: number,
      color: string,
      text: string,
    ) => {
      g.text(label, [x0 - 10, y + 10], {
        size: 12.5,
        align: "right",
        baseline: "middle",
      });
      const w = gx.ease(`lane${y}`, ms);
      g.rect(x0, y, Math.max(3, X(w) - x0), 20, { fill: color });
      g.text(text, [Math.max(X(w), x0 + 3) + 6, y + 10], {
        align: "left",
        size: 12,
        baseline: "middle",
        color: "muted",
      });
    };
    lane(30, "rows", 0.79, "blue", "0.79 ms");
    lane(64, "COUNT(*)", v.cache, g.rgba("purple", 0.7), `${v.cache} ms`);
    const at = v.wait ? v.cache : 0.79;
    const xa = X(gx.ease("drawAt", at));
    g.line([xa, 20], [xa, 104], { stroke: v.wait ? "red" : "green", width: 2 });
    g.label("grid draws", [Math.min(xa + 6, g.w - 80), 112], {
      align: "left",
      color: v.wait ? "red" : "green",
    });
    g.line([x0, g.h - 26], [x1, g.h - 26], { stroke: "faint", width: 1 });
    for (const ms of [0, 50, 100, 150, 200]) {
      g.text(`${ms} ms`, [X(ms), g.h - 12], {
        size: 10.5,
        align: "center",
        color: "muted",
      });
    }
  },
};

// ── 12. All of it together ────────────────────────────────────────────────────

type GridState = WinState & { target: number };

let gridGeom: { x: number; y: number; h: number } | null = null;

export const grid: Spec = {
  aspect: (w) => (w < 520 ? 0.85 : 1.45),
  state: () => ({ ...winState(0), target: 0 }),
  controls: [
    {
      key: "latency",
      label: "Window fetch",
      min: 20,
      max: 1200,
      step: 10,
      value: 150,
      unit: " ms",
      color: "purple",
    },
    {
      label: "Jump to row 900,000",
      type: "button",
      action: (s: GridState) => {
        s.target = 900_000;
      },
    },
    {
      label: "Back to the top",
      type: "button",
      action: (s: GridState) => {
        s.target = 0;
      },
    },
  ],
  caption:
    "A grid over 1,000,000 rows: canvas painting, compressed scrolling and windows together. Rows that haven't arrived draw as skeletons until their window lands. Drag the scrollbar.",
  status: (s: GridState) =>
    `row ${fmt(s.pos + 1)} · ${s.loaded.size} windows held`,
  step(dt, s: GridState, v) {
    s.t += dt;
    const d = s.target - s.pos;
    if (Math.abs(d) > 0.5) {
      s.dir = Math.sign(d);
      s.pos += d * Math.min(1, dt * 6);
      if (Math.abs(s.target - s.pos) < 1) s.pos = s.target;
    }
    winTick(s, 10_000, v.latency);
  },
  draw(g, s: GridState) {
    const sbW = 12;
    const box: [number, number, number, number] = [
      10,
      10,
      g.w - 20 - sbW - 6,
      g.h - 82,
    ];
    const win = (i: number) => Math.floor(i / 10_000);
    drawTable(g as Gx, box, {
      top: s.pos * 28,
      rowH: 28,
      look: (i) => (s.loaded.has(win(i)) ? "row" : "skeleton"),
    });
    const tx = box[0] + box[2] + 6;
    gridGeom = { x: tx, y: box[1], h: box[3] };
    g.rect(tx, box[1], sbW, box[3], { fill: g.rgba("muted", 0.1), r: 6 });
    const thumbH = 28;
    const ty = box[1] + (s.pos / (ROWS - VISIBLE_ROWS)) * (box[3] - thumbH);
    g.rect(tx + 2, ty, sbW - 4, thumbH, { fill: "muted", r: 4 });
    drawWindows(g, s, 10_000, [10, g.h - 56, g.w - 20, 12]);
  },
  drag: {
    hit: (p) =>
      !!gridGeom &&
      p[0] >= gridGeom.x - 10 &&
      p[1] >= gridGeom.y &&
      p[1] <= gridGeom.y + gridGeom.h,
    move: (p, s: GridState) => {
      if (!gridGeom) return;
      const pos = clamp(
        ((p[1] - gridGeom.y) / gridGeom.h) * (ROWS - VISIBLE_ROWS),
        0,
        ROWS - VISIBLE_ROWS,
      );
      s.dir = pos >= s.pos ? 1 : -1;
      s.pos = s.target = pos;
    },
  },
};

// ── Columns: widths by type, culled, pinned ───────────────────────────────────

/** table-column-widths.js: a fixed default per data type, not measured. */
function defaultColumnWidth(dataType: string) {
  const t = dataType.toLowerCase();
  const has = (...n: string[]) => n.some((x) => t.includes(x));
  if (has("json") || has("text")) return 420;
  if (has("uuid") || has("char", "varchar", "string")) return 380;
  if (has("timestamptz", "with time zone")) return 300;
  if (has("timestamp", "datetime")) return 270;
  if (has("date", "time")) return 220;
  if (has("bool")) return 150;
  if (
    has(
      "int",
      "serial",
      "numeric",
      "decimal",
      "float",
      "double",
      "real",
      "money",
    )
  )
    return 210;
  return 240;
}

/** The `events` fixture's columns and their declared types. */
const EVENT_COLS = [
  ["id", "bigint"],
  ["ts", "timestamptz"],
  ["device_id", "integer"],
  ["session", "uuid"],
  ["kind", "text"],
  ["amount", "numeric"],
  ["ok", "boolean"],
  ["latency_ms", "integer"],
  ["embed", "vector"],
  ["props", "jsonb"],
].map(([name, type]) => ({ name, type, w: defaultColumnWidth(type) }));
const GUTTERS = 32 + 36;
const GRID_W = 1200;

export const columns: Spec = {
  aspect: (w) => (w < 520 ? 1.1 : 1.9),
  controls: [
    {
      key: "left",
      label: "scrollLeft",
      min: 0,
      max: GUTTERS + EVENT_COLS.reduce((a, c) => a + c.w, 0) - GRID_W,
      step: 1,
      value: 820,
      unit: " px",
      color: "blue",
    },
    {
      key: "pin",
      label: "Pinned",
      type: "choice",
      options: [
        { value: 0, label: "none" },
        { value: 1, label: "id" },
        { value: 2, label: "id + ts" },
      ],
      value: 1,
    },
  ],
  caption:
    "Top: every column of `events` at its default width, the blue frame is a 1,200 px grid. Bottom: what the grid paints. Columns outside the frame are skipped; pinned ones stay at the left edge and are painted last, on top.",
  status: (_s, v) =>
    `painting ${colLayout(v).filter((c) => c.visible).length} of ${EVENT_COLS.length} columns`,
  draw(g, _s, v) {
    const cols = colLayout(v);
    const total = GUTTERS + EVENT_COLS.reduce((a, c) => a + c.w, 0);
    const x0 = 14;
    const W = g.w - 28;
    const k = W / total;
    const sy = 28;
    g.label(`all columns: ${fmt(total)} px`, [x0, sy - 10], {
      color: "muted",
      align: "left",
    });
    for (const c of cols) {
      const x = x0 + c.contentX * k;
      const color = c.pinned ? "purple" : c.visible ? "blue" : "muted";
      g.rect(x, sy, c.w * k - 1, 26, {
        fill: g.rgba(color, c.visible || c.pinned ? 0.22 : 0.08),
        stroke: g.rgba(color, 0.6),
        width: 1,
      });
      if (g.measure(c.name, { size: 10.5 }) + 8 < c.w * k)
        g.text(c.name, [x + 4, sy + 13], {
          size: 10.5,
          baseline: "middle",
          color: c.visible || c.pinned ? "ink" : "muted",
          align: "left",
        });
    }
    g.rect(x0 + v.left * k, sy - 4, GRID_W * k, 34, {
      stroke: "blue",
      width: 2,
    });
    const by = sy + 62;
    const bk = W / GRID_W;
    const bh = g.h - by - 14;
    g.label("the grid", [x0, by - 10], { color: "blue", align: "left" });
    g.clip([x0, by, W, bh], () => {
      const paint = (c: ColGeom) => {
        const x = x0 + c.drawnX * bk;
        g.rect(x, by, c.w * bk, bh, {
          fill: c.pinned ? g.mix("bg", "purple", 0.12) : "bg",
          stroke: "grid",
          width: 1,
        });
        g.text(c.name, [x + 6, by + 14], {
          size: 11,
          weight: 600,
          color: c.pinned ? "purple" : "muted",
          align: "left",
          baseline: "middle",
        });
        for (let r = 0; r * 22 + 34 < bh; r++) {
          const cell = String(
            c.name === "id" ? 412001 + r : hash(r * 31 + c.w) % 99999,
          ).slice(0, Math.max(2, Math.floor((c.w * bk - 12) / 7)));
          g.text(cell, [x + 6, by + 36 + r * 22], {
            font: "mono",
            size: 11,
            align: "left",
            baseline: "middle",
          });
        }
      };
      for (const c of cols) if (c.visible && !c.pinned) paint(c);
      for (const c of cols) if (c.pinned) paint(c);
    });
    g.rect(x0, by, W, bh, { stroke: "blue", width: 2 });
  },
};
type ColGeom = {
  name: string;
  w: number;
  contentX: number;
  drawnX: number;
  pinned: boolean;
  visible: boolean;
};
/** computeColumnGeometry + colDrawnX from canvas-table.js. */
function colLayout(v: Values): ColGeom[] {
  let contentX = GUTTERS;
  let pinX = 0;
  return EVENT_COLS.map((c, i) => {
    const pinned = i < v.pin;
    const col = { name: c.name, w: c.w, contentX, pinned };
    contentX += c.w;
    const base = col.contentX - v.left;
    const drawnX = pinned ? Math.max(base, pinX) : base;
    if (pinned) pinX += c.w;
    return { ...col, drawnX, visible: drawnX + c.w > 0 && drawnX < GRID_W };
  });
}

// ── Expanded rows without a per-row array ─────────────────────────────────────

export const expand: Spec = {
  aspect: (w) => (w < 520 ? 1.2 : 2.3),
  controls: [
    {
      key: "lg",
      label: "Rows",
      min: 3,
      max: Math.log10(5_000_000),
      step: 0.01,
      value: Math.log10(5_000_000),
      color: "blue",
      format: (x: number) => fmt(10 ** x),
    },
    {
      key: "open",
      label: "Expanded rows",
      type: "stepper",
      min: 0,
      max: 50,
      step: 1,
      value: 3,
      color: "green",
    },
  ],
  caption:
    "Memory for knowing where each row starts, once a few rows are expanded: one number per row, against one entry per expanded row.",
  status: (_s, v) => `${bytes(10 ** v.lg * 8)} vs ${bytes(v.open * 12)}`,
  draw(g, _s, v) {
    const gx = g as Gx;
    const rows = 10 ** v.lg;
    const dense = rows * 8;
    const sparse = v.open * 12;
    const x0 = 16;
    const W = g.w - 32;
    const max = 40_000_000;
    const bar = (y: number, b: number, color: string, label: string) => {
      g.label(label, [x0, y - 10], { color: "muted", align: "left" });
      g.rect(x0, y, W, 22, { fill: g.rgba("muted", 0.08) });
      const w = Math.max(2, (gx.ease(label, b) / max) * W * 0.85);
      g.rect(x0, y, w, 22, { fill: color });
      g.text(bytes(b), [x0 + w + 8, y + 11], {
        size: 12.5,
        baseline: "middle",
        align: "left",
      });
    };
    bar(
      34,
      dense,
      g.rgba("red", 0.55),
      "Float64Array of every row top (the old way)",
    );
    bar(96, sparse, "green", "expanded rows only: index + prefix sum");
    g.text(
      "rowTop(i) = i × rowHeight + (heights of expanded rows before i)",
      [x0, g.h - 18],
      {
        font: "mono",
        size: 11.5,
        color: "muted",
        align: "left",
      },
    );
  },
};

// ── Why the copy goes through a scratch canvas ────────────────────────────────

export const scratch: Spec = {
  aspect: (w) => (w < 520 ? 1 : 1.7),
  controls: [
    {
      key: "how",
      label: "Copy",
      type: "choice",
      options: [
        { value: "down", label: "in place, top first" },
        { value: "up", label: "in place, bottom first" },
        { value: "scratch", label: "via scratch" },
      ],
      value: "up",
    },
    {
      key: "k",
      label: "Scroll by",
      type: "stepper",
      min: 1,
      max: 4,
      step: 1,
      value: 2,
      format: (n: number) => `${n} row${n > 1 ? "s" : ""}`,
    },
  ],
  caption:
    "A model of the hazard, not of Cairo's code. The band moves up by the scroll; a copy that walks it in the wrong order reads rows it has already overwritten, and they repeat above the seam (red).",
  status: (_s, v) => {
    const wrong = scratchFrame(v).filter(
      (r, j) => r.kind === "copy" && r.row !== j + v.k,
    ).length;
    return wrong
      ? `${wrong} rows copied from the wrong place`
      : "every row in the right place";
  },
  draw(g, _s, v) {
    const n = SCRATCH_ROWS;
    const rh = Math.min(26, (g.h - 40) / n);
    const colW = Math.min(170, g.w * 0.36);
    const lx = 20;
    const rx = g.w - colW - 20;
    const y0 = 30;
    g.label("last frame", [lx, y0 - 12], { color: "muted", align: "left" });
    g.label("this frame", [rx, y0 - 12], { color: "muted", align: "left" });
    for (let j = 0; j < n; j++) {
      g.rect(lx, y0 + j * rh, colW, rh - 2, { fill: g.rgba("muted", 0.1) });
      g.text(`row ${j + 10}`, [lx + 8, y0 + j * rh + rh / 2], {
        font: "mono",
        size: 12,
        baseline: "middle",
        align: "left",
      });
    }
    scratchFrame(v).forEach((r, j) => {
      const bad = r.kind === "copy" && r.row !== j + v.k;
      const fill =
        r.kind === "fresh"
          ? g.rgba("green", 0.22)
          : bad
            ? g.rgba("red", 0.25)
            : g.rgba("muted", 0.1);
      g.rect(rx, y0 + j * rh, colW, rh - 2, { fill });
      g.text(`row ${r.row + 10}`, [rx + 8, y0 + j * rh + rh / 2], {
        font: "mono",
        size: 12,
        baseline: "middle",
        align: "left",
        color: bad ? "red" : "ink",
      });
      if (r.kind === "copy" && j % 2 === 0)
        g.arrow(
          [lx + colW + 6, y0 + (j + v.k) * rh + rh / 2],
          [rx - 6, y0 + j * rh + rh / 2],
          {
            stroke: bad ? "red" : g.rgba("muted", 0.5),
            width: 1,
          },
        );
    });
    const seam = y0 + (n - v.k) * rh - 1;
    g.line([rx - 4, seam], [rx + colW + 4, seam], {
      stroke: "green",
      width: 1.5,
    });
  },
};
const SCRATCH_ROWS = 9;
/** Rows of the new frame: copied ones (and from where) plus the fresh strip. */
function scratchFrame(v: Values) {
  const n = SCRATCH_ROWS;
  const buf = Array.from({ length: n }, (_, j) => j); // what each slot holds now
  const src = [...buf];
  const k = v.k;
  const order =
    v.how === "up"
      ? [...Array(n - k).keys()].reverse()
      : [...Array(n - k).keys()];
  for (const j of order) buf[j] = v.how === "scratch" ? src[j + k] : buf[j + k];
  return buf.map((row, j) =>
    j >= n - k ? { kind: "fresh", row: j + k } : { kind: "copy", row },
  );
}

// ── Work per column and per frame, not per cell ───────────────────────────────

export const hotpath: Spec = {
  aspect: (w) => (w < 520 ? 1.2 : 2.3),
  controls: [
    {
      key: "rows",
      label: "Rows on screen",
      min: 5,
      max: 40,
      step: 1,
      value: 15,
      color: "blue",
    },
    {
      key: "cols",
      label: "Columns on screen",
      min: 2,
      max: 12,
      step: 1,
      value: 10,
      color: "blue",
    },
    {
      key: "when",
      label: "Draw code",
      type: "choice",
      options: [
        { value: 0, label: "before" },
        { value: 1, label: "after" },
      ],
      value: 0,
    },
  ],
  caption:
    "Work the draw loop did each frame for things that can't change mid-frame: type checks by regex (4 per cell) and reads off the reactive graph (about 20 per cell).",
  status: (_s, v) =>
    `${v.rows * v.cols} cells · ${fmt(hotCounts(v).regex * 60)} regex runs a second`,
  draw(g, _s, v) {
    const gx = g as Gx;
    const c = hotCounts(v);
    const x0 = Math.min(150, g.w * 0.34);
    const W = g.w - x0 - 70;
    const max = 40 * 12 * 20;
    const bar = (y: number, label: string, n: number, color: string) => {
      g.text(label, [x0 - 10, y + 11], {
        size: 12.5,
        align: "right",
        baseline: "middle",
      });
      g.rect(x0, y, W, 22, { fill: g.rgba("muted", 0.08) });
      const w = Math.max(2, (gx.ease(label, n) / max) * W);
      g.rect(x0, y, w, 22, { fill: color });
      g.text(`${fmt(n)} / frame`, [x0 + w + 8, y + 11], {
        size: 12,
        baseline: "middle",
        align: "left",
        color: "muted",
      });
    };
    bar(30, "regex runs", c.regex, "purple");
    bar(72, "reactive reads", c.reads, "blue");
    g.text(
      v.when
        ? "types tested once per column, values snapshotted once per frame"
        : "every cell re-tests its column's type and re-reads the graph",
      [16, g.h - 18],
      { size: 12, color: "muted", align: "left" },
    );
  },
};
function hotCounts(v: Values) {
  const cells = v.rows * v.cols;
  return v.when
    ? { regex: 0, reads: 20 }
    : { regex: cells * 4, reads: cells * 20 };
}

// ── When to window ────────────────────────────────────────────────────────────

const WINDOW_THRESHOLD = 25_000;
const WINDOW_HEAVY_BYTES = 8_000_000;
let decideP:
  | (((q: [number, number]) => [number, number]) & {
      inv?: (p: [number, number]) => [number, number];
    })
  | null = null;

export const decide: Spec = {
  aspect: (w) => (w < 520 ? 1 : 1.6),
  state: () => ({ at: [4, Math.log10(17_000)] as [number, number] }),
  caption:
    "shouldWindow() over a view's length and its bytes per row. Blue is windowed; outside it the view loads whole. Both assume a page size over 25,000, a primary key and a known count.",
  status: (s) => {
    const rows = 10 ** s.at[0];
    const bpr = 10 ** s.at[1];
    const why =
      rows > WINDOW_THRESHOLD
        ? "long"
        : rows * bpr > WINDOW_HEAVY_BYTES
          ? "heavy"
          : "";
    return `${fmt(rows)} rows × ${bytes(bpr)} = ${bytes(rows * bpr)} → ${why ? `windowed (${why})` : "load whole"}`;
  },
  draw(g, s) {
    const P = g.fit(2, 7, 1.5, 5, {
      uniform: false,
      box: [62, 12, g.w - 76, g.h - 50],
    });
    decideP = P;
    // Windowed: longer than 25,000 rows, or rows × bytes over 8 MB (a line in log-log).
    const lt = Math.log10(WINDOW_THRESHOLD);
    const lh = Math.log10(WINDOW_HEAVY_BYTES);
    const region: [number, number][] = [
      [2, Math.min(5, lh - 2)],
      [2, 5],
      [7, 5],
      [7, 1.5],
      [lt, 1.5],
      [lt, lh - lt],
    ];
    g.path(
      region.map((q) => P(q)),
      { fill: g.rgba("blue", 0.16), close: true },
    );
    g.axes(P, {
      x: [2, 7],
      y: [1.5, 5],
      xTicks: [2, 3, 4, 5, 6, 7],
      yTicks: [2, 3, 4, 5],
      format: (t: number) => (t >= 3 ? `${fmt(10 ** t)}` : `${10 ** t}`),
      xLabel: "rows in the view",
      yLabel: "bytes per row",
    });
    const odoc = P([4, Math.log10(17_000)]);
    g.circle(odoc, 4, { fill: "purple" });
    g.label("openai_docs", [odoc[0] + 8, odoc[1] - 10], {
      color: "purple",
      align: "left",
    });
    g.line(
      P([Math.log10(WINDOW_THRESHOLD), 1.5]),
      P([Math.log10(WINDOW_THRESHOLD), 5]),
      { stroke: "blue", width: 1.2, dash: [5, 4] },
    );
    g.handle(P(s.at), { color: "ink" });
  },
  drag: {
    move: (p, s) => {
      if (!decideP?.inv) return;
      const [x, y] = decideP.inv(p);
      s.at = [clamp(x, 2, 7), clamp(y, 1.5, 5)];
    },
  },
};

// ── Keyset paging and NULLs ───────────────────────────────────────────────────

const SCORES = [3, 8, 12, 15, 21, 27, 30, 34, null, null, null, 41].map(
  (v, i) => ({ id: i + 1, v }),
);

export const nulls: Spec = {
  aspect: (w) => (w < 520 ? 0.95 : 1.6),
  controls: [
    {
      key: "how",
      label: "Next page",
      type: "choice",
      options: [
        { value: "offset", label: "OFFSET, NULLS LAST" },
        { value: "key", label: "WHERE score > last" },
      ],
      value: "key",
    },
    {
      key: "nullable",
      label: "Column has NULLs",
      type: "toggle",
      value: true,
      color: "red",
    },
  ],
  caption:
    "A nullable `score` column, sorted with NULLs last and paged 4 rows at a time. `score > last` is never true for a NULL, so the keyset query never returns those rows (red).",
  status: (_s, v) => {
    const missed = nullPages(v).missed.length;
    return missed ? `${missed} rows never returned` : "every row returned once";
  },
  draw(g, _s, v) {
    const { pages, missed, rows } = nullPages(v);
    const rh = Math.min(24, (g.h - 30) / rows.length);
    const x0 = 20;
    const colors = ["blue", "green", "purple"];
    g.label("sorted rows", [x0, 14], { color: "muted", align: "left" });
    rows.forEach((r, i) => {
      const y = 22 + i * rh;
      const page = pages.findIndex((p) => p.includes(r.id));
      const fill =
        page >= 0 ? g.rgba(colors[page % 3], 0.2) : g.rgba("red", 0.22);
      g.rect(x0, y, 170, rh - 2, { fill });
      g.text(`id ${r.id}`, [x0 + 8, y + rh / 2], {
        font: "mono",
        size: 12,
        baseline: "middle",
        align: "left",
        color: "muted",
      });
      g.text(r.v === null ? "NULL" : String(r.v), [x0 + 80, y + rh / 2], {
        font: "mono",
        size: 12,
        baseline: "middle",
        align: "left",
        color: r.v === null ? "red" : "ink",
      });
      if (page >= 0)
        g.text(`page ${page + 1}`, [x0 + 180, y + rh / 2], {
          size: 11.5,
          baseline: "middle",
          align: "left",
          color: colors[page % 3],
        });
    });
    const q =
      v.how === "key"
        ? ["SELECT … WHERE score > $last", "ORDER BY score LIMIT 4"]
        : ["SELECT … ORDER BY score", "NULLS LAST LIMIT 4 OFFSET $n"];
    const tx = g.w < 520 ? x0 : x0 + 260;
    const ty = g.w < 520 ? g.h - 40 : 40;
    q.forEach((t, i) =>
      g.text(t, [tx, ty + i * 18], { font: "mono", size: 12, align: "left" }),
    );
    if (missed.length)
      g.text(
        `missing: ${missed.map((m) => `id ${m}`).join(", ")}`,
        [tx, ty + 46],
        { size: 12, color: "red", align: "left" },
      );
  },
};
function nullPages(v: Values) {
  const rows = SCORES.map((r) => ({
    ...r,
    v: v.nullable ? r.v : (r.v ?? 36 + r.id),
  }));
  const sorted = [...rows].sort((a, b) =>
    a.v === null ? 1 : b.v === null ? -1 : a.v - b.v,
  );
  const pages: number[][] = [];
  if (v.how === "offset") {
    for (let i = 0; i < sorted.length; i += 4)
      pages.push(sorted.slice(i, i + 4).map((r) => r.id));
  } else {
    let last: number | null = null;
    for (;;) {
      const next = sorted
        .filter((r) => r.v !== null && (last === null || r.v > last))
        .slice(0, 4);
      if (!next.length) break;
      pages.push(next.map((r) => r.id));
      last = next[next.length - 1].v;
    }
  }
  const got = new Set(pages.flat());
  return {
    pages,
    rows: sorted,
    missed: sorted.filter((r) => !got.has(r.id)).map((r) => r.id),
  };
}

// ── Background tabs ───────────────────────────────────────────────────────────

const TAB_ROWS_MRU_MAX = 3;
const TAB_EVICT_ROW_THRESHOLD = 5_000;
const TAB_EVICT_BYTE_THRESHOLD = 8 * 1024 * 1024;
const TABS = [
  { name: "events", rows: 170_000, bpr: 120 },
  { name: "users", rows: 2_000, bpr: 300 },
  { name: "openai_docs", rows: 500, bpr: 17_000 },
  { name: "orders", rows: 40_000, bpr: 200 },
  { name: "settings", rows: 12, bpr: 150 },
  { name: "logs", rows: 4_000, bpr: 900 },
];

export const tabs: Spec = {
  aspect: (w) => (w < 520 ? 1 : 2),
  state: () => tabsOpenedInTurn(),
  controls: [
    {
      key: "tab",
      label: "Switch to",
      type: "choice",
      options: TABS.map((t, i) => ({ value: i, label: t.name })),
      value: 5,
    },
  ],
  caption:
    "Six example table tabs. The three most recently viewed stay warm; a colder tab loses its rows if it holds over 5,000 of them or over 8 MiB. Its columns and count stay, so coming back draws the header at once.",
  status: (s) => `holding ${bytes(tabHeld(s))} across ${TABS.length} tabs`,
  change(key, s, v) {
    if (key === "tab") evictTabs(s, v.tab);
  },
  draw(g, s, v) {
    const n = TABS.length;
    const narrow = g.w < 520;
    const cols = narrow ? 2 : 3;
    const cw = (g.w - 32 - (cols - 1) * 10) / cols;
    const ch =
      (g.h - 30 - 10 * (Math.ceil(n / cols) - 1)) / Math.ceil(n / cols);
    TABS.forEach((t, i) => {
      const x = 16 + (i % cols) * (cw + 10);
      const y = 14 + Math.floor(i / cols) * (ch + 10);
      const active = i === v.tab;
      const warm = s.mru.includes(i);
      const gone = s.evicted.includes(i);
      g.rect(x, y, cw, ch, {
        stroke: active ? "ink" : "faint",
        width: active ? 2 : 1,
        r: 8,
        fill: gone ? g.rgba("muted", 0.06) : "bg",
      });
      g.text(t.name, [x + 10, y + 18], {
        size: 13,
        weight: 600,
        align: "left",
        baseline: "middle",
      });
      g.text(
        gone
          ? "rows evicted"
          : `${fmt(t.rows)} rows · ${bytes(t.rows * t.bpr)}`,
        [x + 10, y + 38],
        {
          size: 11.5,
          align: "left",
          baseline: "middle",
          color: gone ? "red" : "muted",
        },
      );
      const tag = active
        ? "active"
        : warm
          ? "warm"
          : gone
            ? "cold, rows dropped"
            : "cold, small: kept";
      g.text(tag, [x + 10, y + ch - 14], {
        size: 11.5,
        align: "left",
        baseline: "middle",
        color: warm || active ? "green" : gone ? "red" : "muted",
      });
    });
  },
};
/** Every tab opened once, left to right, as the eviction pass leaves them. */
function tabsOpenedInTurn() {
  const s = { mru: [] as number[], evicted: [] as number[] };
  TABS.forEach((_, i) => evictTabs(s, i));
  return s;
}
/** evictColdTabRows: keep the 3 most recent, drop cold tabs over 5,000 rows or 8 MiB. */
function evictTabs(s: { mru: number[]; evicted: number[] }, active: number) {
  s.mru = [...s.mru.filter((x) => x !== active), active].slice(
    -TAB_ROWS_MRU_MAX,
  );
  s.evicted = s.evicted.filter((x) => x !== active);
  TABS.forEach((t, i) => {
    if (s.mru.includes(i) || s.evicted.includes(i)) return;
    if (
      t.rows > TAB_EVICT_ROW_THRESHOLD ||
      t.rows * t.bpr > TAB_EVICT_BYTE_THRESHOLD
    )
      s.evicted.push(i);
  });
}
function tabHeld(s: { evicted: number[] }) {
  return TABS.reduce(
    (a, t, i) => a + (s.evicted.includes(i) ? 0 : t.rows * t.bpr),
    0,
  );
}

// ── Cells too big to ship ─────────────────────────────────────────────────────

const CELL_VALUE_CAP = 256 * 1024;
const CELL_PREVIEW_BYTES = 16 * 1024;
const WIDE_COLUMN_AVG_BYTES = 32 * 1024;

export const oversize: Spec = {
  aspect: (w) => (w < 520 ? 1.1 : 2.1),
  controls: [
    {
      key: "lg",
      label: "Average cell",
      min: 2,
      max: 6.2,
      step: 0.01,
      value: Math.log10(601_000),
      color: "blue",
      format: (x: number) => bytes(10 ** x),
      marks: [{ value: Math.log10(601_000), label: "resume" }],
    },
    {
      key: "inSql",
      label: "Cap inside the query",
      type: "toggle",
      value: true,
      color: "green",
    },
  ],
  caption:
    "One 200-row page with one big column. Three costs: what Postgres reads out of TOAST, what crosses the network, and what reaches the webview.",
  status: (_s, v) => {
    const r = oversizeModel(v);
    return `network ${bytes(r.network)} · webview ${bytes(r.webview)}`;
  },
  draw(g, _s, v) {
    const gx = g as Gx;
    const r = oversizeModel(v);
    const x0 = Math.min(150, g.w * 0.34);
    const W = g.w - x0 - 80;
    const max = Math.max(r.page, 1);
    const bar = (y: number, label: string, b: number, color: string) => {
      g.text(label, [x0 - 10, y + 11], {
        size: 12.5,
        align: "right",
        baseline: "middle",
      });
      g.rect(x0, y, W, 22, { fill: g.rgba("muted", 0.08) });
      const w = Math.max(2, (gx.ease(label, b) / max) * W);
      g.rect(x0, y, w, 22, { fill: color });
      g.text(bytes(b), [x0 + w + 8, y + 11], {
        size: 12,
        baseline: "middle",
        align: "left",
        color: "muted",
      });
    };
    bar(24, "read from TOAST", r.toast, g.rgba("red", 0.5));
    bar(62, "over the network", r.network, "purple");
    bar(100, "into the webview", r.webview, "blue");
    g.text(
      r.wide
        ? v.inSql
          ? `${r.over} cells over 256 KB come back as their size only`
          : `${r.over} cells over 256 KB cross the network whole, then get cut to a 16 KB preview`
        : "average under 32 KB: not a wide column, values ship as they are",
      [16, g.h - 16],
      { size: 12, color: "muted", align: "left" },
    );
  },
};
function oversizeModel(v: Values) {
  const avg = 10 ** v.lg;
  const wide = avg > WIDE_COLUMN_AVG_BYTES;
  let toast = 0;
  let network = 0;
  let webview = 0;
  let over = 0;
  let page = 0;
  for (let i = 0; i < 200; i++) {
    const size = avg * (0.35 + (hash(i) % 1300) / 1000);
    page += size;
    const big = size > CELL_VALUE_CAP;
    if (big) over++;
    if (wide && v.inSql && big) {
      network += 110; // the sentinel: a flag, the type and the size
      webview += 110;
    } else {
      toast += size;
      network += size;
      webview += big ? CELL_PREVIEW_BYTES + 110 : size;
    }
  }
  return { toast, network, webview, over, wide, page };
}

// ── The SQL console streams ───────────────────────────────────────────────────

type StreamState = {
  t: number;
  pending: number;
  bytes: number;
  since: number;
  first: boolean;
  last: number;
  sent: { t: number; rows: number; why: string }[];
};

export const stream: Spec = {
  aspect: (w) => (w < 520 ? 1.2 : 2.3),
  state: (): StreamState => ({
    t: 0,
    pending: 0,
    bytes: 0,
    since: 0,
    first: false,
    last: 0,
    sent: [],
  }),
  controls: [
    {
      key: "lg",
      label: "Rows arriving",
      min: 2,
      max: 6,
      step: 0.01,
      value: 5,
      color: "blue",
      format: (x: number) => `${fmt(10 ** x)}/s`,
    },
    {
      key: "lb",
      label: "Row size",
      min: 1.7,
      max: 4.3,
      step: 0.01,
      value: 2.3,
      color: "purple",
      format: (x: number) => bytes(10 ** x),
      marks: [{ value: Math.log10(17_000), label: "embedding" }],
    },
  ],
  reset: true,
  caption:
    "Messages from the Rust side to the window over the last two seconds. The first closes at 200 rows so the grid fills at once; after that a message closes at 50,000 rows, 4 MB or 250 ms, whichever comes first.",
  status: (s: StreamState) => {
    const recent = s.sent.filter((m) => m.t > s.t - 2);
    const why = recent.length ? recent[recent.length - 1].why : "…";
    return `${recent.length} messages in 2 s · last closed by ${why}`;
  },
  step(dt, s: StreamState, v) {
    s.t += dt;
    const rate = 10 ** v.lg;
    const size = 10 ** v.lb;
    // Rows land in small steps so the flush tests see them one batch at a time.
    const steps = 8;
    for (let k = 0; k < steps; k++) {
      const t = s.t - dt + (dt * (k + 1)) / steps;
      s.pending += (rate * dt) / steps;
      const whole = Math.floor(s.pending);
      s.pending -= whole;
      s.since += whole;
      s.bytes += whole * size;
      const due = s.first ? 50_000 : 200;
      const why =
        s.since >= due
          ? s.first
            ? "50,000 rows"
            : "first 200 rows"
          : s.bytes >= 4 << 20
            ? "4 MB"
            : t - s.last >= 0.25 && s.since > 0
              ? "250 ms"
              : "";
      if (why) {
        s.sent.push({ t, rows: s.since, why });
        s.first = true;
        s.since = 0;
        s.bytes = 0;
        s.last = t;
      }
    }
    s.sent = s.sent.filter((m) => m.t > s.t - 2.2);
  },
  draw(g, s: StreamState) {
    const x0 = 16;
    const x1 = g.w - 16;
    const X = (t: number) => x1 - ((s.t - t) / 2) * (x1 - x0);
    const base = g.h - 40;
    const colors: Record<string, string> = {
      "first 200 rows": "green",
      "50,000 rows": "blue",
      "4 MB": "purple",
      "250 ms": "muted",
    };
    g.line([x0, base], [x1, base], { stroke: "faint", width: 1 });
    const maxRows = Math.max(200, ...s.sent.map((m) => m.rows));
    for (const m of s.sent) {
      const h =
        16 + (Math.log10(m.rows + 1) / Math.log10(maxRows + 1)) * (base - 40);
      g.rect(X(m.t) - 3, base - h, 6, h, { fill: colors[m.why] ?? "ink" });
    }
    g.text("2 s ago", [x0, base + 16], {
      size: 11,
      color: "muted",
      align: "left",
    });
    g.text("now", [x1, base + 16], {
      size: 11,
      color: "muted",
      align: "right",
    });
    let lx = x0;
    for (const [why, c] of Object.entries(colors)) {
      g.rect(lx, 12, 10, 10, { fill: c });
      g.text(why, [lx + 15, 17], {
        size: 11.5,
        baseline: "middle",
        align: "left",
      });
      lx += g.measure(why, { size: 11.5 }) + 32;
    }
  },
};

// ── Spooling a result to disk ─────────────────────────────────────────────────

export const spool: Spec = {
  aspect: (w) => (w < 520 ? 1.3 : 2.4),
  controls: [
    {
      key: "lg",
      label: "Result rows",
      min: 4,
      max: 7,
      step: 0.001,
      value: Math.log10(5_011_000),
      color: "blue",
      format: (x: number) => fmt(10 ** x),
      marks: [{ value: Math.log10(5_011_000), label: "5,011,000" }],
    },
  ],
  caption:
    "Holding a console result in the backend. As decoded values it was measured at 2.8 GB for 5,011,000 rows (scaled linearly here); spooled, the rows sit in a file and memory holds one 8-byte offset per row.",
  status: (_s, v) =>
    `values ${bytes(spoolValues(v))} · offsets ${bytes(10 ** v.lg * 8)}`,
  draw(g, _s, v) {
    const gx = g as Gx;
    const rows = 10 ** v.lg;
    const vals = spoolValues(v);
    const offs = rows * 8;
    const x0 = 16;
    const W = g.w - 32;
    const max = (2.8e9 / 5_011_000) * 1e7;
    const bar = (y: number, label: string, b: number, color: string) => {
      g.label(label, [x0, y - 10], { color: "muted", align: "left" });
      g.rect(x0, y, W, 22, { fill: g.rgba("muted", 0.08) });
      const w = Math.max(2, (gx.ease(label, b) / max) * W * 0.82);
      g.rect(x0, y, w, 22, { fill: color });
      g.text(bytes(b), [x0 + w + 8, y + 11], {
        size: 12.5,
        baseline: "middle",
        align: "left",
      });
    };
    bar(30, "rows held as values", vals, g.rgba("red", 0.55));
    bar(92, "spool file offsets, 8 B a row", offs, "green");
    g.text(
      "read_window(i, n) = file bytes from offsets[i] to offsets[i + n]",
      [x0, g.h - 16],
      {
        font: "mono",
        size: 11.5,
        color: "muted",
        align: "left",
      },
    );
  },
};
const spoolValues = (v: Values) => (2.8e9 / 5_011_000) * 10 ** v.lg;

// ── Giving memory back ────────────────────────────────────────────────────────

export const arenas: Spec = {
  aspect: (w) => (w < 520 ? 1.2 : 2.4),
  controls: [
    {
      key: "alloc",
      label: "Allocator",
      type: "choice",
      options: [
        { value: "glibc", label: "glibc malloc" },
        { value: "mimalloc", label: "mimalloc" },
      ],
      value: "glibc",
    },
  ],
  caption:
    "Memory the Rust side still held after an open, scroll and seek workload on a 1M-row table had finished. With glibc it sat in per-thread arenas, about 50 MB each, for the rest of the session.",
  status: (_s, v) => `retained growth ${v.alloc === "glibc" ? "527" : "27"} MB`,
  draw(g, _s, v) {
    const gx = g as Gx;
    const x0 = 16;
    const W = g.w - 32;
    const mb = gx.ease("retained", v.alloc === "glibc" ? 527 : 27);
    g.label("retained growth, Rust process", [x0, 22], {
      color: "muted",
      align: "left",
    });
    g.rect(x0, 32, W, 24, { fill: g.rgba("muted", 0.08) });
    g.rect(x0, 32, Math.max(2, (mb / 680) * W), 24, {
      fill: v.alloc === "glibc" ? g.rgba("red", 0.55) : "green",
    });
    g.text(`${Math.round(mb)} MB`, [x0 + Math.max(2, (mb / 680) * W) + 8, 44], {
      size: 12.5,
      baseline: "middle",
      align: "left",
    });
    const ty = 86;
    const tw = (W - 30) / 4;
    for (let i = 0; i < 4; i++) {
      const x = x0 + i * (tw + 10);
      g.rect(x, ty, tw, g.h - ty - 14, { stroke: "faint", width: 1, r: 6 });
      g.text(`worker ${i + 1}`, [x + 8, ty + 14], {
        size: 11.5,
        baseline: "middle",
        align: "left",
        color: "muted",
      });
      if (v.alloc === "glibc") {
        const ah = (g.h - ty - 44) * 0.8;
        g.rect(x + 8, g.h - 22 - ah, tw - 16, ah, {
          fill: g.rgba("red", 0.35),
          r: 4,
        });
        g.text("arena ~50 MB", [x + tw / 2, g.h - 22 - ah / 2], {
          size: 11,
          align: "center",
          baseline: "middle",
        });
      }
    }
  },
};
