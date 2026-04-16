-- Phase 2-1: Row Level Security Policies for Google Ads Report Automation
-- Run this AFTER 01_initial_schema.sql

-- ============================================================
-- ENABLE ROW LEVEL SECURITY ON ALL TABLES
-- ============================================================

ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE ad_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE ads ENABLE ROW LEVEL SECURITY;
ALTER TABLE assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE performance_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE import_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE analysis_comments ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- ACCOUNTS POLICIES
-- ============================================================

-- Users can view their own accounts
CREATE POLICY "Users can view their own accounts"
  ON accounts FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can create accounts
CREATE POLICY "Users can create accounts"
  ON accounts FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own accounts
CREATE POLICY "Users can update their own accounts"
  ON accounts FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Only service role can delete accounts
CREATE POLICY "Service role can delete accounts"
  ON accounts FOR DELETE
  USING (auth.role() = 'service_role');

-- Allow anon to read active accounts (for public dashboards)
CREATE POLICY "Anon can view active accounts"
  ON accounts FOR SELECT
  USING (is_active = true AND auth.role() = 'anon');

-- ============================================================
-- CAMPAIGNS POLICIES
-- ============================================================

-- Users can view campaigns in their accounts
CREATE POLICY "Users can view campaigns in their accounts"
  ON campaigns FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- Users can create campaigns
CREATE POLICY "Users can create campaigns"
  ON campaigns FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update campaigns
CREATE POLICY "Users can update campaigns"
  ON campaigns FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Only service role can delete campaigns
CREATE POLICY "Service role can delete campaigns"
  ON campaigns FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- AD_GROUPS POLICIES
-- ============================================================

-- Users can view ad groups
CREATE POLICY "Users can view ad groups"
  ON ad_groups FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- Users can create ad groups
CREATE POLICY "Users can create ad groups"
  ON ad_groups FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update ad groups
CREATE POLICY "Users can update ad groups"
  ON ad_groups FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Only service role can delete ad groups
CREATE POLICY "Service role can delete ad groups"
  ON ad_groups FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- ADS POLICIES
-- ============================================================

-- Users can view ads
CREATE POLICY "Users can view ads"
  ON ads FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- Users can create ads
CREATE POLICY "Users can create ads"
  ON ads FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update ads
CREATE POLICY "Users can update ads"
  ON ads FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Only service role can delete ads
CREATE POLICY "Service role can delete ads"
  ON ads FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- ASSETS POLICIES
-- ============================================================

-- Users can view assets in their accounts
CREATE POLICY "Users can view assets in their accounts"
  ON assets FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- Users can create assets
CREATE POLICY "Users can create assets"
  ON assets FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update assets
CREATE POLICY "Users can update assets"
  ON assets FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Only service role can delete assets
CREATE POLICY "Service role can delete assets"
  ON assets FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- PERFORMANCE_METRICS POLICIES
-- ============================================================

-- Users can view metrics for their accounts
CREATE POLICY "Users can view metrics for their accounts"
  ON performance_metrics FOR SELECT
  USING (auth.role() IN ('authenticated', 'anon'));

-- Service role and authenticated users can insert metrics (via CSV import)
CREATE POLICY "Authenticated users can insert metrics"
  ON performance_metrics FOR INSERT
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- Only service role can update metrics
CREATE POLICY "Service role can update metrics"
  ON performance_metrics FOR UPDATE
  USING (auth.role() = 'service_role');

-- Only service role can delete metrics
CREATE POLICY "Service role can delete metrics"
  ON performance_metrics FOR DELETE
  USING (auth.role() = 'service_role');

-- ============================================================
-- IMPORT_HISTORY POLICIES
-- ============================================================

-- Users can view import history
CREATE POLICY "Users can view import history"
  ON import_history FOR SELECT
  USING (auth.role() = 'authenticated');

-- Authenticated users can create import history records
CREATE POLICY "Authenticated users can create import history"
  ON import_history FOR INSERT
  WITH CHECK (auth.role() IN ('authenticated', 'service_role'));

-- Only service role can update import history
CREATE POLICY "Service role can update import history"
  ON import_history FOR UPDATE
  USING (auth.role() = 'service_role');

-- ============================================================
-- ANALYSIS_COMMENTS POLICIES
-- ============================================================

-- Users can view analysis comments
CREATE POLICY "Users can view analysis comments"
  ON analysis_comments FOR SELECT
  USING (auth.role() = 'authenticated');

-- Users can create analysis comments
CREATE POLICY "Users can create analysis comments"
  ON analysis_comments FOR INSERT
  WITH CHECK (auth.role() = 'authenticated');

-- Users can update their own comments
CREATE POLICY "Users can update analysis comments"
  ON analysis_comments FOR UPDATE
  USING (auth.role() = 'authenticated');

-- Users can delete their own comments
CREATE POLICY "Users can delete analysis comments"
  ON analysis_comments FOR DELETE
  USING (auth.role() = 'authenticated');

-- ============================================================
-- ADDITIONAL GRANTS
-- ============================================================

-- Grant usage on sequences to authenticated users
GRANT USAGE ON ALL SEQUENCES IN SCHEMA public TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- Grant read/write to authenticated users
GRANT SELECT, INSERT, UPDATE ON accounts TO authenticated;
GRANT SELECT, INSERT, UPDATE ON campaigns TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ad_groups TO authenticated;
GRANT SELECT, INSERT, UPDATE ON ads TO authenticated;
GRANT SELECT, INSERT, UPDATE ON assets TO authenticated;
GRANT SELECT, INSERT ON performance_metrics TO authenticated;
GRANT SELECT, INSERT ON import_history TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON analysis_comments TO authenticated;
