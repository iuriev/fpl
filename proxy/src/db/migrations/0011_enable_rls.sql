-- Enable Row-Level Security on all tables.
-- The proxy connects via the service_role key, which bypasses RLS automatically.
-- No policies are needed for server-side access; this migration blocks anonymous
-- API access to all tables, resolving the Supabase security advisories:
--   rls_disabled_in_public / sensitive_columns_exposed

ALTER TABLE "user" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "session" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "account" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "verification" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "watchlist_entry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "player_watchlist_entry" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "transfer_draft" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "fpl_meta" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fpl_bootstrap_cache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fpl_gw_live_cache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fpl_squad_cache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fpl_dream_team_cache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fpl_history_cache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fpl_transfers_cache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fpl_element_summary_cache" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "fpl_fixtures_cache" ENABLE ROW LEVEL SECURITY;

ALTER TABLE "pred_model_run" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pred_epl_match" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pred_team_alias" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pred_player_gw_fact" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pred_team_strength" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pred_fixture_team" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "pred_player_gw" ENABLE ROW LEVEL SECURITY;
