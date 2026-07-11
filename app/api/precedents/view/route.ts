import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkFeatureAccess, recordFeatureUsage } from "@/lib/passGating";
import { checkPackageAccess } from "@/lib/packageAccess";

/**
 * Serves the official 법제처 precedent HTML view. law.go.kr gates this page by
 * registered server IP too (not just the JSON API), so we cannot redirect the
 * end user's own browser there directly — their IP is never registered. When
 * LAW_PROXY_URL is configured, we fetch the HTML through the Korea-hosted proxy
 * and return it directly (proxied content, not a redirect). Falls back to a
 * direct redirect (best-effort) when no proxy is configured.
 */

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.redirect(new URL("/auth/login", req.url));

  const service = createServiceClient();
  let access = await checkFeatureAccess(service, user.id, "precedent");

  // Links inside a purchased package PDF carry ?scan=<scanId>: owning the
  // package for that contract grants permanent precedent viewing for its
  // links (the 24h pass alone would expire and lock the buyer's own report).
  const scanParam = new URL(req.url).searchParams.get("scan");
  if (!access.allowed && scanParam) {
    const pkg = await checkPackageAccess(service, user.id, scanParam);
    if (pkg.unlocked) access = { allowed: true, via: "pass" };
  }

  if (!access.allowed) {
    return new NextResponse(lockedPage(), {
      status: 403,
      headers: { "Content-Type": "text/html; charset=utf-8" },
    });
  }
  if (access.via === "member") {
    await recordFeatureUsage(service, user.id, "precedent");
  }

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
      // law.go.kr sometimes gates the HTML view separately from the JSON API
      // ("미신청된 목록/본문에 대한 접근") even when search/detail work fine.
      // Show a friendly fallback instead of their raw error page.
      if (html.includes("미신청") || html.includes("접근입니다")) {
        return new NextResponse(fallbackPage(id), {
          status: 200,
          headers: { "Content-Type": "text/html; charset=utf-8" },
        });
      }
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

function lockedPage(): string {
  return `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"><title>판례 원문 보기</title>
<style>body{font-family:system-ui,sans-serif;background:#0f1a2e;color:#e2e8f0;padding:40px 24px;max-width:560px;margin:0 auto;line-height:1.6}
h1{font-size:18px;color:#fff}</style></head>
<body>
<h1>판례 원문 보기는 유료 기능입니다</h1>
<p>24시간 패스(₩3,900) 또는 월 멤버십(₩9,900, 판례보기 50건+업체스캔 40건 포함)으로 이용하실 수 있어요. 대시보드로 돌아가 구매해주세요.</p>
</body></html>`;
}

function fallbackPage(id: string): string {
  return `<!DOCTYPE html>
<html lang="ko"><head><meta charset="utf-8"><title>공식 출처 안내</title>
<style>body{font-family:system-ui,sans-serif;background:#0f1a2e;color:#e2e8f0;padding:40px 24px;max-width:560px;margin:0 auto;line-height:1.6}
a{color:#f87171}h1{font-size:18px;color:#fff}</style></head>
<body>
<h1>공식 원문을 지금 바로 열 수 없습니다</h1>
<p>이 판례의 법제처 원문 열람 권한이 아직 완전히 활성화되지 않았습니다. 대신 아래 사이트에서 사건번호로 직접 검색해 확인하실 수 있습니다.</p>
<p><a href="https://glaw.scourt.go.kr/wsjo/panre/sjo060.do" target="_blank" rel="noopener noreferrer">대법원 종합법률정보에서 검색 →</a></p>
<p><a href="https://casenote.kr/" target="_blank" rel="noopener noreferrer">casenote.kr에서 검색 →</a></p>
<p style="color:#94a3b8;font-size:13px;margin-top:24px">판례일련번호(법제처 내부 ID): ${id}</p>
</body></html>`;
}
