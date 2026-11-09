
import { storageService } from "./storageService";
import { summaryDraftService } from "./summaryDraftService";

import type { StudySession } from "../types/session";

const PENDING_SESSION_KEY =
  "studyquest:pending-summary-session:v1";

// =========================================
// STORAGE SCOPE
// =========================================

type SummaryRecoveryScope = {
  type: "account";
  userId: string;
};

let currentScope: SummaryRecoveryScope | null = null;


function useAccountRecovery(userId: string): void {
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

function getPendingSessionKey(): string {
  if (currentScope === null) {
    throw new Error(
      "StudyQuest account recovery storage is not active."
    );
  }

  return (
    `${PENDING_SESSION_KEY}:account:` +
    currentScope.userId
  );
}

// =========================================
// SAVE PENDING SESSION
// =========================================

function savePendingSession(sessionId: string): void {
  try {
    localStorage.setItem(
      getPendingSessionKey(),
      sessionId
    );
  } catch (error) {
    console.error(
      "Could not save pending summary session:",
      error
    );
  }
}

// =========================================
// CLEAR PENDING SESSION
// =========================================

function clearPendingSession(sessionId: string): void {
  try {
    const key = getPendingSessionKey();

    const currentId = localStorage.getItem(key);

    if (currentId === sessionId) {
      localStorage.removeItem(key);
    }
  } catch (error) {
    console.error(
      "Could not clear pending summary session:",
      error
    );
  }
}

// =========================================
// RESTORE UNFINISHED SESSION
// =========================================

function getPendingSession(): StudySession | null {
  try {
    const sessions = storageService.getSessions();
    const summaries = storageService.getSummaries();
    const subjects = storageService.getSubjects();

    const completedSummaryIds = new Set(
      summaries
        .map((summary) => summary.sessionId)
        .filter((id): id is string => Boolean(id))
    );

    const subjectIds = new Set(
      subjects.map((subject) => subject.id)
    );

    function canRestore(session: StudySession): boolean {
      return (
        subjectIds.has(session.subjectId) &&
        !completedSummaryIds.has(session.id)
      );
    }

    // First, restore the explicitly pending session.
    const pendingKey = getPendingSessionKey();

    const pendingId = localStorage.getItem(
      pendingKey
    );

    if (pendingId) {
      const pendingSession = sessions.find(
        (session) => session.id === pendingId
      );

      if (
        pendingSession &&
        canRestore(pendingSession)
      ) {
        return pendingSession;
      }

      localStorage.removeItem(pendingKey);
    }

    // Recover older drafts created before this feature.
    const sessionWithDraft = [...sessions]
      .reverse()
      .find((session) => {
        if (!canRestore(session)) {
          return false;
        }

        const draft = summaryDraftService.getDraft(
          session.id
        );

        return Boolean(
          draft.topic.trim() ||
          draft.content.trim()
        );
      });

    if (sessionWithDraft) {
      savePendingSession(sessionWithDraft.id);
      return sessionWithDraft;
    }

    return null;
  } catch (error) {
    console.error(
      "Could not restore pending summary:",
      error
    );

    return null;
  }
}

export const summaryRecoveryService = {
  useAccountRecovery,
  savePendingSession,
  clearPendingSession,
  getPendingSession,
};
