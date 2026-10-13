
import type { StudySummary } from "../types/summary";

export type StudySummaryDraft = Pick<
  StudySummary,
  "topic" | "content"
>;

const DRAFT_STORAGE_PREFIX =
  "studyquest:summary-draft:v1:";

const EMPTY_DRAFT: StudySummaryDraft = {
  topic: "",
  content: "",
};

function getDraftKey(sessionId: string): string {
  return `${DRAFT_STORAGE_PREFIX}${sessionId}`;
}

// =========================================
// READ DRAFT
// =========================================

function getDraft(sessionId: string): StudySummaryDraft {
  try {
    const savedDraft = localStorage.getItem(
      getDraftKey(sessionId)
    );

    if (!savedDraft) {
      return { ...EMPTY_DRAFT };
    }

    const parsed = JSON.parse(savedDraft) as unknown;

    if (!parsed || typeof parsed !== "object") {
      return { ...EMPTY_DRAFT };
    }

    const draft = parsed as Partial<StudySummaryDraft>;

    return {
      topic:
        typeof draft.topic === "string"
          ? draft.topic
          : "",

      content:
        typeof draft.content === "string"
          ? draft.content
          : "",
    };
  } catch (error) {
    console.error("Could not read summary draft:", error);
    return { ...EMPTY_DRAFT };
  }
}

// =========================================
// SAVE DRAFT
// =========================================

function saveDraft(
  sessionId: string,
  draft: StudySummaryDraft
): boolean {
  try {
    const key = getDraftKey(sessionId);

    if (!draft.topic && !draft.content) {
      localStorage.removeItem(key);
    } else {
      localStorage.setItem(
        key,
        JSON.stringify(draft)
      );
    }

    return true;
  } catch (error) {
    console.error("Could not save summary draft:", error);
    return false;
  }
}

// =========================================
// DELETE DRAFT
// =========================================

function clearDraft(sessionId: string): void {
  try {
    localStorage.removeItem(getDraftKey(sessionId));
  } catch (error) {
    console.error("Could not clear summary draft:", error);
  }
}

export const summaryDraftService = {
  getDraft,
  saveDraft,
  clearDraft,
};
