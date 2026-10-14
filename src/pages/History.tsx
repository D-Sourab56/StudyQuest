
import {
  CalendarDays,
  Clock3,
  History as HistoryIcon,
  ListChecks,
  RotateCcw,
  Sparkles,
  Timer,
} from "lucide-react";

import { useEffect, useState } from "react";

import { storageService } from "../services/storageService";

import type { StudySession } from "../types/session";

import {
  getSessionXPGains,
  getSubjectSessionXPGains,
} from "../utils/xp";

import {
  getActivityStartDate,
  getStudyActivityBuckets,
} from "../utils/studyActivity";

import type {
  ActivityPeriod,
  ActivityView,
} from "../utils/studyActivity";

// =========================================
// TYPES
// =========================================

interface HistoryFilterState {
  subjectId: string;
  period: ActivityPeriod;
}

interface HistoryPreferences {
  overview: HistoryFilterState;
  activity: HistoryFilterState;
  sessions: HistoryFilterState;
}

interface SubjectOption {
  id: string;
  name: string;
}

// =========================================
// STORAGE CONFIGURATION
// =========================================

const HISTORY_PREFERENCES_KEY =
  "studyquest:history-panels:v1";

const LEGACY_FILTER_KEY =
  "studyquest:history-filters:v1";

const DEFAULT_FILTER: HistoryFilterState = {
  subjectId: "all",
  period: "all",
};


// =========================================
// VALIDATION
// =========================================

function isRecord(
  value: unknown
): value is Record<string, unknown> {
  return (
    value !== null &&
    typeof value === "object" &&
    !Array.isArray(value)
  );
}

function isActivityPeriod(
  value: unknown
): value is ActivityPeriod {
  return (
    value === "all" ||
    value === "today" ||
    value === "7days" ||
    value === "30days"
  );
}

function normalizeFilter(
  value: unknown
): HistoryFilterState {
  if (!isRecord(value)) {
    return { ...DEFAULT_FILTER };
  }

  return {
    subjectId:
      typeof value.subjectId === "string"
        ? value.subjectId
        : "all",

    period: isActivityPeriod(value.period)
      ? value.period
      : "all",
  };
}

// =========================================
// RESTORE HISTORY PREFERENCES
// =========================================

function loadHistoryPreferences(): HistoryPreferences {
  try {
    const saved = localStorage.getItem(
      HISTORY_PREFERENCES_KEY
    );

    if (saved) {
      const parsed: unknown = JSON.parse(saved);

      if (isRecord(parsed)) {
        return {
          overview: normalizeFilter(
            parsed.overview
          ),

          activity: normalizeFilter(
            parsed.activity
          ),

          sessions: normalizeFilter(
            parsed.sessions
          ),
        };
      }
    }

    // Restore older preferences if
    // the new panel settings do not exist.

    const legacy = localStorage.getItem(
      LEGACY_FILTER_KEY
    );

    if (legacy) {
      return {
        overview: normalizeFilter(
          JSON.parse(legacy)
        ),

        activity: { ...DEFAULT_FILTER },

        sessions: { ...DEFAULT_FILTER },
      };
    }
  } catch (error) {
    console.error(
      "Could not restore History preferences:",
      error
    );
  }

  return {
    overview: { ...DEFAULT_FILTER },
    activity: { ...DEFAULT_FILTER },
    sessions: { ...DEFAULT_FILTER },
  };
}

// =========================================
// FORMAT STUDY DURATION
// =========================================

function formatDuration(
  durationMs: number
): string {
  const safeDuration = Number.isFinite(durationMs)
    ? Math.max(0, durationMs)
    : 0;

  const totalSeconds = Math.floor(
    safeDuration / 1000
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
    return `${minutes}m ${seconds}s`;
  }

  return `${seconds}s`;
}

// =========================================
// FORMAT SESSION DATE
// =========================================

function formatDate(
  dateString: string
): string {
  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return "Date unavailable";
  }

  return new Intl.DateTimeFormat("en", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(date);
}

// =========================================
// FILTER STUDY SESSIONS
// =========================================

