'use client';

import { PerformanceMetrics, Ad } from '@/lib/types';
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

interface AdComparisonChartProps {
  data: PerformanceMetrics[];
  ads: Ad[];
}

export default function AdComparisonChart({
  data,
  ads,
}: AdComparisonChartProps) {
  if (!data || data.length === 0 || !ads || ads.length === 0) {
    return null;
  }

  const adMap = new Map<string, PerformanceMetrics[]>();
  data.forEach((m) => {
    if (m.ad_id) {
      if (!adMap.has(m.ad_id)) {
        adMap.set(m.ad_id, []);
      }
      adMap.get(m.ad_id)!.push(m);
    }
  });

  const chartData = Array.from(adMap.entries()).map(([adId, metrics]) => {
    const ad = ads.find((a) => a.ad_id === adId);
    const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
    const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0);

    const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : 0;
    const cpa = totalConversions > 0 ? (totalCost / totalConversions).toFixed(0) : 0;

    return {
      name: ad?.ad_name || 'Unknown',
      cost: Math.round(totalCost),
      clicks: totalClicks,
      conversions: totalConversions,
      ctr: parseFloat(String(ctr)),
      cpa: parseFloat(String(cpa)),
    };
  });

  return (
    <Card>
      <h2 className="text-lg font-bold text-gray-900 mb-6">広告別比較</h2>
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
