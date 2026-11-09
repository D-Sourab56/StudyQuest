
import type { StudySummary } from "../types/summary";

// =========================================
// TYPES
// =========================================

export type StudySummaryDraft = Pick<
  StudySummary,
  "topic" | "content"
>;

type SummaryDraftScope = {
  type: "account";
  userId: string;
};

// =========================================
// STORAGE CONFIGURATION
// =========================================

const DRAFT_STORAGE_PREFIX =
  "studyquest:summary-draft:v1:";

const EMPTY_DRAFT: StudySummaryDraft = {
  topic: "",
  content: "",
};

let currentScope: SummaryDraftScope | null = null;

// =========================================
// STORAGE SCOPE
// =========================================

function useAccountDrafts(userId: string): void {
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

// =========================================
// STORAGE KEY
// =========================================

function getDraftKey(sessionId: string): string {
  if (currentScope === null) {
    throw new Error(
      "StudyQuest account draft storage is not active."
    );
  }

  return (
    `${DRAFT_STORAGE_PREFIX}account:` +
    `${currentScope.userId}:${sessionId}`
  );
}

// =========================================
// READ DRAFT
// =========================================

function getDraft(
  sessionId: string
): StudySummaryDraft {
  try {
    const savedDraft = localStorage.getItem(
      getDraftKey(sessionId)
    );

    if (!savedDraft) {
      return { ...EMPTY_DRAFT };
    }

    const parsed: unknown = JSON.parse(savedDraft);

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
    console.error(
      "Could not read summary draft:",
      error
    );

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
    console.error(
      "Could not save summary draft:",
      error
    );

    return false;
  }
}

// =========================================
// DELETE DRAFT
// =========================================

function clearDraft(sessionId: string): void {
  try {
    localStorage.removeItem(
      getDraftKey(sessionId)
    );
  } catch (error) {
    console.error(
      "Could not clear summary draft:",
      error
    );
  }
}

// =========================================
// EXPORT SERVICE
// =========================================
export const summaryDraftService = {
  useAccountDrafts,
  getDraft,
  saveDraft,
  clearDraft,
};