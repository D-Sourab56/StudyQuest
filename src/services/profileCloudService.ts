import type {
  StudySettings,
  StudyTheme,
} from "./settingsService";

import {
  requirePrivateAccount,
} from "./subjectCloudService";

// =========================================
// TYPES
// =========================================

export interface CloudProfileSnapshot {
  displayName: string | null;
  dailyGoalMinutes: number | null;
  theme: StudyTheme;
  updatedAt: string;
}

// =========================================
// VALIDATION
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

function parseCloudProfile(
  value: unknown
): CloudProfileSnapshot {
  if (!isRecord(value)) {
    throw new Error(
      "Invalid cloud profile response."
    );
  }

  const {
    display_name,
    daily_goal_minutes,
    theme,
    updated_at,
  } = value;

  if (
    display_name !== null &&
    (
      typeof display_name !== "string" ||
      display_name.trim().length > 40
    )
  ) {
    throw new Error(
      "Invalid cloud display name."
    );
  }

  if (
    daily_goal_minutes !== null &&
    (
      typeof daily_goal_minutes !== "number" ||
      !Number.isInteger(daily_goal_minutes) ||
      daily_goal_minutes < 1 ||
      daily_goal_minutes > 1440
    )
  ) {
    throw new Error(
      "Invalid cloud daily goal."
    );
  }

  if (
    theme !== "light" &&
    theme !== "dark"
  ) {
    throw new Error(
      "Invalid cloud theme."
    );
  }

  if (
    typeof updated_at !== "string" ||
    Number.isNaN(Date.parse(updated_at))
  ) {
    throw new Error(
      "Invalid cloud profile timestamp."
    );
  }

  return {
    displayName:
      typeof display_name === "string"
        ? display_name.trim()
        : null,

    dailyGoalMinutes:
      typeof daily_goal_minutes === "number"
        ? daily_goal_minutes
        : null,

    theme,
    updatedAt: updated_at,
  };
}

// =========================================
// VALIDATE LOCAL SETTINGS
// =========================================

function validateSettings(
  settings: StudySettings
): StudySettings {
  const displayName =
    settings.displayName.trim();

  if (
    displayName.length > 40 ||
    !Number.isInteger(
      settings.dailyGoalMinutes
    ) ||
    settings.dailyGoalMinutes < 1 ||
    settings.dailyGoalMinutes > 1440 ||
    (
      settings.theme !== "light" &&
      settings.theme !== "dark"
    )
  ) {
    throw new Error(
      "Invalid StudyQuest settings."
    );
  }

  return {
    displayName,
    dailyGoalMinutes:
      settings.dailyGoalMinutes,
    theme: settings.theme,
  };
}

// =========================================
// FETCH CLOUD PROFILE
// =========================================

export async function fetchCloudProfile(
  expectedUserId: string
): Promise<CloudProfileSnapshot | null> {
  const { userId, client } =
    await requirePrivateAccount(
      expectedUserId
    );

  const { data, error } = await client
    .from("profiles")
    .select(
      "display_name, daily_goal_minutes, theme, updated_at"
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (data === null) {
    return null;
  }

  const response: unknown = data;

  return parseCloudProfile(response);
}

// =========================================
// SAVE CLOUD PROFILE
// =========================================

export async function saveCloudProfile(
  settings: StudySettings,
  expectedUserId: string
): Promise<CloudProfileSnapshot> {
  const validatedSettings =
    validateSettings(settings);

  const { userId, client } =
    await requirePrivateAccount(
      expectedUserId
    );

  const { data, error } = await client
    .from("profiles")
    .upsert(
      {
        user_id: userId,
        display_name:
          validatedSettings.displayName,
        daily_goal_minutes:
          validatedSettings.dailyGoalMinutes,
        theme:
          validatedSettings.theme,
      },
      {
        onConflict: "user_id",
      }
    )
    .select(
      "display_name, daily_goal_minutes, theme, updated_at"
    )
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const response: unknown = data;

  return parseCloudProfile(response);
}