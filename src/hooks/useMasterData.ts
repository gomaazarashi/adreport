'use client';

import { useEffect, useMemo, useState } from 'react';
import { Ad, AdGroup, Asset, Campaign } from '@/lib/types';

export type UseMasterDataResult = {
  campaigns: Campaign[];
  adGroups: AdGroup[];
  ads: Ad[];
  assets: Asset[];
  loading: boolean;
  error: string | null;
};

// Stable empty references so consumers that depend on these arrays in
// useEffect/useMemo don't re-run when the hook hasn't actually loaded data yet.
const EMPTY_CAMPAIGNS: Campaign[] = [];
const EMPTY_AD_GROUPS: AdGroup[] = [];
const EMPTY_ADS: Ad[] = [];
const EMPTY_ASSETS: Asset[] = [];

/**
 * Fetch master data (campaigns, ad groups, ads, assets) for an account.
 * Used by the dashboard FilterPanel to populate selectable filter options.
 *
 * - Cancels in-flight requests on unmount or accountId change via AbortController.
 * - Memoizes returned arrays so reference equality is preserved across renders
 *   when the underlying data hasn't changed.
 * - Surfaces network and JSON parse errors as `error: string`.
 */
export function useMasterData(accountId: string): UseMasterDataResult {
  const [rawCampaigns, setRawCampaigns] = useState<Campaign[]>(EMPTY_CAMPAIGNS);
  const [rawAdGroups, setRawAdGroups] = useState<AdGroup[]>(EMPTY_AD_GROUPS);
  const [rawAds, setRawAds] = useState<Ad[]>(EMPTY_ADS);
  const [rawAssets, setRawAssets] = useState<Asset[]>(EMPTY_ASSETS);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!accountId) {
      setRawCampaigns(EMPTY_CAMPAIGNS);
      setRawAdGroups(EMPTY_AD_GROUPS);
      setRawAds(EMPTY_ADS);
      setRawAssets(EMPTY_ASSETS);
      setError(null);
      return;
    }

    const abort = new AbortController();

    const fetchMasterData = async () => {
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({ account_id: accountId });

        const response = await fetch(`/api/master-data?${params.toString()}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' },
          signal: abort.signal,
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.status}`);
        }

        // Parse JSON separately so we can distinguish a malformed body
        // from a network/HTTP failure.
        let result: unknown;
        try {
          result = await response.json();
        } catch (parseErr) {
          throw new Error(
            `Failed to parse master-data response: ${
              parseErr instanceof Error ? parseErr.message : 'invalid JSON'
            }`
          );
        }

        const payload = result as {
          success?: boolean;
          campaigns?: unknown;
          adGroups?: unknown;
          ads?: unknown;
          assets?: unknown;
          error?: string;
        };

        if (!payload || payload.success !== true) {
          throw new Error(payload?.error ?? 'Failed to fetch master data');
        }

        setRawCampaigns(
          Array.isArray(payload.campaigns)
            ? (payload.campaigns as Campaign[])
            : EMPTY_CAMPAIGNS
        );
        setRawAdGroups(
          Array.isArray(payload.adGroups)
            ? (payload.adGroups as AdGroup[])
            : EMPTY_AD_GROUPS
        );
        setRawAds(
          Array.isArray(payload.ads) ? (payload.ads as Ad[]) : EMPTY_ADS
        );
        setRawAssets(
          Array.isArray(payload.assets)
            ? (payload.assets as Asset[])
            : EMPTY_ASSETS
        );
      } catch (err) {
        if ((err as Error).name === 'AbortError') return;
        const message = err instanceof Error ? err.message : 'Unknown error';
        setError(message);
        console.error('Error fetching master data:', err);
      } finally {
        // Don't flip loading off if this effect was aborted — a newer
        // fetch is already in flight and owns the loading state.
        if (!abort.signal.aborted) {
          setLoading(false);
        }
      }
    };

    fetchMasterData();
    return () => abort.abort();
  }, [accountId]);

  // Memoize each returned array. Because we store the raw arrays in state,
  // these are effectively pass-throughs — but the explicit useMemo guarantees
  // a stable reference contract for downstream useEffect/useMemo dependencies.
  const campaigns = useMemo(() => rawCampaigns, [rawCampaigns]);
  const adGroups = useMemo(() => rawAdGroups, [rawAdGroups]);
  const ads = useMemo(() => rawAds, [rawAds]);
  const assets = useMemo(() => rawAssets, [rawAssets]);

  return { campaigns, adGroups, ads, assets, loading, error };
}
