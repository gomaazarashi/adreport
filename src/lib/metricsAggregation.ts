import { PerformanceMetrics } from './types';

/**
 * GROUP BY-style aggregation utilities for PerformanceMetrics.
 *
 * NOTE: `src/lib/metrics-calculator.ts` also exports an `aggregateMetrics`
 * function, but its signature is different — it reduces an array to a single
 * summary object. The `aggregateMetrics` exported here returns
 * `PerformanceMetrics[]` (one row per group), mimicking SQL `GROUP BY`.
 * Consumers import from the file they need; there is no runtime collision.
 */

export type AggregationLevel =
  | 'account'
  | 'campaign'
  | 'ad_group'
  | 'ad'
  | 'asset';

export type MetricsFilters = {
  campaignIds?: string[];
  adGroupIds?: string[];
  adIds?: string[];
  assetIds?: string[];
};

type DerivedBase = {
  impressions: number;
  clicks: number;
  cost: number;
  conversions: number;
  conversion_value?: number;
};

type DerivedResult = {
  ctr: number;
  cvr: number;
  cpc: number;
  cpa: number;
  roas: number;
};

const round2 = (n: number): number => Math.round(n * 100) / 100;
const round3 = (n: number): number => Math.round(n * 1000) / 1000;

/**
 * Recompute ratio metrics from summed base metrics.
 *
 * Scale conventions match the DB schema:
 * - ctr, cvr: percentages (0-100), DECIMAL(5,3)
 * - cpc, cpa: currency per unit, DECIMAL(10,2)
 * - roas: ratio (conversion_value / cost), DECIMAL(5,2)
 *
 * Important: always recompute these from summed numerators/denominators.
 * Averaging pre-computed ratios across rows produces wrong numbers.
 */
export function calculateDerivedMetrics(base: DerivedBase): DerivedResult {
  const impressions = base.impressions ?? 0;
  const clicks = base.clicks ?? 0;
  const cost = base.cost ?? 0;
  const conversions = base.conversions ?? 0;
  const conversion_value = base.conversion_value ?? 0;

  return {
    ctr: impressions > 0 ? round3((clicks / impressions) * 100) : 0,
    cvr: clicks > 0 ? round3((conversions / clicks) * 100) : 0,
    cpc: clicks > 0 ? round2(cost / clicks) : 0,
    cpa: conversions > 0 ? round2(cost / conversions) : 0,
    roas: cost > 0 ? round2(conversion_value / cost) : 0,
  };
}

/**
 * Apply set-membership (IN) filters on optional FK fields. A filter array
 * that is undefined or empty is treated as "no filter" for that field.
 * Rows whose value for an active filter key is missing are excluded —
 * matches the prior single-ID behavior so a filter never silently includes
 * rows lacking the FK it filters on.
 */
export function filterMetrics(
  data: PerformanceMetrics[],
  filters: MetricsFilters
): PerformanceMetrics[] {
  const { campaignIds, adGroupIds, adIds, assetIds } = filters;

  const hasCampaignFilter = !!campaignIds && campaignIds.length > 0;
  const hasAdGroupFilter = !!adGroupIds && adGroupIds.length > 0;
  const hasAdFilter = !!adIds && adIds.length > 0;
  const hasAssetFilter = !!assetIds && assetIds.length > 0;

  if (!hasCampaignFilter && !hasAdGroupFilter && !hasAdFilter && !hasAssetFilter) {
    return data;
  }

  return data.filter((row) => {
    if (
      hasCampaignFilter &&
      (!row.campaign_id || !campaignIds!.includes(row.campaign_id))
    )
      return false;
    if (
      hasAdGroupFilter &&
      (!row.ad_group_id || !adGroupIds!.includes(row.ad_group_id))
    )
      return false;
    if (hasAdFilter && (!row.ad_id || !adIds!.includes(row.ad_id)))
      return false;
    if (hasAssetFilter && (!row.asset_id || !assetIds!.includes(row.asset_id)))
      return false;
    return true;
  });
}

