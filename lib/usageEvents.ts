import type { createServiceClient } from "@/lib/supabase/server";

type ServiceClient = ReturnType<typeof createServiceClient>;

/**
 * Fire-and-forget usage-event logging for the admin activity dashboard.
 * Never throws and never blocks the calling request — analytics must not
 * break or slow down product features.
 */
export function logUsageEvent(
  service: ServiceClient,
  userId: string,
  email: string | null | undefined,
  event: string,
  meta?: Record<string, unknown>,
): void {
  void service
    .from("usage_events")
    .insert({ user_id: userId, email: email ?? null, event, meta: meta ?? null })
    .then(({ error }) => {
      if (error) console.error("usage_events insert failed:", error.message);
    });
}
