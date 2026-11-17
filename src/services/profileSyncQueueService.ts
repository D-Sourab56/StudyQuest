import type {
  StudySettings,
} from "./settingsService";

import {
  saveCloudProfile,
} from "./profileCloudService";

// =========================================
// TYPES
// =========================================

export interface PendingProfileChange {
  changeId: string;
  settings: StudySettings;
  queuedAt: string;
}

// =========================================
// STORAGE CONFIGURATION
// =========================================

const PENDING_KEY =
  "studyquest:profile-sync-pending:v1";

// =========================================
// RESOLVE ACCOUNT STORAGE KEY
// =========================================

function getPendingKey(
  userId: string
): string {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(userId)) {
    throw new Error(
      "Invalid StudyQuest account ID."
    );
  }

  return (
    `${PENDING_KEY}:account:` +
    userId.toLowerCase()
  );
}

// =========================================
// VALIDATION HELPERS
// =========================================

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isValidSettings(
  value: unknown
): value is StudySettings {
  if (!isRecord(value)) {
    return false;
  }

  return (
    typeof value.displayName === "string" &&
    value.displayName.trim().length <= 40 &&

    typeof value.dailyGoalMinutes === "number" &&
    Number.isInteger(value.dailyGoalMinutes) &&
    value.dailyGoalMinutes >= 1 &&
    value.dailyGoalMinutes <= 1440 &&

    (
      value.theme === "light" ||
      value.theme === "dark"
    )
  );
}

// =========================================
// READ PENDING PROFILE CHANGE
// =========================================

export function getPendingProfileChange(
  userId: string
): PendingProfileChange | null {
  const saved = localStorage.getItem(
    getPendingKey(userId)
  );

  if (saved === null) {
    return null;
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(saved);
  } catch {
    throw new Error(
      "Pending profile data is not valid JSON. Existing data was preserved."
    );
  }

  if (
    !isRecord(parsed) ||

    typeof parsed.changeId !== "string" ||
    !parsed.changeId ||

    typeof parsed.queuedAt !== "string" ||
    Number.isNaN(
      Date.parse(parsed.queuedAt)
    ) ||

    !isValidSettings(parsed.settings)
  ) {
    throw new Error(
      "Invalid pending profile change. Existing data was preserved."
    );
  }

  return {
    changeId: parsed.changeId,

    settings: {
      ...parsed.settings,
    },

    queuedAt: parsed.queuedAt,
  };
}

// =========================================
// QUEUE PROFILE CHANGE
// =========================================

export function queueProfileChange(
  settings: StudySettings,
  userId: string
): void {
  if (!isValidSettings(settings)) {
    throw new Error(
      "Invalid profile settings."
    );
  }

  const pending: PendingProfileChange = {
    changeId: crypto.randomUUID(),

    settings: {
      ...settings,
    },

    queuedAt: new Date().toISOString(),
  };

  const key = getPendingKey(userId);

  const serialized =
    JSON.stringify(pending);

  localStorage.setItem(
    key,
    serialized
  );

  // Confirm that the pending change
  // was actually saved.
  if (
    localStorage.getItem(key) !==
    serialized
  ) {
    throw new Error(
      "Could not save pending profile change."
    );
  }
}

// =========================================
// SEQUENTIAL CLOUD SYNCHRONIZATION
// =========================================

// Only one upload process per account
// can run in this browser tab at a time.

const activeFlushes =
  new Map<string, Promise<void>>();

// =========================================
// FLUSH PENDING PROFILE CHANGES
// =========================================

export function flushPendingProfileChange(
  userId: string
): Promise<void> {
  const key = getPendingKey(userId);

  // Check whether synchronization is
  // already running for this account.
  const existing = activeFlushes.get(key);

  if (existing) {
    return existing;
  }

  // =====================================
  // PROCESS PENDING CHANGES
  // =====================================

  const operation = (async () => {
    while (true) {
      const pending =
        getPendingProfileChange(userId);

      // Nothing left to synchronize.
      if (pending === null) {
        return;
      }

      // Upload the pending settings.
      //
      // If Supabase is unavailable,
      // this throws an error.
      //
      // The pending change remains
      // safely stored in localStorage.
      await saveCloudProfile(
        pending.settings,
        userId
      );

      // Check whether the settings
      // changed during the upload.
      const latest =
        getPendingProfileChange(userId);

      // Only remove the change if
      // it is still the same version
      // that was successfully uploaded.
      if (
        latest?.changeId ===
        pending.changeId
      ) {
        localStorage.removeItem(key);
      }

      // Continue the loop.
      //
      // If another change was saved
      // while uploading, it will be
      // processed next.
    }
  })();

  // Register the active operation.
  activeFlushes.set(key, operation);

  // =====================================
  // HANDLE OPERATION COMPLETION
  // =====================================

  const finish = (
    succeeded: boolean
  ): void => {
    // Don't interfere with another
    // operation registered afterward.
    if (
      activeFlushes.get(key) !==
      operation
    ) {
      return;
    }

    activeFlushes.delete(key);

    // ===================================
    // FAILED UPLOAD
    // ===================================

    // Do not retry immediately.
    //
    // The pending change is preserved
    // for the next save or startup.
    if (!succeeded) {
      return;
    }

    // ===================================
    // SUCCESSFUL UPLOAD
    // ===================================

    // Handle a new change that arrived
    // just as synchronization finished.
    try {
      const remaining =
        getPendingProfileChange(userId);

      if (remaining !== null) {
        void flushPendingProfileChange(
          userId
        ).catch((error) => {
          console.warn(
            "Profile synchronization will retry later:",
            error
          );
        });
      }
    } catch (error) {
      console.error(
        "Could not inspect pending profile changes:",
        error
      );
    }
  };

  // =====================================
  // REGISTER COMPLETION HANDLERS
  // =====================================

  void operation.then(
    () => finish(true),
    () => finish(false)
  );

  return operation;
}