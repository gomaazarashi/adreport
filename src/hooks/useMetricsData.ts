'use client';

import { useEffect, useMemo, useState } from 'react';
import { PerformanceMetrics } from '@/lib/types';
import {
  aggregateMetrics,
  filterMetrics,
  type AggregationLevel,
  type MetricsFilters,
} from '@/lib/metricsAggregation';

export type UseMetricsDataOptions = {
  accountId: string;
  startDate?: string;
  endDate?: string;
  /** Aggregation level for the returned data. Defaults to 'account'. */
  aggregationLevel?: AggregationLevel;
  /**
   * When true (default), each (group, date) pair becomes its own row — useful
   * for time-series charts. When false, all dates collapse into a single row
   * per group — useful for KPI summaries over a date range.
   */
  preserveDate?: boolean;
} & MetricsFilters;

export type Period = { start_date: string; end_date: string } | null;

export type UseMetricsDataResult = {
  data: PerformanceMetrics[];
  loading: boolean;
  error: string | null;
  period: Period;
};

/**
 * Fetch performance metrics for an account, then apply client-side filtering
 * and GROUP BY-style aggregation.
 *
 * The /api/metrics endpoint is called with only account_id + date range; all
 * level- and ID-based filtering happens in JS so we don't depend on backend
 * filter support beyond what already exists.
 */
export function useMetricsData(
  options: UseMetricsDataOptions
): UseMetricsDataResult {
  const {
    accountId,
    startDate,
    endDate,
    aggregationLevel = 'account',
    preserveDate = true,
    campaignId,
    adGroupId,
    adId,
    assetId,
  } = options;

  const [rawData, setRawData] = useState<PerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<Period>(null);

  useEffect(() => {
    if (!accountId) {
      setRawData([]);
      setPeriod(null);
      return;
    }

    const abort = new AbortController();

    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ account_id: accountId });
        if (startDate) params.append('start_date', startDate);
        if (endDate) params.append('end_date', endDate);

        const response = await fetch(`/api/metrics?${params.toString()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: abort.signal,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && Array.isArray(result.data)) {
          setRawData(result.data);
          setPeriod(result.period ?? null);
        } else {
          throw new Error('Failed to fetch metrics');
        }
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error fetching metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
    return () => abort.abort();
  }, [accountId, startDate, endDate]);

  // Filter + aggregate purely on the client. Memoized so chart/table renders
  // don't recompute when only unrelated state changes.
  const data = useMemo(() => {
    const filtered = filterMetrics(rawData, {
      campaignId,
      adGroupId,
      adId,
      assetId,
    });
    return aggregateMetrics(filtered, aggregationLevel, preserveDate);
  }, [
    rawData,
    aggregationLevel,
    preserveDate,
    campaignId,
    adGroupId,
    adId,
    assetId,
  ]);

  return { data, loading, error, period };
}
