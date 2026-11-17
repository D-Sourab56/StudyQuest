import {
  queueProfileChange,
  flushPendingProfileChange,
} from "./profileSyncQueueService";

// =========================================
// TYPES
// =========================================

export type StudyTheme = "light" | "dark";

export interface StudySettings {
  displayName: string;
  dailyGoalMinutes: number;
  theme: StudyTheme;
}

// =========================================
// DEFAULT SETTINGS
// =========================================

export const DEFAULT_SETTINGS: StudySettings = {
  displayName: "",
  dailyGoalMinutes: 30,
  theme: "light",
};

// =========================================
// SETTINGS LIMITS
// =========================================

export const SETTINGS_LIMITS = {
  displayNameLength: 40,
  minimumDailyGoal: 1,
  maximumDailyGoal: 1440,
} as const;

// =========================================
// STORAGE CONFIGURATION
// =========================================

const SETTINGS_KEY =
  "studyquest:settings:v1";

type SettingsScope = {
  type: "account";
  userId: string;
};

let currentScope: SettingsScope | null = null;

// =========================================
// SCOPE MANAGEMENT
// =========================================

function useAccountSettings(
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

// =========================================
// STORAGE KEY
// =========================================

function getSettingsKey(): string {
  if (currentScope === null) {
    throw new Error(
      "StudyQuest account settings storage is not active."
    );
  }

  return (
    `${SETTINGS_KEY}:account:` +
    currentScope.userId
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

function isValidDailyGoal(
  value: unknown
): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= SETTINGS_LIMITS.minimumDailyGoal &&
    value <= SETTINGS_LIMITS.maximumDailyGoal
  );
}

function isStudyTheme(
  value: unknown
): value is StudyTheme {
  return (
    value === "light" ||
    value === "dark"
  );
}

// =========================================
// NORMALIZE SETTINGS
// =========================================

function normalizeSettings(
  settings: StudySettings
): StudySettings | null {
  if (
    typeof settings.displayName !== "string" ||
    !isValidDailyGoal(
      settings.dailyGoalMinutes
    ) ||
    !isStudyTheme(settings.theme)
  ) {
    return null;
  }

  const displayName =
    settings.displayName.trim();

  if (
    displayName.length >
    SETTINGS_LIMITS.displayNameLength
  ) {
    return null;
  }

  return {
    displayName,
    dailyGoalMinutes:
      settings.dailyGoalMinutes,
    theme: settings.theme,
  };
}

// =========================================
// GET SETTINGS
// =========================================

function getSettings(): StudySettings {
  try {
    const saved = localStorage.getItem(
      getSettingsKey()
    );

    if (!saved) {
      return { ...DEFAULT_SETTINGS };
    }

    const parsed: unknown =
      JSON.parse(saved);

    if (!isRecord(parsed)) {
      return { ...DEFAULT_SETTINGS };
    }

    return {
      displayName:
        typeof parsed.displayName === "string"
          ? parsed.displayName
              .trim()
              .slice(
                0,
                SETTINGS_LIMITS.displayNameLength
              )
          : DEFAULT_SETTINGS.displayName,

      dailyGoalMinutes: isValidDailyGoal(
        parsed.dailyGoalMinutes
      )
        ? parsed.dailyGoalMinutes
        : DEFAULT_SETTINGS.dailyGoalMinutes,

      theme: isStudyTheme(parsed.theme)
        ? parsed.theme
        : DEFAULT_SETTINGS.theme,
    };
  } catch (error) {
    console.error(
      "Could not load study settings:",
      error
    );

    return { ...DEFAULT_SETTINGS };
  }
}

// =========================================
// WRITE SETTINGS LOCALLY
// =========================================

function writeLocalSettings(
  settings: StudySettings
): boolean {
  try {
    const key = getSettingsKey();
    const serialized =
      JSON.stringify(settings);

    localStorage.setItem(
      key,
      serialized
    );

    return (
      localStorage.getItem(key) ===
      serialized
    );
  } catch (error) {
    console.error(
      "Could not write local settings:",
      error
    );

    return false;
  }
}

// =========================================
// SAVE USER SETTINGS
// =========================================

function saveSettings(
  settings: StudySettings
): boolean {
  const nextSettings =
    normalizeSettings(settings);

  if (nextSettings === null) {
    return false;
  }

  try {
    const key = getSettingsKey();

    if (currentScope === null) {
      return false;
    }

    const userId =
      currentScope.userId;

    // Keep the previous value so it
    // can be restored if queueing fails.
    const previousValue =
      localStorage.getItem(key);

    // Save locally first.
    if (!writeLocalSettings(nextSettings)) {
      return false;
    }

    // Record the change for reliable
    // synchronization with Supabase.
    try {
      queueProfileChange(
        nextSettings,
        userId
      );
    } catch (error) {
      // The cloud queue was not saved.
      // Restore the previous local value.
      try {
        if (previousValue === null) {
          localStorage.removeItem(key);
        } else {
          localStorage.setItem(
            key,
            previousValue
          );
        }
      } catch (rollbackError) {
        console.error(
          "Could not restore previous settings:",
          rollbackError
        );
      }

      console.error(
        "Could not queue profile settings:",
        error
      );

      return false;
    }

    // Attempt cloud synchronization.
    //
    // A network failure must not
    // cause the local save to fail.
    void flushPendingProfileChange(
      userId
    ).catch((error) => {
      console.warn(
        "Settings saved locally. Cloud synchronization will retry later:",
        error
      );
    });

    return true;
  } catch (error) {
    console.error(
      "Could not save study settings:",
      error
    );

    return false;
  }
}

// =========================================
// SAVE RESTORED CLOUD SETTINGS
// =========================================

// Used by the cloud restoration service.
//
// IMPORTANT:
// This must not create another cloud
// upload, because these settings have
// already come from Supabase.

function saveRestoredSettings(
  settings: StudySettings
): boolean {
  const nextSettings =
    normalizeSettings(settings);

  if (nextSettings === null) {
    return false;
  }

  return writeLocalSettings(
    nextSettings
  );
}

// =========================================
// EXPORT SERVICE
// =========================================

export const settingsService = {
  // Account scope
  useAccountSettings,

  // Settings
  getSettings,
  saveSettings,

  // Cloud restoration
  saveRestoredSettings,
};