import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { calculateMetrics } from '@/lib/metrics-calculator';
import { CSVImportResponse } from '@/lib/types';
import Papa from 'papaparse';

/**
 * Validate CSV row data
 */
function validateCSVRow(row: Record<string, string>): {
  isValid: boolean;
  error?: string;
  data?: {
    campaignName: string;
    adGroupName: string;
    impressions: number;
    clicks: number;
    cost: number;
    conversions: number;
    metricDate: string;
  };
} {
  const campaignName = row.Campaign?.trim();
  const adGroupName = row['Ad group']?.trim();
  const impressions = parseInt(row.Impressions) || 0;
  const clicks = parseInt(row.Clicks) || 0;
  const cost = parseFloat(row.Cost) || 0;
  const conversions = parseInt(row.Conversions) || 0;
  const metricDate = row.Date?.trim();

  // Validate required fields
  if (!campaignName) {
    return { isValid: false, error: 'Campaign name is required' };
  }

  if (!adGroupName) {
    return { isValid: false, error: 'Ad group name is required' };
  }

  if (!metricDate) {
    return { isValid: false, error: 'Date is required' };
  }

  // Validate date format
  if (!/^\d{4}-\d{2}-\d{2}$/.test(metricDate)) {
    return { isValid: false, error: 'Date must be in YYYY-MM-DD format' };
  }

  // Validate numeric fields
  if (impressions < 0 || clicks < 0 || cost < 0 || conversions < 0) {
    return {
      isValid: false,
      error: 'Impressions, Clicks, Cost, and Conversions must be non-negative',
    };
  }

  return {
    isValid: true,
    data: {
      campaignName,
      adGroupName,
      impressions,
      clicks,
      cost,
      conversions,
      metricDate,
    },
  };
}

/**
 * Find or create campaign
 */
