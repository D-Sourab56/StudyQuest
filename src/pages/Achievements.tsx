
import {
  Award,
  BookOpen,
  CheckCircle2,
  Clock3,
  Flame,
  Layers3,
  LockKeyhole,
  Sparkles,
  Trophy,
} from "lucide-react";

import type { LucideIcon } from "lucide-react";
import type { StudySession } from "../types/session";

import { storageService } from "../services/storageService";
import { achievementStorageService } from "../services/achievementStorageService";

import { getSessionXPGains } from "../utils/xp";

// =========================================
// CONSTANTS
// =========================================

const MIN_ACHIEVEMENT_SESSION_MS = 60_000;

// =========================================
// TYPES
// =========================================

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  current: number;
  target: number;
  progressLabel: string;
}

// =========================================
// LONGEST STUDY STREAK
// =========================================

function getLongestStreak(
  sessions: StudySession[]
): number {
  const studyDays = new Set<number>();

  sessions.forEach((session) => {
    const date = new Date(session.endedAt);

    if (Number.isNaN(date.getTime())) {
      return;
    }

    const dayNumber = Math.floor(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      ) / 86400000
    );

    studyDays.add(dayNumber);
  });

  const sortedDays = Array.from(studyDays).sort(
    (a, b) => a - b
  );

  let longestStreak = 0;
  let currentStreak = 0;
  let previousDay: number | null = null;

  sortedDays.forEach((day) => {
    if (
      previousDay !== null &&
      day === previousDay + 1
    ) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }

    longestStreak = Math.max(
      longestStreak,
      currentStreak
    );

    previousDay = day;
  });

  return longestStreak;
}

// =========================================
// ACHIEVEMENTS PAGE
// =========================================

