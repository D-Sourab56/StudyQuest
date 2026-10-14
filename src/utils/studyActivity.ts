
import type {
  StudySession,
} from "../types/session";

// =========================================
// TYPES
// =========================================

export type ActivityView =
  | "daily"
  | "weekly"
  | "monthly";

export type ActivityPeriod =
  | "all"
  | "today"
  | "7days"
  | "30days";

export interface StudyActivityBucket {
  key: string;
  label: string;
  fullLabel: string;
  durationMs: number;
}

// =========================================
// LOCAL DATE HELPERS
// =========================================

function startOfDay(date: Date): Date {
  return new Date(
    date.getFullYear(),
    date.getMonth(),
    date.getDate()
  );
}

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

function getMonthKey(date: Date): string {
  return getDateKey(date).slice(0, 7);
}

function addDays(
  date: Date,
  days: number
): Date {
  const result = new Date(date);

  result.setDate(
    result.getDate() + days
  );

  return result;
}

// Calculate calendar-day differences
// without daylight-saving time errors.

function daysBetween(
  start: Date,
  end: Date
): number {
  const startUTC = Date.UTC(
    start.getFullYear(),
    start.getMonth(),
    start.getDate()
  );

  const endUTC = Date.UTC(
    end.getFullYear(),
    end.getMonth(),
    end.getDate()
  );

  return Math.round(
    (endUTC - startUTC) / 86400000
  );
}

// =========================================
// DATE FORMATTING
// =========================================

function formatFullDate(date: Date): string {
  return new Intl.DateTimeFormat(
    "en",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
    }
  ).format(date);
}

function formatShortDate(date: Date): string {
  return new Intl.DateTimeFormat(
    "en",
    {
      month: "short",
      day: "numeric",
    }
  ).format(date);
}

// =========================================
// SHARED FILTER START DATE
// =========================================

export function getActivityStartDate(
  period: ActivityPeriod,
  now: Date = new Date()
): Date | null {
  if (period === "all") {
    return null;
  }

  const start = startOfDay(now);

  if (period === "7days") {
    start.setDate(
      start.getDate() - 6
    );
  }

  if (period === "30days") {
    start.setDate(
      start.getDate() - 29
    );
  }

  return start;
}

// =========================================
// EMPTY ACTIVITY BUCKET
// =========================================

function createBucket(
  key: string,
  label: string,
  fullLabel: string
): StudyActivityBucket {
  return {
    key,
    label,
    fullLabel,
    durationMs: 0,
  };
}

// =========================================
// ASSIGN SESSION DURATIONS
// =========================================

function addSessionDurations(
  sessions: StudySession[],
  buckets: StudyActivityBucket[],
  getBucketIndex: (date: Date) => number,
  now: Date
): StudyActivityBucket[] {
  for (const session of sessions) {
    const date = new Date(
      session.endedAt
    );

    if (
      Number.isNaN(date.getTime()) ||
      date.getTime() > now.getTime() ||
      !Number.isFinite(session.durationMs)
    ) {
      continue;
    }

    const index = getBucketIndex(date);

    if (
      index < 0 ||
      index >= buckets.length
    ) {
      continue;
    }

    buckets[index].durationMs +=
      Math.max(0, session.durationMs);
  }

  return buckets;
}

// =========================================
// TODAY — 24 HOURLY BARS
// =========================================

function getHourlyActivity(
  sessions: StudySession[],
  now: Date
): StudyActivityBucket[] {
  const today = startOfDay(now);

  const buckets = Array.from(
    { length: 24 },
    (_, hour) => {
      const date = new Date(
        today.getFullYear(),
        today.getMonth(),
        today.getDate(),
        hour
      );

      const label = new Intl.DateTimeFormat(
        "en",
        {
          hour: "numeric",
          hour12: true,
        }
      ).format(date);

      return createBucket(
        `${getDateKey(today)}-${hour}`,
        label,
        `${formatFullDate(today)}, ${label}`
      );
    }
  );

  return addSessionDurations(
    sessions,
    buckets,
    (date) => {
      if (
        getDateKey(date) !==
        getDateKey(today)
      ) {
        return -1;
      }

      return date.getHours();
    },
    now
  );
}

// =========================================
// LAST 7 DAYS — DAILY BARS
// =========================================

