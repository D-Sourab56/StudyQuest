
import { STORAGE_CONFIG } from "../data/storageConfig";

import type { StudySession } from "../types/session";
import type { StudySubject } from "../types/subject";
import type { StudySummary } from "../types/summary";
import type { ActiveStudyTimer } from "../types/timer";

// =========================================
// TYPES
// =========================================

interface StudyQuestData {
  version: number;

  subjects: StudySubject[];

  sessions: StudySession[];

  summaries: StudySummary[];

  activeTimer: ActiveStudyTimer | null;
}

type StorageScope = {
  type: "account";
  userId: string;
};

// =========================================
// DEFAULT DATA
// =========================================

function createDefaultData(): StudyQuestData {
  return {
    version: STORAGE_CONFIG.version,

    subjects: [],

    sessions: [],

    summaries: [],

    activeTimer: null,
  };
}

// =========================================
// STORAGE SCOPE
// =========================================
//
// A private account's scope must be selected
// before study data and timer state are loaded.
//
// Never switch scopes while the StudyQuest
// interface is already mounted.

let currentScope: StorageScope | null = null;

function useAccountStorage(userId: string): void {
  // Supabase Auth user IDs are UUIDs.
  // Reject unexpected identifiers.

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

function getStorageKey(): string {
  if (currentScope === null) {
    throw new Error(
      "StudyQuest account storage is not active."
    );
  }

  return (
    `${STORAGE_CONFIG.appDataKey}:account:` +
    currentScope.userId
  );
}

// =========================================
// ACTIVE TIMER VALIDATION
// =========================================

function isActiveStudyTimer(
  value: unknown
): value is ActiveStudyTimer {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return false;
  }

  const timer =
    value as Partial<ActiveStudyTimer>;

  const validStatus =
    timer.status === "running" ||
    timer.status === "paused";

  return (
    typeof timer.subjectId === "string" &&
    typeof timer.startedAt === "string" &&
    validStatus &&
    typeof timer.totalPausedMs === "number" &&
    (
      timer.pausedAt === undefined ||
      typeof timer.pausedAt === "string"
    )
  );
}

// =========================================
// SESSION NORMALIZATION
// =========================================

function normalizeStudySession(
  value: unknown
): StudySession | null {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const session =
    value as Partial<StudySession>;

  if (
    typeof session.id !== "string" ||
    typeof session.subjectId !== "string" ||
    typeof session.startedAt !== "string" ||
    typeof session.endedAt !== "string" ||
    typeof session.durationMs !== "number" ||
    typeof session.createdAt !== "string"
  ) {
    return null;
  }

  const xpEarned =
    typeof session.xpEarned === "number"
      ? session.xpEarned
      : 0;

  return {
    id: session.id,

    subjectId: session.subjectId,

    startedAt: session.startedAt,

    endedAt: session.endedAt,

    durationMs: session.durationMs,

    xpEarned,

    createdAt: session.createdAt,

    ...(typeof session.notes === "string"
      ? { notes: session.notes }
      : {}),
  };
}

// =========================================
// SUMMARY NORMALIZATION
// =========================================

function normalizeStudySummary(
  value: unknown
): StudySummary | null {
  if (
    !value ||
    typeof value !== "object"
  ) {
    return null;
  }

  const summary =
    value as Partial<StudySummary>;

  if (
    typeof summary.id !== "string" ||
    typeof summary.subjectId !== "string" ||
    typeof summary.topic !== "string" ||
    typeof summary.content !== "string" ||
    typeof summary.createdAt !== "string"
  ) {
    return null;
  }

  return {
    id: summary.id,

    subjectId: summary.subjectId,

    sessionId:
      typeof summary.sessionId === "string"
        ? summary.sessionId
        : undefined,

    topic: summary.topic,

    content: summary.content,

    createdAt: summary.createdAt,
  };
}

// =========================================
// READ
// =========================================

// Read data from the active account storage scope.

function readData(
  storageKey: string = getStorageKey()
): StudyQuestData {
  try {
    const savedData = localStorage.getItem(
      storageKey
    );

    // A genuinely new storage scope
    // has no data yet.

    if (savedData === null) {
      return createDefaultData();
    }

    const parsed: unknown = JSON.parse(savedData);

    // Reject invalid storage structures.

    if (
      !parsed ||
      typeof parsed !== "object" ||
      Array.isArray(parsed)
    ) {
      throw new Error(
        "Invalid StudyQuest storage structure."
      );
    }

    const parsedData =
      parsed as Partial<StudyQuestData>;

    // Do not silently replace corrupted
    // collections with empty arrays.

    if (
      !Array.isArray(parsedData.subjects) ||
      !Array.isArray(parsedData.sessions) ||
      !Array.isArray(parsedData.summaries)
    ) {
      throw new Error(
        "StudyQuest storage collections are invalid."
      );
    }

    const sessions = parsedData.sessions.map(
      normalizeStudySession
    );

    if (
      sessions.some(
        (session) => session === null
      )
    ) {
      throw new Error(
        "StudyQuest contains an invalid study session."
      );
    }

    const summaries = parsedData.summaries.map(
      normalizeStudySummary
    );

    if (
      summaries.some(
        (summary) => summary === null
      )
    ) {
      throw new Error(
        "StudyQuest contains an invalid study summary."
      );
    }

    const activeTimer = parsedData.activeTimer;

    if (
      activeTimer !== null &&
      activeTimer !== undefined &&
      !isActiveStudyTimer(activeTimer)
    ) {
      throw new Error(
        "StudyQuest contains invalid timer data."
      );
    }

    return {
      version:
        typeof parsedData.version === "number"
          ? parsedData.version
          : STORAGE_CONFIG.version,

      subjects: parsedData.subjects,

      sessions: sessions as StudySession[],

      summaries: summaries as StudySummary[],

      activeTimer:
        activeTimer === undefined
          ? null
          : activeTimer as ActiveStudyTimer | null,
    };
  } catch (error) {
    console.error(
      "Could not read StudyQuest data:",
      error
    );

    // Never silently replace unreadable
    // data with an empty dataset.

    throw error;
  }
}

