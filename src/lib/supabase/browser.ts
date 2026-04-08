import { createClient } from "@supabase/supabase-js";

export function getSupabaseBrowser() {
  // IMPORTANT: In Next.js client bundles, NEXT_PUBLIC_* env vars are only inlined
  // when accessed statically (e.g. process.env.NEXT_PUBLIC_FOO). Dynamic indexing
  // like process.env[name] won't work in the browser.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_URL");
  if (!anonKey) throw new Error("Missing env: NEXT_PUBLIC_SUPABASE_ANON_KEY");
  return createClient(url, anonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
  });
}

