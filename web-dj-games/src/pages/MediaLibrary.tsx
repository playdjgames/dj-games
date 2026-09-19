import {
  AlertTriangle,
  Check,
  CheckCircle2,
  Copy,
  ExternalLink,
  FilmIcon,
  FolderPlus,
  ImageIcon,
  KeyRound,
  Loader2,
  LogOut,
  Pencil,
  RefreshCw,
  Trash2,
  Upload,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState, type ChangeEvent, type DragEvent, type FormEvent } from "react";
import { toast } from "sonner";

import { Hero } from "@/components/Hero";
import { Reveal } from "@/components/Reveal";
import { useSeo } from "@/hooks/use-seo";
import {
  ACCEPT_ATTRIBUTE,
  createFolder,
  deleteFolder,
  deleteMedia,
  fetchMediaLibrary,
  fetchStorageStatus,
  isMediaBackendConnected,
  kindForContentType,
  MediaAuthError,
  MediaStorageError,
  renameMedia,
  uploadMedia,
  type MediaFolder,
  type MediaItem,
} from "@/lib/media";
import { aspectLabel, compatibilityFor, formatBytes, formatDuration, type CompatVerdict } from "@/lib/social-compat";

const STORAGE_KEY = "dj-games-newsletter-key";

type KindFilter = "all" | "video" | "image";
type SortMode = "newest" | "oldest" | "filename" | "size";

interface UploadJob {
  id: string;
  name: string;
  progress: number;
  status: "uploading" | "done" | "error";
  message?: string;
}

const formatDate = (ms: number): string =>
  new Date(ms).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });

const verdictStyles: Record<CompatVerdict, { className: string; Icon: typeof CheckCircle2 }> = {
  good: { className: "text-signal", Icon: CheckCircle2 },
  warn: { className: "text-ember", Icon: AlertTriangle },
  bad: { className: "text-muted-foreground", Icon: XCircle },
};

/**
 * Private media library. Not linked from the site — reachable only by typing
 * /media. Uploads go browser -> R2 directly; the public URL each file gets is
 * permanent and requires no authentication, which is what social publishers
 * such as Windsor.ai need.
 */
