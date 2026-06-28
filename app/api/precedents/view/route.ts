import { NextRequest, NextResponse } from "next/server";

/**
 * Redirects to the official 법제처 precedent HTML view, keeping LAW_API_OC
 * server-side (never exposed to the client). ?id=<판례일련번호>
 */
export async function GET(req: NextRequest) {
  const oc = process.env.LAW_API_OC;
  const id = (new URL(req.url).searchParams.get("id") || "").replace(/[^0-9]/g, "");

  if (!oc || !id) {
    return NextResponse.redirect("https://www.law.go.kr/precSc.do");
  }
  return NextResponse.redirect(
    `https://www.law.go.kr/DRF/lawService.do?OC=${encodeURIComponent(oc)}&target=prec&ID=${id}&type=HTML`,
  );
}
