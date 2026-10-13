
import { STORAGE_CONFIG } from "../data/storageConfig";

import type { StudySession } from "../types/session";
import type { StudySubject } from "../types/subject";
import type { StudySummary } from "../types/summary";
import type { ActiveStudyTimer } from "../types/timer";

interface StudyQuestData {
  version: number;

  subjects: StudySubject[];

  sessions: StudySession[];

  summaries: StudySummary[];

  activeTimer: ActiveStudyTimer | null;
}

const DEFAULT_DATA: StudyQuestData = {
  version: STORAGE_CONFIG.version,

  subjects: [],

  sessions: [],

  summaries: [],

  activeTimer: null,
};

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

function readData(): StudyQuestData {
  try {
    const savedData =
      localStorage.getItem(
        STORAGE_CONFIG.appDataKey
      );

    if (!savedData) {
      return DEFAULT_DATA;
    }

    const parsedData =
      JSON.parse(
        savedData
      ) as Partial<StudyQuestData>;

    const sessions =
      Array.isArray(
        parsedData.sessions
      )
        ? parsedData.sessions
            .map(normalizeStudySession)
            .filter(
              (
                session
              ): session is StudySession =>
                session !== null
            )
        : [];

    const summaries =
      Array.isArray(
        parsedData.summaries
      )
        ? parsedData.summaries
            .map(normalizeStudySummary)
            .filter(
              (
                summary
              ): summary is StudySummary =>
                summary !== null
            )
        : [];

    return {
      version:
        typeof parsedData.version === "number"
          ? parsedData.version
          : STORAGE_CONFIG.version,

      subjects:
        Array.isArray(parsedData.subjects)
          ? parsedData.subjects
          : [],

      sessions,

      summaries,

      activeTimer:
        isActiveStudyTimer(
          parsedData.activeTimer
        )
          ? parsedData.activeTimer
          : null,
    };
  } catch (error) {
    console.error(
      "Could not read StudyQuest data:",
      error
    );

    return DEFAULT_DATA;
  }
}

// =========================================
// SAVE
// =========================================

function saveData(
  data: StudyQuestData
): void {
  try {
    localStorage.setItem(
      STORAGE_CONFIG.appDataKey,
      JSON.stringify(data)
    );
  } catch (error) {
    console.error(
      "Could not save StudyQuest data:",
      error
    );
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

  // Both fields are required.
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

  // Verify that the changes were persisted.
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
  getSubjects,

  saveSubjects,

  getSessions,

  saveSessions,

  addSession,

  getSummaries,

  saveSummaries,

  addSummary,

  updateSummary,

  deleteSummary,

  getActiveTimer,

  saveActiveTimer,

  clearActiveTimer,
};