// =========================================
// SAVE
// =========================================

function saveData(
  data: StudyQuestData
): void {
  try {
    const serializedData =
      JSON.stringify(data);

    localStorage.setItem(
      getStorageKey(),
      serializedData
    );
  } catch (error) {
    console.error(
      "Could not save StudyQuest data:",
      error
    );

    // Prevent the application from treating
    // a failed storage operation as successful.

    throw error;
  }
}

// =========================================
// SUBJECTS
// =========================================

function getSubjects(): StudySubject[] {
  return readData().subjects;
}

function saveSubjects(
  subjects: StudySubject[]
): void {
  const currentData = readData();

  saveData({
    ...currentData,
    subjects,
  });
}

// =========================================
// SESSIONS
// =========================================

function getSessions(): StudySession[] {
  return readData().sessions;
}

function saveSessions(
  sessions: StudySession[]
): void {
  const currentData = readData();

  saveData({
    ...currentData,
    sessions,
  });
}

function addSession(
  session: StudySession
): void {
  const currentData = readData();

  saveData({
    ...currentData,

    sessions: [
      ...currentData.sessions,
      session,
    ],
  });
}

// =========================================
// SUMMARIES
// =========================================

function getSummaries(): StudySummary[] {
  return readData().summaries;
}

function saveSummaries(
  summaries: StudySummary[]
): void {
  const currentData = readData();

  saveData({
    ...currentData,
    summaries,
  });
}

// =========================================
// ADD SUMMARY
// =========================================

function addSummary(
  summary: StudySummary
): void {
  const currentData = readData();

  saveData({
    ...currentData,

    summaries: [
      ...currentData.summaries,
      summary,
    ],
  });
}

// =========================================
// UPDATE SUMMARY
// =========================================

function updateSummary(
  summaryId: string,
  updates: Pick<StudySummary, "topic" | "content">
): boolean {
  const topic = updates.topic.trim();
  const content = updates.content.trim();

  if (!topic || !content) {
    return false;
  }

  const currentData = readData();

  const existingSummary =
    currentData.summaries.find(
      (summary) => summary.id === summaryId
    );

  if (!existingSummary) {
    return false;
  }

  const updatedSummaries =
    currentData.summaries.map(
      (summary) => {
        if (summary.id !== summaryId) {
          return summary;
        }

        return {
          ...summary,
          topic,
          content,
        };
      }
    );

  saveData({
    ...currentData,

    summaries: updatedSummaries,
  });

  const savedSummary =
    getSummaries().find(
      (summary) => summary.id === summaryId
    );

  return (
    savedSummary?.topic === topic &&
    savedSummary?.content === content
  );
}

// =========================================
// DELETE SUMMARY
// =========================================

function deleteSummary(
  summaryId: string
): void {
  const currentData = readData();

  const updatedSummaries =
    currentData.summaries.filter(
      (summary) =>
        summary.id !== summaryId
    );

  saveData({
    ...currentData,

    summaries: updatedSummaries,
  });
}

// =========================================
// ACTIVE TIMER
// =========================================

function getActiveTimer():
  ActiveStudyTimer | null {
  return readData().activeTimer;
}

function saveActiveTimer(
  timer: ActiveStudyTimer
): void {
  const currentData = readData();

  saveData({
    ...currentData,
    activeTimer: timer,
  });
}

function clearActiveTimer(): void {
  const currentData = readData();

  saveData({
    ...currentData,
    activeTimer: null,
  });
}

// =========================================
// EXPORT
// =========================================

export const storageService = {
  // Scope selection
  useAccountStorage,

  // Subjects
  getSubjects,
  saveSubjects,

  // Sessions
  getSessions,
  saveSessions,
  addSession,

  // Summaries
  getSummaries,
  saveSummaries,
  addSummary,
  updateSummary,
  deleteSummary,

  // Active timer
  getActiveTimer,
  saveActiveTimer,
  clearActiveTimer,
};
