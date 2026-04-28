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

  // ローカル state: チェック状態を管理
  const [localCampaignIds, setLocalCampaignIds] = useState<string[]>(
    selectedFilters.campaignIds || []
  );
  const [localAdGroupIds, setLocalAdGroupIds] = useState<string[]>(
    selectedFilters.adGroupIds || []
  );
  const [localAdIds, setLocalAdIds] = useState<string[]>(
    selectedFilters.adIds || []
  );
  const [localAssetIds, setLocalAssetIds] = useState<string[]>(
    selectedFilters.assetIds || []
  );

  // 親フィルタに基づいて表示範囲を制限
  const visibleAdGroups = useMemo(() => {
    if (localCampaignIds.length === 0) return adGroups;
    const allowed = new Set(localCampaignIds);
    return adGroups.filter((ag) => allowed.has(ag.campaign_id));
  }, [adGroups, localCampaignIds]);

  const visibleAds = useMemo(() => {
    const constraint =
      localAdGroupIds.length > 0
        ? new Set(localAdGroupIds)
        : new Set(visibleAdGroups.map((ag) => ag.ad_group_id));
    return ads.filter((a) => constraint.has(a.ad_group_id));
  }, [ads, visibleAdGroups, localAdGroupIds]);

  // チェックボックス変更時：ローカル state を更新して親に通知
  const handleToggleCampaign = (id: string) => {
    const next = localCampaignIds.includes(id)
      ? localCampaignIds.filter((x) => x !== id)
      : [...localCampaignIds, id];
    setLocalCampaignIds(next);
    onFilterChange({
      campaignIds: next,
      adGroupIds: localAdGroupIds,
      adIds: localAdIds,
      assetIds: localAssetIds,
    });
  };

  const handleToggleAdGroup = (id: string) => {
    const next = localAdGroupIds.includes(id)
      ? localAdGroupIds.filter((x) => x !== id)
      : [...localAdGroupIds, id];
    setLocalAdGroupIds(next);
    onFilterChange({
      campaignIds: localCampaignIds,
      adGroupIds: next,
      adIds: localAdIds,
      assetIds: localAssetIds,
    });
  };

  const handleToggleAd = (id: string) => {
    const next = localAdIds.includes(id)
      ? localAdIds.filter((x) => x !== id)
      : [...localAdIds, id];
    setLocalAdIds(next);
    onFilterChange({
      campaignIds: localCampaignIds,
      adGroupIds: localAdGroupIds,
      adIds: next,
      assetIds: localAssetIds,
    });
  };

  const handleToggleAsset = (id: string) => {
    const next = localAssetIds.includes(id)
      ? localAssetIds.filter((x) => x !== id)
      : [...localAssetIds, id];
    setLocalAssetIds(next);
    onFilterChange({
      campaignIds: localCampaignIds,
      adGroupIds: localAdGroupIds,
      adIds: localAdIds,
      assetIds: next,
    });
  };

  const toggleSection = (key: SectionKey) => {
    setExpanded((prev) => ({ ...prev, [key]: !prev[key] }));
  };

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
          selectedIds={localCampaignIds}
          onToggle={handleToggleCampaign}
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
          selectedIds={localAdGroupIds}
          onToggle={handleToggleAdGroup}
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
          selectedIds={localAdIds}
          onToggle={handleToggleAd}
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
          selectedIds={localAssetIds}
          onToggle={handleToggleAsset}
          expanded={expanded.asset}
          onToggleExpand={() => toggleSection('asset')}
          emptyMessage={EMPTY_MESSAGES.asset}
        />
      </div>
    </Card>
  );
}

interface CheckboxSectionProps<T> {
  sectionKey: SectionKey;
  title: string;
  items: T[];
  idOf: (item: T) => string;
  labelOf: (item: T) => string;
  selectedIds: string[];
  onToggle: (id: string) => void;
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
  expanded,
  onToggleExpand,
  emptyMessage,
}: CheckboxSectionProps<T>) {
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
          {totalCount === 0 ? (
            <p className="text-sm text-gray-500 italic py-2">{emptyMessage}</p>
          ) : (
            <ul className="flex flex-col max-h-60 overflow-y-auto divide-y divide-gray-100">
              {items.map((item) => {
                const id = idOf(item);
                const checked = selectedIds.includes(id);
                return (
                  <li key={id}>
                    <label className="flex items-center gap-2 px-2 py-1.5 hover:bg-gray-50 cursor-pointer rounded">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => {
                          console.log(`Toggling ${id}, currently ${checked}`);
                          onToggle(id);
                        }}
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
