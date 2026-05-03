import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { data: scan } = await service
    .from("vendor_scans")
    .select("id, user_id, vendor_name, result, created_at")
    .eq("id", params.id)
    .single();

  if (!scan) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (scan.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  return NextResponse.json({
    report: scan.result,
    scannedAt: scan.created_at,
    scanId: scan.id,
  });
}
