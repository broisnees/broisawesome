import { useEffect } from "react";
import { track } from "~/lib/analytics";
import { SITE_URL } from "~/lib/seo";

const REF = new URL(SITE_URL).hostname;

/** Adds ref and UTM params to an external URL. Params already on the link win. */
export function tagOutbound(href: string, page: string) {
  const url = new URL(href);
  const params = {
    ref: REF,
    utm_source: REF,
    utm_medium: "referral",
    utm_content: page,
  };
  for (const [key, value] of Object.entries(params)) {
    if (!url.searchParams.has(key)) url.searchParams.set(key, value);
  }
  return url.toString();
}

/**
 * Tags external links the moment they're used (click, middle-click, context
 * menu), so the rendered HTML and the hover preview stay clean. One listener
 * covers every link, MDX posts included.
 */
export function useOutboundTags() {
  useEffect(() => {
    const tag = (event: Event) => {
      const link = (event.target as Element | null)?.closest?.("a[href]");
      if (!(link instanceof HTMLAnchorElement)) return;
      if (!/^https?:$/.test(link.protocol)) return;
      if (link.origin === location.origin) return;
      // Keep the untagged URL so a second click reports the same link.
      link.dataset.href ??= link.href;
      if (event.type !== "contextmenu") {
        track("outbound_link_clicked", {
          url: link.dataset.href,
          host: link.hostname,
        });
      }
      link.href = tagOutbound(link.href, location.pathname);
    };
    const events = ["click", "auxclick", "contextmenu"] as const;
    for (const type of events) document.addEventListener(type, tag, true);
    return () => {
      for (const type of events) document.removeEventListener(type, tag, true);
    };
  }, []);
}
