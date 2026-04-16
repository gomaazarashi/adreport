-- Phase 2-1: Initial Database Schema for Google Ads Report Automation
-- Created for adreport project

-- Enable UUID extension if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable MODD extension for timestamps
CREATE EXTENSION IF NOT EXISTS "moddatetime";

-- ============================================================
-- ACCOUNTS TABLE
-- ============================================================
-- Stores Google Ads account information
CREATE TABLE IF NOT EXISTS accounts (
  account_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_name VARCHAR(255) NOT NULL UNIQUE,
  google_account_id VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add comment to table
COMMENT ON TABLE accounts IS 'Google Ads accounts managed in the system';
COMMENT ON COLUMN accounts.account_id IS 'Unique identifier for the account';
COMMENT ON COLUMN accounts.account_name IS 'Account display name';
COMMENT ON COLUMN accounts.google_account_id IS 'Google Ads Customer ID';
COMMENT ON COLUMN accounts.is_active IS 'Whether the account is currently active';

-- Create index for faster queries
CREATE INDEX idx_accounts_google_id ON accounts(google_account_id);
CREATE INDEX idx_accounts_active ON accounts(is_active);

-- ============================================================
-- CAMPAIGNS TABLE
-- ============================================================
-- Stores campaign-level data from Google Ads
CREATE TABLE IF NOT EXISTS campaigns (
  campaign_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
  campaign_name VARCHAR(255) NOT NULL,
  google_campaign_id VARCHAR(255),
  campaign_type VARCHAR(50),
  status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE campaigns IS 'Google Ads campaigns';
COMMENT ON COLUMN campaigns.campaign_id IS 'Unique identifier for the campaign';
COMMENT ON COLUMN campaigns.account_id IS 'Reference to parent account';
COMMENT ON COLUMN campaigns.google_campaign_id IS 'Google Ads Campaign ID';

CREATE INDEX idx_campaigns_account ON campaigns(account_id);
CREATE INDEX idx_campaigns_google_id ON campaigns(google_campaign_id);

-- ============================================================
-- AD_GROUPS TABLE
-- ============================================================
-- Stores ad group-level data
CREATE TABLE IF NOT EXISTS ad_groups (
  ad_group_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  ad_group_name VARCHAR(255) NOT NULL,
  google_ad_group_id VARCHAR(255),
  status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE ad_groups IS 'Google Ads ad groups';
COMMENT ON COLUMN ad_groups.ad_group_id IS 'Unique identifier for the ad group';
COMMENT ON COLUMN ad_groups.campaign_id IS 'Reference to parent campaign';

CREATE INDEX idx_ad_groups_campaign ON ad_groups(campaign_id);
CREATE INDEX idx_ad_groups_google_id ON ad_groups(google_ad_group_id);

-- ============================================================
-- ADS TABLE
-- ============================================================
-- Stores individual ad (creative) data
CREATE TABLE IF NOT EXISTS ads (
  ad_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  ad_group_id UUID NOT NULL REFERENCES ad_groups(ad_group_id) ON DELETE CASCADE,
  google_ad_id VARCHAR(255),
  ad_headline VARCHAR(255),
  ad_description TEXT,
  ad_type VARCHAR(50),
  status VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE ads IS 'Google Ads creative ads/copy';
COMMENT ON COLUMN ads.ad_id IS 'Unique identifier for the ad';
COMMENT ON COLUMN ads.ad_group_id IS 'Reference to parent ad group';
COMMENT ON COLUMN ads.google_ad_id IS 'Google Ads Ad ID';

CREATE INDEX idx_ads_ad_group ON ads(ad_group_id);
CREATE INDEX idx_ads_google_id ON ads(google_ad_id);

-- ============================================================
-- ASSETS TABLE
-- ============================================================
-- Stores asset/image files and their metadata
CREATE TABLE IF NOT EXISTS assets (
  asset_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
  asset_name VARCHAR(255) NOT NULL,
  asset_type VARCHAR(50), -- image, video, text
  file_path VARCHAR(512),
  file_size INTEGER, -- in bytes
  file_mime_type VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE assets IS 'Creative assets (images, videos, etc.)';
COMMENT ON COLUMN assets.asset_id IS 'Unique identifier for the asset';
COMMENT ON COLUMN assets.account_id IS 'Reference to parent account';
COMMENT ON COLUMN assets.asset_type IS 'Type of asset: image, video, or text';
COMMENT ON COLUMN assets.file_path IS 'Storage path for the asset file';

CREATE INDEX idx_assets_account ON assets(account_id);
CREATE INDEX idx_assets_type ON assets(asset_type);

-- ============================================================
-- PERFORMANCE_METRICS TABLE
-- ============================================================
-- Stores daily performance metrics from Google Ads
CREATE TABLE IF NOT EXISTS performance_metrics (
  metrics_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(campaign_id) ON DELETE SET NULL,
  ad_group_id UUID REFERENCES ad_groups(ad_group_id) ON DELETE SET NULL,
  ad_id UUID REFERENCES ads(ad_id) ON DELETE SET NULL,
  asset_id UUID REFERENCES assets(asset_id) ON DELETE SET NULL,
  metric_date DATE NOT NULL,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  cost DECIMAL(12, 2) DEFAULT 0.00,
  conversions INTEGER DEFAULT 0,
  conversion_value DECIMAL(12, 2) DEFAULT 0.00,
  ctr DECIMAL(5, 3) DEFAULT 0, -- Click-Through Rate (%)
  cvr DECIMAL(5, 3) DEFAULT 0, -- Conversion Rate (%)
  cpc DECIMAL(10, 2) DEFAULT 0, -- Cost Per Click
  cpa DECIMAL(10, 2) DEFAULT 0, -- Cost Per Acquisition
  roas DECIMAL(5, 2) DEFAULT 0, -- Return On Ad Spend
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Composite primary key to prevent duplicate entries
  CONSTRAINT unique_daily_metrics UNIQUE(account_id, campaign_id, ad_group_id, ad_id, asset_id, metric_date)
);

COMMENT ON TABLE performance_metrics IS 'Daily performance metrics from Google Ads';
COMMENT ON COLUMN performance_metrics.metrics_id IS 'Unique identifier for the metric record';
COMMENT ON COLUMN performance_metrics.metric_date IS 'Date of the metric';
COMMENT ON COLUMN performance_metrics.ctr IS 'Click-through rate as percentage';
COMMENT ON COLUMN performance_metrics.cvr IS 'Conversion rate as percentage';

CREATE INDEX idx_metrics_account_date ON performance_metrics(account_id, metric_date);
CREATE INDEX idx_metrics_campaign_date ON performance_metrics(campaign_id, metric_date);
CREATE INDEX idx_metrics_ad_group_date ON performance_metrics(ad_group_id, metric_date);
CREATE INDEX idx_metrics_date ON performance_metrics(metric_date DESC);

-- ============================================================
-- IMPORT_HISTORY TABLE
-- ============================================================
-- Track CSV import history for auditing
CREATE TABLE IF NOT EXISTS import_history (
  import_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID NOT NULL REFERENCES accounts(account_id) ON DELETE CASCADE,
  file_name VARCHAR(255) NOT NULL,
  file_size INTEGER,
  rows_imported INTEGER,
  rows_failed INTEGER,
  import_status VARCHAR(50), -- success, partial, failed
  error_message TEXT,
  imported_by VARCHAR(255),
  import_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE import_history IS 'History of CSV imports for audit trail';
COMMENT ON COLUMN import_history.import_id IS 'Unique import identifier';
COMMENT ON COLUMN import_history.import_status IS 'Status of the import: success, partial, or failed';

CREATE INDEX idx_import_history_account ON import_history(account_id);
CREATE INDEX idx_import_history_date ON import_history(import_date DESC);

-- ============================================================
-- ANALYSIS_COMMENTS TABLE
-- ============================================================
-- Store operational comments and analysis notes
CREATE TABLE IF NOT EXISTS analysis_comments (
  comment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  account_id UUID REFERENCES accounts(account_id) ON DELETE CASCADE,
  campaign_id UUID REFERENCES campaigns(campaign_id) ON DELETE CASCADE,
  ad_group_id UUID REFERENCES ad_groups(ad_group_id) ON DELETE CASCADE,
  comment_type VARCHAR(50), -- improvement, observation, note
  comment_text TEXT NOT NULL,
  commented_by VARCHAR(255),
  comment_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE analysis_comments IS 'Operational comments and improvement notes';
COMMENT ON COLUMN analysis_comments.comment_id IS 'Unique comment identifier';
COMMENT ON COLUMN analysis_comments.comment_type IS 'Type of comment: improvement, observation, or note';

CREATE INDEX idx_comments_account ON analysis_comments(account_id);
CREATE INDEX idx_comments_campaign ON analysis_comments(campaign_id);
CREATE INDEX idx_comments_date ON analysis_comments(created_at DESC);

-- ============================================================
-- AUTO UPDATE TRIGGER for updated_at columns
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all tables with updated_at
CREATE TRIGGER update_accounts_updated_at BEFORE UPDATE ON accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ad_groups_updated_at BEFORE UPDATE ON ad_groups
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ads_updated_at BEFORE UPDATE ON ads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_assets_updated_at BEFORE UPDATE ON assets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_metrics_updated_at BEFORE UPDATE ON performance_metrics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_comments_updated_at BEFORE UPDATE ON analysis_comments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- Grant default permissions
-- ============================================================

-- Allow anon role to read public data
GRANT SELECT ON accounts, campaigns, ad_groups, ads, assets, performance_metrics TO anon;
GRANT SELECT ON import_history TO anon;
