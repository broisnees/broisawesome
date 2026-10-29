import { z } from "zod";

/** One message from the Say hi popover or `curl -d` on /hi. */
export const hiSchema = z.object({
  message: z
    .string()
    .trim()
    .min(1, "Write something first.")
    .max(2000, "Keep it under 2,000 characters."),
  // How to reach them: an email or a phone number.
  contact: z
    .string()
    .trim()
    .max(200)
    .refine(
      (value) =>
        value === "" ||
        z.email().safeParse(value).success ||
        /^\+?\d{7,15}$/.test(value.replace(/[\s().-]/g, "")),
      "That doesn’t look like an email or a phone number.",
    )
    .optional(),
  // A field people never see. Anything in it came from a bot.
  website: z.string().optional(),
  page: z.string().max(200).optional(),
});

export type Hi = z.infer<typeof hiSchema>;

export type HiResult = { ok: true } | { ok: false; error: string };
