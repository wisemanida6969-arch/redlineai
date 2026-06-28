import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * Returns curated REAL court precedents from the `precedents` table.
 * Optional ?field=<catalog field id> → precedents tagged for that field
 * plus cross-cutting (is_general) ones. Data is human-curated with official
 * source links; nothing here is AI-generated.
 */
export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const field = new URL(req.url).searchParams.get("field");
  // allow only simple slug values (catalog field ids)
  const safeField = field && /^[a-z]+$/.test(field) ? field : null;

  const service = createServiceClient();
  const base = service
    .from("precedents")
    .select("id, case_no, court, decided_on, title, summary, fields, topics, is_general, source_name, source_url")
    .order("decided_on", { ascending: false, nullsFirst: false });

  const { data, error } = safeField
    ? await base.or(`is_general.eq.true,fields.cs.{${safeField}}`)
    : await base;

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ precedents: data ?? [] });
}
