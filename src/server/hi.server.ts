import { env } from "cloudflare:workers";
import type { Hi } from "~/lib/hi";

type Delivery = { ok: true } | { ok: false; status: number; error: string };

/**
 * Sends a hello to my phone through a Telegram bot. Rate limited per IP, so
 * the open curl endpoint can't be used to flood it.
 */
export async function deliverHi(
  hi: Hi,
  request: Request,
  via: "site" | "terminal",
): Promise<Delivery> {
  if (hi.website) return { ok: true };

  const ip = request.headers.get("cf-connecting-ip") ?? "local";
  const { success } = await env.HI_LIMIT.limit({ key: ip });
  if (!success) {
    return {
      ok: false,
      status: 429,
      error: "That’s a lot of hellos. Try again in a minute.",
    };
  }

  const text = format(hi, request, via);
  const token = env.TELEGRAM_BOT_TOKEN;
  const chat = env.TELEGRAM_CHAT_ID;
  if (!token || !chat) {
    if (import.meta.env.DEV) {
      console.log(`[say hi]\n${text}`);
      return { ok: true };
    }
    return { ok: false, status: 503, error: "That didn’t go through." };
  }

  const response = await fetch(
    `https://api.telegram.org/bot${token}/sendMessage`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chat,
        text,
        link_preview_options: { is_disabled: true },
      }),
    },
  );
  if (!response.ok) {
    console.error("Telegram", response.status, await response.text());
    return { ok: false, status: 502, error: "That didn’t go through." };
  }
  return { ok: true };
}

function format(hi: Hi, request: Request, via: string) {
  const cf = (request as { cf?: { city?: string; country?: string } }).cf;
  const where = [cf?.city, cf?.country].filter(Boolean).join(", ");
  return [
    `New hi via the ${via}`,
    "",
    hi.message,
    "",
    `Reply to: ${hi.contact || "no contact left"}`,
    ...(hi.page ? [`Page: ${hi.page}`] : []),
    ...(where ? [`From: ${where}`] : []),
  ].join("\n");
}