const MediaLibrary = () => {
  useSeo({
    title: "Media Library — DJ Games",
    description: "Private promotional media library for DJ Games.",
    noIndex: true,
  });

  const [adminKey, setAdminKey] = useState<string>("");
  const [keyInput, setKeyInput] = useState<string>("");
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [folders, setFolders] = useState<MediaFolder[]>([]);
  const [storageReady, setStorageReady] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [hasLoaded, setHasLoaded] = useState<boolean>(false);

  const [activeFolder, setActiveFolder] = useState<string>("all");
  const [uploadFolder, setUploadFolder] = useState<string>("");
  const [kindFilter, setKindFilter] = useState<KindFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("newest");
  const [jobs, setJobs] = useState<UploadJob[]>([]);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [copiedId, setCopiedId] = useState<string>("");
  const [newFolder, setNewFolder] = useState<string>("");
  const [expandedId, setExpandedId] = useState<string>("");

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) setAdminKey(saved);
  }, []);

  const signOut = useCallback((): void => {
    window.localStorage.removeItem(STORAGE_KEY);
    setAdminKey("");
    setKeyInput("");
    setMedia([]);
    setFolders([]);
    setHasLoaded(false);
  }, []);

  const load = useCallback(
    async (key: string): Promise<void> => {
      setIsLoading(true);
      try {
        const status = await fetchStorageStatus(key);
        setStorageReady(status.storageReady);
        window.localStorage.setItem(STORAGE_KEY, key);

        if (status.storageReady) {
          const snapshot = await fetchMediaLibrary(key);
          setMedia(snapshot.media);
          setFolders(snapshot.folders);
        }
        setHasLoaded(true);
      } catch (error: unknown) {
        if (error instanceof MediaAuthError) {
          toast.error("Access denied", { description: error.message });
          signOut();
        } else if (error instanceof MediaStorageError) {
          setStorageReady(false);
          setHasLoaded(true);
        } else {
          console.warn("media load failed", error);
          toast.error("Couldn't load the library", { description: "Please try again in a moment." });
        }
      } finally {
        setIsLoading(false);
      }
    },
    [signOut],
  );

  useEffect(() => {
    if (adminKey.length > 0 && !hasLoaded && !isLoading) void load(adminKey);
  }, [adminKey, hasLoaded, isLoading, load]);

  const onUnlock = useCallback(
    (event: FormEvent<HTMLFormElement>): void => {
      event.preventDefault();
      const value = keyInput.trim();
      if (value.length === 0) return;
      setAdminKey(value);
      void load(value);
    },
    [keyInput, load],
  );

  const targetFolder = uploadFolder || (activeFolder !== "all" ? activeFolder : folders[0]?.slug ?? "");

  const runUploads = useCallback(
    async (files: File[]): Promise<void> => {
      if (files.length === 0) return;
      if (targetFolder.length === 0) {
        toast.error("Create a game folder first", { description: "Media is organised by game." });
        return;
      }

      for (const file of files) {
        const jobId = crypto.randomUUID();
        setJobs((current) => [...current, { id: jobId, name: file.name, progress: 0, status: "uploading" }]);

        try {
          const { item } = await uploadMedia(file, targetFolder, adminKey, (fraction) => {
            setJobs((current) =>
              current.map((job) => (job.id === jobId ? { ...job, progress: fraction } : job)),
            );
          });
          setJobs((current) =>
            current.map((job) => (job.id === jobId ? { ...job, progress: 1, status: "done" } : job)),
          );
          setMedia((current) => [item, ...current.filter((row) => row.id !== item.id)]);
          toast.success("Uploaded", { description: item.filename });
          window.setTimeout(() => setJobs((current) => current.filter((job) => job.id !== jobId)), 2500);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : "Upload failed.";
          setJobs((current) =>
            current.map((job) => (job.id === jobId ? { ...job, status: "error", message } : job)),
          );
          toast.error("Upload failed", { description: message });
          if (error instanceof MediaAuthError) signOut();
        }
      }
    },
    [adminKey, signOut, targetFolder],
  );

  const onPick = useCallback(
    (event: ChangeEvent<HTMLInputElement>): void => {
      const files = Array.from(event.target.files ?? []);
      event.target.value = "";
      void runUploads(files);
    },
    [runUploads],
  );

  const onDrop = useCallback(
    (event: DragEvent<HTMLDivElement>): void => {
      event.preventDefault();
      setIsDragging(false);
      void runUploads(Array.from(event.dataTransfer.files));
    },
    [runUploads],
  );

  const onCopy = useCallback(async (item: MediaItem): Promise<void> => {
    try {
      await navigator.clipboard.writeText(item.url);
      setCopiedId(item.id);
      toast.success("URL copied", { description: "Ready to paste into Windsor.ai." });
      window.setTimeout(() => setCopiedId(""), 2000);
    } catch {
      toast.error("Couldn't copy", { description: item.url });
    }
  }, []);

  const onRename = useCallback(
    async (item: MediaItem): Promise<void> => {
      const next = window.prompt("New filename (the public URL will change):", item.filename);
      if (!next || next.trim() === item.filename) return;
      try {
        const updated = await renameMedia(item.id, next.trim(), adminKey);
        setMedia((current) => current.map((row) => (row.id === updated.id ? updated : row)));
        toast.success("Renamed", { description: "The old URL no longer works." });
      } catch (error: unknown) {
        toast.error("Rename failed", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
      }
    },
    [adminKey],
  );

  const onDelete = useCallback(
    async (item: MediaItem): Promise<void> => {
      const confirmed = window.confirm(
        `Delete "${item.filename}" permanently?\n\nIts public URL will stop working immediately, including in any scheduled social posts.`,
      );
      if (!confirmed) return;
      try {
        await deleteMedia(item.id, adminKey);
        setMedia((current) => current.filter((row) => row.id !== item.id));
        toast.success("Deleted");
      } catch (error: unknown) {
        toast.error("Delete failed", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
      }
    },
    [adminKey],
  );

  const onAddFolder = useCallback(
    async (event: FormEvent<HTMLFormElement>): Promise<void> => {
      event.preventDefault();
      const label = newFolder.trim();
      if (label.length === 0) return;
      try {
        const next = await createFolder(label, adminKey);
        setFolders(next);
        setNewFolder("");
        const created = next.find((folder) => folder.label === label);
        if (created) setUploadFolder(created.slug);
        toast.success("Folder created", { description: label });
      } catch (error: unknown) {
        toast.error("Couldn't create folder", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
      }
    },
    [adminKey, newFolder],
  );

  const onDeleteFolder = useCallback(
    async (folder: MediaFolder): Promise<void> => {
      if (!window.confirm(`Delete the "${folder.label}" folder?`)) return;
      try {
        await deleteFolder(folder.slug, adminKey);
        setFolders((current) => current.filter((row) => row.slug !== folder.slug));
        if (activeFolder === folder.slug) setActiveFolder("all");
        toast.success("Folder deleted");
      } catch (error: unknown) {
        toast.error("Couldn't delete folder", {
          description: error instanceof Error ? error.message : "Please try again.",
        });
      }
    },
    [activeFolder, adminKey],
  );

  const visible = useMemo((): MediaItem[] => {
    const filtered = media.filter((item) => {
      if (activeFolder !== "all" && item.folder !== activeFolder) return false;
      if (kindFilter !== "all" && kindForContentType(item.content_type) !== kindFilter) return false;
      return true;
    });

    const sorted = [...filtered];
    if (sortMode === "newest") sorted.sort((a, b) => b.created_at - a.created_at);
    if (sortMode === "oldest") sorted.sort((a, b) => a.created_at - b.created_at);
    if (sortMode === "filename") sorted.sort((a, b) => a.filename.localeCompare(b.filename));
    if (sortMode === "size") sorted.sort((a, b) => b.size - a.size);
    return sorted;
  }, [activeFolder, kindFilter, media, sortMode]);

  const isUnlocked = adminKey.length > 0 && hasLoaded;

  const chipClass = (active: boolean): string =>
    `inline-flex min-h-[38px] items-center gap-2 rounded-md border px-3.5 font-mono text-[0.64rem] uppercase tracking-[0.16em] transition-colors ${
      active
        ? "border-signal/50 bg-signal/10 text-signal"
        : "border-border bg-surface-raised text-muted-foreground hover:border-signal/40 hover:text-foreground"
    }`;

  return (
    <>
      <Hero
        compact
        eyebrow="Studio only"
        title={
          <>
            Media <span className="text-signal text-glow">Library</span>
          </>
        }
        description="Upload promotional video and artwork, then copy a permanent public link for Windsor.ai and the social platforms."
        stamp={["Private", "Media", "Storage"]}
      />

      <section className="container py-16 sm:py-20">
        {!isMediaBackendConnected() ? (
          <Reveal>
            <p className="font-mono text-sm uppercase tracking-[0.16em] text-ember">
              Backend not reachable — check the project configuration.
            </p>
          </Reveal>
        ) : !isUnlocked ? (
          <Reveal>
            <div className="surface-card corner-ticks mx-auto max-w-md p-7 sm:p-9">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-border bg-surface-raised text-signal">
                <KeyRound size={20} />
              </span>
              <h2 className="display-title mt-5 text-2xl">Enter your access key</h2>
              <p className="mt-3 text-[0.9rem] leading-relaxed text-muted-foreground">
                This page is private. Paste the studio admin key to manage promotional media — it stays saved in this
                browser only.
              </p>

              <form onSubmit={onUnlock} className="mt-6 flex flex-col gap-3">
                <label htmlFor="media-key" className="sr-only">
                  Admin key
                </label>
                <input
                  id="media-key"
                  type="password"
                  autoComplete="current-password"
                  value={keyInput}
                  onChange={(event) => setKeyInput(event.target.value)}
                  placeholder="Access key"
                  className="min-h-[52px] rounded-md border border-border bg-surface-raised px-4 font-mono text-[0.9rem] text-foreground placeholder:text-muted-foreground/70 transition-colors duration-200 focus:border-signal/60 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isLoading || keyInput.trim().length === 0}
                  className="inline-flex min-h-[52px] items-center justify-center gap-2 rounded-md bg-signal px-6 font-mono text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary-foreground transition-all duration-300 hover:shadow-glow active:scale-[0.98] disabled:opacity-60"
                >
                  {isLoading ? <Loader2 size={15} className="animate-spin" /> : null}
                  Unlock
                </button>
              </form>
            </div>
          </Reveal>
        ) : !storageReady ? (
          <Reveal>
            <div className="surface-card corner-ticks mx-auto max-w-2xl p-7 sm:p-9">
              <span className="inline-flex h-11 w-11 items-center justify-center rounded-md border border-ember/40 bg-ember/10 text-ember">
                <AlertTriangle size={20} />
              </span>
              <h2 className="display-title mt-5 text-2xl">Storage isn&apos;t connected yet</h2>
              <p className="mt-3 text-[0.92rem] leading-relaxed text-muted-foreground">
                The library needs a Cloudflare R2 bucket before it can store files. Once the four storage credentials
                are saved to the project, this page turns on automatically — no redeploy needed.
              </p>
              <ul className="mt-5 space-y-2 font-mono text-[0.72rem] uppercase tracking-[0.14em] text-muted-foreground">
                <li>R2_ACCOUNT_ID</li>
                <li>R2_ACCESS_KEY_ID</li>
                <li>R2_SECRET_ACCESS_KEY</li>
                <li>R2_BUCKET</li>
              </ul>
              <button
                type="button"
                onClick={() => void load(adminKey)}
                className="mt-7 inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border bg-surface-raised px-4 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-signal/50 hover:text-foreground"
              >
                <RefreshCw size={14} />
                Check again
              </button>
            </div>
          </Reveal>
        ) : (
          <>
            {/* Toolbar */}
            <Reveal>
              <div className="flex flex-wrap items-end justify-between gap-5">
                <div className="flex items-center gap-4">
                  <span className="inline-flex h-12 w-12 items-center justify-center rounded-md border border-signal/40 bg-signal/10 text-signal">
                    <FilmIcon size={22} />
                  </span>
                  <div>
                    <p className="display-title text-3xl sm:text-4xl">{media.length}</p>
                    <p className="font-mono text-[0.66rem] uppercase tracking-[0.18em] text-muted-foreground">
                      {media.length === 1 ? "File stored" : "Files stored"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2.5">
                  <button
                    type="button"
                    onClick={() => void load(adminKey)}
                    disabled={isLoading}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border bg-surface-raised px-4 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-signal/50 hover:text-foreground disabled:opacity-60"
                  >
                    {isLoading ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
                    Refresh
                  </button>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-md bg-signal px-5 font-mono text-[0.66rem] font-semibold uppercase tracking-[0.16em] text-primary-foreground transition-all duration-300 hover:shadow-glow active:scale-[0.98]"
                  >
                    <Upload size={14} />
                    Upload media
                  </button>
                  <button
                    type="button"
                    onClick={signOut}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-md border border-border bg-surface-raised px-4 font-mono text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:border-ember/50 hover:text-ember"
                  >
                    <LogOut size={14} />
                    Lock
                  </button>
                </div>
              </div>
            </Reveal>

            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPT_ATTRIBUTE}
              multiple
              onChange={onPick}
              className="hidden"
            />

            {/* Folders */}
            <Reveal delay={50}>
              <div className="mt-9">
                <p className="font-mono text-[0.62rem] uppercase tracking-[0.2em] text-signal">Games</p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <button type="button" onClick={() => setActiveFolder("all")} className={chipClass(activeFolder === "all")}>
                    All media
                  </button>
                  {folders.map((folder) => {
                    const count = media.filter((item) => item.folder === folder.slug).length;
                    return (
                      <span key={folder.slug} className="group relative inline-flex">
                        <button
                          type="button"
                          onClick={() => setActiveFolder(folder.slug)}
                          className={chipClass(activeFolder === folder.slug)}
                        >
                          {folder.label}
                          <span className="text-muted-foreground/70">{count}</span>
                        </button>
                        {count === 0 ? (
                          <button
                            type="button"
                            onClick={() => void onDeleteFolder(folder)}
                            aria-label={`Delete ${folder.label} folder`}
                            className="ml-1 inline-flex h-[38px] w-8 items-center justify-center rounded-md border border-transparent text-muted-foreground/60 opacity-0 transition-all hover:border-ember/40 hover:text-ember focus-visible:opacity-100 group-hover:opacity-100"
                          >
                            <Trash2 size={13} />
                          </button>
                        ) : null}
                      </span>
                    );
                  })}

                  <form onSubmit={(event) => void onAddFolder(event)} className="flex items-center gap-2">
                    <label htmlFor="new-folder" className="sr-only">
                      New game folder
                    </label>
                    <input
                      id="new-folder"
                      value={newFolder}
                      onChange={(event) => setNewFolder(event.target.value)}
                      placeholder="New game…"
                      className="min-h-[38px] w-36 rounded-md border border-border bg-surface-raised px-3 font-mono text-[0.68rem] text-foreground placeholder:text-muted-foreground/60 focus:border-signal/60 focus:outline-none"
                    />
                    <button
                      type="submit"
                      disabled={newFolder.trim().length === 0}
                      className="inline-flex min-h-[38px] items-center gap-2 rounded-md border border-border bg-surface-raised px-3 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:border-signal/50 hover:text-signal disabled:opacity-50"
                    >
                      <FolderPlus size={13} />
                      Add
                    </button>
                  </form>
                </div>
              </div>
            </Reveal>

            {/* Drop zone */}
            <Reveal delay={80}>
              <div
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                className={`mt-6 rounded-lg border-2 border-dashed p-8 text-center transition-colors ${
                  isDragging ? "border-signal/70 bg-signal/5" : "border-border bg-surface/40"
                }`}
              >
                <Upload size={22} className={isDragging ? "mx-auto text-signal" : "mx-auto text-muted-foreground"} />
                <p className="mt-3 text-[0.95rem] text-foreground">
                  Drop MP4, MOV, JPEG or PNG files here
                </p>
                <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                  <label htmlFor="upload-folder" className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                    Upload into
                  </label>
                  <select
                    id="upload-folder"
                    value={targetFolder}
                    onChange={(event) => setUploadFolder(event.target.value)}
                    className="min-h-[38px] rounded-md border border-border bg-surface-raised px-3 font-mono text-[0.68rem] text-foreground focus:border-signal/60 focus:outline-none"
                  >
                    {folders.length === 0 ? <option value="">Create a game folder first</option> : null}
                    {folders.map((folder) => (
                      <option key={folder.slug} value={folder.slug}>
                        {folder.label}
                      </option>
                    ))}
                  </select>
                </div>
                <p className="mt-3 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground/80">
                  Video up to 512MB · Images up to 32MB
                </p>
              </div>
            </Reveal>

            {/* Upload progress */}
            {jobs.length > 0 ? (
              <div className="mt-5 space-y-2.5">
                {jobs.map((job) => (
                  <div key={job.id} className="surface-card p-4">
                    <div className="flex items-center justify-between gap-4">
                      <p className="truncate text-[0.88rem] text-foreground">{job.name}</p>
                      <span className="shrink-0 font-mono text-[0.64rem] uppercase tracking-[0.14em] text-muted-foreground">
                        {job.status === "error"
                          ? "Failed"
                          : job.status === "done"
                            ? "Done"
                            : `${Math.round(job.progress * 100)}%`}
                      </span>
                    </div>
                    <div className="mt-2.5 h-1.5 overflow-hidden rounded-full bg-surface-raised">
                      <div
                        className={`h-full rounded-full transition-[width] duration-200 ${
                          job.status === "error" ? "bg-ember" : "bg-signal"
                        }`}
                        style={{ width: `${Math.max(job.progress * 100, job.status === "error" ? 100 : 2)}%` }}
                      />
                    </div>
                    {job.message ? <p className="mt-2 text-[0.8rem] text-ember">{job.message}</p> : null}
                  </div>
                ))}
              </div>
            ) : null}

            {/* Filters + sort */}
            <Reveal delay={100}>
              <div className="mt-10 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap gap-2">
                  {(["all", "video", "image"] as KindFilter[]).map((kind) => (
                    <button key={kind} type="button" onClick={() => setKindFilter(kind)} className={chipClass(kindFilter === kind)}>
                      {kind === "all" ? "All media" : kind === "video" ? "Videos" : "Images"}
                    </button>
                  ))}
                </div>

                <div className="flex items-center gap-2">
                  <label htmlFor="sort" className="font-mono text-[0.62rem] uppercase tracking-[0.16em] text-muted-foreground">
                    Sort
                  </label>
                  <select
                    id="sort"
                    value={sortMode}
                    onChange={(event) => setSortMode(event.target.value as SortMode)}
                    className="min-h-[38px] rounded-md border border-border bg-surface-raised px-3 font-mono text-[0.68rem] text-foreground focus:border-signal/60 focus:outline-none"
                  >
                    <option value="newest">Newest</option>
                    <option value="oldest">Oldest</option>
                    <option value="filename">Filename</option>
                    <option value="size">File size</option>
                  </select>
                </div>
              </div>
            </Reveal>

            {/* Grid */}
            {visible.length === 0 ? (
              <Reveal delay={120}>
                <div className="surface-card mt-8 p-10 text-center">
                  <p className="font-mono text-sm uppercase tracking-[0.16em] text-muted-foreground">
                    {media.length === 0 ? "Nothing uploaded yet" : "Nothing matches these filters"}
                  </p>
                  <p className="mt-3 text-[0.92rem] text-muted-foreground">
                    {media.length === 0
                      ? "Drop a promo video above to get its public link."
                      : "Try a different game or media type."}
                  </p>
                </div>
              </Reveal>
            ) : (
              <div className="mt-8 grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {visible.map((item) => {
                  const kind = kindForContentType(item.content_type);
                  const isExpanded = expandedId === item.id;
                  const compat = compatibilityFor(item);

                  return (
                    <div key={item.id} className="surface-card overflow-hidden">
                      <div className="relative aspect-video bg-surface-raised">
                        {kind === "video" ? (
                          <video
                            src={item.url}
                            controls
                            preload="metadata"
                            className="h-full w-full object-contain"
                          />
                        ) : (
                          <img
                            src={item.url}
                            alt={item.filename}
                            loading="lazy"
                            decoding="async"
                            className="h-full w-full object-contain"
                          />
                        )}
                        <span className="pointer-events-none absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-full border border-border bg-background/85 px-2.5 py-1 font-mono text-[0.58rem] uppercase tracking-[0.14em] text-muted-foreground backdrop-blur-sm">
                          {kind === "video" ? <FilmIcon size={11} /> : <ImageIcon size={11} />}
                          {item.folder}
                        </span>
                      </div>

                      <div className="p-5">
                        <p className="truncate text-[0.95rem] font-medium text-foreground" title={item.filename}>
                          {item.filename}
                        </p>
                        <p className="mt-1.5 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground">
                          {item.content_type.split("/")[1]?.toUpperCase()} · {formatBytes(item.size)}
                          {item.width && item.height ? ` · ${item.width}×${item.height}` : ""}
                          {item.duration ? ` · ${formatDuration(item.duration)}` : ""}
                        </p>
                        <p className="mt-1 font-mono text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground/70">
                          {formatDate(item.created_at)}
                        </p>

                        <p className="mt-3 break-all rounded-md border border-border/70 bg-surface-raised px-3 py-2 font-mono text-[0.64rem] text-muted-foreground">
                          {item.url}
                        </p>

                        <div className="mt-3 flex flex-wrap gap-2">
                          <button
                            type="button"
                            onClick={() => void onCopy(item)}
                            className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-2 rounded-md bg-signal px-3 font-mono text-[0.62rem] font-semibold uppercase tracking-[0.14em] text-primary-foreground transition-all duration-300 hover:shadow-glow active:scale-[0.98]"
                          >
                            {copiedId === item.id ? <Check size={13} /> : <Copy size={13} />}
                            {copiedId === item.id ? "URL copied" : "Copy direct URL"}
                          </button>
                          <a
                            href={item.url}
                            target="_blank"
                            rel="noreferrer"
                            aria-label={`Preview ${item.filename}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-raised text-muted-foreground transition-colors hover:border-signal/50 hover:text-signal"
                          >
                            <ExternalLink size={14} />
                          </a>
                          <button
                            type="button"
                            onClick={() => void onRename(item)}
                            aria-label={`Rename ${item.filename}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-raised text-muted-foreground transition-colors hover:border-signal/50 hover:text-signal"
                          >
                            <Pencil size={14} />
                          </button>
                          <button
                            type="button"
                            onClick={() => void onDelete(item)}
                            aria-label={`Delete ${item.filename}`}
                            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-border bg-surface-raised text-muted-foreground transition-colors hover:border-ember/50 hover:text-ember"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>

                        <button
                          type="button"
                          onClick={() => setExpandedId(isExpanded ? "" : item.id)}
                          className="mt-4 w-full text-left font-mono text-[0.62rem] uppercase tracking-[0.18em] text-signal transition-colors hover:text-signal/80"
                        >
                          {isExpanded ? "− Social media" : "+ Social media"}
                        </button>

                        {isExpanded ? (
                          <div className="mt-3 space-y-3 border-t border-border/60 pt-3">
                            <dl className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono text-[0.62rem] uppercase tracking-[0.12em]">
                              <dt className="text-muted-foreground/70">Format</dt>
                              <dd className="text-foreground">{item.content_type}</dd>
                              <dt className="text-muted-foreground/70">Resolution</dt>
                              <dd className="text-foreground">
                                {item.width && item.height ? `${item.width}×${item.height}` : "Unknown"}
                              </dd>
                              <dt className="text-muted-foreground/70">Aspect</dt>
                              <dd className="text-foreground">{aspectLabel(item)}</dd>
                              <dt className="text-muted-foreground/70">Size</dt>
                              <dd className="text-foreground">{formatBytes(item.size)}</dd>
                              {item.duration ? (
                                <>
                                  <dt className="text-muted-foreground/70">Duration</dt>
                                  <dd className="text-foreground">{formatDuration(item.duration)}</dd>
                                </>
                              ) : null}
                            </dl>

                            <ul className="space-y-1.5">
                              {compat.map((result) => {
                                const { className, Icon } = verdictStyles[result.verdict];
                                return (
                                  <li key={result.platform} className="flex items-start gap-2">
                                    <Icon size={13} className={`mt-0.5 shrink-0 ${className}`} />
                                    <span className="text-[0.76rem] leading-relaxed text-muted-foreground">
                                      <span className="text-foreground">{result.platform}</span> — {result.note}
                                    </span>
                                  </li>
                                );
                              })}
                            </ul>
                          </div>
                        ) : null}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}
      </section>
    </>
  );
};

export default MediaLibrary;
