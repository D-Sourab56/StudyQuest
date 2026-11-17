import type { StudySession } from "../types/session";

import {
  requirePrivateAccount,
} from "./subjectCloudService";

// =========================================
// DATABASE TYPES
// =========================================

interface CloudSessionRow {
  id: string;
  subject_id: string;
  started_at: string;
  ended_at: string;
  duration_ms: number;
  xp_earned: number;
  notes: string | null;
  created_at: string;
  deleted_at: string | null;
}

export interface CloudSessionSnapshot {
  sessions: StudySession[];
  deletedSessionIds: string[];
}

const PAGE_SIZE = 500;
const UPLOAD_BATCH_SIZE = 100;

// =========================================
// FETCH CLOUD SESSION SNAPSHOT
// =========================================

export async function fetchCloudSessionSnapshot(
  expectedUserId: string
): Promise<CloudSessionSnapshot> {
  const { userId, client } =
    await requirePrivateAccount(expectedUserId);

  const rows: CloudSessionRow[] = [];

  // Fetch in pages to support accounts
  // with more than 1,000 sessions.
  for (
    let from = 0;
    ;
    from += PAGE_SIZE
  ) {
    const { data, error } = await client
      .from("study_sessions")
      .select(
                "id, subject_id, started_at, ended_at, duration_ms, xp_earned, notes, created_at, deleted_at"
            )
      .eq("user_id", userId)
      .order("created_at", {
        ascending: true,
      })
      .order("id", {
        ascending: true,
      })
      .range(
        from,
        from + PAGE_SIZE - 1
      );

    if (error) {
      throw new Error(error.message);
    }

    const batch =
      (data ?? []) as CloudSessionRow[];

    rows.push(...batch);

    if (batch.length < PAGE_SIZE) {
      break;
    }
  }

  return {
    sessions: rows
      .filter(
        (row) => row.deleted_at === null
      )
      .map((row) => ({
        id: row.id,
        subjectId: row.subject_id,
        startedAt: row.started_at,
        endedAt: row.ended_at,
        durationMs: Number(row.duration_ms),
        xpEarned: Number(row.xp_earned),
        createdAt: row.created_at,
        ...(row.notes !== null
          ? { notes: row.notes }
          : {}),
      })),

    deletedSessionIds: rows
      .filter(
        (row) => row.deleted_at !== null
      )
      .map((row) => row.id),
  };
}

// =========================================
// UPLOAD SESSIONS
// =========================================

export async function uploadCloudSessions(
  sessions: StudySession[],
  expectedUserId: string
): Promise<void> {
  if (sessions.length === 0) {
    return;
  }

  const { userId, client } =
    await requirePrivateAccount(expectedUserId);

  for (
    let start = 0;
    start < sessions.length;
    start += UPLOAD_BATCH_SIZE
  ) {
    const batch = sessions
      .slice(
        start,
        start + UPLOAD_BATCH_SIZE
      )
      .map((session) => ({
        id: session.id,
        user_id: userId,
        subject_id: session.subjectId,
        started_at: session.startedAt,
        ended_at: session.endedAt,
        duration_ms: session.durationMs,
        xp_earned: session.xpEarned,
        notes: session.notes ?? null,
        created_at: session.createdAt,
      }));

    const { error } = await client
      .from("study_sessions")
      .upsert(batch, {
        onConflict: "user_id,id",
        ignoreDuplicates: true,
      });

    if (error) {
      throw new Error(error.message);
    }
  }
}