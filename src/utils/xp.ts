import {
  XP_CONFIG,
} from "../data/xpConfig";

import type {
  StudySession,
} from "../types/session";

export interface LevelInfo {
  level: number;

  totalXp: number;

  currentLevelXp: number;

  xpRequiredForNextLevel: number;

  xpToNextLevel: number;

  progressPercent: number;
}

// =========================================
// XP FROM STUDY TIME
// =========================================

export function calculateXPFromDuration(
  durationMs: number
): number {
  const fullMinutes =
    Math.floor(
      durationMs /
        XP_CONFIG.millisecondsPerMinute
    );

  return (
    fullMinutes *
    XP_CONFIG.xpPerMinute
  );
}

// =========================================
// SUBJECT XP
// =========================================

export function getSubjectXP(
  sessions: StudySession[]
): number {
  const totalDurationMs =
    sessions.reduce(
      (
        total,
        session
      ) =>
        total +
        session.durationMs,
      0
    );

  return calculateXPFromDuration(
    totalDurationMs
  );
}

// =========================================
// TOTAL XP
// =========================================

export function getTotalXP(
  sessions: StudySession[]
): number {
  const sessionsBySubject =
    new Map<
      string,
      number
    >();

  sessions.forEach(
    (session) => {
      const currentDuration =
        sessionsBySubject.get(
          session.subjectId
        ) ?? 0;

      sessionsBySubject.set(
        session.subjectId,
        currentDuration +
          session.durationMs
      );
    }
  );

  let totalXp = 0;

  sessionsBySubject.forEach(
    (durationMs) => {
      totalXp +=
        calculateXPFromDuration(
          durationMs
        );
    }
  );

  return totalXp;
}

// =========================================
// XP EARNED BY A NEW SESSION
// =========================================

export function calculateSessionXPGain(
  existingSessions:
    StudySession[],

  subjectId: string,

  newSessionDurationMs:
    number
): number {
  const subjectSessions =
    existingSessions.filter(
      (session) =>
        session.subjectId ===
        subjectId
    );

  const previousDuration =
    subjectSessions.reduce(
      (
        total,
        session
      ) =>
        total +
        session.durationMs,
      0
    );

  const previousXp =
    calculateXPFromDuration(
      previousDuration
    );

  const newXp =
    calculateXPFromDuration(
      previousDuration +
        newSessionDurationMs
    );

  return Math.max(
    0,
    newXp - previousXp
  );
}

// =========================================
// LEVEL
// =========================================

export function getLevelInfo(
  totalXp: number
): LevelInfo {
  const safeXp =
    Math.max(
      0,
      Math.floor(totalXp)
    );

  let level = 1;

  let xpAtStartOfLevel =
    0;

  let xpRequiredForLevel =
    XP_CONFIG.baseXpPerLevel;

  while (
    safeXp >=
    xpAtStartOfLevel +
      xpRequiredForLevel
  ) {
    xpAtStartOfLevel +=
      xpRequiredForLevel;

    level += 1;

    xpRequiredForLevel =
      XP_CONFIG.baseXpPerLevel *
      level;
  }

  const currentLevelXp =
    safeXp -
    xpAtStartOfLevel;

  const xpToNextLevel =
    xpRequiredForLevel -
    currentLevelXp;

  const progressPercent =
    xpRequiredForLevel > 0
      ? Math.min(
          100,
          Math.max(
            0,
            (
              currentLevelXp /
              xpRequiredForLevel
            ) *
              100
          )
        )
      : 0;

  return {
    level,

    totalXp:
      safeXp,

    currentLevelXp,

    xpRequiredForNextLevel:
      xpRequiredForLevel,

    xpToNextLevel,

    progressPercent,
  };
}