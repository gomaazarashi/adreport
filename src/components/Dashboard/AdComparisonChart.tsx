'use client';

import { PerformanceMetrics, Campaign } from '@/lib/types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Card from '@/components/Ui/Card';

interface AdComparisonChartProps {
  data: PerformanceMetrics[];
  ads: Campaign[];
}

export default function AdComparisonChart({ data, ads }: AdComparisonChartProps) {
  if (!data || data.length === 0) {
    console.log('AdComparisonChart: returning null - no data');
    return null;
  }

  // Group by ad_id
  const adMap = new Map<string, PerformanceMetrics[]>();
  data.forEach((metric) => {
    const adId = metric.ad_id as string;
    if (adId) {
      if (!adMap.has(adId)) {
        adMap.set(adId, []);
      }
      adMap.get(adId)!.push(metric);
    }
  });

  console.log('AdComparisonChart: data length=', data.length, 'ads length=', ads.length, 'adMap size=', adMap.size);

  if (adMap.size === 0) {
    console.log('AdComparisonChart: no ads in map');
    return null;
  }

  // Build chart data
  const chartData = Array.from(adMap.entries()).map(([adId, metrics]) => {
    const ad = ads.find((a) => a.ad_id === adId);
    const totalCost = metrics.reduce((sum, m) => sum + (m.cost || 0), 0);
    const totalClicks = metrics.reduce((sum, m) => sum + (m.clicks || 0), 0);
    const totalConversions = metrics.reduce((sum, m) => sum + (m.conversions || 0), 0);

    const ctr = totalClicks > 0 ? ((totalClicks / metrics.reduce((sum, m) => sum + (m.impressions || 0), 0)) * 100).toFixed(2) : 0;
    const cpa = totalConversions > 0 ? (totalCost / totalConversions).toFixed(0) : 0;

    return {
      name: ad?.ad_headline || ad?.ad_type || `Ad-${adId.substring(0, 8)}`,
      cost: Math.round(totalCost),
      clicks: totalClicks,
      conversions: totalConversions,
      ctr: parseFloat(String(ctr)),
      cpa: parseFloat(String(cpa)),
    };
  });

  console.log('AdComparisonChart: chartData=', chartData);

  return (
    <Card>
      <h2 className="text-lg font-bold text-gray-900 mb-6">広告別比較</h2>
      <div style={{ width: '100%', height: 'auto', minHeight: Math.max(chartData.length * 60, 300) }}>
        <ResponsiveContainer width="100%" height={Math.max(chartData.length * 60, 300)}>
          <BarChart data={chartData} layout="vertical" margin={{ top: 20, right: 30, left: 250, bottom: 20 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis type="number" stroke="#999" style={{ fontSize: '12px' }} yAxisId="left" />
            <YAxis dataKey="name" type="category" stroke="#999" style={{ fontSize: '12px' }} width={240} />
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
