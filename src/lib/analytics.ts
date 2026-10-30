import posthog from "posthog-js";

/** A named PostHog event. No-op until PostHog has loaded (SSR, no token, blocked). */
export function track(event: string, properties?: Record<string, unknown>) {
  if (posthog.__loaded) posthog.capture(event, properties);
}
