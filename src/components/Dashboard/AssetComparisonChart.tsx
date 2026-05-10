'use client';

import { PerformanceMetrics, Asset } from '@/lib/types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Card from '@/components/Ui/Card';

interface AssetComparisonChartProps {
  data: PerformanceMetrics[];
  assets: Asset[];
}

export default function AssetComparisonChart({
  data,
  assets,
}: AssetComparisonChartProps) {
  if (!data || data.length === 0 || !assets || assets.length === 0) {
    return null;
  }

  const assetMap = new Map<string, PerformanceMetrics[]>();
  data.forEach((m) => {
    if (m.asset_id) {
      if (!assetMap.has(m.asset_id)) {
        assetMap.set(m.asset_id, []);
      }
      assetMap.get(m.asset_id)!.push(m);
    }
  });

  const chartData = Array.from(assetMap.entries()).map(([assetId, metrics]) => {
    const asset = assets.find((a) => a.asset_id === assetId);
    const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
    const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0);

    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;
    const cpa = totalConversions > 0 ? (totalCost / totalConversions).toFixed(0) : 0;

    return {
      name: asset?.asset_name || 'Unknown',
      cost: Math.round(totalCost),
      clicks: totalClicks,
      conversions: totalConversions,
      ctr: parseFloat(String(ctr)),
      cpa: parseFloat(String(cpa)),
    };
  });

  return (
    <Card>
      <h2 className="text-lg font-bold text-gray-900 mb-6">アセット別比較</h2>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" stroke="#999" style={{ fontSize: '12px' }} />
            <YAxis stroke="#999" style={{ fontSize: '12px' }} yAxisId="left" />
            <YAxis stroke="#999" style={{ fontSize: '12px' }} yAxisId="right" orientation="right" />
            <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #ccc', borderRadius: '4px' }} formatter={(value) => typeof value === 'number' ? value.toFixed(2) : String(value)} />
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
