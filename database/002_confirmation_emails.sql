ALTER TABLE bh_teams
  ADD COLUMN IF NOT EXISTS leader_email_ciphertext TEXT;

CREATE TABLE IF NOT EXISTS bh_confirmation_emails (
  proof_id TEXT PRIMARY KEY REFERENCES bh_payment_proofs(id) ON DELETE CASCADE,
  team_id TEXT NOT NULL REFERENCES bh_teams(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'queued'
    CHECK (status IN ('queued', 'sending', 'sent', 'failed')),
  attempt_count INTEGER NOT NULL DEFAULT 0,
  provider_message_id TEXT,
  error_code TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  sent_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS bh_confirmation_emails_team_status
  ON bh_confirmation_emails(team_id, status);
