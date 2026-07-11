import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {}
        },
      },
    }
  );
}

/**
 * Service-role client — bypasses RLS.
 * Uses the plain supabase-js client (NOT @supabase/ssr) so the service_role
 * key is actually applied and not overridden by user cookies.
 */
export function createServiceClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        // Next.js patches global fetch and can cache GETs made inside route
        // handlers — a stale "empty" result would keep a paid unlock invisible.
        // Database reads must never be served from the fetch cache.
        fetch: (url, init) => fetch(url, { ...init, cache: "no-store" }),
      },
    }
  );
}
