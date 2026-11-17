import type { StudySummary } from "../types/summary";

import {
  fetchCloudSummarySnapshot,
} from "./summaryCloudService";

import {
  summarySyncQueueService,
} from "./summarySyncQueueService";

import {
  storageService,
} from "./storageService";

// =========================================
// RESTORE ACCOUNT SUMMARIES
// =========================================

export async function restoreAccountSummaries(
  userId: string,
  isCancelled: () => boolean
): Promise<void> {
  // Fetch existing cloud records.
  const cloud =
    await fetchCloudSummarySnapshot(userId);

  if (isCancelled()) {
    return;
  }

  const localSummaries =
    storageService.getSummaries();

  // Reject duplicate local IDs rather than
  // silently removing any records.
  const localIds = new Set<string>();

  for (const summary of localSummaries) {
    if (localIds.has(summary.id)) {
      throw new Error(
        "Duplicate local summary ID detected. " +
        "Existing summaries were preserved."
      );
    }

    localIds.add(summary.id);
  }

  // =====================================
  // BACK UP ORIGINAL LOCAL SUMMARIES
  // =====================================

  const backupKey =
    "studyquest:summaries-before-cloud-sync:v1:" +
    userId.toLowerCase();

  if (
    localSummaries.length > 0 &&
    localStorage.getItem(backupKey) === null
  ) {
    localStorage.setItem(
      backupKey,
      JSON.stringify({
        savedAt: new Date().toISOString(),
        summaries: localSummaries,
      })
    );
  }

  if (isCancelled()) {
    return;
  }

  // =====================================
  // BACKFILL EXISTING LOCAL SUMMARIES
  // =====================================

  const pending =
    summarySyncQueueService.getPendingOperations(
      userId
    );

  const knownCloudIds = new Set([
    ...cloud.summaries.map(
      (summary) => summary.id
    ),
    ...cloud.deletedSummaryIds,
  ]);

  const pendingIds = new Set(
    pending.map(
      (operation) => operation.summaryId
    )
  );

  // Queue legacy local summaries that
  // have never reached the cloud.
  for (const summary of localSummaries) {
    if (
      knownCloudIds.has(summary.id) ||
      pendingIds.has(summary.id)
    ) {
      continue;
    }

    summarySyncQueueService.enqueueSummarySave(
      userId,
      summary
    );
  }

  if (isCancelled()) {
    return;
  }

  // =====================================
  // PROCESS PENDING CHANGES
  // =====================================

  const queuedOperations =
    summarySyncQueueService.getPendingOperations(
      userId
    );

  if (queuedOperations.length > 0) {
    await summarySyncQueueService
      .processPendingOperations(userId);
  }

  if (isCancelled()) {
    return;
  }

  // Fetch again after confirmed uploads.
  const latestCloud =
    queuedOperations.length > 0
      ? await fetchCloudSummarySnapshot(userId)
      : cloud;

  if (isCancelled()) {
    return;
  }

  // =====================================
  // MERGE LOCAL AND CLOUD DATA
  // =====================================

  const merged =
    new Map<string, StudySummary>();

  for (const summary of localSummaries) {
    merged.set(
      summary.id,
      summary
    );
  }

  // Respect cloud deletions.
  for (
    const deletedId of
    latestCloud.deletedSummaryIds
  ) {
    merged.delete(deletedId);
  }

  // Apply confirmed cloud summaries.
  for (
    const summary of
    latestCloud.summaries
  ) {
    merged.set(
      summary.id,
      summary
    );
  }

  // Unconfirmed newer local changes
  // must take priority.
  const remainingOperations =
    summarySyncQueueService.getPendingOperations(
      userId
    );

  for (
    const operation of remainingOperations
  ) {
    if (operation.type === "delete") {
      merged.delete(
        operation.summaryId
      );
    } else {
      merged.set(
        operation.summaryId,
        operation.summary
      );
    }
  }

  const restoredSummaries =
    Array.from(merged.values()).sort(
      (a, b) =>
        a.createdAt.localeCompare(
          b.createdAt
        ) ||
        a.id.localeCompare(b.id)
    );

  if (
    JSON.stringify(localSummaries) ===
    JSON.stringify(restoredSummaries)
  ) {
    return;
  }

  if (isCancelled()) {
    return;
  }

  // Replace only the summaries collection.
  // Sessions, subjects, and timer state
  // remain unchanged.
  storageService.saveSummaries(
    restoredSummaries
  );
}