function filterStudySessions(
  sessions: StudySession[],
  filters: HistoryFilterState,
  now: Date
): StudySession[] {
  const startDate = getActivityStartDate(
    filters.period,
    now
  );

  const startTime =
    startDate?.getTime() ?? null;

  const currentTime = now.getTime();

  return sessions.filter((session) => {
    const matchesSubject =
      filters.subjectId === "all" ||
      session.subjectId === filters.subjectId;

    const sessionTime = new Date(
      session.endedAt
    ).getTime();

    const validDate =
      Number.isFinite(sessionTime) &&
      sessionTime <= currentTime;

    const matchesPeriod =
      startTime === null ||
      sessionTime >= startTime;

    return (
      matchesSubject &&
      validDate &&
      matchesPeriod
    );
  });
}

// =========================================
// REUSABLE HISTORY FILTERS
// =========================================

interface HistoryFiltersProps {
  prefix: string;

  filters: HistoryFilterState;

  subjects: SubjectOption[];

  onChange: (
    next: HistoryFilterState
  ) => void;
}

function HistoryFilters({
  prefix,
  filters,
  subjects,
  onChange,
}: HistoryFiltersProps) {
  const hasActiveFilters =
    filters.subjectId !== "all" ||
    filters.period !== "all";

  return (
    <div className="history-filters">

      {/* SUBJECT FILTER */}

      <div className="history-filter-field">
        <label htmlFor={`${prefix}-subject`}>
          Subject
        </label>

        <select
          id={`${prefix}-subject`}
          className="history-filter-select"
          value={filters.subjectId}
          onChange={(event) => {
            onChange({
              ...filters,
              subjectId: event.target.value,
            });
          }}
        >
          <option value="all">
            All subjects
          </option>

          {subjects.map((subject) => (
            <option
              key={subject.id}
              value={subject.id}
            >
              {subject.name}
            </option>
          ))}
        </select>
      </div>

      {/* TIME PERIOD FILTER */}

      <div className="history-filter-field">
        <label htmlFor={`${prefix}-period`}>
          Time period
        </label>

        <select
          id={`${prefix}-period`}
          className="history-filter-select"
          value={filters.period}
          onChange={(event) => {
            const selectedPeriod =
              event.target.value;

            if (isActivityPeriod(selectedPeriod)) {
              onChange({
                ...filters,
                period: selectedPeriod,
              });
            }
          }}
        >
          <option value="all">
            All time
          </option>

          <option value="today">
            Today
          </option>

          <option value="7days">
            Last 7 days
          </option>

          <option value="30days">
            Last 30 days
          </option>
        </select>
      </div>

      {/* CLEAR FILTERS */}

      {hasActiveFilters && (
        <button
          type="button"
          className="history-filter-reset"
          onClick={() =>
            onChange({
              ...DEFAULT_FILTER,
            })
          }
        >
          <RotateCcw size={16} />

          Clear filters
        </button>
      )}
    </div>
  );
}

// =========================================
// HISTORY PAGE
// =========================================

