'use client';

import { useEffect, useState } from 'react';
import { PerformanceMetrics } from '@/lib/types';

export function useMetricsData(
  accountId: string,
  startDate?: string,
  endDate?: string
) {
  const [data, setData] = useState<PerformanceMetrics[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) {
      setData([]);
      return;
    }

    const fetchMetrics = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          account_id: accountId,
        });

        if (startDate) {
          params.append('start_date', startDate);
        }

        if (endDate) {
          params.append('end_date', endDate);
        }

        const response = await fetch(`/api/metrics?${params.toString()}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        const result = await response.json();

        if (result.success && result.data) {
          setData(result.data);
        } else {
          throw new Error('Failed to fetch metrics');
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('Error fetching metrics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchMetrics();
  }, [accountId, startDate, endDate]);

  return { data, loading, error };
}
