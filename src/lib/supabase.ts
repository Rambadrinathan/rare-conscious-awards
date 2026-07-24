import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function env(name: string): string | undefined {
  const v = process.env[name]?.trim();
  return v || undefined;
}

export function isSupabaseConfigured(): boolean {
  return Boolean(
    env("NEXT_PUBLIC_SUPABASE_URL") &&
      (env("SUPABASE_SERVICE_ROLE_KEY") || env("NEXT_PUBLIC_SUPABASE_ANON_KEY"))
  );
}

/** Server-side client. Prefer service role for inserts when set. */
export function getSupabase(): SupabaseClient | null {
  if (!isSupabaseConfigured()) return null;
  if (client) return client;

  const url = env("NEXT_PUBLIC_SUPABASE_URL")!;
  const key =
    env("SUPABASE_SERVICE_ROLE_KEY") || env("NEXT_PUBLIC_SUPABASE_ANON_KEY")!;

  client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  return client;
}
