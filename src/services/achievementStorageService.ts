import {
  uploadCloudAchievementUnlocks,
} from "./achievementCloudService";
// =========================================
// TYPES
// =========================================

export interface AchievementUnlock {
  achievementId: string;
  unlockedAt: string;
}

type AchievementScope = {
  type: "account";
  userId: string;
};

// =========================================
// STORAGE CONFIGURATION
// =========================================

const ACHIEVEMENTS_KEY =
  "studyquest:achievement-unlocks:v1";

let currentScope: AchievementScope | null = null;
// =========================================
// STORAGE SCOPE
// =========================================


function useAccountAchievements(
  userId: string
): void {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(userId)) {
    throw new Error(
      "Invalid StudyQuest account ID."
    );
  }

  currentScope = {
    type: "account",
    userId: userId.toLowerCase(),
  };
}

function getStorageKey(): string {
  if (currentScope === null) {
    throw new Error(
      "StudyQuest account achievement storage is not active."
    );
  }

  return (
    `${ACHIEVEMENTS_KEY}:account:` +
    currentScope.userId
  );
}

// =========================================
// READ UNLOCKS
// =========================================

function getUnlocks(): AchievementUnlock[] {
  try {
    const saved = localStorage.getItem(
      getStorageKey()
    );

    if (!saved) {
      return [];
    }

    const parsed: unknown = JSON.parse(saved);

    if (!Array.isArray(parsed)) {
      return [];
    }

    const uniqueUnlocks =
      new Map<string, AchievementUnlock>();

    for (const item of parsed) {
      if (
        !item ||
        typeof item !== "object"
      ) {
        continue;
      }

      const record = item as Partial<AchievementUnlock>;

      if (
        typeof record.achievementId !== "string" ||
        !record.achievementId.trim() ||
        typeof record.unlockedAt !== "string" ||
        Number.isNaN(
          Date.parse(record.unlockedAt)
        )
      ) {
        continue;
      }

      if (!uniqueUnlocks.has(record.achievementId)) {
        uniqueUnlocks.set(
          record.achievementId,
          {
            achievementId: record.achievementId,
            unlockedAt: record.unlockedAt,
          }
        );
      }
    }

    return Array.from(uniqueUnlocks.values());
  } catch (error) {
    console.error(
      "Could not load achievement unlocks:",
      error
    );

    return [];
  }
}

// =========================================
// SAVE NEW UNLOCK
// =========================================

function unlockAchievement(
  achievementId: string
): boolean {
  const id = achievementId.trim();

  if (!id) {
    return false;
  }

  const existingUnlocks = getUnlocks();

  // Never replace an existing
  // achievement's original unlock date.
  if (
    existingUnlocks.some(
      (unlock) =>
        unlock.achievementId === id
    )
  ) {
    return true;
  }

  const newUnlock: AchievementUnlock = {
    achievementId: id,
    unlockedAt: new Date().toISOString(),
  };

  const updatedUnlocks = [
    ...existingUnlocks,
    newUnlock,
  ];

  try {
    const key = getStorageKey();

    // Always save locally first.
    localStorage.setItem(
      key,
      JSON.stringify(updatedUnlocks)
    );

    const saved =
      localStorage.getItem(key) !== null &&
      getUnlocks().some(
        (unlock) =>
          unlock.achievementId === id
      );

    if (!saved) {
      return false;
    }

    // Upload to the authenticated account.
    const accountId = currentScope?.userId;

    if (accountId) {
      void uploadCloudAchievementUnlocks(
        [newUnlock],
        accountId
      ).catch((error: unknown) => {
        console.warn(
          "Could not upload achievement. " +
          "The permanent local unlock was preserved. " +
          "Synchronization will retry on account reload.",
          error
        );
      });
    }

    return true;
  } catch (error) {
    console.error(
      "Could not save achievement unlock:",
      error
    );

    return false;
  }
}
// =========================================
// MERGE CLOUD ACHIEVEMENT UNLOCKS
// =========================================

function mergeCloudUnlocks(
  cloudUnlocks: AchievementUnlock[]
): void {
  if (cloudUnlocks.length === 0) {
    return;
  }

  const key = getStorageKey();

  // Refuse to overwrite malformed local
  // achievement data.
  const raw = localStorage.getItem(key);

  const parsed: unknown =
    raw === null
      ? []
      : JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error(
      "Invalid local achievement storage. " +
      "Existing data was preserved."
    );
  }

  const localUnlocks = getUnlocks();

  // If normalization discarded records,
  // preserve the original data for review.
  if (
    parsed.length !== localUnlocks.length
  ) {
    throw new Error(
      "Local achievement records require review. " +
      "Existing data was preserved."
    );
  }

  const merged = new Map<
    string,
    AchievementUnlock
  >();

  for (const unlock of localUnlocks) {
    merged.set(
      unlock.achievementId,
      unlock
    );
  }

  for (const unlock of cloudUnlocks) {
    if (
      !unlock ||
      typeof unlock.achievementId !==
        "string" ||
      !unlock.achievementId.trim() ||
      typeof unlock.unlockedAt !==
        "string" ||
      Number.isNaN(
        Date.parse(unlock.unlockedAt)
      )
    ) {
      throw new Error(
        "Invalid cloud achievement record."
      );
    }

    const existing =
      merged.get(unlock.achievementId);

    // Add missing achievements.
    // If both devices have the same unlock,
    // preserve the earliest earned date.
    if (
      !existing ||
      Date.parse(unlock.unlockedAt) <
        Date.parse(existing.unlockedAt)
    ) {
      merged.set(
        unlock.achievementId,
        {
          achievementId:
            unlock.achievementId,
          unlockedAt:
            unlock.unlockedAt,
        }
      );
    }
  }

  const restoredUnlocks =
    Array.from(merged.values());

  if (
    JSON.stringify(localUnlocks) ===
    JSON.stringify(restoredUnlocks)
  ) {
    return;
  }

  localStorage.setItem(
    key,
    JSON.stringify(restoredUnlocks)
  );
}
// =========================================
// CHECK UNLOCK STATUS
// =========================================

function isUnlocked(
  achievementId: string
): boolean {
  return getUnlocks().some(
    (unlock) =>
      unlock.achievementId === achievementId
  );
}

// =========================================
// EXPORT SERVICE
// =========================================

export const achievementStorageService = {
  useAccountAchievements,
  getUnlocks,
  unlockAchievement,
  mergeCloudUnlocks,
  isUnlocked,
};