import type {
  AchievementUnlock,
} from "./achievementStorageService";

import {
  requirePrivateAccount,
} from "./subjectCloudService";

// =========================================
// TYPES
// =========================================

interface CloudAchievementRow {
  achievement_id: string;
  unlocked_at: string;
}

const PAGE_SIZE = 500;
const UPLOAD_BATCH_SIZE = 100;

// =========================================
// FETCH CLOUD ACHIEVEMENTS
// =========================================

export async function fetchCloudAchievementUnlocks(
  expectedUserId: string
): Promise<AchievementUnlock[]> {
  const { userId, client } =
    await requirePrivateAccount(expectedUserId);

  const rows: CloudAchievementRow[] = [];

  for (
    let from = 0;
    ;
    from += PAGE_SIZE
  ) {
    const { data, error } = await client
      .from("achievement_unlocks")
      .select(
        "achievement_id, unlocked_at"
      )
      .eq("user_id", userId)
      .order("unlocked_at", {
        ascending: true,
      })
      .order("achievement_id", {
        ascending: true,
      })
      .range(
        from,
        from + PAGE_SIZE - 1
      );

    if (error) {
      throw new Error(error.message);
    }

    const batch =
      (data ?? []) as CloudAchievementRow[];

    rows.push(...batch);

    if (batch.length < PAGE_SIZE) {
      break;
    }
  }

  return rows.map((row) => ({
    achievementId: row.achievement_id,
    unlockedAt: row.unlocked_at,
  }));
}

// =========================================
// UPLOAD PERMANENT ACHIEVEMENTS
// =========================================

export async function uploadCloudAchievementUnlocks(
  unlocks: AchievementUnlock[],
  expectedUserId: string
): Promise<void> {
  if (unlocks.length === 0) {
    return;
  }

  const { userId, client } =
    await requirePrivateAccount(expectedUserId);

  for (
    let start = 0;
    start < unlocks.length;
    start += UPLOAD_BATCH_SIZE
  ) {
    const batch = unlocks
      .slice(
        start,
        start + UPLOAD_BATCH_SIZE
      )
      .map((unlock) => {
        if (
          !unlock.achievementId.trim() ||
          Number.isNaN(
            Date.parse(unlock.unlockedAt)
          )
        ) {
          throw new Error(
            "Invalid achievement unlock."
          );
        }

        return {
          user_id: userId,
          achievement_id:
            unlock.achievementId,
          unlocked_at:
            unlock.unlockedAt,
        };
      });

    // Ignore existing records instead of
    // overwriting their original dates.
    const { error } = await client
      .from("achievement_unlocks")
      .upsert(batch, {
        onConflict:
          "user_id,achievement_id",
        ignoreDuplicates: true,
      });

    if (error) {
      throw new Error(error.message);
    }
  }
}