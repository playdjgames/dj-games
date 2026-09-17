import { FileClock, RefreshCw } from "lucide-react";

import { cn } from "@/lib/utils";

interface LiveSyncNoteProps {
  isSyncing: boolean;
  className?: string;
}

interface PrereleaseSyncNoteProps {
  className?: string;
}

/**
 * Small reassurance line telling visitors the app list is pulled live from the
 * App Store rather than hand-maintained.
 */
export const LiveSyncNote = ({ isSyncing, className }: LiveSyncNoteProps) => (
  <p
    className={cn(
      "inline-flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground",
      className,
    )}
  >
    <RefreshCw
      size={12}
      aria-hidden="true"
      className={cn("text-signal", isSyncing ? "animate-spin" : undefined)}
    />
    {isSyncing ? "Checking the App Store…" : "Synced live from the App Store"}
  </p>
);

/**
 * Counterpart for apps that are not published yet. Their details come from App
 * Store Connect, which no public API exposes, so this says so plainly instead of
 * implying the App Store is being polled.
 */
export const PrereleaseSyncNote = ({ className }: PrereleaseSyncNoteProps) => (
  <p
    className={cn(
      "inline-flex items-center gap-2 font-mono text-[0.62rem] uppercase tracking-[0.18em] text-muted-foreground",
      className,
    )}
  >
    <FileClock size={12} aria-hidden="true" className="text-ember" />
    Pre-release details from App Store Connect
  </p>
);
