/**
 * Allow-list of media the library accepts, shared by the upload validator and
 * the public file server. Anything not listed here is rejected outright, which
 * is what keeps executables and scripts out of the bucket.
 */

export interface MediaTypeSpec {
  contentType: string;
  kind: "video" | "image";
  extensions: string[];
  /** Hard upload ceiling in bytes. */
  maxBytes: number;
}

const MB = 1024 * 1024;

export const MEDIA_TYPES: MediaTypeSpec[] = [
  { contentType: "video/mp4", kind: "video", extensions: ["mp4", "m4v"], maxBytes: 512 * MB },
  { contentType: "video/quicktime", kind: "video", extensions: ["mov"], maxBytes: 512 * MB },
  { contentType: "image/jpeg", kind: "image", extensions: ["jpg", "jpeg"], maxBytes: 32 * MB },
  { contentType: "image/png", kind: "image", extensions: ["png"], maxBytes: 32 * MB },
];

export const specForContentType = (contentType: string): MediaTypeSpec | undefined =>
  MEDIA_TYPES.find((spec) => spec.contentType === contentType.toLowerCase().split(";")[0]?.trim());

export const specForExtension = (extension: string): MediaTypeSpec | undefined =>
  MEDIA_TYPES.find((spec) => spec.extensions.includes(extension.toLowerCase()));

/** Content type inferred from the stored key, used when R2 metadata is missing. */
export const contentTypeForKey = (key: string): string => {
  const extension = key.split(".").pop() ?? "";
  return specForExtension(extension)?.contentType ?? "application/octet-stream";
};

/**
 * Makes a filename safe for a public URL: lowercase, ASCII, hyphen-separated,
 * with exactly one extension preserved.
 */
export const safeFilename = (input: string, fallbackExtension: string): string => {
  const trimmed = input.trim().toLowerCase();
  const lastDot = trimmed.lastIndexOf(".");
  const rawExtension = lastDot > 0 ? trimmed.slice(lastDot + 1) : "";
  const known = specForExtension(rawExtension);
  const extension = known ? rawExtension : fallbackExtension;
  const base = lastDot > 0 ? trimmed.slice(0, lastDot) : trimmed;

  const slug = base
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

  return `${slug.length > 0 ? slug : "file"}.${extension}`;
};

/** Folder slugs follow the same rules, minus the extension. */
export const safeSlug = (input: string): string =>
  input
    .trim()
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
