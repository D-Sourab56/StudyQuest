
-- =========================================
-- STUDYQUEST PERMANENT QR CREDENTIALS
-- =========================================

CREATE TABLE public.qr_account_credentials (
  user_id UUID PRIMARY KEY
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  secret_hash TEXT NOT NULL UNIQUE
    CHECK (secret_hash ~ '^[a-f0-9]{64}$'),

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  updated_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  revoked_at TIMESTAMPTZ
);

-- Protect permanent QR credentials.
ALTER TABLE public.qr_account_credentials
ENABLE ROW LEVEL SECURITY;

-- Only privileged backend operations
-- may access this table.
REVOKE ALL ON public.qr_account_credentials
FROM anon, authenticated;
