import {
  settingsService,
} from "./settingsService";

import type {
  StudySettings,
} from "./settingsService";

import {
  fetchCloudProfile,
  saveCloudProfile,
} from "./profileCloudService";

import {
  getPendingProfileChange,
  flushPendingProfileChange,
} from "./profileSyncQueueService";

// =========================================
// RESTORE ACCOUNT PROFILE
// =========================================

export async function restoreAccountProfile(
  userId: string,
  isCancelled: () => boolean
): Promise<void> {
  if (isCancelled()) {
    return;
  }

  const accountId = userId.toLowerCase();

  // =====================================
  // BACKUP EXISTING LOCAL SETTINGS
  // =====================================

  const settingsKey =
    "studyquest:settings:v1:account:" +
    accountId;

  const backupKey =
    "studyquest:settings-before-cloud-sync:v1:account:" +
    accountId;

  const originalData =
    localStorage.getItem(settingsKey);

  // Preserve the original settings before
  // any cloud restoration changes them.
  //
  // Never overwrite an existing backup.
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

  const localSettings =
    settingsService.getSettings();

  // =====================================
  // FETCH CURRENT CLOUD PROFILE
  // =====================================

  const initialCloudProfile =
    await fetchCloudProfile(userId);

  if (isCancelled()) {
    return;
  }

  // =====================================
  // UPLOAD PENDING LOCAL CHANGES
  // =====================================

  const pendingChange =
    getPendingProfileChange(userId);

  if (pendingChange !== null) {
    // Local changes explicitly saved by
    // the user take priority until uploaded.
    await flushPendingProfileChange(
      userId
    );
  } else if (
    initialCloudProfile === null
  ) {
    // This account has never saved its
    // settings to Supabase.
    //
    // Initialize cloud settings from
    // the current browser's settings.
    await saveCloudProfile(
      localSettings,
      userId
    );
  }

  if (isCancelled()) {
    return;
  }

  // =====================================
  // FETCH LATEST CLOUD SETTINGS
  // =====================================

  let cloudProfile =
    await fetchCloudProfile(userId);

  if (isCancelled()) {
    return;
  }

  if (cloudProfile === null) {
    throw new Error(
      "Cloud profile could not be restored."
    );
  }

  // =====================================
  // HANDLE PARTIALLY INITIALIZED PROFILE
  // =====================================

  // Existing database columns allow
  // display_name and daily_goal_minutes
  // to be NULL.
  //
  // Fill missing values without replacing
  // valid cloud settings.

  if (
    cloudProfile.displayName === null ||
    cloudProfile.dailyGoalMinutes === null
  ) {
    const completedSettings: StudySettings = {
      displayName:
        cloudProfile.displayName ??
        localSettings.displayName,

      dailyGoalMinutes:
        cloudProfile.dailyGoalMinutes ??
        localSettings.dailyGoalMinutes,

      theme: cloudProfile.theme,
    };

    await saveCloudProfile(
      completedSettings,
      userId
    );

    if (isCancelled()) {
      return;
    }

    cloudProfile =
      await fetchCloudProfile(userId);

    if (isCancelled()) {
      return;
    }

    if (cloudProfile === null) {
      throw new Error(
        "Cloud profile disappeared during restoration."
      );
    }
  }

  // =====================================
  // PROTECT NEW LOCAL CHANGES
  // =====================================

  // Don't overwrite a new settings change
  // that was queued while restoration
  // was running.
  if (
    getPendingProfileChange(userId) !== null
  ) {
    return;
  }

  // =====================================
  // RESTORE CLOUD SETTINGS LOCALLY
  // =====================================

  const restoredSettings: StudySettings = {
    displayName:
      cloudProfile.displayName ??
      localSettings.displayName,

    dailyGoalMinutes:
      cloudProfile.dailyGoalMinutes ??
      localSettings.dailyGoalMinutes,

    theme: cloudProfile.theme,
  };

  // Save without creating another
  // cloud synchronization operation.
  const saved =
    settingsService.saveRestoredSettings(
      restoredSettings
    );

  if (!saved) {
    throw new Error(
      "Could not restore cloud settings locally."
    );
  }
}