function History() {
  // =========================================
  // INDEPENDENT FILTER STATES
  // =========================================

  const [preferences, setPreferences] =
    useState<HistoryPreferences>(
      loadHistoryPreferences
    );

  const overviewFilters =
    preferences.overview;

  const activityFilters =
    preferences.activity;

  const sessionFilters =
    preferences.sessions;

  // =========================================
  // SAVE FILTER PREFERENCES
  // =========================================

  useEffect(() => {
    try {
      localStorage.setItem(
        HISTORY_PREFERENCES_KEY,
        JSON.stringify(preferences)
      );
    } catch (error) {
      console.error(
        "Could not save History preferences:",
        error
      );
    }
  }, [preferences]);

  // =========================================
  // LOAD STUDY DATA
  // =========================================

  const now = new Date();

  const sessions = storageService
    .getSessions()
    .slice()
    .sort(
      (a, b) =>
        new Date(b.endedAt).getTime() -
        new Date(a.endedAt).getTime()
    );

  const subjects =
    storageService.getSubjects();

  // =========================================
  // SUBJECT NAME LOOKUP
  // =========================================

  const subjectNames = new Map(
    subjects.map((subject) => [
      subject.id,
      subject.name,
    ])
  );

  // =========================================
  // AVAILABLE SUBJECTS
  // =========================================

  const subjectOptions: SubjectOption[] =
    Array.from(
      new Set(
        sessions.map(
          (session) => session.subjectId
        )
      )
    )
      .map((subjectId) => ({
        id: subjectId,

        name:
          subjectNames.get(subjectId) ??
          "Deleted subject",
      }))
      .sort((a, b) =>
        a.name.localeCompare(b.name)
      );

  // =========================================
  // INDEPENDENT FILTER RESULTS
  // =========================================

  const overviewSessions =
    filterStudySessions(
      sessions,
      overviewFilters,
      now
    );

  const activitySessions =
    filterStudySessions(
      sessions,
      activityFilters,
      now
    );

  const filteredSessions =
    filterStudySessions(
      sessions,
      sessionFilters,
      now
    );

  // =========================================
  // XP CALCULATIONS
  // =========================================

  // Calculate XP from complete history
  // before filtering sessions.

  const globalXPGains =
    getSessionXPGains(sessions);

  const subjectXPGains =
    getSubjectSessionXPGains(sessions);

  function getEarnedXP(
    session: StudySession,
    selectedSubjectId: string
  ): number {
    const gains =
      selectedSubjectId === "all"
        ? globalXPGains
        : subjectXPGains;

    return gains.get(session.id) ?? 0;
  }

  // =========================================
  // LEARNING OVERVIEW STATISTICS
  // =========================================

  const totalSessions =
    overviewSessions.length;

  const totalDurationMs =
    overviewSessions.reduce(
      (total, session) =>
        total +
        Math.max(
          0,
          Number.isFinite(session.durationMs)
            ? session.durationMs
            : 0
        ),
      0
    );

  const averageDurationMs =
    totalSessions > 0
      ? totalDurationMs / totalSessions
      : 0;

  const totalXP =
    overviewSessions.reduce(
      (total, session) =>
        total +
        getEarnedXP(
          session,
          overviewFilters.subjectId
        ),
      0
    );

  // =========================================
  // AUTOMATIC ACTIVITY GROUPING
  // =========================================

  // Today        -> Daily
  // Last 7 days  -> Daily
  // Last 30 days -> Weekly
  // All time     -> Monthly

  const activityView: ActivityView =
    activityFilters.period === "all"
      ? "monthly"
      : activityFilters.period === "30days"
        ? "weekly"
        : "daily";

  // =========================================
  // STUDY ACTIVITY DATA
  // =========================================

  const activityBuckets =
    getStudyActivityBuckets(
      activitySessions,
      activityView,
      activityFilters.period,
      now
    );

  const maxActivityDuration = Math.max(
    1,
    ...activityBuckets.map(
      (bucket) => bucket.durationMs
    )
  );

  const chartTotalDurationMs =
    activityBuckets.reduce(
      (total, bucket) =>
        total + bucket.durationMs,
      0
    );

  const chartMinWidth = Math.max(
    450,
    activityBuckets.length *
      (activityView === "daily" ? 62 : 78)
  );

  // =========================================
  // RENDER
  // =========================================

  return (
    <div className="page-container">

      {/* ================================= */}
      {/* PAGE HEADER */}
      {/* ================================= */}

      <header className="page-header">
        <div>
          <p className="page-eyebrow">
            LEARNING LOG
          </p>

          <h1>History</h1>

          <p className="page-description">
            Look back at what you studied
            and what you learned.
          </p>
        </div>
      </header>

      {/* ================================= */}
      {/* PANEL 1 — LEARNING OVERVIEW */}
      {/* ================================= */}

      <section className="panel history-panel history-overview-panel">

        {/* OVERVIEW HEADER */}

        <div className="subject-section-heading">
          <div>
            <p className="panel-label">
              LEARNING OVERVIEW
            </p>

            <h2>Your Progress</h2>
          </div>
        </div>

        {/* OVERVIEW FILTERS */}

        <HistoryFilters
          prefix="overview"
          filters={overviewFilters}
          subjects={subjectOptions}
          onChange={(next) =>
            setPreferences((current) => ({
              ...current,
              overview: next,
            }))
          }
        />

        {/* MATCHING SESSIONS */}

        <p className="history-filter-results">
          {overviewSessions.length} matching{" "}
          {overviewSessions.length === 1
            ? "session"
            : "sessions"}{" "}
          in this overview.
        </p>

        {/* ================================= */}
        {/* OVERVIEW STATISTICS */}
        {/* ================================= */}

        <div className="history-stats-grid">

          {/* TOTAL STUDY TIME */}

          <div className="history-stat-card">
            <div className="history-stat-icon">
              <Clock3 size={20} />
            </div>

            <p className="history-stat-label">
              Total study time
            </p>

            <strong className="history-stat-value">
              {formatDuration(totalDurationMs)}
            </strong>
          </div>

          {/* COMPLETED SESSIONS */}

          <div className="history-stat-card">
            <div className="history-stat-icon">
              <ListChecks size={20} />
            </div>

            <p className="history-stat-label">
              Completed sessions
            </p>

            <strong className="history-stat-value">
              {totalSessions.toLocaleString("en")}
            </strong>
          </div>

          {/* AVERAGE SESSION */}

          <div className="history-stat-card">
            <div className="history-stat-icon">
              <Timer size={20} />
            </div>

            <p className="history-stat-label">
              Average session
            </p>

            <strong className="history-stat-value">
              {formatDuration(averageDurationMs)}
            </strong>
          </div>

          {/* XP EARNED */}

          <div className="history-stat-card">
            <div className="history-stat-icon history-stat-icon--xp">
              <Sparkles size={20} />
            </div>

            <p className="history-stat-label">
              XP earned
            </p>

            <strong className="history-stat-value">
              {totalXP.toLocaleString("en")}
              <small> XP</small>
            </strong>
          </div>

        </div>
      </section>

      {/* ================================= */}
      {/* PANEL 2 — STUDY ACTIVITY */}
      {/* ================================= */}

      <section
        className="panel history-panel history-activity-section history-activity-panel"
        aria-labelledby="history-activity-title"
      >

        {/* ACTIVITY HEADER */}

        <div className="history-activity-heading">
          <div>
            <p className="panel-label">
              LEARNING ANALYTICS
            </p>

            <h3 id="history-activity-title">
              Study Activity
            </h3>

            <p className="history-activity-description">
              Track your study time using
              the subject and time period filters.
            </p>
          </div>
        </div>

        {/* ACTIVITY FILTERS */}

        <HistoryFilters
          prefix="activity"
          filters={activityFilters}
          subjects={subjectOptions}
          onChange={(next) =>
            setPreferences((current) => ({
              ...current,
              activity: next,
            }))
          }
        />

        {/* MATCHING SESSIONS */}

        <p className="history-filter-results">
          Chart based on {activitySessions.length}{" "}
          matching{" "}
          {activitySessions.length === 1
            ? "session"
            : "sessions"}.
        </p>

        {/* ================================= */}
        {/* ACTIVITY CHART */}
        {/* ================================= */}

        {sessions.length === 0 ? (
          <div className="empty-state compact">
            <div className="empty-state-icon">
              <Clock3 size={24} />
            </div>

            <h3>No activity yet</h3>

            <p>
              Complete your first study session
              to see your learning activity.
            </p>
          </div>
        ) : (
          <>
            <div className="history-activity-scroll">
              <div
                className="history-activity-bars"
                style={{
                  gridTemplateColumns:
                    `repeat(${activityBuckets.length}, minmax(0, 1fr))`,

                  minWidth: `${chartMinWidth}px`,
                }}
              >
                {activityBuckets.map((bucket) => {
                  const heightPercent =
                    bucket.durationMs > 0
                      ? Math.max(
                          6,
                          (bucket.durationMs /
                            maxActivityDuration) * 100
                        )
                      : 0;

                  const durationLabel =
                    formatDuration(
                      bucket.durationMs
                    );

                  return (
                    <div
                      key={bucket.key}
                      className="history-activity-column"
                    >

                      {/* DURATION */}

                      <span className="history-activity-value">
                        {durationLabel}
                      </span>

                      {/* ACTIVITY BAR */}

                      <div
                        className="history-activity-bar-track"
                        role="img"
                        aria-label={
                          `${bucket.fullLabel}: ` +
                          durationLabel
                        }
                        title={
                          `${bucket.fullLabel}: ` +
                          durationLabel
                        }
                      >
                        <div
                          className="history-activity-bar"
                          style={{
                            height:
                              `${heightPercent}%`,
                          }}
                        />
                      </div>

                      {/* DATE */}

                      <span
                        className="history-activity-label"
                        title={bucket.fullLabel}
                      >
                        {bucket.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* CHART FOOTER */}

            <div className="history-activity-footer">
              <strong>
                {formatDuration(
                  chartTotalDurationMs
                )}{" "}
                across selected dates
              </strong>

              <span>
                Based on completed sessions
              </span>
            </div>
          </>
        )}
      </section>

      {/* ================================= */}
      {/* PANEL 3 — STUDY SESSIONS */}
      {/* ================================= */}

      <section className="panel history-panel history-sessions-panel">

        {/* SESSION HEADER */}

        <div className="subject-section-heading">
          <div>
            <p className="panel-label">
              SESSION HISTORY
            </p>

            <h2>Study Sessions</h2>
          </div>

          <span className="subject-summary-count">
            {filteredSessions.length}{" "}
            {filteredSessions.length === 1
              ? "session"
              : "sessions"}
          </span>
        </div>

        {/* SESSION FILTERS */}

        <HistoryFilters
          prefix="sessions"
          filters={sessionFilters}
          subjects={subjectOptions}
          onChange={(next) =>
            setPreferences((current) => ({
              ...current,
              sessions: next,
            }))
          }
        />

        {/* RESULT COUNT */}

        <p className="history-filter-results">
          Showing {filteredSessions.length} of{" "}
          {sessions.length} saved{" "}
          {sessions.length === 1
            ? "session"
            : "sessions"}.
        </p>

        {/* ================================= */}
        {/* STUDY SESSION LIST */}
        {/* ================================= */}

        {sessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon large">
              <HistoryIcon size={30} />
            </div>

            <h2>No study sessions yet.</h2>

            <p>
              Complete a study session
              to see your history here.
            </p>
          </div>
        ) : filteredSessions.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon large">
              <HistoryIcon size={30} />
            </div>

            <h2>No matching sessions</h2>

            <p>
              Try another subject or
              time period.
            </p>

            <button
              type="button"
              className="history-filter-reset"
              onClick={() =>
                setPreferences((current) => ({
                  ...current,

                  sessions: {
                    ...DEFAULT_FILTER,
                  },
                }))
              }
            >
              <RotateCcw size={16} />

              Clear filters
            </button>
          </div>
        ) : (
          <div className="history-session-list">
            {filteredSessions.map((session) => {
              const subjectName =
                subjectNames.get(
                  session.subjectId
                ) ?? "Deleted subject";

              const earnedXP = getEarnedXP(
                session,
                sessionFilters.subjectId
              );

              return (
                <article
                  key={session.id}
                  className="history-session-card"
                >

                  {/* SUBJECT + DATE */}

                  <div className="history-session-card-main">
                    <h3 className="history-session-subject">
                      {subjectName}
                    </h3>

                    <time
                      className="history-session-date"
                      dateTime={session.endedAt}
                    >
                      <CalendarDays size={15} />

                      {formatDate(
                        session.endedAt
                      )}
                    </time>
                  </div>

                  {/* SESSION METRICS */}

                  <div className="history-session-metrics">

                    {/* DURATION */}

                    <span className="history-session-metric">
                      <Clock3 size={16} />

                      {formatDuration(
                        session.durationMs
                      )}
                    </span>

                    {/* XP */}

                    <span className="history-session-metric history-session-metric--xp">
                      <Sparkles size={16} />

                      +{earnedXP} XP
                    </span>
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

export default History;
