import {
  STORAGE_CONFIG,
} from "../data/storageConfig";

import type {
  StudySubject,
} from "../types/subject";

interface StudyQuestData {
  version: number;

  subjects: StudySubject[];
}

const DEFAULT_DATA: StudyQuestData = {
  version: STORAGE_CONFIG.version,

  subjects: [],
};

function readData(): StudyQuestData {
  try {
    const savedData = localStorage.getItem(
      STORAGE_CONFIG.appDataKey
    );

    if (!savedData) {
      return DEFAULT_DATA;
    }

    const parsedData = JSON.parse(
      savedData
    ) as Partial<StudyQuestData>;

    return {
      version:
        typeof parsedData.version === "number"
          ? parsedData.version
          : STORAGE_CONFIG.version,

      subjects:
        Array.isArray(parsedData.subjects)
          ? parsedData.subjects
          : [],
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

export const storageService = {
  getSubjects,

  saveSubjects,
};