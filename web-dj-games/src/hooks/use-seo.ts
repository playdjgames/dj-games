import { useEffect } from "react";

import { canonicalUrl } from "@/data/site";

interface SeoOptions {
  title: string;
  description: string;
  /** Absolute image URL used for social previews. */
  image?: string;
  /** Keeps a private page out of search engines. */
  noIndex?: boolean;
}

const setMeta = (selector: string, attribute: "name" | "property", key: string, content: string): void => {
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
};

/**
 * Keeps the document title and social metadata in sync with the active route.
 * Canonical/og URLs use the custom domain only when it actually serves the site
 * (see `canonicalOrigin`), otherwise the current origin.
 */
export const useSeo = ({ title, description, image, noIndex = false }: SeoOptions): void => {
  useEffect(() => {
    document.title = title;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[property="og:title"]', "property", "og:title", title);
    setMeta('meta[property="og:description"]', "property", "og:description", description);
    const absoluteUrl = canonicalUrl(window.location.pathname);
    setMeta('meta[property="og:url"]', "property", "og:url", absoluteUrl);

    if (image) {
      setMeta('meta[property="og:image"]', "property", "og:image", image);
      setMeta('meta[name="twitter:image"]', "name", "twitter:image", image);
    }

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = absoluteUrl;

    const robots = document.head.querySelector<HTMLMetaElement>('meta[name="robots"]');
    if (noIndex) {
      setMeta('meta[name="robots"]', "name", "robots", "noindex, nofollow");
    } else if (robots) {
      robots.remove();
    }
  }, [title, description, image, noIndex]);
};
