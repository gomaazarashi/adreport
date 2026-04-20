'use client';

import { PerformanceMetrics } from '@/lib/types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import Card from '@/components/Ui/Card';

interface PerformanceChartProps {
  data: PerformanceMetrics[];
}

export default function PerformanceChart({ data }: PerformanceChartProps) {
  if (!data || data.length === 0) {
    return null;
  }

  // Prepare chart data
  const chartData = data.map((m) => ({
    date: m.metric_date || '不明',
    cost: Math.round(m.cost),
    clicks: m.clicks,
    conversions: m.conversions,
    ctr: parseFloat(m.ctr.toFixed(2)),
    cvr: parseFloat(m.cvr.toFixed(2)),
  }));

  return (
    <Card>
      <h2 className="text-lg font-bold text-gray-900 mb-6">パフォーマンス推移</h2>
      <div className="w-full h-80">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" stroke="#999" style={{ fontSize: '12px' }} />
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
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="cost"
              stroke="#3b82f6"
              name="費用（円）"
              dot={false}
              strokeWidth={2}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="clicks"
              stroke="#10b981"
              name="クリック数"
              dot={false}
              strokeWidth={2}
            />
            <Line
              yAxisId="right"
              type="monotone"
              dataKey="ctr"
              stroke="#f59e0b"
              name="CTR（%）"
              dot={false}
              strokeWidth={2}
              strokeDasharray="5 5"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
