
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

const SETTINGS_KEY = "studyquest:settings:v1";

type SettingsScope = {
  type: "account";
  userId: string;
};

let currentScope: SettingsScope | null = null;

// =========================================
// SCOPE MANAGEMENT
// =========================================

function useAccountSettings(userId: string): void {
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
// RESOLVE STORAGE KEY
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
  return value === "light" || value === "dark";
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

    const parsed: unknown = JSON.parse(saved);

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
// SAVE SETTINGS
// =========================================

function saveSettings(
  settings: StudySettings
): boolean {
  const displayName =
    settings.displayName.trim();

  if (
    displayName.length >
      SETTINGS_LIMITS.displayNameLength ||
    !isValidDailyGoal(
      settings.dailyGoalMinutes
    ) ||
    !isStudyTheme(settings.theme)
  ) {
    return false;
  }

  const nextSettings: StudySettings = {
    displayName,
    dailyGoalMinutes:
      settings.dailyGoalMinutes,
    theme: settings.theme,
  };

  try {
    const serialized =
      JSON.stringify(nextSettings);

    const storageKey =
      getSettingsKey();

    localStorage.setItem(
      storageKey,
      serialized
    );

    return (
      localStorage.getItem(storageKey) ===
      serialized
    );
  } catch (error) {
    console.error(
      "Could not save study settings:",
      error
    );

    return false;
  }
}

// =========================================
// EXPORT
// =========================================

export const settingsService = {
  // Storage scope
  useAccountSettings,

  // Settings
  getSettings,
  saveSettings,
};
