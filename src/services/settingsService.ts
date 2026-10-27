export type StudyTheme = "light" | "dark";

export interface StudySettings {
  displayName: string;
  dailyGoalMinutes: number;
  theme: StudyTheme;
}

export const DEFAULT_SETTINGS: StudySettings = {
  displayName: "",
  dailyGoalMinutes: 30,
  theme: "light",
};

export const SETTINGS_LIMITS = {
  displayNameLength: 40,
  minimumDailyGoal: 1,
  maximumDailyGoal: 1440,
} as const;

const SETTINGS_KEY = "studyquest:settings:v1";

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isValidDailyGoal(value: unknown): value is number {
  return (
    typeof value === "number" &&
    Number.isInteger(value) &&
    value >= SETTINGS_LIMITS.minimumDailyGoal &&
    value <= SETTINGS_LIMITS.maximumDailyGoal
  );
}

function isStudyTheme(value: unknown): value is StudyTheme {
  return value === "light" || value === "dark";
}

function getSettings(): StudySettings {
  try {
    const saved = localStorage.getItem(SETTINGS_KEY);

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
              .slice(0, SETTINGS_LIMITS.displayNameLength)
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
    console.error("Could not load study settings:", error);
    return { ...DEFAULT_SETTINGS };
  }
}

function saveSettings(settings: StudySettings): boolean {
  const displayName = settings.displayName.trim();

  if (
    displayName.length > SETTINGS_LIMITS.displayNameLength ||
    !isValidDailyGoal(settings.dailyGoalMinutes) ||
    !isStudyTheme(settings.theme)
  ) {
    return false;
  }

  const nextSettings: StudySettings = {
    displayName,
    dailyGoalMinutes: settings.dailyGoalMinutes,
    theme: settings.theme,
  };

  try {
    const serialized = JSON.stringify(nextSettings);

    localStorage.setItem(SETTINGS_KEY, serialized);

    return localStorage.getItem(SETTINGS_KEY) === serialized;
  } catch (error) {
    console.error("Could not save study settings:", error);
    return false;
  }
}

export const settingsService = {
  getSettings,
  saveSettings,
};
