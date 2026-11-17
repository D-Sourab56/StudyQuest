import { useEffect } from "react";

import {
  useStorageMode,
} from "../context/StorageModeContext";

import {
  flushPendingProfileChange,
} from "../services/profileSyncQueueService";

import {
  summarySyncQueueService,
} from "../services/summarySyncQueueService";

// =========================================
// AUTOMATIC CLOUD RECONNECTION
// =========================================

export function CloudReconnectSync() {
  const {
    mode,
    accountUserId,
    isSwitching,
  } = useStorageMode();

  const userId =
    mode === "private" && !isSwitching
      ? accountUserId
      : null;

  useEffect(() => {
    if (userId === null) {
      return;
    }

    const targetUserId = userId;

    let cancelled = false;
    let isRunning = false;

    // =====================================
    // RETRY PENDING CLOUD CHANGES
    // =====================================

    async function retryPendingChanges() {
      if (cancelled || isRunning) {
        return;
      }

      isRunning = true;

      try {
        const [
          profileResult,
          summaryResult,
        ] = await Promise.allSettled([
          flushPendingProfileChange(
            targetUserId
          ),

          summarySyncQueueService
            .processPendingOperations(
              targetUserId
            ),
        ]);

        if (cancelled) {
          return;
        }

        if (
          profileResult.status === "rejected"
        ) {
          console.warn(
            "Profile changes remain queued. " +
            "Synchronization will retry later.",
            profileResult.reason
          );
        }

        if (
          summaryResult.status === "rejected"
        ) {
          console.warn(
            "Summary changes remain queued. " +
            "Synchronization will retry later.",
            summaryResult.reason
          );
        }
      } finally {
        isRunning = false;
      }
    }

    // =====================================
    // SAFE RETRY REQUEST
    // =====================================

    function requestRetry() {
      void retryPendingChanges().catch(
        (error: unknown) => {
          if (!cancelled) {
            console.warn(
              "Cloud reconnection failed. " +
              "Pending data was preserved.",
              error
            );
          }
        }
      );
    }

    // =====================================
    // RETRY WHEN TAB BECOMES VISIBLE
    // =====================================

    function handleVisibilityChange() {
      if (
        document.visibilityState ===
        "visible"
      ) {
        requestRetry();
      }
    }

    // =====================================
    // REGISTER EVENT LISTENERS
    // =====================================

    window.addEventListener(
      "online",
      requestRetry
    );

    document.addEventListener(
      "visibilitychange",
      handleVisibilityChange
    );

    // Check pending changes when
    // the component first mounts.
    queueMicrotask(requestRetry);

    // =====================================
    // CLEANUP
    // =====================================

    return () => {
      cancelled = true;

      window.removeEventListener(
        "online",
        requestRetry
      );

      document.removeEventListener(
        "visibilitychange",
        handleVisibilityChange
      );
    };
  }, [userId]);

  return null;
}