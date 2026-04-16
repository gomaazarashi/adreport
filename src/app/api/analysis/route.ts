import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
import {
  compareMetrics,
  analyzePerformanceStatus,
  calculatePerformanceScore,
  detectAnomalies,
  aggregateMetrics,
} from '@/lib/metrics-calculator';
import { ApiResponse, AnalysisResult, PerformanceMetrics } from '@/lib/types';

/**
 * POST /api/analysis
 * Analyze metrics and provide improvement suggestions
 * Request body:
 *   - account_id: (required) Account UUID
 *   - campaign_id: (optional) Campaign UUID
 *   - start_date: (optional) Start date (YYYY-MM-DD)
 *   - end_date: (optional) End date (YYYY-MM-DD)
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { account_id, campaign_id, start_date, end_date } = body;

    // Validate required fields
    if (!account_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'account_id is required',
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Build query for metrics
    let query = supabaseAdmin
      .from('performance_metrics')
      .select('*')
      .eq('account_id', account_id)
      .order('metric_date', { ascending: true });

    if (campaign_id) {
      query = query.eq('campaign_id', campaign_id);
    }

    if (start_date) {
      query = query.gte('metric_date', start_date);
    }

    if (end_date) {
      query = query.lte('metric_date', end_date);
    }

    // Fetch metrics
    const { data: metricsData, error: metricsError } = await query;

    if (metricsError) {
      console.error('Error fetching metrics for analysis:', metricsError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch metrics',
        } as ApiResponse<null>,
        { status: 500 }
      );
    }

    // Check if we have enough data for analysis
    if (!metricsData || metricsData.length < 2) {
      return NextResponse.json(
        {
          success: false,
          error: 'Insufficient data for analysis (minimum 2 data points required)',
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Cast data to PerformanceMetrics type
    const typedMetrics = metricsData as unknown as PerformanceMetrics[];

    // Get current and previous period metrics
    const currentMetrics = typedMetrics[typedMetrics.length - 1];
    const previousMetrics = typedMetrics[typedMetrics.length - 2];

    // Calculate comparison
    const comparison = compareMetrics(currentMetrics, previousMetrics);

    // Analyze performance status
    const performanceStatus = analyzePerformanceStatus(currentMetrics, previousMetrics);

    // Detect anomalies
    const anomalies = detectAnomalies(typedMetrics);

    // Aggregate metrics for overall view
    const aggregated = aggregateMetrics(typedMetrics);

    // Suppress unused variable warning — used indirectly via performanceStatus
    void calculatePerformanceScore;

    // Generate suggestions based on metrics
    const suggestions: Array<{
      title: string;
      description: string;
      impact: 'high' | 'medium' | 'low';
    }> = [];

    // Rule 1: CPA increased significantly
    if (comparison.cpa_change > 20) {
      suggestions.push({
        title: 'CPA（顧客獲得単価）の上昇を検出',
        description: `CPAが${comparison.cpa_change.toFixed(2)}%上昇しています（¥${previousMetrics.cpa.toFixed(0)} → ¥${currentMetrics.cpa.toFixed(0)}）。予算削減またはターゲティング改善を検討してください。`,
        impact: 'high',
      });
    }

    // Rule 2: CTR decreased significantly
    if (comparison.ctr_change < -0.5) {
      suggestions.push({
        title: 'CTR（クリック率）の低下を検出',
        description: `CTRが${Math.abs(comparison.ctr_change).toFixed(2)}%低下しています（${previousMetrics.ctr.toFixed(2)}% → ${currentMetrics.ctr.toFixed(2)}%）。広告クリエイティブやヘッドラインの見直しをお勧めします。`,
        impact: 'high',
      });
    }

    // Rule 3: CVR declined significantly
    if (comparison.cvr_change < -1) {
      suggestions.push({
        title: 'CVR（コンバージョン率）の低下を検出',
        description: `CVRが${Math.abs(comparison.cvr_change).toFixed(2)}%低下しています（${previousMetrics.cvr.toFixed(2)}% → ${currentMetrics.cvr.toFixed(2)}%）。ランディングページの改善を検討してください。`,
        impact: 'high',
      });
    }

    // Rule 4: Cost increased without conversion increase
    if (comparison.cost_change_pct > 10 && comparison.conversions_change_pct < 5) {
      suggestions.push({
        title: 'コスト効率の低下',
        description: `費用は${comparison.cost_change_pct.toFixed(2)}%増加していますがコンバージョンは${comparison.conversions_change_pct.toFixed(2)}%の増加に留まっています。入札戦略の最適化をお勧めします。`,
        impact: 'medium',
      });
    }

    // Rule 5: Impressions dropped significantly
    if (comparison.impressions_change_pct < -20) {
      suggestions.push({
        title: 'インプレッション数の大幅低下',
        description: `インプレッション数が${Math.abs(comparison.impressions_change_pct).toFixed(2)}%低下しています。広告の入札額または予算を増加させることを検討してください。`,
        impact: 'medium',
      });
    }

    // Rule 6: Good performance - maintain strategy
    if (comparison.cvr_change > 2 && comparison.cpa_change < -10) {
      suggestions.push({
        title: '優れたパフォーマンス',
        description: `CVRが改善し、CPAが低下しています。現在の戦略が有効です。継続してください。`,
        impact: 'low',
      });
    }

    // Rule 7: ROI improved
    if (
      comparison.conversions_change_pct > comparison.cost_change_pct &&
      comparison.cost_change_pct >= 0
    ) {
      suggestions.push({
        title: 'ROI（投資対効果）の向上',
        description: `コンバージョンの増加率がコスト増加率を上回っています。現在の最適化が機能しています。`,
        impact: 'low',
      });
    }

    // Rule 8: Anomalies detected
    if (anomalies.length > 0) {
      const highSeverity = anomalies.filter((a) => a.severity === 'high').length;
      const medium = anomalies.filter((a) => a.severity === 'medium').length;

      suggestions.push({
        title: `データ異常を${anomalies.length}件検出`,
        description: `高: ${highSeverity}件、中: ${medium}件の異常が検出されました。詳細を確認して調査をお勧めします。`,
        impact: highSeverity > 0 ? 'high' : 'medium',
      });
    }

    // If no issues detected
    if (suggestions.length === 0) {
      suggestions.push({
        title: '追加の改善提案はありません',
        description:
          'メトリクスは安定しており、異常は検出されていません。現在の戦略を継続してください。',
        impact: 'low',
      });
    }

    // Generate analysis text
    const firstDate = typedMetrics[0].date ?? typedMetrics[0].metrics_id;
    const lastDate =
      typedMetrics[typedMetrics.length - 1].date ?? typedMetrics[typedMetrics.length - 1].metrics_id;

    const analysisText = `
【パフォーマンス分析レポート】

【期間情報】
- 開始日: ${firstDate}
- 終了日: ${lastDate}
- データポイント数: ${typedMetrics.length}

【集計メトリクス】
- 総費用: ¥${aggregated.total_cost.toLocaleString('ja-JP')}
- 総インプレッション数: ${aggregated.total_impressions.toLocaleString('ja-JP')}
- 総クリック数: ${aggregated.total_clicks.toLocaleString('ja-JP')}
- 総コンバージョン数: ${aggregated.total_conversions.toLocaleString('ja-JP')}
- 平均CTR: ${aggregated.avg_ctr.toFixed(2)}%
- 平均CVR: ${aggregated.avg_cvr.toFixed(2)}%
- 平均CPA: ¥${aggregated.avg_cpa.toFixed(0)}

【期間比較（最新 vs 前回）】
- 費用変化: ${comparison.cost_change_pct > 0 ? '+' : ''}${comparison.cost_change_pct.toFixed(2)}% (¥${comparison.cost_change_absolute.toLocaleString('ja-JP')})
- インプレッション変化: ${comparison.impressions_change_pct > 0 ? '+' : ''}${comparison.impressions_change_pct.toFixed(2)}% (${comparison.impressions_change_absolute})
- クリック変化: ${comparison.clicks_change_pct > 0 ? '+' : ''}${comparison.clicks_change_pct.toFixed(2)}% (${comparison.clicks_change_absolute})
- コンバージョン変化: ${comparison.conversions_change_pct > 0 ? '+' : ''}${comparison.conversions_change_pct.toFixed(2)}% (${comparison.conversions_change_absolute})
- CTR変化: ${comparison.ctr_change > 0 ? '+' : ''}${comparison.ctr_change.toFixed(2)}%ポイント
- CVR変化: ${comparison.cvr_change > 0 ? '+' : ''}${comparison.cvr_change.toFixed(2)}%ポイント
- CPA変化: ${comparison.cpa_change > 0 ? '+' : ''}${comparison.cpa_change.toFixed(2)}%

【パフォーマンスステータス】
- コスト傾向: ${performanceStatus.cost_trend}
- ROI傾向: ${performanceStatus.roi_trend}
- CTR ステータス: ${performanceStatus.ctr_status}
- CVR ステータス: ${performanceStatus.cvr_status}
- CPA ステータス: ${performanceStatus.cpa_status}
- 総合スコア: ${performanceStatus.overall_score}/100

【検出された異常】
${
  anomalies.length > 0
    ? anomalies
        .map((a) => `- [${a.severity.toUpperCase()}] ${a.type} (${a.date}): ${a.description}`)
        .join('\n')
    : '異常なし'
}

【改善提案】
${suggestions.map((s) => `- [${s.impact.toUpperCase()}] ${s.title}\n  ${s.description}`).join('\n')}
    `.trim();

    return NextResponse.json(
      {
        success: true,
        data: {
          analysis: analysisText,
          suggestions,
          recommendations: suggestions.map((s) => s.title),
        },
      } as ApiResponse<AnalysisResult>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/analysis:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      {
        success: false,
        error: errorMessage,
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
