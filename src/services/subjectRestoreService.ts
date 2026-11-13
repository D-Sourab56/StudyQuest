import type { StudySubject } from "../types/subject";

import {
  fetchCloudSubjectSnapshot,
} from "./subjectCloudService";

import {
  subjectSyncQueueService,
} from "./subjectSyncQueueService";

import {
  storageService,
} from "./storageService";

// =========================================
// RESTORE ACCOUNT SUBJECTS FROM CLOUD
// =========================================

export async function restoreAccountSubjects(
  userId: string,
  isCancelled: () => boolean
): Promise<void> {
  // Fetch remote records without modifying
  // any existing local data.
  const cloud =
    await fetchCloudSubjectSnapshot(userId);

  if (isCancelled()) {
    return;
  }

  // Read account-specific local subjects.
  const localSubjects =
    storageService.getSubjects();

  // Preserve changes that haven't been
  // successfully uploaded yet.
  const pendingOperations =
    subjectSyncQueueService.getPendingOperations(
      userId
    );

  // Start with locally stored subjects.
  const mergedSubjects =
    new Map<string, StudySubject>();

  for (const subject of localSubjects) {
    mergedSubjects.set(
      subject.id,
      subject
    );
  }

  // Apply confirmed cloud deletions.
  for (const deletedId of cloud.deletedSubjectIds) {
    mergedSubjects.delete(deletedId);
  }

  // Apply current cloud subjects.
  for (const subject of cloud.subjects) {
    mergedSubjects.set(
      subject.id,
      subject
    );
  }

  // Pending local operations take priority
  // until they are successfully uploaded.
  for (const operation of pendingOperations) {
    if (operation.type === "delete") {
      mergedSubjects.delete(
        operation.subjectId
      );
    } else {
      mergedSubjects.set(
        operation.subjectId,
        operation.subject
      );
    }
  }

  const restoredSubjects =
    Array.from(mergedSubjects.values());

  // Avoid unnecessary localStorage writes.
  if (
    JSON.stringify(localSubjects) ===
    JSON.stringify(restoredSubjects)
  ) {
    return;
  }

  if (isCancelled()) {
    return;
  }

  // Preserve an original copy before the
  // first cloud restoration.
  const backupKey =
    "studyquest:subjects-before-restore:v1:" +
    userId.toLowerCase();

  if (localStorage.getItem(backupKey) === null) {
    localStorage.setItem(
      backupKey,
      JSON.stringify({
        savedAt: new Date().toISOString(),
        subjects: localSubjects,
      })
    );
  }

  if (isCancelled()) {
    return;
  }

  // Updates only the subject collection.
  // Sessions, summaries, and timers remain
  // untouched.
  storageService.saveSubjects(
    restoredSubjects
  );
}