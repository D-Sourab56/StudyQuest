
import {
  ArrowRight,
  BookOpen,
  Clock3,
  Flame,
  Target,
  Zap,
} from "lucide-react";

import { Link } from "react-router";

import {
  ROUTES,
} from "../data/appConfig";

import {
  storageService,
} from "../services/storageService";

import type {
  StudySession,
} from "../types/session";

import {
  getLevelInfo,
  getSessionXPGains,
  getTotalXP,
} from "../utils/xp";

// =========================================
// CONFIGURATION
// =========================================

const WEEKLY_GOAL_MS =
  10 * 60 * 60 * 1000;

// =========================================
// FORMAT DURATION
// =========================================

function formatDuration(
  durationMs: number
): string {
  const totalSeconds = Math.max(
    0,
    Math.floor(durationMs / 1000)
  );

  const hours = Math.floor(
    totalSeconds / 3600
  );

  const minutes = Math.floor(
    (totalSeconds % 3600) / 60
  );

  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }

  if (minutes > 0) {
    return seconds > 0
      ? `${minutes}m ${seconds}s`
      : `${minutes}m`;
  }

  return `${seconds}s`;
}

// =========================================
// LOCAL DATE KEY
// =========================================

function getDateKey(date: Date): string {
  const year = date.getFullYear();

  const month = String(
    date.getMonth() + 1
  ).padStart(2, "0");

  const day = String(
    date.getDate()
  ).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

// =========================================
// GROUP STUDY TIME BY DAY
// =========================================

function getDailyDurations(
  sessions: StudySession[]
): Map<string, number> {
  const dailyDurations =
    new Map<string, number>();

  sessions.forEach((session) => {
    const date = new Date(
      session.endedAt
    );

    if (Number.isNaN(date.getTime())) {
      return;
    }

    const key = getDateKey(date);

    const duration = Math.max(
      0,
      Number.isFinite(session.durationMs)
        ? session.durationMs
        : 0
    );

    dailyDurations.set(
      key,
      (dailyDurations.get(key) ?? 0) +
        duration
    );
  });

  return dailyDurations;
}

// =========================================
// STUDY STREAK
// =========================================

function calculateStudyStreak(
  sessions: StudySession[],
  today: Date
): number {
  const studiedDays = new Set<string>();

  sessions.forEach((session) => {
    if (session.durationMs <= 0) {
      return;
    }

    const date = new Date(
      session.endedAt
    );

    if (!Number.isNaN(date.getTime())) {
      studiedDays.add(getDateKey(date));
    }
  });

  const cursor = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  // If the student has not studied today,
  // their streak can still continue from yesterday.

  if (!studiedDays.has(getDateKey(cursor))) {
    cursor.setDate(
      cursor.getDate() - 1
    );
  }

  let streak = 0;

  while (
    studiedDays.has(getDateKey(cursor))
  ) {
    streak += 1;

    cursor.setDate(
      cursor.getDate() - 1
    );
  }

  return streak;
}

// =========================================
// FORMAT RECENT SESSION DATE
// =========================================

function formatSessionDate(
  dateString: string
): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

// =========================================
// DASHBOARD
// =========================================

function Dashboard() {
  // =========================================
  // SAVED DATA
  // =========================================

  const sessions =
    storageService.getSessions();

  const subjects =
    storageService.getSubjects();

  const subjectNames = new Map(
    subjects.map((subject) => [
      subject.id,
      subject.name,
    ])
  );

  // =========================================
  // GLOBAL XP + LEVEL
  // =========================================

  const totalXp = getTotalXP(sessions);

  const levelInfo =
    getLevelInfo(totalXp);

  const sessionXPGains =
    getSessionXPGains(sessions);

  // =========================================
  // TODAY'S STUDY TIME
  // =========================================

  const today = new Date();

  const dailyDurations =
    getDailyDurations(sessions);

  const todayKey =
    getDateKey(today);

  const todayDurationMs =
    dailyDurations.get(todayKey) ?? 0;

  // =========================================
  // CURRENT WEEK
  // =========================================

  const monday = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  );

  const mondayOffset =
    (monday.getDay() + 6) % 7;

  monday.setDate(
    monday.getDate() - mondayOffset
  );

  const weekDays = Array.from(
    { length: 7 },
    (_, index) => {
      const date = new Date(monday);

      date.setDate(
        monday.getDate() + index
      );

      const key = getDateKey(date);

      return {
        key,

        label:
          new Intl.DateTimeFormat(
            "en",
            { weekday: "short" }
          ).format(date),

        durationMs:
          dailyDurations.get(key) ?? 0,

        isToday: key === todayKey,
      };
    }
  );

  // =========================================
  // WEEKLY GOAL
  // =========================================

  const weekDurationMs =
    weekDays.reduce(
      (total, day) =>
        total + day.durationMs,
      0
    );

  const weeklyProgressPercent =
    Math.min(
      100,
      (weekDurationMs / WEEKLY_GOAL_MS) *
        100
    );

  // =========================================
  // WEEKLY ACTIVITY CHART
  // =========================================

  const maxDayDuration = Math.max(
    1,
    ...weekDays.map(
      (day) => day.durationMs
    )
  );

  // =========================================
  // STUDY STREAK
  // =========================================

  const studyStreak =
    calculateStudyStreak(
      sessions,
      today
    );

  // =========================================
  // RECENT SESSIONS
  // =========================================

  const recentSessions = [
    ...sessions,
  ]
    .sort(
      (a, b) =>
        new Date(b.endedAt).getTime() -
        new Date(a.endedAt).getTime()
    )
    .slice(0, 5);

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="page-container">

      {/* HEADER */}

      <header className="page-header">
        <div>
          <p className="page-eyebrow">
            OVERVIEW
          </p>

          <h1>Welcome back.</h1>

          <p className="page-description">
            Every study session moves your
            quest forward.
          </p>
        </div>
      </header>

      {/* ================================= */}
      {/* DASHBOARD STATISTICS */}
      {/* ================================= */}

      <section className="stats-grid">

        {/* TODAY */}

        <article className="stat-card">
          <div className="stat-icon">
            <Clock3 size={20} />
          </div>

          <div>
            <p className="stat-label">
              Today
            </p>

            <h2>
              {formatDuration(todayDurationMs)}
            </h2>

            <p className="stat-helper">
              Completed study time today
            </p>
          </div>
        </article>

        {/* WEEKLY GOAL */}

        <article className="stat-card">
          <div className="stat-icon">
            <Target size={20} />
          </div>

          <div className="stat-card-content">
            <p className="stat-label">
              Weekly Goal
            </p>

            <h2>
              {formatDuration(weekDurationMs)}
              {" / 10h"}
            </h2>

            <div
              className="progress-track"
              role="progressbar"
              aria-label="Weekly study goal"
              aria-valuenow={Math.round(
                weeklyProgressPercent
              )}
              aria-valuemin={0}
              aria-valuemax={100}
            >
              <div
                className="progress-fill"
                style={{
                  width:
                    `${weeklyProgressPercent}%`,
                }}
              />
            </div>

            <p className="stat-helper">
              {Math.round(
                weeklyProgressPercent
              )}% of weekly goal
            </p>
          </div>
        </article>

        {/* GLOBAL XP / LEVEL */}

        <article className="stat-card">
          <div className="stat-icon">
            <Zap size={20} />
          </div>

          <div className="stat-card-content">
            <p className="stat-label">
              Level {levelInfo.level}
            </p>

            <h2>
              {totalXp} XP
            </h2>

            <div className="progress-track">
              <div
                className="progress-fill"
                style={{
                  width:
                    `${levelInfo.progressPercent}%`,
                }}
              />
            </div>

            <p className="stat-helper">
              {levelInfo.xpToNextLevel}{" "}
              XP to next level
            </p>
          </div>
        </article>

        {/* STUDY STREAK */}

        <article className="stat-card">
          <div className="stat-icon">
            <Flame size={20} />
          </div>

          <div>
            <p className="stat-label">
              Study Streak
            </p>

            <h2>
              {studyStreak}{" "}
              {studyStreak === 1
                ? "day"
                : "days"}
            </h2>

            <p className="stat-helper">
              Consecutive study days
            </p>
          </div>
        </article>
      </section>

      {/* ================================= */}
      {/* DASHBOARD CONTENT */}
      {/* ================================= */}

      <section className="dashboard-grid">

        {/* WELCOME PANEL */}

        <article className="panel welcome-panel">
          <div className="welcome-icon">
            <BookOpen size={27} />
          </div>

          <div className="welcome-content">
            <span className="quest-label">
              YOUR QUEST
            </span>

            <h2>
              Keep building your
              learning journey.
            </h2>

            <p>
              Study consistently,
              earn XP, level up,
              and turn learning
              into visible progress.
            </p>

            <Link
              to={ROUTES.study}
              className="primary-button"
            >
              Start studying
              <ArrowRight size={18} />
            </Link>
          </div>
        </article>

        {/* ================================= */}
        {/* WEEKLY ACTIVITY */}
        {/* ================================= */}

        <article className="panel">
          <div className="panel-heading">
            <div>
              <p className="panel-label">
                THIS WEEK
              </p>

              <h2>Study Activity</h2>
            </div>
          </div>

          <div className="dashboard-activity-chart">
            {weekDays.map((day) => {
              const barHeight =
                day.durationMs > 0
                  ? Math.max(
                      6,
                      (day.durationMs /
                        maxDayDuration) *
                        100
                    )
                  : 0;

              return (
                <div
                  key={day.key}
                  className="dashboard-activity-day"
                >
                  <div
                    className="dashboard-activity-bar-track"
                    role="img"
                    aria-label={
                      `${day.label}: ` +
                      formatDuration(day.durationMs)
                    }
                    title={
                      `${day.label}: ` +
                      formatDuration(day.durationMs)
                    }
                  >
                    <div
                      className="dashboard-activity-bar"
                      style={{
                        height: `${barHeight}%`,
                      }}
                    />
                  </div>

                  <span
                    className={
                      day.isToday
                        ? "dashboard-activity-day-label is-today"
                        : "dashboard-activity-day-label"
                    }
                  >
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>

          <p className="dashboard-activity-total">
            {formatDuration(weekDurationMs)}
            {" studied this week"}
          </p>
        </article>

        {/* ================================= */}
        {/* RECENT SESSIONS */}
        {/* ================================= */}

        <article className="panel recent-panel">
          <div className="panel-heading">
            <div>
              <p className="panel-label">
                RECENT
              </p>

              <h2>Study Sessions</h2>
            </div>
          </div>

          {recentSessions.length === 0 ? (
            <div className="empty-state compact">
              <div className="empty-state-icon">
                <BookOpen size={24} />
              </div>

              <h3>No sessions yet</h3>

              <p>
                Finish your first study session
                to see it here.
              </p>
            </div>
          ) : (
            <>
              <div className="dashboard-recent-list">
                {recentSessions.map(
                  (session) => (
                    <div
                      key={session.id}
                      className="dashboard-recent-item"
                    >
                      <div className="dashboard-recent-main">
                        <strong>
                          {subjectNames.get(
                            session.subjectId
                          ) ?? "Deleted subject"}
                        </strong>

                        <time
                          dateTime={session.endedAt}
                        >
                          {formatSessionDate(
                            session.endedAt
                          )}
                        </time>
                      </div>

                      <div className="dashboard-recent-metrics">
                        <span>
                          <Clock3 size={14} />
                          {formatDuration(
                            session.durationMs
                          )}
                        </span>

                        <span className="dashboard-recent-xp">
                          <Zap size={14} />
                          +
                          {sessionXPGains.get(
                            session.id
                          ) ?? 0}
                          {" XP"}
                        </span>
                      </div>
                    </div>
                  )
                )}
              </div>

              <Link
                to={ROUTES.history}
                className="dashboard-recent-link"
              >
                View all history
                <ArrowRight size={16} />
              </Link>
            </>
          )}
        </article>
      </section>
    </div>
  );
}

export default Dashboard;
