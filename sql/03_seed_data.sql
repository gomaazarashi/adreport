-- Phase 2-3: Seed Data for Testing
-- Development test accounts, campaigns, and ad groups

INSERT INTO accounts (account_id, account_name, google_account_id, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'テストアカウント_A', 'ggl_001_a', true),
('550e8400-e29b-41d4-a716-446655440002', 'テストアカウント_B', 'ggl_001_b', true)
ON CONFLICT DO NOTHING;

INSERT INTO campaigns (campaign_id, account_id, campaign_name, campaign_type, status) VALUES
('550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440001', 'キャンペーン_A1', 'SEARCH', 'ENABLED'),
('550e8400-e29b-41d4-a716-446655440102', '550e8400-e29b-41d4-a716-446655440001', 'キャンペーン_A2', 'DISPLAY', 'ENABLED'),
('550e8400-e29b-41d4-a716-446655440103', '550e8400-e29b-41d4-a716-446655440002', 'キャンペーン_B1', 'SHOPPING', 'ENABLED')
ON CONFLICT DO NOTHING;

INSERT INTO ad_groups (ad_group_id, campaign_id, ad_group_name, google_ad_group_id, status) VALUES
('550e8400-e29b-41d4-a716-446655440201', '550e8400-e29b-41d4-a716-446655440101', '広告グループ_1', 'AG-001', 'ENABLED'),
('550e8400-e29b-41d4-a716-446655440202', '550e8400-e29b-41d4-a716-446655440101', '広告グループ_2', 'AG-002', 'ENABLED'),
('550e8400-e29b-41d4-a716-446655440203', '550e8400-e29b-41d4-a716-446655440102', '広告グループ_3', 'AG-003', 'ENABLED')
ON CONFLICT DO NOTHING;

INSERT INTO performance_metrics (account_id, campaign_id, ad_group_id, metric_date, impressions, clicks, cost, conversions, ctr, cvr, cpa) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440201', '2024-04-01', 10000, 300, 5000.0, 30, 3.0, 10.0, 166.67),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440201', '2024-04-02', 12000, 360, 6000.0, 36, 3.0, 10.0, 166.67),
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440101', '550e8400-e29b-41d4-a716-446655440201', '2024-04-03', 11000, 330, 5500.0, 33, 3.0, 10.0, 166.67)
ON CONFLICT DO NOTHING;
