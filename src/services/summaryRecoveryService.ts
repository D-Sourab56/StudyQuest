
import { storageService } from "./storageService";
import { summaryDraftService } from "./summaryDraftService";

import type { StudySession } from "../types/session";

const PENDING_SESSION_KEY =
  "studyquest:pending-summary-session:v1";

// =========================================
// SAVE PENDING SESSION
// =========================================

function savePendingSession(sessionId: string): void {
  try {
    localStorage.setItem(
      PENDING_SESSION_KEY,
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
    const currentId = localStorage.getItem(
      PENDING_SESSION_KEY
    );

    if (currentId === sessionId) {
      localStorage.removeItem(PENDING_SESSION_KEY);
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
    const pendingId = localStorage.getItem(
      PENDING_SESSION_KEY
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

      localStorage.removeItem(PENDING_SESSION_KEY);
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
  savePendingSession,
  clearPendingSession,
  getPendingSession,
};
