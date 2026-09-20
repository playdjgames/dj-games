/**
 * Client for the media library backend (Cloudflare Worker + R2).
 *
 * Every call is admin-authenticated with the same studio key used by
 * /subscribers. Uploads go straight from the browser to R2 through a
 * short-lived presigned PUT, so large videos never pass through the Worker.
 * The resulting public URL is permanent and unauthenticated.
 */

const BACKEND_URL: string = import.meta.env["EXPO_PUBLIC_RORK_FUNCTIONS_URL"] ?? "";

export const isMediaBackendConnected = (): boolean => BACKEND_URL.length > 0;

export type MediaKind = "video" | "image";

export interface MediaItem {
  id: string;
  folder: string;
  filename: string;
  storage_key: string;
  content_type: string;
  size: number;
  width: number | null;
  height: number | null;
  duration: number | null;
  created_at: number;
  /** Permanent public HTTPS URL to the actual file. */
  url: string;
}

export interface MediaFolder {
  slug: string;
  label: string;
}

export interface MediaLibrarySnapshot {
  media: MediaItem[];
  folders: MediaFolder[];
  publicBase: string;
}

export interface StorageStatus {
  storageReady: boolean;
  publicBase: string;
  usingCustomDomain: boolean;
}

export class MediaAuthError extends Error {}
export class MediaStorageError extends Error {}
/** Thrown when the browser's cross-origin PUT to R2 was blocked outright. */
class MediaCorsError extends Error {}

const ACCEPTED: Record<string, { kind: MediaKind; maxBytes: number }> = {
  "video/mp4": { kind: "video", maxBytes: 512 * 1024 * 1024 },
  "video/quicktime": { kind: "video", maxBytes: 512 * 1024 * 1024 },
  "image/jpeg": { kind: "image", maxBytes: 32 * 1024 * 1024 },
  "image/png": { kind: "image", maxBytes: 32 * 1024 * 1024 },
};

export const ACCEPT_ATTRIBUTE = ".mp4,.m4v,.mov,.jpg,.jpeg,.png,video/mp4,video/quicktime,image/jpeg,image/png";

/**
 * Browsers occasionally hand back an empty or odd type (notably `.mov` on
 * Windows), so fall back to the extension before rejecting a file.
 */
export const resolveContentType = (file: File): string | null => {
  const reported = file.type.toLowerCase();
  if (ACCEPTED[reported]) return reported;

  const extension = file.name.toLowerCase().split(".").pop() ?? "";
  if (extension === "mp4" || extension === "m4v") return "video/mp4";
  if (extension === "mov") return "video/quicktime";
  if (extension === "jpg" || extension === "jpeg") return "image/jpeg";
  if (extension === "png") return "image/png";
  return null;
};

export const kindForContentType = (contentType: string): MediaKind =>
  contentType.startsWith("video/") ? "video" : "image";

export const maxBytesFor = (contentType: string): number => ACCEPTED[contentType]?.maxBytes ?? 0;

const request = async (path: string, adminKey: string, init?: RequestInit): Promise<Response> => {
  const response = await fetch(`${BACKEND_URL}${path}`, {
    ...init,
    headers: {
      ...(init?.headers ?? {}),
      Authorization: `Bearer ${adminKey}`,
    },
  });

  if (response.status === 401) throw new MediaAuthError("That key didn't work.");
  if (response.status === 503) {
    const data = (await response.json().catch(() => null)) as { error?: string } | null;
    if (data?.error === "storage_not_configured") {
      throw new MediaStorageError("Media storage isn't connected yet.");
    }
    throw new MediaAuthError("No admin key is configured on the server yet.");
  }

  return response;
};

/** Reports whether R2 credentials are present, without requiring them. */
export const fetchStorageStatus = async (adminKey: string): Promise<StorageStatus> => {
  const response = await request("/media-admin/config", adminKey);
  if (!response.ok) throw new Error(`request failed (${response.status})`);
  const data = (await response.json()) as StorageStatus;
  return data;
};

export const fetchMediaLibrary = async (adminKey: string): Promise<MediaLibrarySnapshot> => {
  const response = await request("/media-admin/list", adminKey);
  if (!response.ok) throw new Error(`request failed (${response.status})`);
  const data = (await response.json()) as MediaLibrarySnapshot;
  return { media: data.media ?? [], folders: data.folders ?? [], publicBase: data.publicBase ?? "" };
};

export const createFolder = async (label: string, adminKey: string): Promise<MediaFolder[]> => {
  const response = await request("/media-admin/folder", adminKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ label }),
  });
  const data = (await response.json().catch(() => null)) as { ok?: boolean; folders?: MediaFolder[] } | null;
  if (!response.ok || !data?.ok) throw new Error("Couldn't create that folder.");
  return data.folders ?? [];
};

export const deleteFolder = async (slug: string, adminKey: string): Promise<void> => {
  const response = await request("/media-admin/remove-folder", adminKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ slug }),
  });
  if (response.status === 409) throw new Error("That folder still has media in it.");
  if (!response.ok) throw new Error("Couldn't delete that folder.");
};

/**
 * Reads dimensions (and duration for video) locally before upload, so the
 * library can show resolution and social-format compatibility without any
 * server-side transcoding.
 */
