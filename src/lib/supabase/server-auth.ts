import { createClient } from "@supabase/supabase-js";
import { getRequiredEnv } from "@/lib/env";

/**
 * Server-side Supabase client using ANON key.
 * Used only to validate access tokens (auth.getUser(token)).
 */
export function getSupabaseServerAuth() {
  const url = getRequiredEnv("NEXT_PUBLIC_SUPABASE_URL");
  const anonKey = getRequiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}

