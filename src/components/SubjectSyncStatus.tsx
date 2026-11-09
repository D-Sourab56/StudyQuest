
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  AlertTriangle,
  CheckCircle2,
  Cloud,
  CloudUpload,
  Loader2,
  RefreshCw,
} from "lucide-react";

import { useStorageMode } from "../context/StorageModeContext";

import {
  subjectSyncQueueService,
} from "../services/subjectSyncQueueService";

// =========================================
// TYPES
// =========================================

interface SyncStatus {
  userId: string | null;
  pendingCount: number | null;
  isSyncing: boolean;
  error: string | null;
}

// =========================================
// COMPONENT
// =========================================

export function SubjectSyncStatus() {
  const {
    mode,
    accountUserId,
  } = useStorageMode();

  const userId =
    mode === "private"
      ? accountUserId
      : null;

  const [status, setStatus] =
    useState<SyncStatus>({
      userId: null,
      pendingCount: null,
      isSyncing: false,
      error: null,
    });

  // Prevent duplicate sync operations for
  // the same account.
  const activeSyncRef =
    useRef<Set<string>>(new Set());

  // =========================================
  // REFRESH AND PROCESS PENDING OPERATIONS
  // =========================================

  const synchronize = useCallback(
    async (targetUserId: string) => {
      if (
        activeSyncRef.current.has(targetUserId)
      ) {
        return;
      }

      activeSyncRef.current.add(targetUserId);

      try {
        const pending =
          subjectSyncQueueService
            .getPendingOperations(targetUserId);

        setStatus({
          userId: targetUserId,
          pendingCount: pending.length,
          isSyncing: pending.length > 0,
          error: null,
        });

        if (pending.length > 0) {
          await subjectSyncQueueService
            .processPendingOperations(targetUserId);
        }

        const remaining =
          subjectSyncQueueService
            .getPendingOperations(targetUserId);

        setStatus((previous) => {
          if (
            previous.userId !== targetUserId
          ) {
            return previous;
          }

          return {
            userId: targetUserId,
            pendingCount: remaining.length,
            isSyncing: false,
            error: null,
          };
        });
      } catch (error) {
        console.error(
          "Subject synchronization failed:",
          error
        );

        setStatus((previous) => {
          if (
            previous.userId !== targetUserId
          ) {
            return previous;
          }

          return {
            ...previous,
            pendingCount: null,
            isSyncing: false,
            error:
              error instanceof Error
                ? error.message
                : "Unable to synchronize subjects.",
          };
        });
      } finally {
        activeSyncRef.current.delete(
          targetUserId
        );
      }
    },
    []
  );

  // =========================================
  // AUTOMATIC SYNCHRONIZATION
  // =========================================

  useEffect(() => {
    if (userId === null) {
      return;
    }

    let cancelled = false;

    function handleSync() {
      if (!cancelled) {
        void synchronize(userId!);
      }
    }

    // Start after the current effect finishes.
    queueMicrotask(handleSync);

    window.addEventListener(
      "online",
      handleSync
    );

    return () => {
      cancelled = true;

      window.removeEventListener(
        "online",
        handleSync
      );
    };
  }, [
    userId,
    synchronize,
  ]);

  // =========================================
  // ACCOUNT STATUS
  // =========================================

  if (userId === null) {
    return null;
  }

  const isCurrentAccount =
    status.userId === userId;

  const pendingCount = isCurrentAccount
    ? status.pendingCount
    : null;

  const isSyncing =
    isCurrentAccount && status.isSyncing;

  const error = isCurrentAccount
    ? status.error
    : null;

  // =========================================
  // STATUS MESSAGE
  // =========================================

  let statusText =
    "Checking subject synchronization...";

  if (error) {
    statusText =
      "Subject sync status unavailable";
  } else if (isSyncing) {
    statusText =
      "Synchronizing subjects...";
  } else if (pendingCount === 0) {
    statusText =
      "No pending subject changes";
  } else if (pendingCount !== null) {
    statusText =
      `${pendingCount} subject change${
        pendingCount === 1 ? "" : "s"
      } waiting to sync`;
  }

  // =========================================
  // RENDER
  // =========================================

  return (
    <div
      style={{
        padding: 18,
        background: "var(--glass)",
        border:
          "1px solid var(--glass-border)",
        borderRadius: 16,
      }}
    >
      {/* HEADER */}

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
          }}
        >
          <Cloud
            size={20}
            color="var(--accent-dark)"
            aria-hidden="true"
          />

          <strong
            style={{
              color: "var(--text-primary)",
              fontSize: 14,
            }}
          >
            Subject Cloud Sync
          </strong>
        </div>

        <button
          type="button"
          className="secondary-button"
          disabled={isSyncing}
          onClick={() => {
            void synchronize(userId);
          }}
          style={{
            minHeight: 35,
            padding: "0 12px",
            fontSize: 12,
          }}
        >
          {isSyncing ? (
            <Loader2 size={15} />
          ) : (
            <RefreshCw size={15} />
          )}

          {isSyncing
            ? "Syncing..."
            : "Sync Now"}
        </button>
      </div>

      {/* STATUS */}

      <div
        role="status"
        aria-live="polite"
        style={{
          display: "flex",
          alignItems: "center",
          gap: 9,
          marginTop: 16,
          color: error
            ? "var(--danger)"
            : "var(--text-secondary)",
          fontSize: 13,
        }}
      >
        {error ? (
          <AlertTriangle size={17} />
        ) : isSyncing ? (
          <CloudUpload size={17} />
        ) : pendingCount === 0 ? (
          <CheckCircle2 size={17} />
        ) : (
          <Cloud size={17} />
        )}

        <span>{statusText}</span>
      </div>

      {/* ERROR DETAILS */}

      {error && (
        <p
          role="alert"
          style={{
            margin: "12px 0 0",
            color: "var(--danger)",
            fontSize: 12,
            lineHeight: 1.6,
          }}
        >
          {error}
        </p>
      )}

      {/* INFORMATION */}

      <p
        style={{
          margin: "14px 0 0",
          color: "var(--text-muted)",
          fontSize: 11,
          lineHeight: 1.7,
        }}
      >
        This status covers subject changes
        queued for upload. Study sessions,
        summaries, and achievements are not
        synchronized by this component.
      </p>
    </div>
  );
}
