CREATE TABLE IF NOT EXISTS bh_teams (
  id TEXT PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  team_name TEXT NOT NULL,
  selection_order INTEGER NOT NULL DEFAULT 0,
  leader_name TEXT NOT NULL,
  team_members JSONB NOT NULL DEFAULT '[]'::jsonb,
  member_contacts JSONB NOT NULL DEFAULT '[]'::jsonb,
  leader_email_salt TEXT NOT NULL,
  leader_email_hash TEXT NOT NULL,
  stage TEXT NOT NULL DEFAULT 'shortlisted' CHECK (stage IN ('shortlisted', 'confirmed', 'standby')),
  payment_status TEXT NOT NULL DEFAULT 'not_submitted' CHECK (payment_status IN ('not_submitted', 'pending', 'confirmed', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE bh_teams ADD COLUMN IF NOT EXISTS selection_order INTEGER NOT NULL DEFAULT 0;
ALTER TABLE bh_teams ADD COLUMN IF NOT EXISTS team_members JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE bh_teams ADD COLUMN IF NOT EXISTS member_contacts JSONB NOT NULL DEFAULT '[]'::jsonb;

CREATE TABLE IF NOT EXISTS bh_payment_proofs (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES bh_teams(id) ON DELETE CASCADE,
  image_bytes BYTEA NOT NULL,
  mime_type TEXT NOT NULL CHECK (mime_type IN ('image/jpeg', 'image/png', 'image/webp')),
  original_name TEXT NOT NULL,
  review_status TEXT NOT NULL DEFAULT 'pending' CHECK (review_status IN ('pending', 'confirmed', 'rejected')),
  review_note TEXT,
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ
);

CREATE UNIQUE INDEX IF NOT EXISTS bh_one_pending_proof_per_team
  ON bh_payment_proofs(team_id) WHERE review_status = 'pending';
CREATE INDEX IF NOT EXISTS bh_payment_proofs_team_uploaded
  ON bh_payment_proofs(team_id, uploaded_at DESC);

CREATE TABLE IF NOT EXISTS bh_admin_audit_log (
  id TEXT PRIMARY KEY,
  team_id TEXT NOT NULL REFERENCES bh_teams(id) ON DELETE CASCADE,
  proof_id TEXT REFERENCES bh_payment_proofs(id) ON DELETE SET NULL,
  action TEXT NOT NULL CHECK (action IN ('confirm_payment', 'reject_payment', 'promote_standby')),
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS bh_auth_attempts (
  id BIGSERIAL PRIMARY KEY,
  subject_hash TEXT NOT NULL,
  ip_hash TEXT NOT NULL,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS bh_auth_attempts_recent_subject
  ON bh_auth_attempts(subject_hash, attempted_at DESC);
CREATE INDEX IF NOT EXISTS bh_auth_attempts_recent_ip
  ON bh_auth_attempts(ip_hash, attempted_at DESC);
