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

-- ============================================================
-- ADS (Phase 3-2 test data)
-- ============================================================
-- 8 ads total: 3 under AG-001, 2 under AG-002, 3 under AG-003.
-- TEXT_AD for SEARCH campaigns; RESPONSIVE_DISPLAY_AD for DISPLAY.

INSERT INTO ads (ad_id, ad_group_id, google_ad_id, ad_headline, ad_description, ad_type, status) VALUES
-- ad_group_1 (AG-001) — SEARCH ads
('550e8400-e29b-41d4-a716-446655440301', '550e8400-e29b-41d4-a716-446655440201', 'AD-0001',
 '春の新作セール開催中', '最大50%OFFの特別価格でご提供。期間限定キャンペーン実施中。', 'TEXT_AD', 'ENABLED'),
('550e8400-e29b-41d4-a716-446655440302', '550e8400-e29b-41d4-a716-446655440201', 'AD-0002',
 '人気商品が今だけ送料無料', '対象商品10,000円以上のお買い物で送料無料。お早めにどうぞ。', 'TEXT_AD', 'ENABLED'),
('550e8400-e29b-41d4-a716-446655440303', '550e8400-e29b-41d4-a716-446655440201', 'AD-0003',
 '会員限定クーポン配布中', '新規会員登録で1,000円OFFクーポンを今すぐプレゼント。', 'TEXT_AD', 'PAUSED'),

-- ad_group_2 (AG-002) — SEARCH ads
('550e8400-e29b-41d4-a716-446655440304', '550e8400-e29b-41d4-a716-446655440202', 'AD-0004',
 '初回限定30%OFF', '初めてのご注文で30%OFFクーポンを自動適用。', 'TEXT_AD', 'ENABLED'),
('550e8400-e29b-41d4-a716-446655440305', '550e8400-e29b-41d4-a716-446655440202', 'AD-0005',
 '翌日お届け対応', '13時までのご注文で翌日お届け(一部地域を除く)。', 'TEXT_AD', 'ENABLED'),

-- ad_group_3 (AG-003) — DISPLAY ads
('550e8400-e29b-41d4-a716-446655440306', '550e8400-e29b-41d4-a716-446655440203', 'AD-0006',
 '新生活応援フェア', '春の新生活を応援する特別キャンペーンを実施中。', 'RESPONSIVE_DISPLAY_AD', 'ENABLED'),
('550e8400-e29b-41d4-a716-446655440307', '550e8400-e29b-41d4-a716-446655440203', 'AD-0007',
 'ブランド一斉セール', '人気ブランドが最大70%OFFの大特価。在庫限り。', 'RESPONSIVE_DISPLAY_AD', 'ENABLED'),
('550e8400-e29b-41d4-a716-446655440308', '550e8400-e29b-41d4-a716-446655440203', 'AD-0008',
 '期間限定ポイント10倍', '対象商品のご購入でポイント10倍進呈。', 'RESPONSIVE_DISPLAY_AD', 'PAUSED')
ON CONFLICT DO NOTHING;

-- ============================================================
-- ASSETS (Phase 3-2 test data)
-- ============================================================
-- 4 assets for account A (active marketing account), 2 for account B.

INSERT INTO assets (asset_id, account_id, asset_name, asset_type, file_path, file_size, file_mime_type, is_active) VALUES
-- account A
('550e8400-e29b-41d4-a716-446655440401', '550e8400-e29b-41d4-a716-446655440001',
 'バナー画像_春セール', 'image', '/assets/account_a/spring_banner.png', 524288, 'image/png', true),
('550e8400-e29b-41d4-a716-446655440402', '550e8400-e29b-41d4-a716-446655440001',
 '商品紹介動画_新作コレクション', 'video', '/assets/account_a/product_intro.mp4', 15728640, 'video/mp4', true),
('550e8400-e29b-41d4-a716-446655440403', '550e8400-e29b-41d4-a716-446655440001',
 'テキスト広告_見出し集', 'text', '/assets/account_a/headlines.txt', 4096, 'text/plain', true),
('550e8400-e29b-41d4-a716-446655440404', '550e8400-e29b-41d4-a716-446655440001',
 'ロゴ画像_メイン', 'image', '/assets/account_a/logo_main.png', 102400, 'image/png', true),

-- account B
('550e8400-e29b-41d4-a716-446655440405', '550e8400-e29b-41d4-a716-446655440002',
 '商品画像_ショッピング広告', 'image', '/assets/account_b/products.jpg', 819200, 'image/jpeg', true),
('550e8400-e29b-41d4-a716-446655440406', '550e8400-e29b-41d4-a716-446655440002',
 'プロモ動画_新規顧客向け', 'video', '/assets/account_b/new_customer_promo.mp4', 31457280, 'video/mp4', false)
ON CONFLICT DO NOTHING;
