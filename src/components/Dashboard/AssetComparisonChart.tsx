'use client';

import { PerformanceMetrics } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '@/components/Ui/Card';
import Image from 'next/image';

interface Asset {
  asset_id: string;
  asset_name?: string;
  file_path?: string;
}

interface AssetComparisonChartProps {
  data: PerformanceMetrics[];
  assets: Asset[];
}

export default function AssetComparisonChart({ data, assets }: AssetComparisonChartProps) {
  if (!data || data.length === 0) {
    console.log('AssetComparisonChart: returning null - no data');
    return null;
  }

  // Group by asset_id
  const assetMap = new Map<string, PerformanceMetrics[]>();
  data.forEach((metric) => {
    const assetId = metric.asset_id as string;
    if (assetId) {
      if (!assetMap.has(assetId)) {
        assetMap.set(assetId, []);
      }
      assetMap.get(assetId)!.push(metric);
    }
  });

  console.log('AssetComparisonChart: data length=', data.length, 'assets length=', assets.length, 'assetMap size=', assetMap.size);

  if (assetMap.size === 0) {
    console.log('AssetComparisonChart: no assets in map');
    return null;
  }

  // Build chart data
  const chartData = Array.from(assetMap.entries()).map(([assetId, metrics]) => {
    const asset = assets.find((a) => a.asset_id === assetId);
    const totalCost = metrics.reduce((sum, m) => sum + (m.cost || 0), 0);
    const totalClicks = metrics.reduce((sum, m) => sum + (m.clicks || 0), 0);
    const totalConversions = metrics.reduce((sum, m) => sum + (m.conversions || 0), 0);

    const ctr = totalClicks > 0 ? ((totalClicks / metrics.reduce((sum, m) => sum + (m.impressions || 0), 0)) * 100).toFixed(2) : 0;
    const cpa = totalConversions > 0 ? (totalCost / totalConversions).toFixed(0) : 0;

    return {
      assetId,
      name: asset?.asset_name || `Asset-${assetId.substring(0, 8)}`,
      filePath: asset?.file_path,
      cost: Math.round(totalCost),
      clicks: totalClicks,
      conversions: totalConversions,
      ctr: parseFloat(String(ctr)),
      cpa: parseFloat(String(cpa)),
    };
  });

  console.log('AssetComparisonChart: chartData=', chartData);

  const CustomTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-white p-2 border border-gray-300 rounded shadow">
          <p className="font-bold">{data.name}</p>
          <p className="text-blue-600">費用: ¥{data.cost.toLocaleString()}</p>
          <p className="text-green-600">クリック: {data.clicks}</p>
          <p className="text-orange-600">コンバージョン: {data.conversions}</p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card>
      <h2 className="text-lg font-bold text-gray-900 mb-6">アセット別比較</h2>
      
      {/* バナー画像プレビュー */}
      <div className="mb-6 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {chartData.map((item) => (
          <div key={item.assetId} className="border rounded p-2">
            {item.filePath ? (
              <div className="relative w-full h-24 bg-gray-100 rounded mb-2">
                <Image
                  src={item.filePath}
                  alt={item.name}
                  fill
                  className="object-cover rounded"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              </div>
            ) : (
              <div className="w-full h-24 bg-gray-200 rounded mb-2 flex items-center justify-center text-xs text-gray-500">
                画像なし
              </div>
            )}
            <p className="text-xs font-semibold text-gray-700 truncate">{item.name}</p>
            <p className="text-xs text-gray-500">費用: ¥{item.cost.toLocaleString()}</p>
            <p className="text-xs text-gray-500">クリック: {item.clicks}</p>
          </div>
        ))}
      </div>

      {/* グラフ */}
      <div style={{ width: '100%', height: 'auto', minHeight: Math.max(chartData.length * 60, 300) }}>
        <ResponsiveContainer width="100%" height={Math.max(chartData.length * 60, 300)}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 200, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" stroke="#999" style={{ fontSize: '12px' }} />
            <YAxis dataKey="name" type="category" stroke="#999" style={{ fontSize: '12px' }} width={190} />
            <Tooltip content={<CustomTooltip />} />
            <Legend />
            {/* 費用（円） */}
            <Bar dataKey="cost" fill="#3b82f6" name="費用（円）" label={{ position: 'right', fontSize: 12, formatter: (value: number) => `¥${value.toLocaleString()}` }} />
            {/* クリック数 */}
            <Bar dataKey="clicks" fill="#10b981" name="クリック数" label={{ position: 'right', fontSize: 12 }} />
            {/* コンバージョン数 */}
            <Bar dataKey="conversions" fill="#f59e0b" name="コンバージョン" label={{ position: 'right', fontSize: 12 }} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-500 mt-2">※ 費用は円単位、クリック数とコンバージョン数は個数です</p>
    </Card>
  );
}
