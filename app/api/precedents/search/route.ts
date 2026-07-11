import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { checkFeatureAccess } from "@/lib/passGating";
import { logUsageEvent } from "@/lib/usageEvents";

/**
 * LIVE precedent search.
 *  - If LAW_API_OC is set → official 법제처 국가법령정보 Open API (law.go.kr),
 *    returning rich data (사건번호 / 법원 / 선고일 / 사건명).
 *  - Otherwise → fallback scrape of the Korea Copyright Commission DB (no key).
 * Either way, results are real court data with links to the official source —
 * nothing AI-generated.
 *
 * ?q=<keyword>&page=<n>
 */
const COPYRIGHT_BASE = "https://www.copyright.or.kr/information-materials/trend/precedents";
const LAW_BASE = "https://www.law.go.kr/DRF";

interface LiveResult {
  externalId: string;
  caseNo: string | null;
  title: string;
  court: string | null;
  date: string | null;
  url: string;
  source: "law" | "copyright";
}

function fmtDate(s: string): string | null {
  const m = (s || "").match(/^(\d{4})(\d{2})(\d{2})$/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : (s || null);
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}

/* ── 법제처 Open API (official) ──
 * Called either directly (works only if THIS server's outbound IP is registered
 * with law.go.kr) or via a Korea-hosted proxy (lib/law-proxy) when LAW_PROXY_URL
 * is set — Railway's outbound IP is US-based and not registrable there, so the
 * proxy is the real path once deployed. See law-proxy/README.md.
 */
async function searchLaw(oc: string, q: string, page: number): Promise<{ results: LiveResult[]; hasMore: boolean } | null> {
  const proxyUrl = process.env.LAW_PROXY_URL;
  const proxyKey = process.env.LAW_PROXY_KEY;
  const url = proxyUrl
    ? `${proxyUrl.replace(/\/$/, "")}/prec/search?query=${encodeURIComponent(q)}&page=${page}`
    : `${LAW_BASE}/lawSearch.do?OC=${encodeURIComponent(oc)}&target=prec&type=JSON&search=2&display=10&page=${page}&query=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        ...(proxyUrl && proxyKey ? { "x-proxy-key": proxyKey } : {}),
      },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return null;
    const data = await res.json();
    const root = data?.PrecSearch ?? data?.precSearch;
    if (!root) return null;

    let precs = root.prec ?? root.Prec ?? [];
    if (!Array.isArray(precs)) precs = precs ? [precs] : [];
    const total = parseInt(String(root.totalCnt ?? "0"), 10) || 0;

    const results: LiveResult[] = precs
      .map((p: Record<string, unknown>): LiveResult => {
        const id = String(p["판례일련번호"] ?? "").trim();
        return {
          externalId: id,
          caseNo: String(p["사건번호"] ?? "").trim() || null,
          title: String(p["사건명"] ?? "").trim(),
          court: String(p["법원명"] ?? "").trim() || null,
          date: fmtDate(String(p["선고일자"] ?? "").trim()),
          url: `/api/precedents/view?id=${encodeURIComponent(id)}`,
          source: "law",
        };
      })
      .filter((r: LiveResult) => r.externalId && r.title);

    return { results, hasMore: page * 10 < total };
  } catch {
    return null;
  }
}

/* ── 한국저작권위원회 (no-key fallback) ── */

// Noise words to drop so multi-word queries still match (the source does keyword matching).
const STOPWORDS = new Set([
  "관련", "관한", "관련된", "관련하여", "관련해서", "에", "에서", "대한", "대하여",
  "사건", "판례", "분쟁", "의", "및", "건", "으로", "로", "좀", "주세요", "어떻게", "되나요",
]);

/** Build fallback search candidates: raw → cleaned phrase → individual keywords (original order). */
function candidateQueries(q: string): string[] {
  const tokens = q.split(/\s+/).filter(Boolean);
  const meaningful = tokens.filter((tk) => !STOPWORDS.has(tk) && tk.length >= 2);
  const out: string[] = [q.trim()];
  if (meaningful.length >= 2) out.push(meaningful.join(" "));
  for (const tk of meaningful) out.push(tk);
  return out.filter((v, i, a) => v.length > 0 && a.indexOf(v) === i).slice(0, 4);
}

async function fetchCopyrightPage(q: string, page: number): Promise<LiveResult[]> {
  const listUrl = `${COPYRIGHT_BASE}/list.do?servicecode=06&searchTarget=ALL&searchText=${encodeURIComponent(q)}&pageIndex=${page}`;
  let html = "";
  try {
    const res = await fetch(listUrl, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "ko" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) throw new Error(`upstream ${res.status}`);
    html = await res.text();
  } catch {
    return [];
  }

  const tbody = html.match(/<tbody>([\s\S]*?)<\/tbody>/i)?.[1] ?? "";
  const rows = tbody.split(/<tr[\s>]/i).slice(1);
  const results: LiveResult[] = [];
  for (const row of rows) {
    const id = row.match(/brdctsno=(\d+)/)?.[1];
    const rawTitle = row.match(/title="상세보기"[^>]*>([\s\S]*?)<\/a>/i)?.[1];
    if (!id || !rawTitle) continue;
    const date = row.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
    let title = decodeEntities(rawTitle.replace(/<[^>]+>/g, " "));
    const courtMatch = title.match(/^\[([^\]]+)\]\s*/);
    const court = courtMatch ? courtMatch[1] : null;
    if (courtMatch) title = title.slice(courtMatch[0].length).trim();
    if (!title) continue;
    results.push({
      externalId: `c${id}`,
      caseNo: null,
      title,
      court,
      date,
      url: `${COPYRIGHT_BASE}/view.do?brdctsno=${id}&servicecode=06`,
      source: "copyright",
    });
  }
  return results;
}

async function searchCopyright(q: string, page: number): Promise<{ results: LiveResult[]; hasMore: boolean; effectiveQuery: string }> {
  // For "load more", the client already sends the effective query — search it directly.
  if (page > 1) {
    const results = await fetchCopyrightPage(q, page);
    return { results, hasMore: results.length >= 10, effectiveQuery: q };
  }
  // Page 1: try the raw query, then progressively simpler candidates until something matches.
  for (const cand of candidateQueries(q)) {
    const results = await fetchCopyrightPage(cand, page);
    if (results.length > 0) return { results, hasMore: results.length >= 10, effectiveQuery: cand };
  }
  return { results: [], hasMore: false, effectiveQuery: q.trim() };
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") || "").slice(0, 60).trim();
  const page = Math.max(1, Math.min(50, parseInt(sp.get("page") || "1", 10) || 1));
  if (!q) return NextResponse.json({ results: [], page, hasMore: false, source: null });

  // Case numbers are part of the paid offering: without them a visitor can't
  // just copy the number and read the ruling elsewhere. Strip them from the
  // response (not merely hide in the UI) unless the user has precedent access.
  const service = createServiceClient();
  const access = await checkFeatureAccess(service, user.id, "precedent");
  if (page === 1) logUsageEvent(service, user.id, user.email, "precedent_search", { q });
  const stripCaseNos = (results: LiveResult[]): LiveResult[] =>
    access.allowed ? results : results.map((r) => ({ ...r, caseNo: null }));

  const oc = process.env.LAW_API_OC;
  if (oc) {
    const law = await searchLaw(oc, q, page);
    if (law && law.results.length > 0) {
      return NextResponse.json({ ...law, results: stripCaseNos(law.results), page, source: "law", effectiveQuery: q });
    }
  }

  const cr = await searchCopyright(q, page);
  return NextResponse.json({ ...cr, results: stripCaseNos(cr.results), page, source: "copyright" });
}
