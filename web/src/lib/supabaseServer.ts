import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL as string;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY as string;

export function getSupabaseServer() {
  if (!supabaseUrl || !supabaseServiceKey) {
    throw new Error('SUPABASE service env vars are required on server');
  }
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false }
  });
}
