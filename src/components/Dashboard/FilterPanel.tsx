'use client';

import { useMemo, useState } from 'react';
import { Ad, AdGroup, Asset, Campaign } from '@/lib/types';
import Card from '@/components/Ui/Card';
import Loading from '@/components/Ui/Loading';

export type FilterValues = {
  campaignIds?: string[];
  adGroupIds?: string[];
  adIds?: string[];
  assetIds?: string[];
};

interface FilterPanelProps {
  campaigns: Campaign[];
  adGroups: AdGroup[];
  ads: Ad[];
  assets: Asset[];
  selectedFilters: FilterValues;
  onFilterChange: (filters: FilterValues) => void;
  /** When true, render a loading state instead of the filter sections. */
  loading?: boolean;
}

type SectionKey = 'campaign' | 'adGroup' | 'ad' | 'asset';

const SECTION_TITLES: Record<SectionKey, string> = {
  campaign: 'キャンペーン',
  adGroup: '広告グループ',
  ad: '広告',
  asset: 'アセット',
};

const EMPTY_MESSAGES: Record<SectionKey, string> = {
  campaign: 'キャンペーンがありません',
  adGroup: '広告グループがありません',
  ad: '広告がありません',
  asset: 'アセットがありません',
};

const EMPTY_ARRAY: string[] = [];

