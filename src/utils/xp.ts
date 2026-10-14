
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
  const fullMinutes = Math.floor(
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

// The caller must pass sessions
// belonging to the selected subject.

export function getSubjectXP(
  sessions: StudySession[]
): number {
  const totalDurationMs = sessions.reduce(
    (total, session) =>
      total + session.durationMs,
    0
  );

  return calculateXPFromDuration(
    totalDurationMs
  );
}

// =========================================
// GLOBAL TOTAL XP
// =========================================

// Combine time from ALL subjects first.
// Only then calculate the total XP.

export function getTotalXP(
  sessions: StudySession[]
): number {
  const totalDurationMs = sessions.reduce(
    (total, session) =>
      total + session.durationMs,
    0
  );

  return calculateXPFromDuration(
    totalDurationMs
  );
}

// =========================================
// XP EARNED BY A NEW SESSION
// =========================================

// Keep subjectId in the function signature
// for compatibility with StudyTimerContext.
//
// XP earned by a new session now follows
// the GLOBAL cumulative study duration.

export function calculateSessionXPGain(
  existingSessions: StudySession[],
  _subjectId: string,
  newSessionDurationMs: number
): number {
  const previousDurationMs =
    existingSessions.reduce(
      (total, session) =>
        total + session.durationMs,
      0
    );

  const previousXP =
    calculateXPFromDuration(
      previousDurationMs
    );

  const newXP =
    calculateXPFromDuration(
      previousDurationMs +
        newSessionDurationMs
    );

  return Math.max(
    0,
    newXP - previousXP
  );
}

// =========================================
// SESSION XP CALCULATION HELPER
// =========================================

function calculateSessionGains(
  sessions: StudySession[],
  scope: "global" | "subject"
): Map<string, number> {
  const xpBySession =
    new Map<string, number>();

  const durationByScope =
    new Map<string, number>();

  const chronologicalSessions = [
    ...sessions,
  ].sort(
    (a, b) =>
      new Date(a.endedAt).getTime() -
      new Date(b.endedAt).getTime()
  );

  for (const session of chronologicalSessions) {
    const scopeKey =
      scope === "global"
        ? "__global__"
        : session.subjectId;

    const previousDurationMs =
      durationByScope.get(scopeKey) ?? 0;

    const newDurationMs =
      previousDurationMs +
      session.durationMs;

    const previousXP =
      calculateXPFromDuration(
        previousDurationMs
      );

    const newXP =
      calculateXPFromDuration(
        newDurationMs
      );

    xpBySession.set(
      session.id,
      Math.max(0, newXP - previousXP)
    );

    durationByScope.set(
      scopeKey,
      newDurationMs
    );
  }

  return xpBySession;
}

// =========================================
// GLOBAL SESSION XP
// =========================================

// XP gained by each session based on
// cumulative time across all subjects.

export function getSessionXPGains(
  sessions: StudySession[]
): Map<string, number> {
  return calculateSessionGains(
    sessions,
    "global"
  );
}

// =========================================
// SUBJECT SESSION XP
// =========================================

// XP gained by each session based only
// on its own subject's cumulative time.

export function getSubjectSessionXPGains(
  sessions: StudySession[]
): Map<string, number> {
  return calculateSessionGains(
    sessions,
    "subject"
  );
}

// =========================================
// LEVEL
// =========================================

export function getLevelInfo(
  totalXp: number
): LevelInfo {
  const safeXp = Math.max(
    0,
    Math.floor(totalXp)
  );

  let level = 1;

  let xpAtStartOfLevel = 0;

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
    safeXp - xpAtStartOfLevel;

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
            ) * 100
          )
        )
      : 0;

  return {
    level,
    totalXp: safeXp,
    currentLevelXp,
    xpRequiredForNextLevel:
      xpRequiredForLevel,
    xpToNextLevel,
    progressPercent,
  };
}
