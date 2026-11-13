
-- =========================================
-- STUDYQUEST QR LOGIN REQUESTS
-- =========================================

CREATE TABLE IF NOT EXISTS public.qr_login_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  verifier_hash TEXT NOT NULL
    CHECK (verifier_hash ~ '^[a-f0-9]{64}$'),

  verification_code VARCHAR(6) NOT NULL,

  device_label VARCHAR(80) NOT NULL
    DEFAULT 'New device',

  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (
      status IN (
        'pending',
        'approved',
        'consumed',
        'expired',
        'denied'
      )
    ),

  approved_user_id UUID
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  expires_at TIMESTAMPTZ NOT NULL
    DEFAULT (NOW() + INTERVAL '2 minutes'),

  consumed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS
  qr_login_requests_expiry_idx
ON public.qr_login_requests (expires_at);

ALTER TABLE public.qr_login_requests
ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.qr_login_requests
FROM anon, authenticated;


-- =========================================
-- STUDYQUEST QR DEVICE CREDENTIALS
-- =========================================

CREATE TABLE IF NOT EXISTS public.qr_device_credentials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  user_id UUID NOT NULL
    REFERENCES auth.users(id)
    ON DELETE CASCADE,

  device_label VARCHAR(80) NOT NULL
    DEFAULT 'StudyQuest Device',

  credential_hash TEXT NOT NULL UNIQUE
    CHECK (credential_hash ~ '^[a-f0-9]{64}$'),

  created_at TIMESTAMPTZ NOT NULL
    DEFAULT NOW(),

  expires_at TIMESTAMPTZ NOT NULL,

  last_used_at TIMESTAMPTZ,

  revoked_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS
  qr_device_credentials_user_idx
ON public.qr_device_credentials (user_id);

ALTER TABLE public.qr_device_credentials
ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.qr_device_credentials
FROM anon, authenticated;
