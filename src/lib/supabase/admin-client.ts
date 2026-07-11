import { createClient as createSupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase client with service-role key.
 * NEVER import on the client side — server actions / route handlers only.
 */
export function createAdminClient() {
  const url     = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!service) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. Add it to .env.local.",
    );
  }

  return createSupabaseClient(url, service, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
