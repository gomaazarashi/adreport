import { PerformanceMetrics } from './types';

/**
 * Calculate derived metrics (CTR, CVR, CPA) from raw data
 * @param data - Raw metrics data object
 * @returns Calculated metrics object
 */
export const calculateMetrics = (data: {
  cost?: number | string;
  impressions?: number | string;
  clicks?: number | string;
  conversions?: number | string;
}) => {
  const cost = parseFloat(String(data.cost)) || 0;
  const impressions = parseInt(String(data.impressions)) || 0;
  const clicks = parseInt(String(data.clicks)) || 0;
  const conversions = parseInt(String(data.conversions)) || 0;

  // Calculate derived metrics
  const ctr = impressions > 0 ? (clicks / impressions) * 100 : 0;
  const cvr = clicks > 0 ? (conversions / clicks) * 100 : 0;
  const cpa = conversions > 0 ? cost / conversions : 0;

  return {
    cost: Math.round(cost * 100) / 100,
    impressions,
    clicks,
    conversions,
    ctr: Math.round(ctr * 100) / 100,
    cvr: Math.round(cvr * 100) / 100,
    cpa: Math.round(cpa * 100) / 100,
  };
};

/**
 * Compare metrics between two periods
 * Calculates percentage change and absolute difference
 * @param current - Current period metrics
 * @param previous - Previous period metrics
 * @returns Comparison object with changes
 */
export const compareMetrics = (
  current: PerformanceMetrics,
  previous: PerformanceMetrics
) => {
  const safeDivide = (current: number, previous: number): number => {
    return previous === 0 ? 0 : (current - previous) / previous;
  };

  return {
    cost_change_pct: Math.round(safeDivide(current.cost, previous.cost) * 10000) / 100,
    impressions_change_pct: Math.round(
      safeDivide(current.impressions, previous.impressions) * 10000
    ) / 100,
    clicks_change_pct: Math.round(safeDivide(current.clicks, previous.clicks) * 10000) / 100,
    conversions_change_pct: Math.round(
      safeDivide(current.conversions, previous.conversions) * 10000
    ) / 100,
    cost_change_absolute: Math.round((current.cost - previous.cost) * 100) / 100,
    impressions_change_absolute: current.impressions - previous.impressions,
    clicks_change_absolute: current.clicks - previous.clicks,
    conversions_change_absolute: current.conversions - previous.conversions,
    ctr_change: Math.round((current.ctr - previous.ctr) * 100) / 100,
    cvr_change: Math.round((current.cvr - previous.cvr) * 100) / 100,
    cpa_change: Math.round((current.cpa - previous.cpa) * 100) / 100,
  };
};

/**
 * Aggregate metrics across multiple entries
 * Sums all metrics and recalculates derived metrics
 * @param metricsArray - Array of metrics to aggregate
 * @returns Aggregated metrics object
 */
export const aggregateMetrics = (metricsArray: PerformanceMetrics[]) => {
  if (metricsArray.length === 0) {
    return {
      total_cost: 0,
      total_impressions: 0,
      total_clicks: 0,
      total_conversions: 0,
      avg_ctr: 0,
      avg_cvr: 0,
      avg_cpa: 0,
      entry_count: 0,
    };
  }

  const total_cost = metricsArray.reduce((sum, m) => sum + m.cost, 0);
  const total_impressions = metricsArray.reduce((sum, m) => sum + m.impressions, 0);
  const total_clicks = metricsArray.reduce((sum, m) => sum + m.clicks, 0);
  const total_conversions = metricsArray.reduce((sum, m) => sum + m.conversions, 0);

  const avg_ctr =
    total_impressions > 0 ? (total_clicks / total_impressions) * 100 : 0;
  const avg_cvr = total_clicks > 0 ? (total_conversions / total_clicks) * 100 : 0;
  const avg_cpa = total_conversions > 0 ? total_cost / total_conversions : 0;

  return {
    total_cost: Math.round(total_cost * 100) / 100,
    total_impressions,
    total_clicks,
    total_conversions,
    avg_ctr: Math.round(avg_ctr * 100) / 100,
    avg_cvr: Math.round(avg_cvr * 100) / 100,
    avg_cpa: Math.round(avg_cpa * 100) / 100,
    entry_count: metricsArray.length,
  };
};

/**
 * Format currency value for display
 * @param value - Numeric value
 * @param currency - Currency code (default: JPY)
 * @returns Formatted currency string
 */
export const formatCurrency = (value: number, currency: string = 'JPY'): string => {
  if (currency === 'JPY') {
    return `¥${Math.round(value).toLocaleString('ja-JP')}`;
  }
  return `${value.toFixed(2)} ${currency}`;
};

/**
 * Format percentage value for display
 * @param value - Numeric percentage value
 * @param decimals - Number of decimal places (default: 2)
 * @returns Formatted percentage string
 */
