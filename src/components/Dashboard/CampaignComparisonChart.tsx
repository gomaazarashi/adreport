'use client';

import { PerformanceMetrics } from '@/lib/types';
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

interface CampaignComparisonChartProps {
  data: PerformanceMetrics[];
  campaigns: Array<{ campaign_id: string; campaign_name: string }>;
}

export default function CampaignComparisonChart({
  data,
  campaigns,
}: CampaignComparisonChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Group data by campaign
  const campaignMap = new Map<string, PerformanceMetrics>();
  
  data.forEach((metric) => {
    const key = metric.campaign_id || 'Unknown';
    if (!campaignMap.has(key)) {
      campaignMap.set(key, {
        ...metric,
        impressions: 0,
        clicks: 0,
        cost: 0,
        conversions: 0,
        ctr: 0,
        cvr: 0,
        cpc: 0,
        cpa: 0,
        roas: 0,
      });
    }
    const existing = campaignMap.get(key)!;
    existing.impressions += metric.impressions;
    existing.clicks += metric.clicks;
    existing.cost += metric.cost;
    existing.conversions += metric.conversions;
  });

  // Recalculate metrics
  const chartData = Array.from(campaignMap.values()).map((m) => {
    const campaignName =
      campaigns.find((c) => c.campaign_id === m.campaign_id)?.campaign_name ||
      m.campaign_id.slice(0, 8);

    return {
      name: campaignName,
      cost: Math.round(m.cost),
      impressions: m.impressions,
      clicks: m.clicks,
      conversions: m.conversions,
      ctr: m.impressions > 0 ? ((m.clicks / m.impressions) * 100).toFixed(2) : 0,
      cpa: m.conversions > 0 ? (m.cost / m.conversions).toFixed(2) : 0,
    };
  });

  return (
    <Card>
      <h2 className="text-lg font-bold text-gray-900 mb-6">キャンペーン比較</h2>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" stroke="#999" style={{ fontSize: '12px' }} />
            <YAxis stroke="#999" style={{ fontSize: '12px' }} yAxisId="left" />
            <YAxis
              stroke="#999"
              style={{ fontSize: '12px' }}
              yAxisId="right"
              orientation="right"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
              formatter={(value) =>
                typeof value === 'number' ? value.toFixed(0) : String(value)
              }
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="cost"
              fill="#3b82f6"
              name="費用（円）"
            />
            <Bar
              yAxisId="left"
              dataKey="clicks"
              fill="#10b981"
              name="クリック数"
            />
            <Bar
              yAxisId="right"
              dataKey="conversions"
              fill="#f59e0b"
              name="コンバージョン"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
'use client';

import { PerformanceMetrics, Campaign } from '@/lib/types';
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

interface CampaignComparisonChartProps {
  data: PerformanceMetrics[];
  campaigns: Campaign[];
}

export default function CampaignComparisonChart({
  data,
  campaigns,
}: CampaignComparisonChartProps) {
  if (!data || data.length === 0 || !campaigns || campaigns.length === 0) {
    return null;
  }

  // Group metrics by campaign_id and aggregate
  const campaignMap = new Map<string, PerformanceMetrics[]>();
  data.forEach((m) => {
    if (!campaignMap.has(m.campaign_id)) {
      campaignMap.set(m.campaign_id, []);
    }
    campaignMap.get(m.campaign_id)!.push(m);
  });

  // Build chart data
  const chartData = Array.from(campaignMap.entries()).map(([cid, metrics]) => {
    const campaign = campaigns.find((c) => c.campaign_id === cid);
    const totalImpressions = metrics.reduce((sum, m) => sum + m.impressions, 0);
    const totalClicks = metrics.reduce((sum, m) => sum + m.clicks, 0);
    const totalCost = metrics.reduce((sum, m) => sum + m.cost, 0);
    const totalConversions = metrics.reduce((sum, m) => sum + m.conversions, 0);

    const ctr =
      totalImpressions > 0
        ? ((totalClicks / totalImpressions) * 100).toFixed(2)
        : 0;
    const cpa =
      totalConversions > 0 ? (totalCost / totalConversions).toFixed(0) : 0;

    return {
      name: campaign?.campaign_name || 'Unknown',
      cost: Math.round(totalCost),
      clicks: totalClicks,
      conversions: totalConversions,
      ctr: parseFloat(String(ctr)),
      cpa: parseFloat(String(cpa)),
    };
  });

  return (
    <Card>
      <h2 className="text-lg font-bold text-gray-900 mb-6">キャンペーン比較</h2>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="name" stroke="#999" style={{ fontSize: '12px' }} />
            <YAxis stroke="#999" style={{ fontSize: '12px' }} yAxisId="left" />
            <YAxis
              stroke="#999"
              style={{ fontSize: '12px' }}
              yAxisId="right"
              orientation="right"
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#fff',
                border: '1px solid #ccc',
                borderRadius: '4px',
              }}
              formatter={(value) =>
                typeof value === 'number' ? value.toFixed(2) : String(value)
              }
            />
            <Legend />
            <Bar
              yAxisId="left"
              dataKey="cost"
              fill="#3b82f6"
              name="費用（円）"
            />
            <Bar
              yAxisId="left"
              dataKey="clicks"
              fill="#10b981"
              name="クリック数"
            />
            <Bar
              yAxisId="right"
              dataKey="conversions"
              fill="#f59e0b"
              name="コンバージョン"
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
