import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/**
 * Fetch 판시사항 / 판결요지 for one precedent from the official 법제처 API.
 * Requires LAW_API_OC. ?id=<판례일련번호>
 */
const LAW_BASE = "https://www.law.go.kr/DRF";

function clean(s: unknown): string {
  return String(s ?? "")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // ── Premium gate: viewing the holding (판결요지) is Pro+ only ──
  const service = createServiceClient();
  const { data: profile } = await service.from("profiles").select("plan").eq("id", user.id).single();
  if ((profile?.plan ?? "free") === "free") {
    return NextResponse.json({ locked: true }, { status: 403 });
  }

  const oc = process.env.LAW_API_OC;
  if (!oc) return NextResponse.json({ error: "not_configured" }, { status: 200 });

  const id = (new URL(req.url).searchParams.get("id") || "").replace(/[^0-9]/g, "");
  if (!id) return NextResponse.json({ error: "missing id" }, { status: 400 });

  const url = `${LAW_BASE}/lawService.do?OC=${encodeURIComponent(oc)}&target=prec&ID=${id}&type=JSON`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
      next: { revalidate: 86400 },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    const data = await res.json();
    const root = data?.PrecService ?? data?.precService ?? {};
    const issue = clean(root["판시사항"]).slice(0, 2000);
    const summary = clean(root["판결요지"]).slice(0, 4000);
    const refLaw = clean(root["참조조문"]).slice(0, 1500);
    return NextResponse.json({
      issue,
      summary,
      refLaw,
      caseNo: clean(root["사건번호"]) || null,
      court: clean(root["법원명"]) || null,
    });
  } catch {
    return NextResponse.json({ error: "fetch_failed" }, { status: 200 });
  }
}