export const formatPercentage = (value: number, decimals: number = 2): string => {
  return `${value.toFixed(decimals)}%`;
};

/**
 * Determine performance status based on metrics
 * @param current - Current metrics
 * @param previous - Previous metrics
 * @returns Status object with trend information
 */
export const analyzePerformanceStatus = (
  current: PerformanceMetrics,
  previous: PerformanceMetrics
) => {
  const comparison = compareMetrics(current, previous);

  return {
    cost_trend:
      comparison.cost_change_pct > 0
        ? 'increased'
        : comparison.cost_change_pct < 0
          ? 'decreased'
          : 'stable',
    roi_trend:
      comparison.conversions_change_pct > comparison.cost_change_pct
        ? 'improved'
        : 'declined',
    ctr_status: current.ctr > previous.ctr ? 'improved' : 'declined',
    cvr_status: current.cvr > previous.cvr ? 'improved' : 'declined',
    cpa_status: current.cpa < previous.cpa ? 'improved' : 'declined',
    overall_score: calculatePerformanceScore(current, previous),
  };
};

/**
 * Calculate an overall performance score (0-100)
 * Based on conversion efficiency and cost effectiveness
 * @param current - Current metrics
 * @param previous - Previous metrics
 * @returns Score from 0 to 100
 */
export const calculatePerformanceScore = (
  current: PerformanceMetrics,
  previous: PerformanceMetrics
): number => {
  const comparison = compareMetrics(current, previous);

  // Weighted scoring
  const ctrScore =
    comparison.ctr_change > 0
      ? Math.min(100, 50 + comparison.ctr_change * 10)
      : Math.max(0, 50 + comparison.ctr_change * 10);

  const cvrScore =
    comparison.cvr_change > 0
      ? Math.min(100, 50 + comparison.cvr_change * 10)
      : Math.max(0, 50 + comparison.cvr_change * 10);

  const cpaScore =
    comparison.cpa_change < 0
      ? Math.min(100, 50 + Math.abs(comparison.cpa_change) * 10)
      : Math.max(0, 50 - Math.abs(comparison.cpa_change) * 10);

  // Weighted average
  const score = (ctrScore * 0.3 + cvrScore * 0.4 + cpaScore * 0.3) / 100;
  return Math.round(Math.max(0, Math.min(100, score * 100)));
};

/**
 * Get anomaly detection for metrics
 * Identifies unusual patterns in data
 * @param metricsArray - Array of metrics over time
 * @returns Array of anomalies detected
 */
export const detectAnomalies = (metricsArray: PerformanceMetrics[]) => {
  if (metricsArray.length < 2) {
    return [];
  }

  const anomalies: Array<{
    index: number;
    date: string;
    type: string;
    severity: 'low' | 'medium' | 'high';
    description: string;
  }> = [];

  // Calculate average metrics
  const avg = aggregateMetrics(metricsArray);
  const avgCtr = avg.avg_ctr;
  const avgCvr = avg.avg_cvr;
  const avgCpa = avg.avg_cpa;

  metricsArray.forEach((metric, index) => {
    // Detect CTR anomaly (deviation > 30%)
    if (Math.abs(metric.ctr - avgCtr) > avgCtr * 0.3) {
      anomalies.push({
        index,
        date: metric.date,
        type: 'CTR_ANOMALY',
        severity: Math.abs(metric.ctr - avgCtr) > avgCtr * 0.5 ? 'high' : 'medium',
        description: `CTR: ${metric.ctr.toFixed(2)}% (average: ${avgCtr.toFixed(2)}%)`,
      });
    }

    // Detect CVR anomaly (deviation > 30%)
    if (metric.conversions > 0 && Math.abs(metric.cvr - avgCvr) > avgCvr * 0.3) {
      anomalies.push({
        index,
        date: metric.date,
        type: 'CVR_ANOMALY',
        severity: Math.abs(metric.cvr - avgCvr) > avgCvr * 0.5 ? 'high' : 'medium',
        description: `CVR: ${metric.cvr.toFixed(2)}% (average: ${avgCvr.toFixed(2)}%)`,
      });
    }

    // Detect CPA anomaly (deviation > 50%)
    if (metric.conversions > 0 && Math.abs(metric.cpa - avgCpa) > avgCpa * 0.5) {
      anomalies.push({
        index,
        date: metric.date,
        type: 'CPA_ANOMALY',
        severity: Math.abs(metric.cpa - avgCpa) > avgCpa ? 'high' : 'medium',
        description: `CPA: ¥${metric.cpa.toFixed(0)} (average: ¥${avgCpa.toFixed(0)})`,
      });
    }

    // Detect zero conversions
    if (metric.clicks > 0 && metric.conversions === 0) {
      anomalies.push({
        index,
        date: metric.date,
        type: 'ZERO_CONVERSIONS',
        severity: 'medium',
        description: `No conversions despite ${metric.clicks} clicks`,
      });
    }
  });

  return anomalies;
};
