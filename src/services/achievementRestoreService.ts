import {
  achievementStorageService,
} from "./achievementStorageService";

import {
  fetchCloudAchievementUnlocks,
  uploadCloudAchievementUnlocks,
} from "./achievementCloudService";

// =========================================
// RESTORE PERMANENT ACHIEVEMENTS
// =========================================

export async function restoreAccountAchievements(
  userId: string,
  isCancelled: () => boolean
): Promise<void> {
  // Fetch existing cloud unlocks.
  const cloudUnlocks =
    await fetchCloudAchievementUnlocks(userId);

  if (isCancelled()) {
    return;
  }

  // Read original local unlocks.
  const localUnlocks =
    achievementStorageService.getUnlocks();

  // =====================================
  // PRESERVE ORIGINAL ACHIEVEMENT DATA
  // =====================================

  const accountId = userId.toLowerCase();

  const storageKey =
    "studyquest:achievement-unlocks:v1:account:" +
    accountId;

  const backupKey =
    "studyquest:achievement-unlocks-before-cloud-sync:v1:" +
    accountId;

  const originalData =
    localStorage.getItem(storageKey);

  // Preserve the exact original value,
  // including its unlock timestamps.
  if (
    originalData !== null &&
    localStorage.getItem(backupKey) === null
  ) {
    localStorage.setItem(
      backupKey,
      JSON.stringify({
        savedAt: new Date().toISOString(),
        rawValue: originalData,
      })
    );
  }

  if (isCancelled()) {
    return;
  }

  // =====================================
  // UPLOAD MISSING LOCAL UNLOCKS
  // =====================================

  const cloudIds = new Set(
    cloudUnlocks.map(
      (unlock) => unlock.achievementId
    )
  );

  const missingUnlocks =
    localUnlocks.filter(
      (unlock) =>
        !cloudIds.has(unlock.achievementId)
    );

  if (missingUnlocks.length > 0) {
    await uploadCloudAchievementUnlocks(
      missingUnlocks,
      userId
    );
  }

  if (isCancelled()) {
    return;
  }

  // =====================================
  // FETCH CONFIRMED CLOUD STATE
  // =====================================

  const latestCloudUnlocks =
    missingUnlocks.length > 0
      ? await fetchCloudAchievementUnlocks(
          userId
        )
      : cloudUnlocks;

  if (isCancelled()) {
    return;
  }

  // =====================================
  // MERGE WITHOUT REMOVING ACHIEVEMENTS
  // =====================================

  achievementStorageService.mergeCloudUnlocks(
    latestCloudUnlocks
  );
}