export default function FilterPanel({
  campaigns,
  adGroups,
  ads,
  assets,
  selectedFilters,
  onFilterChange,
  loading = false,
}: FilterPanelProps) {
  const [expanded, setExpanded] = useState<Record<SectionKey, boolean>>({
    campaign: true,
    adGroup: true,
    ad: false,
    asset: false,
  });

  const selectedCampaignIds = selectedFilters.campaignIds ?? EMPTY_ARRAY;
  const selectedAdGroupIds = selectedFilters.adGroupIds ?? EMPTY_ARRAY;
  const selectedAdIds = selectedFilters.adIds ?? EMPTY_ARRAY;
  const selectedAssetIds = selectedFilters.assetIds ?? EMPTY_ARRAY;

  // Visible ad groups: when no campaign is selected, show all; otherwise
  // narrow to ad groups whose campaign_id is in the selected campaign set.
  const visibleAdGroups = useMemo(() => {
    if (selectedCampaignIds.length === 0) return adGroups;
    const allowed = new Set(selectedCampaignIds);
    return adGroups.filter((ag) => allowed.has(ag.campaign_id));
  }, [adGroups, selectedCampaignIds]);

  // Visible ads: parent constraint is the selected ad groups if any, otherwise
  // the visible ad groups (which themselves reflect any campaign filter).
  // Assets have no parent and are always all-visible.
  const visibleAds = useMemo(() => {
    const constraint =
      selectedAdGroupIds.length > 0
        ? new Set(selectedAdGroupIds)
        : new Set(visibleAdGroups.map((ag) => ag.ad_group_id));
    return ads.filter((a) => constraint.has(a.ad_group_id));
  }, [ads, visibleAdGroups, selectedAdGroupIds]);

  /**
   * Apply transitive pruning before emitting upstream. Diff-based: we only
   * cascade-drop children of parents that were *just* deselected in `next`
   * (compared to the current `selectedFilters`). Adding a parent never
   * prunes children. Cascade flows campaign → ad group → ad.
   *
   * Why diff instead of "filter children to currently selected parents":
   * we want clearing a parent level (which deselects everything in one
   * action) to drop the matching children, but we also want the user to be
   * able to pre-select an ad group before any campaign is chosen without
   * having that selection silently dropped on the next render.
   */
  const emit = (next: FilterValues) => {
    const nextCampaignIds = next.campaignIds ?? EMPTY_ARRAY;
    const nextAdGroupIdsInput = next.adGroupIds ?? EMPTY_ARRAY;
    const nextAdIdsInput = next.adIds ?? EMPTY_ARRAY;

    // Cascade 1: campaigns just deselected → drop their ad groups
    const nextCampaignSet = new Set(nextCampaignIds);
    const removedCampaignIds = selectedCampaignIds.filter(
      (id) => !nextCampaignSet.has(id)
    );

    let prunedAdGroupIds = nextAdGroupIdsInput;
    if (removedCampaignIds.length > 0) {
      const removedCampaignSet = new Set(removedCampaignIds);
      const adGroupsToDrop = new Set(
        adGroups
          .filter((ag) => removedCampaignSet.has(ag.campaign_id))
          .map((ag) => ag.ad_group_id)
      );
      prunedAdGroupIds = prunedAdGroupIds.filter(
        (id) => !adGroupsToDrop.has(id)
      );
    }

    // Cascade 2: ad groups just deselected (either by user or by cascade
    // above) → drop their ads
    const prunedAdGroupSet = new Set(prunedAdGroupIds);
    const removedAdGroupIds = selectedAdGroupIds.filter(
      (id) => !prunedAdGroupSet.has(id)
    );

    let prunedAdIds = nextAdIdsInput;
    if (removedAdGroupIds.length > 0) {
      const removedAdGroupSet = new Set(removedAdGroupIds);
      const adsToDrop = new Set(
        ads
          .filter((a) => removedAdGroupSet.has(a.ad_group_id))
          .map((a) => a.ad_id)
      );
      prunedAdIds = prunedAdIds.filter((id) => !adsToDrop.has(id));
    }

    onFilterChange({
      campaignIds: nextCampaignIds,
      adGroupIds: prunedAdGroupIds,
      adIds: prunedAdIds,
      assetIds: next.assetIds ?? EMPTY_ARRAY,
    });
  };

  const toggleSection = (key: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Per-section toggle helpers. Each builds the next filter object and runs
  // it through `emit` so transitive pruning is applied uniformly.
  const toggleCampaign = (id: string) => {
    const next = selectedCampaignIds.includes(id)
      ? selectedCampaignIds.filter((x) => x !== id)
      : [...selectedCampaignIds, id];
    emit({ ...selectedFilters, campaignIds: next });
  };
  const toggleAdGroup = (id: string) => {
    const next = selectedAdGroupIds.includes(id)
      ? selectedAdGroupIds.filter((x) => x !== id)
      : [...selectedAdGroupIds, id];
    emit({ ...selectedFilters, adGroupIds: next });
  };
  const toggleAd = (id: string) => {
    const next = selectedAdIds.includes(id)
      ? selectedAdIds.filter((x) => x !== id)
      : [...selectedAdIds, id];
    emit({ ...selectedFilters, adIds: next });
  };
  const toggleAsset = (id: string) => {
    const next = selectedAssetIds.includes(id)
      ? selectedAssetIds.filter((x) => x !== id)
      : [...selectedAssetIds, id];
    emit({ ...selectedFilters, assetIds: next });
  };

  // Select-all targets the visible items only — selecting "all" within a
  // narrowed parent should not silently widen the selection beyond what the
  // user can see.
  const selectAllCampaigns = () =>
    emit({
      ...selectedFilters,
      campaignIds: campaigns.map((c) => c.campaign_id),
    });
  const clearCampaigns = () =>
    emit({ ...selectedFilters, campaignIds: EMPTY_ARRAY });

  const selectAllAdGroups = () =>
    emit({
      ...selectedFilters,
      adGroupIds: visibleAdGroups.map((ag) => ag.ad_group_id),
    });
  const clearAdGroups = () =>
    emit({ ...selectedFilters, adGroupIds: EMPTY_ARRAY });

  const selectAllAds = () =>
    emit({ ...selectedFilters, adIds: visibleAds.map((a) => a.ad_id) });
  const clearAds = () => emit({ ...selectedFilters, adIds: EMPTY_ARRAY });

  const selectAllAssets = () =>
    emit({ ...selectedFilters, assetIds: assets.map((a) => a.asset_id) });
  const clearAssets = () =>
    emit({ ...selectedFilters, assetIds: EMPTY_ARRAY });

  if (loading) {
    return (
      <Card>
        <Loading message="マスターデータを読み込み中..." size="md" />
      </Card>
    );
  }

  return (
    <Card>
      <div className="flex flex-col gap-3">
        <CheckboxSection
          sectionKey="campaign"
          title={SECTION_TITLES.campaign}
          items={campaigns}
          idOf={(c) => c.campaign_id}
          labelOf={(c) => c.campaign_name}
          selectedIds={selectedCampaignIds}
          onToggle={toggleCampaign}
          onSelectAll={selectAllCampaigns}
          onClear={clearCampaigns}
          expanded={expanded.campaign}
          onToggleExpand={() => toggleSection('campaign')}
          emptyMessage={EMPTY_MESSAGES.campaign}
        />
        <CheckboxSection
          sectionKey="adGroup"
          title={SECTION_TITLES.adGroup}
          items={visibleAdGroups}
          idOf={(ag) => ag.ad_group_id}
          labelOf={(ag) => ag.ad_group_name}
          selectedIds={selectedAdGroupIds}
          onToggle={toggleAdGroup}
          onSelectAll={selectAllAdGroups}
          onClear={clearAdGroups}
          expanded={expanded.adGroup}
          onToggleExpand={() => toggleSection('adGroup')}
          emptyMessage={EMPTY_MESSAGES.adGroup}
        />
        <CheckboxSection
          sectionKey="ad"
          title={SECTION_TITLES.ad}
          items={visibleAds}
          idOf={(a) => a.ad_id}
          labelOf={(a) =>
            a.ad_headline?.trim() ? a.ad_headline : `(無題: ${a.ad_id.slice(0, 8)})`
          }
          selectedIds={selectedAdIds}
          onToggle={toggleAd}
          onSelectAll={selectAllAds}
          onClear={clearAds}
          expanded={expanded.ad}
          onToggleExpand={() => toggleSection('ad')}
          emptyMessage={EMPTY_MESSAGES.ad}
        />
        <CheckboxSection
          sectionKey="asset"
          title={SECTION_TITLES.asset}
          items={assets}
          idOf={(a) => a.asset_id}
          labelOf={(a) => a.asset_name}
          selectedIds={selectedAssetIds}
          onToggle={toggleAsset}
          onSelectAll={selectAllAssets}
          onClear={clearAssets}
          expanded={expanded.asset}
          onToggleExpand={() => toggleSection('asset')}
          emptyMessage={EMPTY_MESSAGES.asset}
        />
      </div>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// CheckboxSection: a generic, collapsible multi-select panel used by all four
// filter levels. Kept inside this file because it isn't reused elsewhere; if
// it ever needs to be shared, lift it into src/components/Ui/.
// ---------------------------------------------------------------------------

interface CheckboxSectionProps<T> {
  sectionKey: SectionKey;
  title: string;
  items: T[];
  idOf: (item: T) => string;
  labelOf: (item: T) => string;
  selectedIds: string[];
  onToggle: (id: string) => void;
  onSelectAll: () => void;
  onClear: () => void;
  expanded: boolean;
  onToggleExpand: () => void;
  emptyMessage: string;
}

function CheckboxSection<T>({
  sectionKey,
  title,
  items,
  idOf,
  labelOf,
  selectedIds,
  onToggle,
  onSelectAll,
  onClear,
  expanded,
  onToggleExpand,
  emptyMessage,
}: CheckboxSectionProps<T>) {
  // Selected count limited to currently visible items so the "N/M" badge
  // never reads "5/3" after a parent filter narrows the list.
  const visibleSelectedCount = useMemo(() => {
    if (selectedIds.length === 0) return 0;
    const visibleIds = new Set(items.map(idOf));
    return selectedIds.filter((id) => visibleIds.has(id)).length;
  }, [selectedIds, items, idOf]);

  const totalCount = items.length;

  return (
    <div className="border border-gray-200 rounded-md bg-white">
      <button
        type="button"
        onClick={onToggleExpand}
        aria-expanded={expanded}
        aria-controls={`filter-section-${sectionKey}`}
        className="w-full flex items-center justify-between px-3 py-2 bg-gray-50 hover:bg-gray-100 rounded-md text-left"
      >
        <div className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className={`inline-block transition-transform text-gray-500 text-xs ${
              expanded ? 'rotate-90' : ''
            }`}
          >
            ▶
          </span>
          <span className="font-medium text-gray-900">{title}</span>
        </div>
        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          {visibleSelectedCount}/{totalCount} selected
        </span>
      </button>

      {expanded && (
        <div
          id={`filter-section-${sectionKey}`}
          className="border-t border-gray-200 px-3 py-2"
        >
          <div className="flex items-center gap-2 mb-2">
            <button
              type="button"
              onClick={onSelectAll}
              disabled={totalCount === 0}
              className="px-2 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              すべて選択
            </button>
            <button
              type="button"
              onClick={onClear}
              disabled={visibleSelectedCount === 0}
              className="px-2 py-1 text-xs font-medium text-gray-700 bg-gray-50 hover:bg-gray-100 rounded border border-gray-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              クリア
            </button>
          </div>

          {totalCount === 0 ? (
            <p className="text-sm text-gray-500 italic py-2">{emptyMessage}</p>
          ) : (
            <ul className="flex flex-col max-h-60 overflow-y-auto divide-y divide-gray-100">
              {items.map((item) => {
                const id = idOf(item);
                const checked = selectedIds.includes(id);
                return (
                  <li key={id}>
                    <label
                      className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 cursor-pointer rounded"
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => onToggle(id)}
                        className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-800 truncate">
                        {labelOf(item)}
                      </span>
                    </label>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
