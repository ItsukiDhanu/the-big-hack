CREATE TABLE IF NOT EXISTS bh_team_judgements (
  team_id TEXT PRIMARY KEY REFERENCES bh_teams(id) ON DELETE CASCADE,
  innovation SMALLINT NOT NULL CHECK (innovation BETWEEN 0 AND 25),
  technical_depth SMALLINT NOT NULL CHECK (technical_depth BETWEEN 0 AND 25),
  evidence SMALLINT NOT NULL CHECK (evidence BETWEEN 0 AND 20),
  impact SMALLINT NOT NULL CHECK (impact BETWEEN 0 AND 15),
  presentation SMALLINT NOT NULL CHECK (presentation BETWEEN 0 AND 15),
  notes TEXT NOT NULL DEFAULT '' CHECK (length(notes) <= 2000),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
