import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkPackageAccess, unlockScanForPro } from "@/lib/packageAccess";
import { buildReportPdf } from "@/lib/packageReport";
import { logUsageEvent } from "@/lib/usageEvents";

export const dynamic = "force-dynamic";

/*
 * 사인 전 패키지 — server-side PDF report for one scan.
 *  GET  ?check=1        → access status JSON (unlocked / via / pro remaining)
 *  POST {action:use_pro} → pro subscriber spends one monthly unlock on this scan
 *  GET                   → the PDF itself (403 unless unlocked)
 *
 * Wording rule (legal): factual comparison only — "표준계약서와 다름",
 * "표준계약서에 존재하나 본 계약서에 없음", "관련 판례", "참고 정보".
 * No judgment/advice language anywhere in this file.
 */

export async function POST(req: NextRequest, { params }: { params: { scanId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  if (body?.action !== "use_pro") return NextResponse.json({ error: "Unknown action" }, { status: 400 });

  const service = createServiceClient();
  const result = await unlockScanForPro(service, user.id, params.scanId);
  if (!result.ok) return NextResponse.json({ error: result.error }, { status: 403 });

  logUsageEvent(service, user.id, user.email, "package_unlock", { via: "pro", scanId: params.scanId });
  return NextResponse.json({ unlocked: true, proRemaining: result.proRemaining });
}

export async function GET(req: NextRequest, { params }: { params: { scanId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const access = await checkPackageAccess(service, user.id, params.scanId);

  const checkOnly = new URL(req.url).searchParams.get("check") === "1";
  if (checkOnly) return NextResponse.json(access);

  if (!access.unlocked) return NextResponse.json({ error: "locked", access }, { status: 403 });

  // ── Load the scan (must belong to the caller) ──
  const { data: scan } = await service
    .from("scans")
    .select("id, user_id, filename, summary, result, created_at")
    .eq("id", params.scanId)
    .single();
  if (!scan) return NextResponse.json({ error: "Scan not found" }, { status: 404 });
  if (scan.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  try {
    const pdf = await buildReportPdf(service, user.id, scan);
    logUsageEvent(service, user.id, user.email, "report_download", { scanId: params.scanId });
    return new NextResponse(new Uint8Array(pdf), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="redlineai-report-${String(scan.created_at).slice(0, 10)}.pdf"`,
      },
    });
  } catch (err) {
    console.error("Report PDF generation failed:", err);
    return NextResponse.json({ error: "generation_failed", retry: true }, { status: 500 });
  }
}