const probeMedia = (file: File, kind: MediaKind): Promise<{ width: number; height: number; duration: number }> =>
  new Promise((resolve) => {
    const objectUrl = URL.createObjectURL(file);
    const fallback = { width: 0, height: 0, duration: 0 };
    const finish = (result: { width: number; height: number; duration: number }): void => {
      URL.revokeObjectURL(objectUrl);
      resolve(result);
    };
    const timer = window.setTimeout(() => finish(fallback), 10000);

    if (kind === "video") {
      const video = document.createElement("video");
      video.preload = "metadata";
      video.onloadedmetadata = () => {
        window.clearTimeout(timer);
        finish({
          width: video.videoWidth,
          height: video.videoHeight,
          duration: Number.isFinite(video.duration) ? video.duration : 0,
        });
      };
      video.onerror = () => {
        window.clearTimeout(timer);
        finish(fallback);
      };
      video.src = objectUrl;
      return;
    }

    const image = new Image();
    image.onload = () => {
      window.clearTimeout(timer);
      finish({ width: image.naturalWidth, height: image.naturalHeight, duration: 0 });
    };
    image.onerror = () => {
      window.clearTimeout(timer);
      finish(fallback);
    };
    image.src = objectUrl;
  });

/** PUTs the file to the presigned URL with real progress events. */
const putWithProgress = (
  uploadUrl: string,
  file: File,
  contentType: string,
  onProgress: (fraction: number) => void,
): Promise<void> =>
  new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("PUT", uploadUrl, true);
    xhr.setRequestHeader("Content-Type", contentType);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && event.total > 0) onProgress(event.loaded / event.total);
    };
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        onProgress(1);
        resolve();
        return;
      }
      reject(new Error(`storage rejected the upload (${xhr.status})`));
    };
    // A browser-side PUT to R2 is cross-origin, so a missing bucket CORS policy
    // surfaces here as an opaque network error with no status. Flag it as such
    // so the caller can fix the bucket and retry instead of failing the upload.
    xhr.onerror = () => reject(new MediaCorsError("storage blocked the browser upload"));
    xhr.onabort = () => reject(new Error("upload cancelled"));
    xhr.send(file);
  });

export interface UploadOutcome {
  item: MediaItem;
}

/**
 * Full upload flow: validate -> presign -> direct PUT to R2 -> record metadata.
 * Throws with a human-readable message that the page surfaces in a toast.
 */
export const uploadMedia = async (
  file: File,
  folder: string,
  adminKey: string,
  onProgress: (fraction: number) => void,
): Promise<UploadOutcome> => {
  const contentType = resolveContentType(file);
  if (!contentType) throw new Error("Only MP4, MOV, JPEG and PNG files are supported.");

  const limit = maxBytesFor(contentType);
  if (file.size > limit) {
    throw new Error(`That file is larger than the ${Math.round(limit / (1024 * 1024))}MB limit.`);
  }

  const presign = await request("/media-admin/upload-url", adminKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ folder, filename: file.name, contentType, size: file.size }),
  });

  const presignData = (await presign.json().catch(() => null)) as
    | { ok?: boolean; uploadUrl?: string; storageKey?: string; folder?: string; filename?: string; error?: string }
    | null;

  if (!presign.ok || !presignData?.ok || !presignData.uploadUrl) {
    if (presignData?.error === "already_exists") {
      throw new Error(`"${presignData.filename ?? file.name}" already exists in that folder. Rename it first.`);
    }
    if (presignData?.error === "unsupported_type") {
      throw new Error("Only MP4, MOV, JPEG and PNG files are supported.");
    }
    if (presignData?.error === "file_too_large") throw new Error("That file is too large.");
    throw new Error("Couldn't start the upload.");
  }

  const probe = await probeMedia(file, kindForContentType(contentType));

  try {
    await putWithProgress(presignData.uploadUrl, file, contentType, onProgress);
  } catch (error: unknown) {
    if (!(error instanceof MediaCorsError)) throw error;

    // First upload against a fresh bucket: R2 rejects the cross-origin PUT
    // until a CORS policy names this site. Ask the backend to write one with
    // its own credentials, then retry once — no dashboard trip required.
    const enabled = await request("/media-admin/enable-uploads", adminKey, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ origin: window.location.origin }),
    });
    if (!enabled.ok) {
      throw new Error("Storage is refusing uploads from this site and couldn't be reconfigured automatically.");
    }

    onProgress(0);
    await putWithProgress(presignData.uploadUrl, file, contentType, onProgress);
  }

  const record = await request("/media-admin/record", adminKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: crypto.randomUUID(),
      folder: presignData.folder,
      filename: presignData.filename,
      storage_key: presignData.storageKey,
      content_type: contentType,
      size: file.size,
      width: probe.width,
      height: probe.height,
      duration: probe.duration,
    }),
  });

  const recorded = (await record.json().catch(() => null)) as { ok?: boolean; item?: MediaItem } | null;
  if (!record.ok || !recorded?.ok || !recorded.item) {
    throw new Error("The file uploaded but couldn't be indexed. Refresh to check.");
  }

  return { item: recorded.item };
};

export const renameMedia = async (id: string, filename: string, adminKey: string): Promise<MediaItem> => {
  const response = await request("/media-admin/rename", adminKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id, filename }),
  });
  const data = (await response.json().catch(() => null)) as { ok?: boolean; item?: MediaItem; error?: string } | null;
  if (response.status === 409) throw new Error("A file with that name already exists in this folder.");
  if (!response.ok || !data?.ok || !data.item) throw new Error("Couldn't rename that file.");
  return data.item;
};

export const deleteMedia = async (id: string, adminKey: string): Promise<void> => {
  const response = await request("/media-admin/remove", adminKey, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ id }),
  });
  if (!response.ok) throw new Error("Couldn't delete that file.");
};
