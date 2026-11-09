
import { supabase } from "../lib/supabase";
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
): Promise<string> {
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user || !data.user.is_anonymous) {
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

  return data.user.id;
}

// =========================================
// FETCH CLOUD SUBJECTS
// =========================================

export async function fetchCloudSubjects(
  expectedUserId?: string
): Promise<StudySubject[]> {
  const userId = await requirePrivateAccount(
    expectedUserId
  );

  const { data, error } = await supabase
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
// UPLOAD OR UPDATE ONE SUBJECT
// =========================================

export async function saveCloudSubject(
  subject: StudySubject,
  expectedUserId?: string
): Promise<void> {
  const userId = await requirePrivateAccount(
    expectedUserId
  );

  const { error } = await supabase
    .from("subjects")
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
  const userId = await requirePrivateAccount(
    expectedUserId
  );

  const { error } = await supabase
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
  saveCloudSubject,
  deleteCloudSubject,
};
