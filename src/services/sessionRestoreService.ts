import type { StudySession } from "../types/session";

import {
  fetchCloudSessionSnapshot,
  uploadCloudSessions,
} from "./sessionCloudService";

import {
  storageService,
} from "./storageService";

// =========================================
// RESTORE ACCOUNT STUDY SESSIONS
// =========================================

export async function restoreAccountSessions(
  userId: string,
  isCancelled: () => boolean
): Promise<void> {
  // First, read the current cloud records.
  const cloud =
    await fetchCloudSessionSnapshot(userId);

  if (isCancelled()) {
    return;
  }

  // Read the existing local sessions.
  const localSessions =
    storageService.getSessions();

  // Refuse to merge duplicate local IDs.
  // This prevents silently losing records.
  const localIds = new Set<string>();

  for (const session of localSessions) {
    if (localIds.has(session.id)) {
      throw new Error(
        "Duplicate local session ID detected. " +
        "Existing sessions were preserved."
      );
    }

    localIds.add(session.id);
  }

  // =====================================
  // PRESERVE ORIGINAL LOCAL HISTORY
  // =====================================

  const backupKey =
    "studyquest:sessions-before-cloud-sync:v1:" +
    userId.toLowerCase();

  if (
    localSessions.length > 0 &&
    localStorage.getItem(backupKey) === null
  ) {
    localStorage.setItem(
      backupKey,
      JSON.stringify({
        savedAt: new Date().toISOString(),
        sessions: localSessions,
      })
    );
  }

  if (isCancelled()) {
    return;
  }

  // =====================================
  // UPLOAD EXISTING LOCAL SESSIONS
  // =====================================

  const knownCloudIds = new Set([
    ...cloud.sessions.map(
      (session) => session.id
    ),
    ...cloud.deletedSessionIds,
  ]);

  const missingSessions =
    localSessions.filter(
      (session) =>
        !knownCloudIds.has(session.id)
    );

  if (missingSessions.length > 0) {
    await uploadCloudSessions(
      missingSessions,
      userId
    );
  }

  if (isCancelled()) {
    return;
  }

  // Read again after uploading to obtain
  // the latest confirmed server state.
  const latestCloud =
    missingSessions.length > 0
      ? await fetchCloudSessionSnapshot(userId)
      : cloud;

  if (isCancelled()) {
    return;
  }

  // =====================================
  // MERGE CLOUD AND LOCAL SESSIONS
  // =====================================

  const mergedSessions =
    new Map<string, StudySession>();

  // Begin with local sessions.
  for (const session of localSessions) {
    mergedSessions.set(
      session.id,
      session
    );
  }

  // Respect confirmed cloud deletions.
  for (
    const deletedId of
    latestCloud.deletedSessionIds
  ) {
    mergedSessions.delete(deletedId);
  }

  // Current cloud records take priority
  // when an ID already exists locally.
  for (
    const session of latestCloud.sessions
  ) {
    mergedSessions.set(
      session.id,
      session
    );
  }

  // Maintain chronological order.
  const restoredSessions =
    Array.from(mergedSessions.values())
      .sort(
        (a, b) =>
          a.createdAt.localeCompare(
            b.createdAt
          ) ||
          a.id.localeCompare(b.id)
      );

  // =====================================
  // SAVE ONLY IF NECESSARY
  // =====================================

  if (
    JSON.stringify(localSessions) ===
    JSON.stringify(restoredSessions)
  ) {
    return;
  }

  if (isCancelled()) {
    return;
  }

  // Update only the session collection.
  // Subjects, summaries, and the active
  // timer remain untouched.
  storageService.saveSessions(
    restoredSessions
  );
}