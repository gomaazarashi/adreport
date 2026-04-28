'use client';

import { useEffect, useMemo, useState } from 'react';
import { aggregateMetrics } from '@/lib/metricsAggregation';

export type UseMetricsDataOptions = {
  accountId: string;
  startDate?: string;
  endDate?: string;
  aggregationLevel?: 'account' | 'campaign' | 'ad_group' | 'ad' | 'asset';
  preserveDate?: boolean;
  campaignIds?: string[];
  adGroupIds?: string[];
  adIds?: string[];
  assetIds?: string[];
};

export function useMetricsData(options: UseMetricsDataOptions) {
  const {
    accountId,
    startDate,
    endDate,
    aggregationLevel = 'account',
    preserveDate = false,
    campaignIds,
    adGroupIds,
    adIds,
    assetIds,
  } = options;

  const [rawData, setRawData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<{ start: string; end: string } | null>(null);

  useEffect(() => {
    if (!accountId) {
      setRawData([]);
      setError(null);
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
        if (campaignIds?.length) params.append('campaign_ids', campaignIds.join(','));
        if (adGroupIds?.length) params.append('ad_group_ids', adGroupIds.join(','));
        if (adIds?.length) params.append('ad_ids', adIds.join(','));
        if (assetIds?.length) params.append('asset_ids', assetIds.join(','));

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
  }, [accountId, startDate, endDate, campaignIds, adGroupIds, adIds, assetIds]);

  // APIからすでにフィルタリングされたデータが来ているので、
  // クライアント側ではfilterMetrics()を呼ばず、aggregateMetricsのみ実行
  const data = useMemo(() => {
  const filtered = filterMetrics(rawData, {
    campaignIds,
    adGroupIds,
    adIds,
    assetIds,
  });
  return aggregateMetrics(filtered, aggregationLevel, preserveDate);
}, [
  rawData,
  aggregationLevel,
  preserveDate,
  campaignIds,
  adGroupIds,
  adIds,
  assetIds,
]);


  return { data, loading, error, period };
}
