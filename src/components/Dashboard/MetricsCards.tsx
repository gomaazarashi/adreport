'use client';

import { PerformanceMetrics } from '@/lib/types';
import { aggregateMetrics, formatCurrency, formatPercentage } from '@/lib/metrics-calculator';
import Card from '@/components/Ui/Card';

interface MetricsCardsProps {
  data: PerformanceMetrics[];
}

export default function MetricsCards({ data }: MetricsCardsProps) {
  if (!data || data.length === 0) {
    return null;
  }

  const aggregated = aggregateMetrics(data);

  const metrics = [
    {
      label: '総費用',
      value: formatCurrency(aggregated.total_cost),
      color: 'bg-blue-50',
      icon: '💰',
    },
    {
      label: 'インプレッション',
      value: aggregated.total_impressions.toLocaleString('ja-JP'),
      color: 'bg-green-50',
      icon: '👁️',
    },
    {
      label: 'クリック',
      value: aggregated.total_clicks.toLocaleString('ja-JP'),
      color: 'bg-yellow-50',
      icon: '🖱️',
    },
    {
      label: 'コンバージョン',
      value: aggregated.total_conversions.toLocaleString('ja-JP'),
      color: 'bg-purple-50',
      icon: '✅',
    },
    {
      label: '平均CTR',
      value: formatPercentage(aggregated.avg_ctr),
      color: 'bg-pink-50',
      icon: '📊',
    },
    {
      label: '平均CVR',
      value: formatPercentage(aggregated.avg_cvr),
      color: 'bg-indigo-50',
      icon: '📈',
    },
    {
      label: '平均CPA',
      value: formatCurrency(aggregated.avg_cpa),
      color: 'bg-red-50',
      icon: '💵',
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-7 gap-4">
      {metrics.map((metric) => (
        <Card key={metric.label} className={`${metric.color} !p-4`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-medium text-gray-600">{metric.label}</p>
              <p className="text-xl font-bold text-gray-900 mt-2">{metric.value}</p>
            </div>
            <span className="text-2xl">{metric.icon}</span>
          </div>
        </Card>
      ))}
    </div>
  );
}
