import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Supabase credentials are not configured. Please check your environment variables.'
  );
}

/**
 * Client-side Supabase client
 * Used for browser operations with limited permissions
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

/**
 * Server-side Supabase client with admin privileges
 * Used for server operations with full database access
 * Only use in API routes and server-side functions
 */
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey);

/**
 * Test Supabase connection
 * Returns connection status and session information
 */
export const testConnection = async (): Promise<{
  connected: boolean;
  error?: string;
}> => {
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
