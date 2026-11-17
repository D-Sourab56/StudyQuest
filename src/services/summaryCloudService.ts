import type { StudySummary } from "../types/summary";

import {
  requirePrivateAccount,
} from "./subjectCloudService";

// =========================================
// TYPES
// =========================================

interface CloudSummaryRow {
  id: string;
  subject_id: string;
  session_id: string | null;
  topic: string;
  content: string;
  created_at: string;
  deleted_at: string | null;
}

export interface CloudSummarySnapshot {
  summaries: StudySummary[];
  deletedSummaryIds: string[];
}

const PAGE_SIZE = 500;

// =========================================
// FETCH SUMMARIES
// =========================================

export async function fetchCloudSummarySnapshot(
  expectedUserId: string
): Promise<CloudSummarySnapshot> {
  const { userId, client } =
    await requirePrivateAccount(expectedUserId);

  const rows: CloudSummaryRow[] = [];

  for (
    let from = 0;
    ;
    from += PAGE_SIZE
  ) {
    const { data, error } = await client
      .from("study_summaries")
      .select(
        "id, subject_id, session_id, topic, content, created_at, deleted_at"
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
      (data ?? []) as CloudSummaryRow[];

    rows.push(...batch);

    if (batch.length < PAGE_SIZE) {
      break;
    }
  }

  return {
    summaries: rows
      .filter(
        (row) => row.deleted_at === null
      )
      .map((row) => ({
        id: row.id,
        subjectId: row.subject_id,
        sessionId:
          row.session_id ?? undefined,
        topic: row.topic,
        content: row.content,
        createdAt: row.created_at,
      })),

    deletedSummaryIds: rows
      .filter(
        (row) => row.deleted_at !== null
      )
      .map((row) => row.id),
  };
}

// =========================================
// SAVE OR UPDATE SUMMARY
// =========================================

export async function saveCloudSummary(
  summary: StudySummary,
  expectedUserId: string
): Promise<void> {
  const { userId, client } =
    await requirePrivateAccount(expectedUserId);

  const { error } = await client
    .from("study_summaries")
    .upsert(
      {
        id: summary.id,
        user_id: userId,
        subject_id: summary.subjectId,
        session_id:
          summary.sessionId ?? null,
        topic: summary.topic,
        content: summary.content,
        created_at: summary.createdAt,
        updated_at:
          new Date().toISOString(),
        deleted_at: null,
      },
      {
        onConflict: "user_id,id",
      }
    );

  if (error) {
    throw new Error(error.message);
  }
}

// =========================================
// SOFT DELETE SUMMARY
// =========================================

export async function deleteCloudSummary(
  summaryId: string,
  expectedUserId: string
): Promise<void> {
  const { userId, client } =
    await requirePrivateAccount(expectedUserId);

  const now = new Date().toISOString();

  const { error } = await client
    .from("study_summaries")
    .update({
      deleted_at: now,
      updated_at: now,
    })
    .eq("user_id", userId)
    .eq("id", summaryId);

  if (error) {
    throw new Error(error.message);
  }
}