import {
  STORAGE_CONFIG,
} from "../data/storageConfig";

import type {
  StudySession,
} from "../types/session";

import type {
  StudySubject,
} from "../types/subject";

import type {
  ActiveStudyTimer,
} from "../types/timer";

interface StudyQuestData {
  version: number;

  subjects: StudySubject[];

  sessions: StudySession[];

  activeTimer:
    ActiveStudyTimer | null;
}

const DEFAULT_DATA: StudyQuestData = {
  version:
    STORAGE_CONFIG.version,

  subjects: [],

  sessions: [],

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
    typeof timer.subjectId ===
      "string" &&
    typeof timer.startedAt ===
      "string" &&
    validStatus &&
    typeof timer.totalPausedMs ===
      "number" &&
    (
      timer.pausedAt === undefined ||
      typeof timer.pausedAt ===
        "string"
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
    typeof session.id !==
      "string" ||
    typeof session.subjectId !==
      "string" ||
    typeof session.startedAt !==
      "string" ||
    typeof session.endedAt !==
      "string" ||
    typeof session.durationMs !==
      "number" ||
    typeof session.createdAt !==
      "string"
  ) {
    return null;
  }

  const xpEarned =
    typeof session.xpEarned ===
    "number"
      ? session.xpEarned
      : 0;

  return {
    id:
      session.id,

    subjectId:
      session.subjectId,

    startedAt:
      session.startedAt,

    endedAt:
      session.endedAt,

    durationMs:
      session.durationMs,

    xpEarned,

    createdAt:
      session.createdAt,
  };
}

// =========================================
// READ DATA
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
            .map(
              normalizeStudySession
            )
            .filter(
              (
                session
              ): session is StudySession =>
                session !== null
            )
        : [];

    return {
      version:
        typeof parsedData.version ===
        "number"
          ? parsedData.version
          : STORAGE_CONFIG.version,

      subjects:
        Array.isArray(
          parsedData.subjects
        )
          ? parsedData.subjects
          : [],

      sessions,

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
// SAVE DATA
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

function getSubjects():
  StudySubject[] {
  return readData().subjects;
}

function saveSubjects(
  subjects: StudySubject[]
): void {
  const currentData =
    readData();

  saveData({
    ...currentData,

    subjects,
  });
}

// =========================================
// SESSIONS
// =========================================

function getSessions():
  StudySession[] {
  return readData().sessions;
}

function saveSessions(
  sessions: StudySession[]
): void {
  const currentData =
    readData();

  saveData({
    ...currentData,

    sessions,
  });
}

function addSession(
  session: StudySession
): void {
  const currentData =
    readData();

  saveData({
    ...currentData,

    sessions: [
      ...currentData.sessions,
      session,
    ],
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
  const currentData =
    readData();

  saveData({
    ...currentData,

    activeTimer:
      timer,
  });
}

function clearActiveTimer():
  void {
  const currentData =
    readData();

  saveData({
    ...currentData,

    activeTimer:
      null,
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

  getActiveTimer,

  saveActiveTimer,

  clearActiveTimer,
};