function getDailyActivity(
  sessions: StudySession[],
  now: Date
): StudyActivityBucket[] {
  const start = addDays(
    startOfDay(now),
    -6
  );

  const buckets = Array.from(
    { length: 7 },
    (_, index) => {
      const date = addDays(
        start,
        index
      );

      const label = new Intl.DateTimeFormat(
        "en",
        {
          weekday: "short",
        }
      ).format(date);

      return createBucket(
        getDateKey(date),
        label,
        formatFullDate(date)
      );
    }
  );

  return addSessionDurations(
    sessions,
    buckets,
    (date) =>
      daysBetween(start, date),
    now
  );
}

// =========================================
// LAST 30 DAYS — FOUR SUMMARY BARS
// =========================================

function getFourWeekActivity(
  sessions: StudySession[],
  now: Date
): StudyActivityBucket[] {
  const start = addDays(
    startOfDay(now),
    -29
  );

  // 30 days grouped into four bars:
  //
  // Week 1: oldest 9 days
  // Week 2: next 7 days
  // Week 3: next 7 days
  // Week 4: latest 7 days
  //
  // This includes all 30 days.

  const ranges = [
    { start: 0, end: 8 },
    { start: 9, end: 15 },
    { start: 16, end: 22 },
    { start: 23, end: 29 },
  ];

  const buckets = ranges.map(
    (range, index) => {
      const firstDate = addDays(
        start,
        range.start
      );

      const lastDate = addDays(
        start,
        range.end
      );

      const dayCount =
        range.end - range.start + 1;

      return createBucket(
        getDateKey(firstDate),
        `Week ${index + 1}`,
        `${formatShortDate(firstDate)} – ` +
          `${formatShortDate(lastDate)} ` +
          `(${dayCount} days)`
      );
    }
  );

  return addSessionDurations(
    sessions,
    buckets,
    (date) => {
      const dayIndex =
        daysBetween(start, date);

      if (
        dayIndex < 0 ||
        dayIndex > 29
      ) {
        return -1;
      }

      if (dayIndex <= 8) {
        return 0;
      }

      if (dayIndex <= 15) {
        return 1;
      }

      if (dayIndex <= 22) {
        return 2;
      }

      return 3;
    },
    now
  );
}

// =========================================
// ALL TIME — MONTHLY BARS
// =========================================

function getMonthlyActivity(
  sessions: StudySession[],
  now: Date
): StudyActivityBucket[] {
  // Find the earliest valid session date.

  let earliestTime = now.getTime();

  for (const session of sessions) {
    const time = new Date(
      session.endedAt
    ).getTime();

    if (
      Number.isFinite(time) &&
      time <= now.getTime() &&
      time < earliestTime
    ) {
      earliestTime = time;
    }
  }

  const earliestDate = new Date(
    earliestTime
  );

  const startMonth = new Date(
    earliestDate.getFullYear(),
    earliestDate.getMonth(),
    1
  );

  const monthCount =
    (
      now.getFullYear() -
      startMonth.getFullYear()
    ) * 12 +
    (
      now.getMonth() -
      startMonth.getMonth()
    ) +
    1;

  const buckets = Array.from(
    { length: monthCount },
    (_, index) => {
      const date = new Date(
        startMonth.getFullYear(),
        startMonth.getMonth() + index,
        1
      );

      // Show Oct 2026 instead of Oct 26,
      // which could be mistaken for a date.

      const label = new Intl.DateTimeFormat(
        "en",
        {
          month: "short",
          year: "numeric",
        }
      ).format(date);

      return createBucket(
        getMonthKey(date),
        label,
        label
      );
    }
  );

  return addSessionDurations(
    sessions,
    buckets,
    (date) =>
      (
        date.getFullYear() -
        startMonth.getFullYear()
      ) * 12 +
      (
        date.getMonth() -
        startMonth.getMonth()
      ),
    now
  );
}

// =========================================
// MAIN STUDY ACTIVITY FUNCTION
// =========================================

export function getStudyActivityBuckets(
  sessions: StudySession[],
  _view: ActivityView,
  period: ActivityPeriod,
  now: Date = new Date()
): StudyActivityBucket[] {
  // Chart grouping follows the selected
  // time period automatically.
  //
  // _view remains in the signature for
  // compatibility with History.tsx.

  switch (period) {
    case "today":
      return getHourlyActivity(
        sessions,
        now
      );

    case "7days":
      return getDailyActivity(
        sessions,
        now
      );

    case "30days":
      return getFourWeekActivity(
        sessions,
        now
      );

    case "all":
    default:
      return getMonthlyActivity(
        sessions,
        now
      );
  }
}
