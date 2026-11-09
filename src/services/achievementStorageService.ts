
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

  // Never replace an existing unlock date.
  if (
    existingUnlocks.some(
      (unlock) =>
        unlock.achievementId === id
    )
  ) {
    return true;
  }

  const updatedUnlocks = [
    ...existingUnlocks,
    {
      achievementId: id,
      unlockedAt: new Date().toISOString(),
    },
  ];

  try {
    const key = getStorageKey();

    localStorage.setItem(
      key,
      JSON.stringify(updatedUnlocks)
    );

    return localStorage.getItem(key) !== null &&
      getUnlocks().some(
        (unlock) =>
          unlock.achievementId === id
      );
  } catch (error) {
    console.error(
      "Could not save achievement unlock:",
      error
    );

    return false;
  }
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
  isUnlocked,
};