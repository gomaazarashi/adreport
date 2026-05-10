'use client';

import { PerformanceMetrics, Campaign } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '@/components/Ui/Card';

interface AssetComparisonChartProps {
  data: PerformanceMetrics[];
  assets: Campaign[];
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
    const asset = assets.find((a) => a.id === assetId);
    const totalCost = metrics.reduce((sum, m) => sum + (m.cost || 0), 0);
    const totalClicks = metrics.reduce((sum, m) => sum + (m.clicks || 0), 0);
    const totalConversions = metrics.reduce((sum, m) => sum + (m.conversions || 0), 0);

    const ctr = totalClicks > 0 ? ((totalClicks / metrics.reduce((sum, m) => sum + (m.impressions || 0), 0)) * 100).toFixed(2) : 0;
    const cpa = totalConversions > 0 ? (totalCost / totalConversions).toFixed(0) : 0;

    return {
      name: asset?.asset_name || `Asset-${assetId.substring(0, 8)}`,
      cost: Math.round(totalCost),
      clicks: totalClicks,
      conversions: totalConversions,
      ctr: parseFloat(String(ctr)),
      cpa: parseFloat(String(cpa)),
    };
  });

  console.log('AssetComparisonChart: chartData=', chartData);

  return (
    <Card>
      <h2 className="text-lg font-bold text-gray-900 mb-6">アセット別比較</h2>
      <div style={{ width: '100%', height: 'auto', minHeight: Math.max(chartData.length * 60, 300) }}>
        <ResponsiveContainer width="100%" height={Math.max(chartData.length * 60, 300)}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 200, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" stroke="#999" style={{ fontSize: '12px' }} yAxisId="left" />
            <YAxis dataKey="name" type="category" stroke="#999" style={{ fontSize: '12px' }} width={190} />
            <YAxis type="category" stroke="#999" style={{ fontSize: '12px' }} yAxisId="right" orientation="right" />
            <Tooltip 
              formatter={(value) => (typeof value === 'number' ? value.toLocaleString() : value)}
              contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc' }}
            />
            <Legend />
            <Bar yAxisId="left" dataKey="cost" fill="#3b82f6" name="費用（円）" />
            <Bar yAxisId="left" dataKey="clicks" fill="#10b981" name="クリック数" />
            <Bar yAxisId="right" dataKey="conversions" fill="#f59e0b" name="コンバージョン" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
