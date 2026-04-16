import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

const isConfigured = Boolean(supabaseUrl && supabaseAnonKey);

if (!isConfigured) {
  console.warn(
    'Supabase credentials are not configured. Please check your environment variables.'
  );
}

// Lazy singleton instances — created only on first use, not at module evaluation time
let _supabase: SupabaseClient | null = null;
let _supabaseAdmin: SupabaseClient | null = null;

function getSupabaseInstance(): SupabaseClient {
  if (!_supabase) {
    _supabase = createClient(supabaseUrl, supabaseAnonKey);
  }
  return _supabase;
}

function getSupabaseAdminInstance(): SupabaseClient {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);
  }
  return _supabaseAdmin;
}

/**
 * Client-side Supabase client
 * Used for browser operations with limited permissions
 */
export const supabase: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseInstance() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/**
 * Server-side Supabase client with admin privileges
 * Used for server operations with full database access
 * Only use in API routes and server-side functions
 */
export const supabaseAdmin: SupabaseClient = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    return (getSupabaseAdminInstance() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

/**
 * Test Supabase connection
 * Returns connection status and session information
 */
export const testConnection = async (): Promise<{
  connected: boolean;
  error?: string;
}> => {
  if (!isConfigured) {
    return { connected: false, error: 'Supabase credentials are not configured' };
  }
  try {
    const { error } = await supabase.from('accounts').select('count').limit(1);
    if (error) {
      return { connected: false, error: error.message };
    }
    return { connected: true };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    };
  }
};
