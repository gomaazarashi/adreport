export type Account = {
  account_id: string;
  account_name: string;
  google_account_id: string;
  created_at: string;
  updated_at: string;
};

export type Campaign = {
  campaign_id: string;
  account_id: string;
  campaign_name: string;
  cost: number;
  impressions: number;
  clicks: number;
  conversions: number;
  created_at: string;
  data_date: string;
};

export type AdGroup = {
  ad_group_id: string;
  campaign_id: string;
  ad_group_name: string;
  cost: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cvr: number;
  cpa: number;
  created_at: string;
  data_date: string;
};

export type Ad = {
  ad_id: string;
  ad_group_id: string;
  ad_headline: string;
  ad_description: string;
  cost: number;
  impressions: number;
  clicks: number;
  ctr: number;
  conversions: number;
  cvr: number;
  cpa: number;
  created_at: string;
  data_date: string;
};

export type Asset = {
  asset_id: string;
  account_id: string;
  asset_name: string;
  asset_type: string;
  file_path: string;
  cost: number;
  impressions: number;
  clicks: number;
  conversions: number;
  created_at: string;
  data_date: string;
};

export type PerformanceMetrics = {
  metrics_id: string;
  account_id: string;
  campaign_id?: string;
  ad_group_id?: string;
  ad_id?: string;
  asset_id?: string;
  metric_date: string;
  cost: number;
  impressions: number;
  clicks: number;
  ctr: number;
  cvr: number;
  conversions: number;
  cpa: number;
  conversion_value?: number;
  cpc?: number;
  roas?: number;
  created_at?: string;
  updated_at?: string;
};

export type MetricsResponse = {
  data: PerformanceMetrics[];
  period: {
    start_date: string;
    end_date: string;
  };
};

export type ApiResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
};

export type CSVImportResponse = {
  success: boolean;
  message: string;
  imported_rows: number;
  failed_rows: number;
  errors?: Array<{
    row: number;
    error: string;
  }>;
};

export type AnalysisResult = {
  analysis: string;
  suggestions: Array<{
    title: string;
    description: string;
    impact: 'high' | 'medium' | 'low';
  }>;
  recommendations: string[];
};

export type DateRange = {
  start_date: string;
  end_date: string;
};
