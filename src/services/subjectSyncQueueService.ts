
import type { StudySubject } from "../types/subject";

import {
  saveCloudSubject,
  deleteCloudSubject,
} from "./subjectCloudService";

// =========================================
// TYPES
// =========================================

type SubjectSyncOperation =
  | {
      type: "save";
      subjectId: string;
      subject: StudySubject;
      operationId?: string;
    }
  | {
      type: "delete";
      subjectId: string;
      operationId?: string;
    };

// =========================================
// CONSTANTS
// =========================================

const QUEUE_PREFIX =
  "studyquest:subject-sync-queue:";

// =========================================
// ACCOUNT VALIDATION
// =========================================

function getQueueKey(userId: string): string {
  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(userId)) {
    throw new Error(
      "Invalid private account ID."
    );
  }

  return QUEUE_PREFIX + userId.toLowerCase();
}

// =========================================
// READ QUEUE
// =========================================

function getPendingOperations(
  userId: string
): SubjectSyncOperation[] {
  const saved = localStorage.getItem(
    getQueueKey(userId)
  );

  if (saved === null) {
    return [];
  }

  const parsed: unknown = JSON.parse(saved);

  if (!Array.isArray(parsed)) {
    throw new Error(
      "Invalid subject sync queue."
    );
  }

  for (const operation of parsed) {
    if (
      !operation ||
      typeof operation !== "object" ||
      !("type" in operation) ||
      !("subjectId" in operation)
    ) {
      throw new Error(
        "Corrupted subject sync operation."
      );
    }

    const item = operation as {
      type: unknown;
      subjectId: unknown;
      subject?: unknown;
      operationId?: unknown;
    };

    if (
      (item.type !== "save" &&
        item.type !== "delete") ||
      typeof item.subjectId !== "string" ||
      item.subjectId.length === 0
    ) {
      throw new Error(
        "Invalid subject sync operation."
      );
    }

    // Older queued operations may not
    // have an operationId.
    //
    // Keep them readable so existing
    // unsynchronized data is preserved.
    if (
      item.operationId !== undefined &&
      (
        typeof item.operationId !== "string" ||
        item.operationId.length === 0
      )
    ) {
      throw new Error(
        "Invalid sync operation ID."
      );
    }

    if (item.type === "save") {
      const subject =
        item.subject as StudySubject | undefined;

      if (
        !subject ||
        typeof subject.id !== "string" ||
        subject.id !== item.subjectId ||
        typeof subject.name !== "string" ||
        typeof subject.progress !== "number" ||
        !Number.isFinite(subject.progress) ||
        typeof subject.createdAt !== "string"
      ) {
        throw new Error(
          "Invalid queued subject."
        );
      }
    }
  }

  return parsed as SubjectSyncOperation[];
}

// =========================================
// WRITE QUEUE
// =========================================

function savePendingOperations(
  userId: string,
  operations: SubjectSyncOperation[]
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
// CREATE OPERATION ID
// =========================================

function createOperationId(): string {
  return crypto.randomUUID();
}

// =========================================
// ENQUEUE SUBJECT SAVE
// =========================================

function enqueueSubjectSave(
  userId: string,
  subject: StudySubject
): void {
  const operations =
    getPendingOperations(userId);

  // Only the newest pending operation
  // for this subject needs uploading.
  const remaining = operations.filter(
    (item) =>
      item.subjectId !== subject.id
  );

  const newOperation: SubjectSyncOperation = {
    type: "save",
    subjectId: subject.id,
    subject: {
      ...subject,
    },
    operationId: createOperationId(),
  };

  savePendingOperations(userId, [
    ...remaining,
    newOperation,
  ]);
}

// =========================================
// ENQUEUE SUBJECT DELETE
// =========================================

function enqueueSubjectDelete(
  userId: string,
  subjectId: string
): void {
  const operations =
    getPendingOperations(userId);

  // Replace older pending changes
  // for this subject with a deletion.
  const remaining = operations.filter(
    (item) =>
      item.subjectId !== subjectId
  );

  const newOperation: SubjectSyncOperation = {
    type: "delete",
    subjectId,
    operationId: createOperationId(),
  };

  savePendingOperations(userId, [
    ...remaining,
    newOperation,
  ]);
}

// =========================================
// OPERATION IDENTITY
// =========================================

function operationsMatch(
  current: SubjectSyncOperation,
  completed: SubjectSyncOperation
): boolean {
  if (
    current.subjectId !== completed.subjectId ||
    current.type !== completed.type
  ) {
    return false;
  }

  // New operations use unique IDs.
  // An identical edit is still a
  // different operation.
  if (
    current.operationId !== undefined ||
    completed.operationId !== undefined
  ) {
    return (
      current.operationId !== undefined &&
      completed.operationId !== undefined &&
      current.operationId ===
        completed.operationId
    );
  }

  // Backward compatibility for operations
  // queued before operation IDs existed.
  return (
    JSON.stringify(current) ===
    JSON.stringify(completed)
  );
}

// =========================================
// PROCESS QUEUE
// =========================================

const processingAccounts = new Map<
  string,
  Promise<void>
>();

async function processPendingOperations(
  userId: string
): Promise<void> {
  const accountId = userId.toLowerCase();

  // Validate the account ID.
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

      // The cloud service verifies that
      // the authenticated account matches
      // the queue owner.
      if (operation.type === "save") {
        await saveCloudSubject(
          operation.subject,
          accountId
        );
      } else {
        await deleteCloudSubject(
          operation.subjectId,
          accountId
        );
      }

      // Re-read the queue because a user
      // may have edited the subject while
      // the request was in progress.
      const latestOperations =
        getPendingOperations(accountId);

      const matchingIndex =
        latestOperations.findIndex(
          (item) =>
            operationsMatch(
              item,
              operation
            )
        );

      if (matchingIndex === -1) {
        // A newer operation replaced
        // the completed operation.
        // Never remove the newer one.
        continue;
      }

      // Remove only the exact operation
      // that finished successfully.
      latestOperations.splice(
        matchingIndex,
        1
      );

      savePendingOperations(
        accountId,
        latestOperations
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

export const subjectSyncQueueService = {
  getPendingOperations,
  enqueueSubjectSave,
  enqueueSubjectDelete,
  processPendingOperations,
};
