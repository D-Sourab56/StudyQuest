
import type { SupabaseClient } from "@supabase/supabase-js";

import {
  supabase,
  qrSupabase,
  getSavedQrDevice,
  getQrAccessToken,
} from "../lib/supabase";
import type { StudySubject } from "../types/subject";


// =========================================
// DATABASE ROW TYPE
// =========================================

interface CloudSubjectRow {
  id: string;
  user_id: string;
  name: string;
  category: string | null;
  progress: number;
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

// =========================================
// VERIFY PRIVATE ACCOUNT
// =========================================


async function requirePrivateAccount(
  expectedUserId?: string
): Promise<{
  userId: string;
  client: SupabaseClient;
}> {
  // =====================================
  // ORIGINAL ANONYMOUS PRIVATE ACCOUNT
  // =====================================

  const { data } = await supabase.auth.getUser();

  if (data.user) {
    if (data.user.is_anonymous !== true) {
      throw new Error(
        "An authenticated private account is required."
      );
    }

    if (
      expectedUserId &&
      data.user.id !== expectedUserId
    ) {
      throw new Error(
        "Cloud operation blocked: private account mismatch."
      );
    }

    return {
      userId: data.user.id,
      client: supabase,
    };
  }

  // =====================================
  // QR AUTHORIZED PRIVATE ACCOUNT
  // =====================================

  const device = getSavedQrDevice();

  if (!device) {
    throw new Error(
      "An authenticated private account is required."
    );
  }

  const token = await getQrAccessToken();

  if (!token) {
    throw new Error(
      "QR account authentication failed."
    );
  }

  if (
    expectedUserId &&
    device.accountId !== expectedUserId
  ) {
    throw new Error(
      "Cloud operation blocked: private account mismatch."
    );
  }

  return {
    userId: device.accountId,
    client: qrSupabase,
  };
}


// =========================================
// FETCH CLOUD SUBJECTS
// =========================================

export async function fetchCloudSubjects(
  expectedUserId?: string
): Promise<StudySubject[]> {
  const { userId, client } =
  await requirePrivateAccount(expectedUserId);

  const { data, error } = await client
  .from("subjects")
    .select(
      "id, user_id, name, category, progress, created_at, updated_at, deleted_at"
    )
    .eq("user_id", userId)
    .is("deleted_at", null)
    .order("created_at", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as CloudSubjectRow[]).map(
    (row) => ({
      id: row.id,
      name: row.name,
      category: row.category ?? undefined,
      progress: row.progress,
      createdAt: row.created_at,
    })
  );
}

// =========================================
// FETCH COMPLETE CLOUD SUBJECT SNAPSHOT
// =========================================

export interface CloudSubjectSnapshot {
  subjects: StudySubject[];
  deletedSubjectIds: string[];
}

export async function fetchCloudSubjectSnapshot(
  expectedUserId?: string
): Promise<CloudSubjectSnapshot> {
  const { userId, client } =
    await requirePrivateAccount(expectedUserId);

  const { data, error } = await client
    .from("subjects")
    .select(
      "id, user_id, name, category, progress, created_at, updated_at, deleted_at"
    )
    .eq("user_id", userId)
    .order("created_at", {
      ascending: true,
    });

  if (error) {
    throw new Error(error.message);
  }

  const rows =
    (data ?? []) as CloudSubjectRow[];

  return {
    subjects: rows
      .filter((row) => row.deleted_at === null)
      .map((row) => ({
        id: row.id,
        name: row.name,
        category: row.category ?? undefined,
        progress: row.progress,
        createdAt: row.created_at,
      })),

    deletedSubjectIds: rows
      .filter((row) => row.deleted_at !== null)
      .map((row) => row.id),
  };
}

// =========================================
// UPLOAD OR UPDATE ONE SUBJECT
// =========================================

export async function saveCloudSubject(
  subject: StudySubject,
  expectedUserId?: string
): Promise<void> {
  const { userId, client } =
  await requirePrivateAccount(expectedUserId);

  const { error } = await client.from("subjects")
    .upsert(
      {
        id: subject.id,
        user_id: userId,
        name: subject.name,
        category: subject.category ?? null,
        progress: subject.progress,
        created_at: subject.createdAt,
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
// SOFT DELETE ONE SUBJECT
// =========================================

export async function deleteCloudSubject(
  subjectId: string,
  expectedUserId?: string
): Promise<void> {
  const { userId, client } =
  await requirePrivateAccount(expectedUserId);

const { error } = await client
  .from("subjects")
    .update({
      deleted_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("id", subjectId);

  if (error) {
    throw new Error(error.message);
  }
}

// =========================================
// EXPORT SERVICE
// =========================================

export const subjectCloudService = {
  fetchCloudSubjects,
  fetchCloudSubjectSnapshot,
  saveCloudSubject,
  deleteCloudSubject,
};
