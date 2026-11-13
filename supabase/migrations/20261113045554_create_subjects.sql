-- =========================================
-- STUDYQUEST SUBJECT CLOUD SYNC
-- =========================================

CREATE TABLE IF NOT EXISTS public.subjects (
  id TEXT NOT NULL,

  user_id UUID NOT NULL
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  name TEXT NOT NULL,

  category TEXT,

  progress NUMERIC NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  deleted_at TIMESTAMPTZ,

  CONSTRAINT subjects_pkey
    PRIMARY KEY (user_id, id)
);

-- =========================================
-- INDEXES
-- =========================================

CREATE INDEX IF NOT EXISTS
  subjects_user_deleted_idx
ON public.subjects (user_id, deleted_at);

-- =========================================
-- SECURITY
-- =========================================

ALTER TABLE public.subjects
ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.subjects FROM anon;

GRANT SELECT, INSERT, UPDATE
ON public.subjects TO authenticated;

-- =========================================
-- SELECT POLICY
-- =========================================

CREATE POLICY "Users can view own subjects"
ON public.subjects
FOR SELECT
TO authenticated
USING (
  (SELECT auth.uid()) = user_id
);

-- =========================================
-- INSERT POLICY
-- =========================================

CREATE POLICY "Users can create own subjects"
ON public.subjects
FOR INSERT
TO authenticated
WITH CHECK (
  (SELECT auth.uid()) = user_id
);

-- =========================================
-- UPDATE POLICY
-- =========================================

CREATE POLICY "Users can update own subjects"
ON public.subjects
FOR UPDATE
TO authenticated
USING (
  (SELECT auth.uid()) = user_id
)
WITH CHECK (
  (SELECT auth.uid()) = user_id
);