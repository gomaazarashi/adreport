'use client';

import { useState, useEffect } from 'react';
import { useAccounts } from '@/hooks/useAccounts';
import { useMetricsData } from '@/hooks/useMetricsData';
import { useMasterData } from '@/hooks/useMasterData';
import AccountSelector from './AccountSelector';
import DateRangePicker from './DateRangePicker';
import FilterPanel, { type FilterValues } from './FilterPanel';
import MetricsCards from './MetricsCards';
import PerformanceChart from './PerformanceChart';
import DetailTable from './DetailTable';
import Loading from '@/components/Ui/Loading';
import ErrorMessage from '@/components/Ui/ErrorMessage';
import Card from '@/components/Ui/Card';

export default function Dashboard() {
  const [selectedAccountId, setSelectedAccountId] = useState<string>('');
  const [selectedFilters, setSelectedFilters] = useState<FilterValues>({});
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  const { accounts, loading: accountsLoading, error: accountsError } = useAccounts();
  const { data: metricsData, loading: metricsLoading, error: metricsError } = useMetricsData({
    accountId: selectedAccountId,
    startDate,
    endDate,
    campaignIds: selectedFilters.campaignIds,
    adGroupIds: selectedFilters.adGroupIds,
    adIds: selectedFilters.adIds,
    assetIds: selectedFilters.assetIds,
  });
  const {
    campaigns,
    adGroups,
    ads,
    assets,
    loading: masterDataLoading,
    error: masterDataError,
  } = useMasterData(selectedAccountId);

  // Set first account as default
  useEffect(() => {
    if (accounts.length > 0 && !selectedAccountId) {
      setSelectedAccountId(accounts[0].account_id);
    }
  }, [accounts, selectedAccountId]);

  // Reset filters whenever the account changes — campaigns/ad_groups/ads/assets
  // from one account never apply to another, so carrying selections across
  // would silently filter the new account's metrics down to nothing.
  useEffect(() => {
    setSelectedFilters({});
  }, [selectedAccountId]);

  // Set default date range (last 7 days)
  useEffect(() => {
    if (!startDate || !endDate) {
      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      setEndDate(today.toISOString().split('T')[0]);
      setStartDate(sevenDaysAgo.toISOString().split('T')[0]);
    }
  }, [startDate, endDate]);

  // Handle errors
  useEffect(() => {
    if (accountsError) {
      setError(`アカウント読み込みエラー: ${accountsError}`);
    } else if (masterDataError) {
      setError(`マスターデータ読み込みエラー: ${masterDataError}`);
    } else if (metricsError) {
      setError(`メトリクス読み込みエラー: ${metricsError}`);
    } else {
      setError(null);
    }
  }, [accountsError, masterDataError, metricsError]);

  const handleAccountSelect = (accountId: string) => {
    setSelectedAccountId(accountId);
  };

  const handleDateRangeChange = (start: string, end: string) => {
    setStartDate(start);
    setEndDate(end);
  };

  if (accountsLoading) {
    return <Loading message="アカウント情報を読み込み中..." size="lg" />;
  }

  if (accounts.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <h1 className="text-3xl font-bold mb-8">Google広告ダッシュボード</h1>
        <ErrorMessage
          title="アカウントなし"
          message="登録されたアカウントがありません。管理者に連絡してください。"
          type="warning"
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-6">
        {/* ヘッダー */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Google広告パフォーマンスダッシュボード
          </h1>
          <p className="text-gray-600">
            複数アカウントのメトリクスを一元管理・分析
          </p>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <ErrorMessage
            message={error}
            onDismiss={() => setError(null)}
            type="error"
          />
        )}

        {/* コントロールパネル */}
        <Card className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-6">フィルター設定</h2>

          {/* アカウント選択 */}
          <div className="mb-6">
            <AccountSelector
              accounts={accounts}
              selectedAccountId={selectedAccountId}
              onSelectAccount={handleAccountSelect}
            />
          </div>

          {/* 期間選択 */}
          <DateRangePicker
            onDateRangeChange={handleDateRangeChange}
            initialStartDate={startDate}
            initialEndDate={endDate}
          />

          {/* マスターデータフィルター */}
          <div className="mt-6">
            <FilterPanel
              campaigns={campaigns}
              adGroups={adGroups}
              ads={ads}
              assets={assets}
              selectedFilters={selectedFilters}
              onFilterChange={setSelectedFilters}
              loading={masterDataLoading}
            />
          </div>
        </Card>

        {/* メトリクス表示 */}
        {metricsLoading ? (
          <Loading message="メトリクスを読み込み中..." size="md" />
        ) : metricsData && metricsData.length > 0 ? (
          <>
            {/* KPI カード */}
            <div className="mb-8">
              <MetricsCards data={metricsData} />
            </div>

            {/* グラフ */}
            <div className="mb-8">
              <PerformanceChart data={metricsData} />
            </div>

            {/* 詳細テーブル */}
            <div className="mb-8">
              <DetailTable data={metricsData} />
            </div>
          </>
        ) : (
          <Card>
            <p className="text-center text-gray-900 py-8">
              選択した期間にはデータがありません
            </p>
          </Card>
        )}
      </div>
    </div>
  );
}