function Achievements() {
  // =========================================
  // LOAD EXISTING STUDY DATA
  // =========================================

  const sessions = storageService.getSessions();

  // Only sessions lasting at least 60 seconds
  // count toward session-based achievements.
  //
  // Do not use this filtered array for XP.

  const qualifyingSessions = sessions.filter(
    (session) =>
      Number.isFinite(session.durationMs) &&
      session.durationMs >=
        MIN_ACHIEVEMENT_SESSION_MS
  );

  const totalSessions = qualifyingSessions.length;

  const totalDurationMs = qualifyingSessions.reduce(
    (total, session) => {
      return total + Math.max(
        0,
        session.durationMs
      );
    },
    0
  );

  const totalStudyHours =
    totalDurationMs / 3600000;

  const studiedSubjects = new Set(
    qualifyingSessions.map(
      (session) => session.subjectId
    )
  ).size;

  const longestStreak = getLongestStreak(
    qualifyingSessions
  );

  // =========================================
  // XP CALCULATION
  // =========================================

  // XP must use ALL sessions, including those
  // shorter than 60 seconds.
  //
  // This preserves the existing Dashboard,
  // History, XP and level calculations.

  const xpGains = getSessionXPGains(sessions);

  const totalXP = Array.from(
    xpGains.values()
  ).reduce((total, xp) => {
    return total + (
      Number.isFinite(xp)
        ? Math.max(0, xp)
        : 0
    );
  }, 0);

  // =========================================
  // ACHIEVEMENT DEFINITIONS
  // =========================================

  const achievements: Achievement[] = [
    {
      id: "first-step",
      title: "First Step",
      description:
        "Complete your first study session.",
      icon: Award,
      current: totalSessions,
      target: 1,
      progressLabel:
        `${Math.min(totalSessions, 1)} / 1 session`,
    },
    {
      id: "dedicated-learner",
      title: "Dedicated Learner",
      description:
        "Complete 10 study sessions.",
      icon: BookOpen,
      current: totalSessions,
      target: 10,
      progressLabel:
        `${Math.min(totalSessions, 10)} / 10 sessions`,
    },
    {
      id: "focus-master",
      title: "Focus Master",
      description:
        "Accumulate 10 hours of study time.",
      icon: Clock3,
      current: totalStudyHours,
      target: 10,
      progressLabel:
        `${Math.min(totalStudyHours, 10).toFixed(1)} / 10 hours`,
    },
    {
      id: "consistency-champion",
      title: "Consistency Champion",
      description:
        "Study for 7 consecutive days.",
      icon: Flame,
      current: longestStreak,
      target: 7,
      progressLabel:
        `${Math.min(longestStreak, 7)} / 7 days`,
    },
    {
      id: "subject-explorer",
      title: "Subject Explorer",
      description:
        "Study 3 different subjects.",
      icon: Layers3,
      current: studiedSubjects,
      target: 3,
      progressLabel:
        `${Math.min(studiedSubjects, 3)} / 3 subjects`,
    },
    {
      id: "xp-collector",
      title: "XP Collector",
      description:
        "Earn 1,000 XP from study sessions.",
      icon: Sparkles,
      current: totalXP,
      target: 1000,
      progressLabel:
        `${Math.min(totalXP, 1000).toLocaleString()} / 1,000 XP`,
    },
  ];

  // =========================================
  // PERMANENT ACHIEVEMENT UNLOCKS
  // =========================================

  // Record newly completed achievements.
  //
  // Existing unlock dates are never overwritten.
  //
  // Achievement unlocks are stored separately
  // from study sessions and summaries.

  const completedAchievements = achievements.filter(
    (achievement) =>
      achievement.current >= achievement.target
  );

  completedAchievements.forEach((achievement) => {
    if (
      !achievementStorageService.isUnlocked(
        achievement.id
      )
    ) {
      achievementStorageService.unlockAchievement(
        achievement.id
      );
    }
  });

  // Read the permanent unlock records.
  const savedUnlocks =
    achievementStorageService.getUnlocks();

  const unlockedIds = new Set(
    savedUnlocks.map(
      (unlock) => unlock.achievementId
    )
  );

  // =========================================
  // ACHIEVEMENT STATUS
  // =========================================

  const unlockedCount = achievements.filter(
    (achievement) =>
      unlockedIds.has(achievement.id)
  ).length;

  const inProgressCount = achievements.filter(
    (achievement) =>
      !unlockedIds.has(achievement.id) &&
      achievement.current > 0 &&
      achievement.current < achievement.target
  ).length;

  // Display permanently unlocked achievements
  // even if their study history was deleted.
  //
  // Also display achievements with progress.
  // Hide only achievements that are still locked
  // and have no progress.

  const visibleAchievements = achievements.filter(
    (achievement) =>
      unlockedIds.has(achievement.id) ||
      achievement.current > 0
  );

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="page-container">
      {/* =====================================
          PAGE HEADER
      ===================================== */}

      <header className="page-header">
        <div>
          <p className="page-eyebrow">
            MILESTONES
          </p>

          <h1>Achievements</h1>

          <p className="page-description">
            Build consistency and unlock milestones
            as you progress.
          </p>
        </div>
      </header>

      {/* =====================================
          ACHIEVEMENT OVERVIEW
      ===================================== */}

      <section
        className="panel"
        style={{
          padding: "clamp(18px, 3vw, 28px)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 16,
            flexWrap: "wrap",
          }}
        >
          <div>
            <p className="panel-label">
              YOUR PROGRESS
            </p>

            <h2
              style={{
                margin: "8px 0",
                color: "var(--text-primary)",
              }}
            >
              Achievement Collection
            </h2>

            <p
              style={{
                color: "var(--text-secondary)",
                fontSize: 14,
              }}
            >
              Keep studying to unlock more rewards.
            </p>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 12,
              color: "var(--accent-dark)",
            }}
          >
            <Trophy size={28} />

            <div style={{ textAlign: "center" }}>
              <strong
                style={{
                  display: "block",
                  fontSize: 28,
                  color: "var(--text-primary)",
                }}
              >
                {unlockedCount}
              </strong>

              <span
                style={{
                  fontSize: 12,
                  color: "var(--text-secondary)",
                }}
              >
                Unlocked
              </span>
            </div>
          </div>
        </div>

      </section>

      {/* =====================================
          VISIBLE ACHIEVEMENTS
      ===================================== */}

      <section
        style={{
          marginTop: 24,
        }}
      >
        {/* SECTION HEADING */}

        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            marginBottom: 18,
            flexWrap: "wrap",
          }}
        >
          <h2
            style={{
              color: "var(--text-primary)",
            }}
          >
            Your Achievements
          </h2>

          <span
            style={{
              color: "var(--text-secondary)",
              fontSize: 13,
            }}
          >
            {unlockedCount} unlocked · {inProgressCount} in progress
          </span>
        </div>

        {/* =====================================
            NO ACHIEVEMENTS STARTED
        ===================================== */}

        {visibleAchievements.length === 0 ? (
          <div
            className="panel"
            style={{
              padding: 24,
            }}
          >
            <div className="empty-state">
              <div className="empty-state-icon large">
                <Award size={30} />
              </div>

              <h2>Your achievements are waiting.</h2>

              <p>
                Complete your first study session
                to begin unlocking achievements.
              </p>
            </div>
          </div>
        ) : (
          /* =====================================
              ACHIEVEMENT GRID
          ===================================== */

          <div
            style={{
              display: "grid",
              gridTemplateColumns:
                "repeat(auto-fit, minmax(min(100%, 260px), 1fr))",
              gap: 18,
            }}
          >
            {visibleAchievements.map((achievement) => {
              // Once unlocked, always unlocked.
              const unlocked = unlockedIds.has(
                achievement.id
              );

              const progress = unlocked
                ? 100
                : Math.min(
                    100,
                    Math.max(
                      0,
                      (achievement.current /
                        achievement.target) * 100
                    )
                  );

              const Icon = achievement.icon;

              return (
                <article
                  key={achievement.id}
                  className="panel"
                  style={{
                    padding: 22,
                    display: "flex",
                    flexDirection: "column",
                    gap: 16,
                    background: unlocked
                      ? "color-mix(in srgb, var(--accent-dark) 10%, var(--glass-bg))"
                      : "var(--glass-bg)",
                    border:
                      "1px solid var(--glass-border)",
                  }}
                >
                  {/* ===========================
                      ICON + STATUS
                  =========================== */}

                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      gap: 12,
                    }}
                  >
                    <div
                      style={{
                        width: 52,
                        height: 52,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: 15,
                        background:
                          "color-mix(in srgb, var(--accent-dark) 15%, transparent)",
                        color: unlocked
                          ? "var(--accent-dark)"
                          : "var(--text-secondary)",
                      }}
                    >
                      <Icon size={25} />
                    </div>

                    {/* STATUS */}

                    <span
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        fontWeight: 650,
                        color: unlocked
                          ? "var(--accent-dark)"
                          : "var(--text-secondary)",
                      }}
                    >
                      {unlocked ? (
                        <>
                          <CheckCircle2 size={15} />
                          Unlocked
                        </>
                      ) : (
                        <>
                          <LockKeyhole size={14} />
                          Locked
                        </>
                      )}
                    </span>
                  </div>

                  {/* ===========================
                      ACHIEVEMENT INFORMATION
                  =========================== */}

                  <div>
                    <h3
                      style={{
                        margin: "0 0 8px",
                        color: "var(--text-primary)",
                        fontSize: 17,
                      }}
                    >
                      {achievement.title}
                    </h3>

                    <p
                      style={{
                        margin: 0,
                        color: "var(--text-secondary)",
                        fontSize: 13,
                        lineHeight: 1.7,
                      }}
                    >
                      {achievement.description}
                    </p>
                  </div>

                  {/* ===========================
                      ACHIEVEMENT PROGRESS
                  =========================== */}

                  <div
                    style={{
                      marginTop: "auto",
                    }}
                  >
                    <div
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        gap: 10,
                        marginBottom: 10,
                        flexWrap: "wrap",
                      }}
                    >
                      <span
                        style={{
                          color: "var(--text-secondary)",
                          fontSize: 12,
                        }}
                      >
                        Progress
                      </span>

                      <strong
                        style={{
                          color: "var(--text-primary)",
                          fontSize: 12,
                        }}
                      >
                        {unlocked
                          ? "Completed"
                          : achievement.progressLabel}
                      </strong>
                    </div>

                    {/* PROGRESS BAR */}

                    <div
                      role="progressbar"
                      aria-label={`${achievement.title} progress`}
                      aria-valuemin={0}
                      aria-valuemax={achievement.target}
                      aria-valuenow={
                        unlocked
                          ? achievement.target
                          : Math.min(
                              achievement.current,
                              achievement.target
                            )
                      }
                      style={{
                        height: 8,
                        borderRadius: 999,
                        overflow: "hidden",
                        background:
                          "color-mix(in srgb, var(--text-primary) 10%, transparent)",
                      }}
                    >
                      <div
                        style={{
                          width: `${progress}%`,
                          height: "100%",
                          borderRadius: 999,
                          background: "var(--accent-dark)",
                          transition: "width 0.3s ease",
                        }}
                      />
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

export default Achievements;
