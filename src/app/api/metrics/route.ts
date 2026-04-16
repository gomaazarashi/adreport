import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';
import { ApiResponse, MetricsResponse } from '@/lib/types';

/**
 * GET /api/metrics
 * Retrieve performance metrics for specified account and date range
 * Query parameters:
 *   - account_id: (required) Account UUID
 *   - start_date: (optional) Start date (YYYY-MM-DD)
 *   - end_date: (optional) End date (YYYY-MM-DD)
 *   - campaign_id: (optional) Filter by campaign
 *   - ad_group_id: (optional) Filter by ad group
 *   - level: (optional) Aggregation level: account, campaign, ad_group, ad, asset
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('account_id');
    const startDate = searchParams.get('start_date');
    const endDate = searchParams.get('end_date');
    const campaignId = searchParams.get('campaign_id');
    const adGroupId = searchParams.get('ad_group_id');
    const level = searchParams.get('level') || 'account';

    // Validate required parameter
    if (!accountId) {
      return NextResponse.json(
        {
          success: false,
          error: 'account_id query parameter is required',
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Validate date format if provided
    if (startDate && !/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid start_date format. Use YYYY-MM-DD',
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid end_date format. Use YYYY-MM-DD',
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Build base query with proper column selection based on level
    let selectColumns = '*';

    if (level === 'campaign') {
      selectColumns = `
        campaign_id,
        metric_date,
        impressions,
        clicks,
        cost,
        conversions,
        ctr,
        cvr,
        cpa
      `;
    } else if (level === 'ad_group') {
      selectColumns = `
        ad_group_id,
        campaign_id,
        metric_date,
        impressions,
        clicks,
        cost,
        conversions,
        ctr,
        cvr,
        cpa
      `;
    } else if (level === 'ad') {
      selectColumns = `
        ad_id,
        ad_group_id,
        metric_date,
        impressions,
        clicks,
        cost,
        conversions,
        ctr,
        cvr,
        cpa
      `;
    } else if (level === 'asset') {
      selectColumns = `
        asset_id,
        metric_date,
        impressions,
        clicks,
        cost,
        conversions,
        ctr,
        cvr,
        cpa
      `;
    }

    let query = supabaseAdmin
      .from('performance_metrics')
      .select(selectColumns)
      .eq('account_id', accountId)
      .order('metric_date', { ascending: false });

    // Apply date filters
    if (startDate) {
      query = query.gte('metric_date', startDate);
    }

    if (endDate) {
      query = query.lte('metric_date', endDate);
    }

    // Apply optional filters based on level
    if (level === 'campaign' && campaignId) {
      query = query.eq('campaign_id', campaignId);
    }

    if (level === 'ad_group' && adGroupId) {
      query = query.eq('ad_group_id', adGroupId);
    }

    if (level === 'ad' && campaignId) {
      // If filtering by ad, we still need the campaign filter
      const { data: adGroupsData } = await supabaseAdmin
        .from('ad_groups')
        .select('ad_group_id')
        .eq('campaign_id', campaignId);

      if (adGroupsData && adGroupsData.length > 0) {
        const adGroupIds = adGroupsData.map((ag) => ag.ad_group_id);
        query = query.in('ad_group_id', adGroupIds);
      }
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error('Error fetching metrics:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch metrics',
        } as ApiResponse<null>,
        { status: 500 }
      );
    }

    // Calculate period from actual data
    let calculatedStartDate = startDate;
    let calculatedEndDate = endDate;

    if (!calculatedStartDate || !calculatedEndDate) {
      if (data && data.length > 0) {
        const dates = (data as unknown as Record<string, unknown>[])
          .map((d) => d.metric_date as string)
          .filter((d: string) => d)
          .sort();

        if (!calculatedStartDate && dates.length > 0) {
          calculatedStartDate = dates[0];
        }

        if (!calculatedEndDate && dates.length > 0) {
          calculatedEndDate = dates[dates.length - 1];
        }
      }
    }

    if (!calculatedStartDate) {
      calculatedStartDate = new Date().toISOString().split('T')[0];
    }

    if (!calculatedEndDate) {
      calculatedEndDate = new Date().toISOString().split('T')[0];
    }

    const period = {
      start_date: calculatedStartDate,
      end_date: calculatedEndDate,
    };

    return NextResponse.json(
      {
        success: true,
        data: data || [],
        period,
      } as unknown as MetricsResponse,
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/metrics:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
