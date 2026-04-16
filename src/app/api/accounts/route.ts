import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { ApiResponse } from '@/lib/types';

/**
 * GET /api/accounts
 * Retrieve all accounts
 */
export async function GET(request: NextRequest) {
  try {
    const { data, error } = await supabaseAdmin
      .from('accounts')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching accounts:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to fetch accounts',
        } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
      } as ApiResponse<typeof data>,
      { status: 200 }
    );
  } catch (error) {
    console.error('Unexpected error in GET /api/accounts:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}

/**
 * POST /api/accounts
 * Create a new account
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.account_name || !body.google_account_id) {
      return NextResponse.json(
        {
          success: false,
          error: 'account_name and google_account_id are required',
        } as ApiResponse<null>,
        { status: 400 }
      );
    }

    // Check for duplicate account
    const { data: existingAccount } = await supabaseAdmin
      .from('accounts')
      .select('account_id')
      .eq('google_account_id', body.google_account_id)
      .single();

    if (existingAccount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Account with this Google ID already exists',
        } as ApiResponse<null>,
        { status: 409 }
      );
    }

    // Insert new account
    const { data, error } = await supabaseAdmin
      .from('accounts')
      .insert([
        {
          account_name: body.account_name,
          google_account_id: body.google_account_id,
          description: body.description || '',
          is_active: body.is_active ?? true,
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('Error creating account:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create account',
        } as ApiResponse<null>,
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        success: true,
        data,
        message: 'Account created successfully',
      } as ApiResponse<typeof data>,
      { status: 201 }
    );
  } catch (error) {
    console.error('Unexpected error in POST /api/accounts:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error',
      } as ApiResponse<null>,
      { status: 500 }
    );
  }
}
