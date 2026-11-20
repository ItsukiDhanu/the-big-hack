ALTER TABLE bh_teams DROP CONSTRAINT IF EXISTS bh_teams_stage_check;
ALTER TABLE bh_teams
  ADD CONSTRAINT bh_teams_stage_check
  CHECK (stage IN ('shortlisted', 'confirmed', 'standby'));

ALTER TABLE bh_admin_audit_log DROP CONSTRAINT IF EXISTS bh_admin_audit_log_action_check;
ALTER TABLE bh_admin_audit_log
  ADD CONSTRAINT bh_admin_audit_log_action_check
  CHECK (action IN ('confirm_payment', 'reject_payment', 'promote_standby'));
