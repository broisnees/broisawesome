import { CommandLineIcon, Tick02Icon } from "@hugeicons/core-free-icons";
import { useLocation } from "@tanstack/react-router";
import { type FormEvent, useEffect, useId, useRef, useState } from "react";
import { hiSchema } from "~/lib/hi";
import { sayHi } from "~/lib/hi.functions";
import { SITE_URL } from "~/lib/seo";
import { cn } from "~/lib/utils";
import { Icon } from "./icon";

const EMAIL = "broisnees@gmail.com";
const CURL = `curl -d "hey" ${SITE_URL}/hi`;

const hourIn = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kathmandu",
  hour: "numeric",
  hourCycle: "h23",
});
const timeIn = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Asia/Kathmandu",
  hour: "2-digit",
  minute: "2-digit",
});

type State =
  | { kind: "idle" }
  | { kind: "sending" }
  | { kind: "sent"; contact?: string }
  | { kind: "error"; message: string; offerEmail?: boolean };

/**
 * The header's Say hi: a small message box instead of a mailto. Messages
 * reach my phone through /hi, which also takes curl.
 */
export function SayHi() {
  const [open, setOpen] = useState(false);
  // Mounted on first open and kept, so closing animates and drafts survive.
  const [mounted, setMounted] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [draft, setDraft] = useState("");
  const [contact, setContact] = useState("");
  const [state, setState] = useState<State>({ kind: "idle" });
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const input = useRef<HTMLTextAreaElement>(null);
  const honeypot = useRef<HTMLInputElement>(null);
  const { pathname } = useLocation();
  const id = useId();

  function show() {
    setNow(new Date());
    setMounted(true);
    setOpen(true);
  }

  function hide(refocus = false) {
    setOpen(false);
    if (refocus) trigger.current?.focus();
  }

  useEffect(() => {
    if (!open) return;
    input.current?.focus();
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") hide(true);
    };
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) hide();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
    };
  }, [open]);

  // A route change closes it, like any other popover.
  useEffect(() => setOpen(false), [pathname]);

  async function send(event?: FormEvent) {
    event?.preventDefault();
    if (state.kind === "sending") return;
    const parsed = hiSchema.safeParse({
      message: draft,
      contact,
      website: honeypot.current?.value,
      page: pathname,
    });
    if (!parsed.success) {
      setState({ kind: "error", message: parsed.error.issues[0]!.message });
      return;
    }

    setState({ kind: "sending" });
    try {
      const result = await sayHi({ data: parsed.data });
      if (result.ok) {
        setDraft("");
        setState({ kind: "sent", contact: parsed.data.contact || undefined });
      } else {
        setState({ kind: "error", message: result.error, offerEmail: true });
      }
    } catch {
      setState({
        kind: "error",
        message: "That didn’t go through.",
        offerEmail: true,
      });
    }
  }

  function again() {
    setState({ kind: "idle" });
    requestAnimationFrame(() => input.current?.focus());
  }

  const hour = Number(hourIn.format(now));
  const asleep = hour >= 23 || hour < 7;
  const sending = state.kind === "sending";

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={mounted ? id : undefined}
        onClick={() => (open ? hide() : show())}
        className="button-accent h-8 px-3.5 text-sm"
      >
        Say hi
      </button>

      {mounted && (
        <div
          id={id}
          role="dialog"
          aria-label="Say hi"
          data-open={open}
          inert={!open}
          className="say-hi absolute top-[calc(100%+0.625rem)] right-0 z-50 w-[min(22rem,calc(100vw-2.5rem))] overflow-hidden rounded-2xl bg-bg"
        >
          {state.kind === "sent" ? (
            <div role="status" className="say-hi-in p-4">
              <p className="flex items-center gap-2 font-[550] text-fg">
                <Icon icon={Tick02Icon} size={16} className="text-accent" />
                Sent, thanks!
              </p>
              <p className="mt-1 text-sm/[1.5] text-pretty text-muted">
                {state.contact
                  ? `I’ll get back to you at ${state.contact}.`
                  : "No contact left, so this one’s a one-way hello."}
              </p>
              <button
                type="button"
                onClick={again}
                className="link mt-3 text-sm"
              >
                Send another
              </button>
            </div>
          ) : (
            <form
              noValidate
              onSubmit={send}
              // Typing again clears the last error.
              onChange={() =>
                state.kind === "error" && setState({ kind: "idle" })
              }
            >
              <p className="px-4 pt-3.5 text-xs text-muted tabular-nums">
                {timeIn.format(now)} in Kathmandu
                {asleep ? ", probably asleep" : ""}
              </p>
              <label htmlFor={`${id}-message`} className="sr-only">
                Message
              </label>
              <textarea
                ref={input}
                id={`${id}-message`}
                value={draft}
                onChange={(event) => setDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter" && (event.metaKey || event.ctrlKey))
                    void send();
                }}
                rows={3}
                maxLength={2000}
                placeholder="What’s on your mind?"
                className="block w-full resize-none bg-transparent px-4 pt-1.5 pb-3 text-fg outline-none placeholder:text-muted"
              />

              {state.kind === "error" && (
                <p role="alert" className="px-4 pb-3 text-sm/[1.5] text-fg">
                  {state.message}{" "}
                  {state.offerEmail && (
                    <>
                      Email me at{" "}
                      <a href={`mailto:${EMAIL}`} className="link">
                        {EMAIL}
                      </a>{" "}
                      instead.
                    </>
                  )}
                </p>
              )}

              <div className="flex items-center gap-1 border-t border-line py-1.5 pr-1.5 pl-4">
                <label htmlFor={`${id}-contact`} className="sr-only">
                  Your email or phone
                </label>
                <input
                  id={`${id}-contact`}
                  type="text"
                  autoComplete="email"
                  value={contact}
                  onChange={(event) => setContact(event.target.value)}
                  placeholder="Email or phone"
                  className="h-8 min-w-0 flex-1 bg-transparent text-base text-fg outline-none placeholder:text-muted sm:text-sm"
                />
                <CurlButton />
                <button
                  type="submit"
                  disabled={!draft.trim() || sending}
                  className="button-accent h-8 px-3.5 text-sm disabled:opacity-50"
                >
                  {/* Both labels share a cell so the button never resizes. */}
                  <span className="grid">
                    <span
                      className={cn(
                        "col-start-1 row-start-1",
                        sending && "opacity-0",
                      )}
                    >
                      Send
                    </span>
                    <span
                      aria-hidden
                      className={cn(
                        "col-start-1 row-start-1",
                        !sending && "opacity-0",
                      )}
                    >
                      Sending
                    </span>
                  </span>
                </button>
              </div>

              {/* People never see this field; bots fill it in. */}
              <input
                ref={honeypot}
                name="website"
                tabIndex={-1}
                autoComplete="off"
                aria-hidden
                className="absolute size-px opacity-0"
              />
            </form>
          )}
        </div>
      )}
    </div>
  );
}

/** Copies the curl version, for anyone who'd rather say hi from a terminal. */
function CurlButton() {
  const [copied, setCopied] = useState(false);
  const swap =
    "absolute transition-[opacity,scale,filter] duration-200 ease-[cubic-bezier(0.2,0,0,1)]";
  const shown = "scale-100 opacity-100 blur-0";
  const hidden = "scale-[0.25] opacity-0 blur-[4px]";

  return (
    <button
      type="button"
      title={`Or from a terminal: ${CURL}`}
      aria-label={copied ? "Copied" : "Copy the curl command"}
      onClick={async () => {
        await navigator.clipboard.writeText(CURL);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      }}
      className="relative grid size-8 shrink-0 place-items-center rounded-lg text-muted transition-[color,background-color] duration-150 ease-out hover:bg-surface-hover hover:text-fg"
    >
      <Icon
        icon={CommandLineIcon}
        size={15}
        className={cn(swap, copied ? hidden : shown)}
      />
      <Icon
        icon={Tick02Icon}
        size={15}
        className={cn(swap, "text-accent", copied ? shown : hidden)}
      />
    </button>
  );
}
