ALTER TABLE bh_teams ADD COLUMN IF NOT EXISTS github_repo_url TEXT;
ALTER TABLE bh_teams ADD COLUMN IF NOT EXISTS leader_phone TEXT;

CREATE TABLE IF NOT EXISTS bh_app_settings (
  setting_key TEXT PRIMARY KEY,
  enabled BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO bh_app_settings (setting_key, enabled)
VALUES ('github_repo_submission_enabled', FALSE)
ON CONFLICT (setting_key) DO NOTHING;