async function findOrCreateCampaign(
  accountId: string,
  campaignName: string
): Promise<{ success: boolean; campaignId?: string; error?: string }> {
  try {
    // Find existing campaign
    const { data: existingCampaign } = await supabaseAdmin
      .from('campaigns')
      .select('campaign_id')
      .eq('account_id', accountId)
      .eq('campaign_name', campaignName)
      .single();

    if (existingCampaign) {
      return { success: true, campaignId: existingCampaign.campaign_id };
    }

    // Create new campaign
    const { data: newCampaign, error: createError } = await supabaseAdmin
      .from('campaigns')
      .insert([
        {
          account_id: accountId,
          campaign_name: campaignName,
          status: 'active',
        },
      ])
      .select('campaign_id')
      .single();

    if (createError) {
      throw new Error(`Failed to create campaign: ${createError.message}`);
    }

    return { success: true, campaignId: newCampaign?.campaign_id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * Find or create ad group
 */
async function findOrCreateAdGroup(
  campaignId: string,
  adGroupName: string
): Promise<{ success: boolean; adGroupId?: string; error?: string }> {
  try {
    // Find existing ad group
    const { data: existingAdGroup } = await supabaseAdmin
      .from('ad_groups')
      .select('ad_group_id')
      .eq('campaign_id', campaignId)
      .eq('ad_group_name', adGroupName)
      .single();

    if (existingAdGroup) {
      return { success: true, adGroupId: existingAdGroup.ad_group_id };
    }

    // Create new ad group
    const { data: newAdGroup, error: createError } = await supabaseAdmin
      .from('ad_groups')
      .insert([
        {
          campaign_id: campaignId,
          ad_group_name: adGroupName,
          status: 'active',
        },
      ])
      .select('ad_group_id')
      .single();

    if (createError) {
      throw new Error(`Failed to create ad group: ${createError.message}`);
    }

    return { success: true, adGroupId: newAdGroup?.ad_group_id };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
  }
}

/**
 * POST /api/csv-import
 * Import CSV data from Google Ads
 * Expected multipart/form-data with:
 *   - file: CSV file (required)
 *   - account_id: Account UUID (required)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    const accountId = formData.get('account_id') as string;

    // Validate required fields
    if (!file) {
      return NextResponse.json(
        {
          success: false,
          message: 'CSV file is required',
          imported_rows: 0,
          failed_rows: 0,
        } as CSVImportResponse,
        { status: 400 }
      );
    }

    if (!accountId) {
      return NextResponse.json(
        {
          success: false,
          message: 'account_id is required',
          imported_rows: 0,
          failed_rows: 0,
        } as CSVImportResponse,
        { status: 400 }
      );
    }

    // Validate file type
    if (!file.name.endsWith('.csv') && file.type !== 'text/csv') {
      return NextResponse.json(
        {
          success: false,
          message: 'Only CSV files are allowed',
          imported_rows: 0,
          failed_rows: 0,
        } as CSVImportResponse,
        { status: 400 }
      );
    }

    // Validate file size (max 10MB)
    const MAX_FILE_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        {
          success: false,
          message: 'File size exceeds maximum allowed size (10MB)',
          imported_rows: 0,
          failed_rows: 0,
        } as CSVImportResponse,
        { status: 400 }
      );
    }

    // Read file content
    const fileText = await file.text();

    if (!fileText.trim()) {
      return NextResponse.json(
        {
          success: false,
          message: 'CSV file is empty',
          imported_rows: 0,
          failed_rows: 0,
        } as CSVImportResponse,
        { status: 400 }
      );
    }

    // Parse CSV
    let parseResult: Papa.ParseResult<Record<string, string>>;

    try {
      parseResult = await new Promise<Papa.ParseResult<Record<string, string>>>(
        (resolve, reject) => {
          Papa.parse<Record<string, string>>(fileText, {
            header: true,
            skipEmptyLines: true,
            dynamicTyping: false,
            complete: (results) => resolve(results),
            error: (err: Error) => reject(err),
          });
        }
      );
    } catch (parseError) {
      console.error('CSV parse error:', parseError);
      return NextResponse.json(
        {
          success: false,
          message: 'Failed to parse CSV file',
          imported_rows: 0,
          failed_rows: 0,
        } as CSVImportResponse,
        { status: 400 }
      );
    }

    if (!parseResult.data || parseResult.data.length === 0) {
      return NextResponse.json(
        {
          success: false,
          message: 'CSV file contains no data rows',
          imported_rows: 0,
          failed_rows: 0,
        } as CSVImportResponse,
        { status: 400 }
      );
    }

    // Process each CSV row
    let importedRows = 0;
    let failedRows = 0;
    const errors: Array<{ row: number; error: string }> = [];
    const metricsToInsert: Record<string, unknown>[] = [];

    for (let i = 0; i < parseResult.data.length; i++) {
      const row = parseResult.data[i];
      const rowNumber = i + 2; // +2 because row 1 is header, array starts at 0

      try {
        // Validate row data
        const validation = validateCSVRow(row);

        if (!validation.isValid) {
          throw new Error(validation.error);
        }

        const { campaignName, adGroupName, impressions, clicks, cost, conversions, metricDate } =
          validation.data!;

        // Find or create campaign
        const campaignResult = await findOrCreateCampaign(accountId, campaignName);

        if (!campaignResult.success) {
          throw new Error(campaignResult.error);
        }

        const campaignId = campaignResult.campaignId!;

        // Find or create ad group
        const adGroupResult = await findOrCreateAdGroup(campaignId, adGroupName);

        if (!adGroupResult.success) {
          throw new Error(adGroupResult.error);
        }

        const adGroupId = adGroupResult.adGroupId!;

        // Calculate metrics
        const metrics = calculateMetrics({ cost, impressions, clicks, conversions });

        // Prepare metrics record for batch insert
        metricsToInsert.push({
          account_id: accountId,
          campaign_id: campaignId,
          ad_group_id: adGroupId,
          metric_date: metricDate,
          impressions: metrics.impressions,
          clicks: metrics.clicks,
          cost: metrics.cost,
          conversions: metrics.conversions,
          ctr: metrics.ctr,
          cvr: metrics.cvr,
          cpa: metrics.cpa,
        });

        importedRows++;
      } catch (error) {
        failedRows++;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        errors.push({ row: rowNumber, error: errorMessage });
        console.error(`Error processing row ${rowNumber}:`, error);
      }
    }

    // Insert all metrics in batch using upsert
    if (metricsToInsert.length > 0) {
      const { error: insertError } = await supabaseAdmin
        .from('performance_metrics')
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        .upsert(metricsToInsert as any[], {
          onConflict: 'account_id,campaign_id,ad_group_id,metric_date',
        });

      if (insertError) {
        console.error('Error upserting metrics:', insertError);

        const status = importedRows > 0 ? 207 : 500;
        return NextResponse.json(
          {
            success: false,
            message: importedRows > 0
              ? `Partial import: ${insertError.message}`
              : `Import failed: ${insertError.message}`,
            imported_rows: importedRows,
            failed_rows: failedRows,
            errors: errors.slice(0, 10),
          } as CSVImportResponse,
          { status }
        );
      }
    }

    // Record import history
    const importStatus =
      failedRows === 0 ? 'success' : importedRows > 0 ? 'partial' : 'failed';

    const { error: historyError } = await supabaseAdmin.from('import_history').insert([
      {
        account_id: accountId,
        file_name: file.name,
        file_size: file.size,
        rows_imported: importedRows,
        rows_failed: failedRows,
        import_status: importStatus,
        error_message: errors.length > 0 ? JSON.stringify(errors.slice(0, 10)) : null,
      },
    ]);

    if (historyError) {
      console.warn('Warning: Failed to record import history:', historyError);
    }

    const isSuccess = failedRows === 0;

    return NextResponse.json(
      {
        success: isSuccess,
        message: isSuccess
          ? `Successfully imported ${importedRows} rows`
          : `Imported ${importedRows} rows with ${failedRows} failures`,
        imported_rows: importedRows,
        failed_rows: failedRows,
        errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
      } as CSVImportResponse,
      { status: isSuccess ? 200 : 207 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/csv-import:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';

    return NextResponse.json(
      {
        success: false,
        message: errorMessage,
        imported_rows: 0,
        failed_rows: 0,
      } as CSVImportResponse,
      { status: 500 }
    );
  }
}

