import { NextRequest, NextResponse } from "next/server";

/**
 * Serves the official 법제처 precedent HTML view. law.go.kr gates this page by
 * registered server IP too (not just the JSON API), so we cannot redirect the
 * end user's own browser there directly — their IP is never registered. When
 * LAW_PROXY_URL is configured, we fetch the HTML through the Korea-hosted proxy
 * and return it directly (proxied content, not a redirect). Falls back to a
 * direct redirect (best-effort) when no proxy is configured.
 */
export async function GET(req: NextRequest) {
  const oc = process.env.LAW_API_OC;
  const proxyUrl = process.env.LAW_PROXY_URL;
  const proxyKey = process.env.LAW_PROXY_KEY;
  const id = (new URL(req.url).searchParams.get("id") || "").replace(/[^0-9]/g, "");

  if (!id) {
    return NextResponse.redirect("https://www.law.go.kr/precSc.do");
  }

  if (proxyUrl) {
    try {
      const res = await fetch(`${proxyUrl.replace(/\/$/, "")}/prec/view?id=${id}`, {
        headers: proxyKey ? { "x-proxy-key": proxyKey } : {},
        cache: "no-store",
        signal: AbortSignal.timeout(15000),
      });
      const html = await res.text();
      return new NextResponse(html, {
        status: res.status,
        headers: { "Content-Type": "text/html; charset=utf-8" },
      });
    } catch {
      return new NextResponse("법제처 페이지를 불러오지 못했습니다.", { status: 502 });
    }
  }

  if (!oc) {
    return NextResponse.redirect("https://www.law.go.kr/precSc.do");
  }
  return NextResponse.redirect(
    `https://www.law.go.kr/DRF/lawService.do?OC=${encodeURIComponent(oc)}&target=prec&ID=${id}&type=HTML`,
  );
}
