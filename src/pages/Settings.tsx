import {
  Moon,
  Save,
  Settings as SettingsIcon,
  Sun,
} from "lucide-react";

import { useState } from "react";
import type { FormEvent } from "react";

import {
  SETTINGS_LIMITS,
  settingsService,
} from "../services/settingsService";

import type {
  StudyTheme,
} from "../services/settingsService";

function Settings() {
  const [savedSettings, setSavedSettings] = useState(() =>
    settingsService.getSettings()
  );

  const [displayName, setDisplayName] = useState(
    savedSettings.displayName
  );

  const [dailyGoal, setDailyGoal] = useState(
    String(savedSettings.dailyGoalMinutes)
  );

  const [theme, setTheme] = useState<StudyTheme>(
    savedSettings.theme
  );

  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const hasChanges =
    displayName.trim() !== savedSettings.displayName ||
    dailyGoal !== String(savedSettings.dailyGoalMinutes) ||
    theme !== savedSettings.theme;

  function clearFeedback() {
    setError("");
    setMessage("");
  }

  function selectTheme(nextTheme: StudyTheme) {
    setTheme(nextTheme);
    clearFeedback();
  }

  function handleSave(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    clearFeedback();

    const cleanName = displayName.trim();
    const goalMinutes = Number(dailyGoal);

    if (
      cleanName.length > SETTINGS_LIMITS.displayNameLength
    ) {
      setError("Please use a name with 40 characters or fewer.");
      return;
    }

    if (
      dailyGoal.trim() === "" ||
      !Number.isInteger(goalMinutes) ||
      goalMinutes < SETTINGS_LIMITS.minimumDailyGoal ||
      goalMinutes > SETTINGS_LIMITS.maximumDailyGoal
    ) {
      setError("Enter a whole number between 1 and 1,440 minutes.");
      return;
    }

    const nextSettings = {
      displayName: cleanName,
      dailyGoalMinutes: goalMinutes,
      theme,
    };

    if (!settingsService.saveSettings(nextSettings)) {
      setError(
        "Your settings could not be saved. Please try again."
      );
      return;
    }

    document.documentElement.dataset.theme = theme;

    setSavedSettings(nextSettings);
    setDisplayName(cleanName);
    setDailyGoal(String(goalMinutes));
    setMessage("Settings saved.");
  }

  function handleCancel() {
    setDisplayName(savedSettings.displayName);
    setDailyGoal(String(savedSettings.dailyGoalMinutes));
    setTheme(savedSettings.theme);
    clearFeedback();
  }

  return (
    <div className="page-container">
      <header className="page-header">
        <div>
          <p className="page-eyebrow">PREFERENCES</p>

          <h1>Settings</h1>

          <p className="page-description">
            Make StudyQuest fit your daily learning routine.
          </p>
        </div>
      </header>

      <section
        className="panel"
        aria-labelledby="study-settings-title"
        style={{
          maxWidth: 760,
          padding: "clamp(20px, 4vw, 32px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            marginBottom: 28,
          }}
        >
          <div
            className="empty-state-icon"
            style={{ flexShrink: 0 }}
          >
            <SettingsIcon size={24} aria-hidden="true" />
          </div>

          <div>
            <p className="panel-label">YOUR ROUTINE</p>

            <h2
              id="study-settings-title"
              style={{
                margin: 0,
                color: "var(--text-primary)",
                fontSize: 22,
              }}
            >
              Study preferences
            </h2>
          </div>
        </div>

        <form
          onSubmit={handleSave}
          noValidate
          style={{ display: "grid", gap: 24 }}
        >
          <div className="form-group">
            <label htmlFor="settings-display-name">
              Display name (optional)
            </label>

            <input
              id="settings-display-name"
              type="text"
              autoComplete="nickname"
              value={displayName}
              maxLength={SETTINGS_LIMITS.displayNameLength}
              placeholder="What should we call you?"
              aria-describedby="settings-name-help"
              onChange={(event) => {
                setDisplayName(event.target.value);
                clearFeedback();
              }}
            />

            <p
              id="settings-name-help"
              style={{
                margin: "8px 0 0",
                color: "var(--text-secondary)",
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              Leave this blank if you prefer a general greeting.
            </p>
          </div>

          <div className="form-group">
            <label htmlFor="settings-daily-goal">
              Daily study goal (minutes)
            </label>

            <input
              id="settings-daily-goal"
              type="number"
              inputMode="numeric"
              min={SETTINGS_LIMITS.minimumDailyGoal}
              max={SETTINGS_LIMITS.maximumDailyGoal}
              step={1}
              required
              value={dailyGoal}
              aria-describedby="settings-goal-help"
              onChange={(event) => {
                setDailyGoal(event.target.value);
                clearFeedback();
              }}
            />

            <p
              id="settings-goal-help"
              style={{
                margin: "8px 0 0",
                color: "var(--text-secondary)",
                fontSize: 12,
                lineHeight: 1.6,
              }}
            >
              Choose a realistic target for each day.
            </p>
          </div>

          <fieldset
            style={{
              margin: 0,
              padding: 0,
              border: 0,
              minWidth: 0,
            }}
          >
            <legend
              style={{
                marginBottom: 10,
                color: "var(--text-primary)",
                fontSize: 13,
                fontWeight: 650,
              }}
            >
              Appearance
            </legend>

            <div className="settings-theme-options">
              <button
                type="button"
                className={
                  theme === "light"
                    ? "settings-theme-option active"
                    : "settings-theme-option"
                }
                aria-pressed={theme === "light"}
                onClick={() => selectTheme("light")}
              >
                <Sun size={20} aria-hidden="true" />
                <span>
                  <strong>Light</strong>
                  <small>Bright glass interface</small>
                </span>
              </button>

              <button
                type="button"
                className={
                  theme === "dark"
                    ? "settings-theme-option active"
                    : "settings-theme-option"
                }
                aria-pressed={theme === "dark"}
                onClick={() => selectTheme("dark")}
              >
                <Moon size={20} aria-hidden="true" />
                <span>
                  <strong>Dark</strong>
                  <small>Dim glass interface</small>
                </span>
              </button>
            </div>
          </fieldset>

          {error && (
            <p
              className="form-error"
              role="alert"
              style={{ margin: 0 }}
            >
              {error}
            </p>
          )}

          <div
            role="status"
            aria-live="polite"
            style={{
              minHeight: 20,
              color: "var(--accent-dark)",
              fontSize: 13,
            }}
          >
            {message}
          </div>

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              flexWrap: "wrap",
              gap: 12,
            }}
          >
            {hasChanges && (
              <button
                type="button"
                className="secondary-button"
                onClick={handleCancel}
              >
                Cancel changes
              </button>
            )}

            <button
              type="submit"
              className="primary-button"
            >
              <Save size={17} aria-hidden="true" />
              Save settings
            </button>
          </div>
        </form>
      </section>
    </div>
  );
}

export default Settings;
