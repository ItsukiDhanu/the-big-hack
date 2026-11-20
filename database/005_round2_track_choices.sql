ALTER TABLE bh_teams
  ADD COLUMN IF NOT EXISTS round2_track_id TEXT,
  ADD COLUMN IF NOT EXISTS round2_problem_statement_id TEXT,
  ADD COLUMN IF NOT EXISTS round3_slot SMALLINT CHECK (round3_slot BETWEEN 1 AND 10);

CREATE INDEX IF NOT EXISTS bh_teams_round2_track
  ON bh_teams(round2_track_id, round2_problem_statement_id)
  WHERE round2_track_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS bh_teams_round3_track_slot
  ON bh_teams(round2_track_id, round3_slot)
  WHERE round3_slot IS NOT NULL;

INSERT INTO bh_app_settings (setting_key, enabled)
VALUES ('round2_choices_open', FALSE)
ON CONFLICT (setting_key) DO NOTHING;