/**
 * Group-by aggregation that mimics SQL GROUP BY at the requested level.
 *
 * Grouping keys:
 *   account   -> account_id
 *   campaign  -> account_id, campaign_id
 *   ad_group  -> account_id, campaign_id, ad_group_id
 *   ad        -> account_id, campaign_id, ad_group_id, ad_id
 *   asset     -> account_id, asset_id
 *
 * Rows missing the level's required identifier (e.g. no campaign_id when
 * grouping at campaign level) are dropped so they don't collapse into a single
 * `undefined` bucket.
 *
 * When preserveDate is true, metric_date is part of the grouping key — use
 * this for time-series charts. When false (default), all dates collapse into
 * a single bucket per group — use this for KPI summaries across a range.
 *
 * Base metrics (impressions, clicks, cost, conversions, conversion_value) are
 * summed. Ratio metrics (ctr, cvr, cpc, cpa, roas) are recomputed from the
 * summed bases via calculateDerivedMetrics.
 */
export function aggregateMetrics(
  data: PerformanceMetrics[],
  level: AggregationLevel,
  preserveDate: boolean = false
): PerformanceMetrics[] {
  const requiredKeys: Record<AggregationLevel, (keyof PerformanceMetrics)[]> = {
    account: [],
    campaign: ['campaign_id'],
    ad_group: ['campaign_id', 'ad_group_id'],
    ad: ['campaign_id', 'ad_group_id', 'ad_id'],
    asset: ['asset_id'],
  };

  type Bucket = {
    account_id: string;
    campaign_id?: string;
    ad_group_id?: string;
    ad_id?: string;
    asset_id?: string;
    metric_date: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    conversion_value: number;
  };

  const keys = requiredKeys[level];
  const buckets = new Map<string, Bucket>();

  for (const row of data) {
    // Drop rows missing required IDs for this grouping level.
    if (keys.some((k) => !row[k])) continue;

    const parts: string[] = [row.account_id];
    for (const k of keys) parts.push(String(row[k]));
    parts.push(preserveDate ? row.metric_date : '__all__');
    const mapKey = parts.join('|');

    const add = {
      impressions: Number(row.impressions) || 0,
      clicks: Number(row.clicks) || 0,
      cost: Number(row.cost) || 0,
      conversions: Number(row.conversions) || 0,
      conversion_value: Number(row.conversion_value) || 0,
    };

    const existing = buckets.get(mapKey);
    if (existing) {
      existing.impressions += add.impressions;
      existing.clicks += add.clicks;
      existing.cost += add.cost;
      existing.conversions += add.conversions;
      existing.conversion_value += add.conversion_value;
      // When collapsing across dates, track the latest date seen so the bucket
      // carries a stable representative value.
      if (!preserveDate && row.metric_date > existing.metric_date) {
        existing.metric_date = row.metric_date;
      }
    } else {
      buckets.set(mapKey, {
        account_id: row.account_id,
        campaign_id:
          level === 'campaign' || level === 'ad_group' || level === 'ad'
            ? row.campaign_id
            : undefined,
        ad_group_id:
          level === 'ad_group' || level === 'ad' ? row.ad_group_id : undefined,
        ad_id: level === 'ad' ? row.ad_id : undefined,
        asset_id: level === 'asset' ? row.asset_id : undefined,
        metric_date: row.metric_date,
        ...add,
      });
    }
  }

  const result: PerformanceMetrics[] = [];
  for (const b of buckets.values()) {
    const derived = calculateDerivedMetrics(b);
    const row: PerformanceMetrics = {
      metrics_id: `agg:${b.account_id}:${b.campaign_id ?? ''}:${b.ad_group_id ?? ''}:${b.ad_id ?? ''}:${b.asset_id ?? ''}:${preserveDate ? b.metric_date : 'all'}`,
      account_id: b.account_id,
      metric_date: b.metric_date,
      impressions: b.impressions,
      clicks: b.clicks,
      cost: round2(b.cost),
      conversions: b.conversions,
      conversion_value: round2(b.conversion_value),
      ...derived,
    };
    if (b.campaign_id) row.campaign_id = b.campaign_id;
    if (b.ad_group_id) row.ad_group_id = b.ad_group_id;
    if (b.ad_id) row.ad_id = b.ad_id;
    if (b.asset_id) row.asset_id = b.asset_id;
    result.push(row);
  }

  // Sort newest first — matches the /api/metrics ordering so downstream
  // components don't need to re-sort for chart/table rendering.
  return result.sort((a, b) => (a.metric_date < b.metric_date ? 1 : -1));
}
