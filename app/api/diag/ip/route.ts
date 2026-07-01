import { NextResponse } from "next/server";

/**
 * Diagnostic: reports this server's OUTBOUND IP (to register at open.law.go.kr)
 * and a live 법제처 API test so you can confirm once the IP is registered.
 * Safe to remove after setup.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  // 1) Outbound IP (the address law.go.kr sees when we call it)
  let outboundIp = "unknown";
  try {
    const r = await fetch("https://api.ipify.org?format=json", {
      cache: "no-store",
      signal: AbortSignal.timeout(8000),
    });
    outboundIp = (await r.json())?.ip ?? "unknown";
  } catch {
    // fallback provider
    try {
      const r2 = await fetch("https://ifconfig.me/ip", { cache: "no-store", signal: AbortSignal.timeout(8000) });
      outboundIp = (await r2.text()).trim() || "unknown";
    } catch { outboundIp = "unknown (ip lookup failed)"; }
  }

  // 2) Live 법제처 test (OC never exposed — only the response snippet)
  const oc = process.env.LAW_API_OC;
  const lawConfigured = Boolean(oc);
  let lawTest = "LAW_API_OC not set";
  let lawWorking = false;
  if (oc) {
    try {
      const r = await fetch(
        `https://www.law.go.kr/DRF/lawSearch.do?OC=${encodeURIComponent(oc)}&target=prec&type=JSON&display=1&query=${encodeURIComponent("저작권")}`,
        { headers: { "User-Agent": "Mozilla/5.0" }, cache: "no-store", signal: AbortSignal.timeout(9000) },
      );
      const text = await r.text();
      lawWorking = text.includes("PrecSearch") || text.includes("판례일련번호");
      lawTest = text.slice(0, 400);
    } catch {
      lawTest = "law.go.kr fetch failed";
    }
  }

  return NextResponse.json({
    outboundIp,
    lawConfigured,
    lawWorking,
    lawTest,
    hint: lawWorking
      ? "법제처 API 정상 작동 중입니다."
      : "위 outboundIp 를 open.law.go.kr 마이페이지의 OPEN API 서버 IP로 등록하세요.",
  });
}
