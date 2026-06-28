import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

/* ── 법제처 Open API (official) ── */
async function searchLaw(oc: string, q: string, page: number): Promise<{ results: LiveResult[]; hasMore: boolean } | null> {
  const url = `${LAW_BASE}/lawSearch.do?OC=${encodeURIComponent(oc)}&target=prec&type=JSON&search=2&display=10&page=${page}&query=${encodeURIComponent(q)}`;
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
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
async function searchCopyright(q: string, page: number): Promise<{ results: LiveResult[]; hasMore: boolean }> {
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
    return { results: [], hasMore: false };
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
  return { results, hasMore: results.length >= 10 };
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") || "").slice(0, 60).trim();
  const page = Math.max(1, Math.min(50, parseInt(sp.get("page") || "1", 10) || 1));
  if (!q) return NextResponse.json({ results: [], page, hasMore: false, source: null });

  const oc = process.env.LAW_API_OC;
  if (oc) {
    const law = await searchLaw(oc, q, page);
    if (law && law.results.length > 0) {
      return NextResponse.json({ ...law, page, source: "law" });
    }
  }

  const cr = await searchCopyright(q, page);
  return NextResponse.json({ ...cr, page, source: "copyright" });
}
