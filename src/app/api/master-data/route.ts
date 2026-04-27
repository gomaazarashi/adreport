import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

export const dynamic = 'force-dynamic';

/**
 * GET /api/master-data
 * Retrieve master data (campaigns, ad groups, ads, assets) for a given account.
 * Used by the dashboard FilterPanel to populate selectable filter options.
 *
 * Query parameters:
 *   - account_id: (required) Account UUID
 *
 * Response shape:
 *   {
 *     success: true,
 *     campaigns: Campaign[],
 *     adGroups: AdGroup[],
 *     ads: Ad[],
 *     assets: Asset[]
 *   }
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const accountId = searchParams.get('account_id');

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

    // 1) Campaigns for this account
    const { data: campaigns, error: campaignsError } = await supabaseAdmin
      .from('campaigns')
      .select('*')
      .eq('account_id', accountId)
      .order('campaign_name', { ascending: true });

    if (campaignsError) {
      console.error('Error fetching campaigns:', campaignsError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch campaigns',
        } as ApiResponse<null>,
        { status: 500 }
      );
    }

    const campaignIds = (campaigns ?? []).map(
      (c: { campaign_id: string }) => c.campaign_id
    );

    // 2) Ad groups whose campaign_id is in the campaign list
    let adGroups: unknown[] = [];
    if (campaignIds.length > 0) {
      const { data: adGroupsData, error: adGroupsError } = await supabaseAdmin
        .from('ad_groups')
        .select('*')
        .in('campaign_id', campaignIds)
        .order('ad_group_name', { ascending: true });

      if (adGroupsError) {
        console.error('Error fetching ad groups:', adGroupsError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to fetch ad groups',
          } as ApiResponse<null>,
          { status: 500 }
        );
      }

      adGroups = adGroupsData ?? [];
    }

    const adGroupIds = (adGroups as Array<{ ad_group_id: string }>).map(
      (ag) => ag.ad_group_id
    );

    // 3) Ads whose ad_group_id is in the ad group list
    let ads: unknown[] = [];
    if (adGroupIds.length > 0) {
      const { data: adsData, error: adsError } = await supabaseAdmin
        .from('ads')
        .select('*')
        .in('ad_group_id', adGroupIds)
        .order('ad_headline', { ascending: true });

      if (adsError) {
        console.error('Error fetching ads:', adsError);
        return NextResponse.json(
          {
            success: false,
            error: 'Failed to fetch ads',
          } as ApiResponse<null>,
          { status: 500 }
        );
      }

      ads = adsData ?? [];
    }

    // 4) Assets for this account
    const { data: assets, error: assetsError } = await supabaseAdmin
      .from('assets')
      .select('*')
      .eq('account_id', accountId)
      .order('asset_name', { ascending: true });

    if (assetsError) {
      console.error('Error fetching assets:', assetsError);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch assets',
        } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        campaigns: campaigns ?? [],
        adGroups,
        ads,
        assets: assets ?? [],
      },
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/master-data:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
