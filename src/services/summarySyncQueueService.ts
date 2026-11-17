import type { StudySummary } from "../types/summary";

import {
  saveCloudSummary,
  deleteCloudSummary,
} from "./summaryCloudService";

// =========================================
// TYPES
// =========================================

export type SummarySyncOperation =
  | {
      type: "save";
      summaryId: string;
      summary: StudySummary;
      operationId: string;
    }
  | {
      type: "delete";
      summaryId: string;
      operationId: string;
    };

// =========================================
// CONSTANTS
// =========================================

const QUEUE_PREFIX =
  "studyquest:summary-sync-queue:";

const processingAccounts = new Map<
  string,
  Promise<void>
>();

// =========================================
// ACCOUNT VALIDATION
// =========================================

function getQueueKey(userId: string): string {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(userId)) {
    throw new Error(
      "Invalid summary sync account ID."
    );
  }

  return QUEUE_PREFIX + userId.toLowerCase();
}

// =========================================
// SUMMARY VALIDATION
// =========================================

function isStudySummary(
  value: unknown
): value is StudySummary {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const summary =
    value as Partial<StudySummary>;

  return (
    typeof summary.id === "string" &&
    summary.id.length > 0 &&
    typeof summary.subjectId === "string" &&
    typeof summary.topic === "string" &&
    typeof summary.content === "string" &&
    typeof summary.createdAt === "string" &&
    (
      summary.sessionId === undefined ||
      typeof summary.sessionId === "string"
    )
  );
}

// =========================================
// READ PENDING OPERATIONS
// =========================================

function getPendingOperations(
  userId: string
): SummarySyncOperation[] {
  const saved = localStorage.getItem(
    getQueueKey(userId)
  );

  if (saved === null) {
    return [];
  }

  const parsed: unknown = JSON.parse(saved);

  if (!Array.isArray(parsed)) {
    throw new Error(
      "Invalid summary sync queue."
    );
  }

  for (const candidate of parsed) {
    if (
      !candidate ||
      typeof candidate !== "object"
    ) {
      throw new Error(
        "Corrupted summary sync operation."
      );
    }

    const operation =
      candidate as Record<string, unknown>;

    if (
      (
        operation.type !== "save" &&
        operation.type !== "delete"
      ) ||
      typeof operation.summaryId !== "string" ||
      operation.summaryId.length === 0 ||
      typeof operation.operationId !== "string" ||
      operation.operationId.length === 0
    ) {
      throw new Error(
        "Invalid summary sync operation."
      );
    }

    if (operation.type === "save") {
      if (
        !isStudySummary(operation.summary) ||
        operation.summary.id !==
          operation.summaryId
      ) {
        throw new Error(
          "Invalid queued study summary."
        );
      }
    }
  }

  return parsed as SummarySyncOperation[];
}

// =========================================
// SAVE PENDING OPERATIONS
// =========================================

function savePendingOperations(
  userId: string,
  operations: SummarySyncOperation[]
): void {
  const key = getQueueKey(userId);

  if (operations.length === 0) {
    localStorage.removeItem(key);
    return;
  }

  localStorage.setItem(
    key,
    JSON.stringify(operations)
  );
}

// =========================================
// ENQUEUE SAVE
// =========================================

function enqueueSummarySave(
  userId: string,
  summary: StudySummary
): void {
  const existing =
    getPendingOperations(userId);

  const remaining = existing.filter(
    (operation) =>
      operation.summaryId !== summary.id
  );

  savePendingOperations(userId, [
    ...remaining,
    {
      type: "save",
      summaryId: summary.id,
      summary: { ...summary },
      operationId: crypto.randomUUID(),
    },
  ]);
}

// =========================================
// ENQUEUE DELETE
// =========================================

function enqueueSummaryDelete(
  userId: string,
  summaryId: string
): void {
  const existing =
    getPendingOperations(userId);

  const remaining = existing.filter(
    (operation) =>
      operation.summaryId !== summaryId
  );

  savePendingOperations(userId, [
    ...remaining,
    {
      type: "delete",
      summaryId,
      operationId: crypto.randomUUID(),
    },
  ]);
}

// =========================================
// PROCESS PENDING OPERATIONS
// =========================================

async function processPendingOperations(
  userId: string
): Promise<void> {
  const accountId = userId.toLowerCase();

  getQueueKey(accountId);

  const existingProcess =
    processingAccounts.get(accountId);

  if (existingProcess) {
    return existingProcess;
  }

  const process = async (): Promise<void> => {
    while (true) {
      const operations =
        getPendingOperations(accountId);

      if (operations.length === 0) {
        return;
      }

      const operation = operations[0];

      if (operation.type === "save") {
        await saveCloudSummary(
          operation.summary,
          accountId
        );
      } else {
        await deleteCloudSummary(
          operation.summaryId,
          accountId
        );
      }

      // Check again before removing an
      // operation. The user may have edited
      // the summary during the upload.
      const latest =
        getPendingOperations(accountId);

      const matchingIndex =
        latest.findIndex(
          (item) =>
            item.operationId ===
              operation.operationId &&
            item.summaryId ===
              operation.summaryId &&
            item.type === operation.type
        );

      if (matchingIndex === -1) {
        // A newer operation replaced it.
        continue;
      }

      // Remove only the operation that
      // successfully completed.
      latest.splice(matchingIndex, 1);

      savePendingOperations(
        accountId,
        latest
      );
    }
  };

  const runningProcess = process();

  processingAccounts.set(
    accountId,
    runningProcess
  );

  try {
    await runningProcess;
  } finally {
    if (
      processingAccounts.get(accountId) ===
      runningProcess
    ) {
      processingAccounts.delete(accountId);
    }
  }
}

// =========================================
// EXPORT SERVICE
// =========================================

export const summarySyncQueueService = {
  getPendingOperations,
  enqueueSummarySave,
  enqueueSummaryDelete,
  processPendingOperations,
};