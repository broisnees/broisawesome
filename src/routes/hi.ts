import { createFileRoute } from "@tanstack/react-router";
import { hiSchema } from "~/lib/hi";
import { SITE_URL } from "~/lib/seo";
import { deliverHi } from "~/server/hi.server";

const USAGE = `Say hi to me from a terminal:

  curl -d "hey" ${SITE_URL}/hi

Leave an email or a phone number so I can get back to you:

  curl -d "message=hey" -d "contact=you@example.com" ${SITE_URL}/hi

JSON works too: {"message": "hey", "contact": "+977 98XXXXXXXX"}
`;

// The `/hi` endpoint behind the curl line in the Say hi popover.
export const Route = createFileRoute("/hi")({
  server: {
    handlers: {
      GET: () => reply(200, USAGE),
      POST: async ({ request }) => {
        const raw = await request.text();
        if (raw.length > 8000) return reply(413, "That’s too long.\n");

        const parsed = hiSchema.safeParse(
          withContact(readBody(raw, request.headers.get("content-type"))),
        );
        if (!parsed.success) {
          return reply(400, `${parsed.error.issues[0]?.message}\n\n${USAGE}`);
        }

        const result = await deliverHi(parsed.data, request, "terminal");
        if (!result.ok) return reply(result.status, `${result.error}\n`);
        return reply(
          200,
          parsed.data.contact
            ? "Sent. Thanks for saying hi, I’ll get back to you.\n"
            : "Sent. Thanks for saying hi.\n",
        );
      },
    },
  },
});

function readBody(raw: string, type: string | null) {
  if (type?.includes("application/json")) {
    try {
      return JSON.parse(raw) as unknown;
    } catch {
      return {};
    }
  }
  // `curl -d "hey"` sends the words as a form body with no field names.
  const form = new URLSearchParams(raw);
  return form.has("message") ? Object.fromEntries(form) : { message: raw };
}

/** `email=` and `phone=` both work as the contact field. */
function withContact(body: unknown) {
  if (!body || typeof body !== "object") return body;
  const { email, phone, contact, ...rest } = body as Record<string, unknown>;
  return { ...rest, contact: contact ?? email ?? phone };
}

function reply(status: number, text: string) {
  return new Response(text, {
    status,
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
}
