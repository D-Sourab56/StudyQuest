import {
  STORAGE_CONFIG,
} from "../data/storageConfig";

import type {
  StudySubject,
} from "../types/subject";

import type {
  ActiveStudyTimer,
} from "../types/timer";

interface StudyQuestData {
  version: number;

  subjects: StudySubject[];

  activeTimer: ActiveStudyTimer | null;
}

const DEFAULT_DATA: StudyQuestData = {
  version:
    STORAGE_CONFIG.version,

  subjects: [],

  activeTimer: null,
};

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
  const currentData =
    readData();

  saveData({
    ...currentData,

    subjects,
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

    activeTimer: timer,
  });
}

function clearActiveTimer(): void {
  const currentData =
    readData();

  saveData({
    ...currentData,

    activeTimer: null,
  });
}

export const storageService = {
  getSubjects,

  saveSubjects,

  getActiveTimer,

  saveActiveTimer,

  clearActiveTimer,
};