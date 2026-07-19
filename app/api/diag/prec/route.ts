import { NextRequest, NextResponse } from "next/server";

/**
 * Diagnostic: measures 법제처 precedent search behavior through the configured
 * proxy/direct path — totalCnt, returned rows, and whether search/display
 * params pass through. Safe to remove after diagnosis.
 */
export const dynamic = "force-dynamic";

async function probe(base: string, headers: Record<string, string>, extra: string) {
  try {
    const res = await fetch(`${base}${extra}`, { headers, cache: "no-store", signal: AbortSignal.timeout(12000) });
    const text = await res.text();
    let totalCnt: string | null = null;
    let rows = 0;
    const titles: string[] = [];
    try {
      const data = JSON.parse(text);
      const root = data?.PrecSearch ?? data?.precSearch;
      totalCnt = root?.totalCnt ?? null;
      let precs = root?.prec ?? [];
      if (!Array.isArray(precs)) precs = precs ? [precs] : [];
      rows = precs.length;
      for (const p of precs.slice(0, 5)) titles.push(String(p["사건명"] ?? ""));
    } catch { /* non-JSON */ }
    return { status: res.status, totalCnt, rows, titles, raw: totalCnt === null ? text.slice(0, 200) : undefined };
  } catch (e) {
    return { status: -1, error: e instanceof Error ? e.message : String(e) };
  }
}

export async function GET(req: NextRequest) {
  const q = new URL(req.url).searchParams.get("q") || "위약금";
  const oc = process.env.LAW_API_OC;
  const proxyUrl = process.env.LAW_PROXY_URL;
  const proxyKey = process.env.LAW_PROXY_KEY;

  const base = proxyUrl
    ? `${proxyUrl.replace(/\/$/, "")}/prec/search?query=${encodeURIComponent(q)}&page=1`
    : `https://www.law.go.kr/DRF/lawSearch.do?OC=${encodeURIComponent(oc ?? "")}&target=prec&type=JSON&query=${encodeURIComponent(q)}&page=1`;
  const headers = { "User-Agent": "Mozilla/5.0", ...(proxyUrl && proxyKey ? { "x-proxy-key": proxyKey } : {}) };

  const [dflt, disp30, search1, search2, disp50s2] = await Promise.all([
    probe(base, headers, ""),
    probe(base, headers, "&display=30"),
    probe(base, headers, "&search=1&display=10"),
    probe(base, headers, "&search=2&display=10"),
    probe(base, headers, "&search=2&display=50"),
  ]);

  return NextResponse.json({
    via: proxyUrl ? "proxy" : "direct",
    query: q,
    dflt, disp30, search1, search2, disp50s2,
  });
}
