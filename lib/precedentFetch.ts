/* ------------------------------------------------------------------ */
/*  Server-side precedent fetch (Korea Copyright Commission, no key)    */
/*  Returns REAL case titles/links — used to inform contract drafting.  */
/* ------------------------------------------------------------------ */

const COPYRIGHT_BASE = "https://www.copyright.or.kr/information-materials/trend/precedents";

export interface PrecedentRef {
  title: string;
  court: string | null;
  date: string | null;
  url: string;
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ").trim();
}

/** Fetch up to `limit` real precedent entries for a keyword. Returns [] on any failure. */
export async function fetchPrecedentTitles(query: string, limit = 6): Promise<PrecedentRef[]> {
  if (!query.trim()) return [];
  const listUrl = `${COPYRIGHT_BASE}/list.do?servicecode=06&searchTarget=ALL&searchText=${encodeURIComponent(query)}&pageIndex=1`;
  try {
    const res = await fetch(listUrl, {
      headers: { "User-Agent": "Mozilla/5.0", "Accept-Language": "ko" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const tbody = html.match(/<tbody>([\s\S]*?)<\/tbody>/i)?.[1] ?? "";
    const rows = tbody.split(/<tr[\s>]/i).slice(1);
    const out: PrecedentRef[] = [];
    for (const row of rows) {
      const id = row.match(/brdctsno=(\d+)/)?.[1];
      const rawTitle = row.match(/title="상세보기"[^>]*>([\s\S]*?)<\/a>/i)?.[1];
      if (!id || !rawTitle) continue;
      const date = row.match(/(\d{4}-\d{2}-\d{2})/)?.[1] ?? null;
      let title = decodeEntities(rawTitle.replace(/<[^>]+>/g, " "));
      const cm = title.match(/^\[([^\]]+)\]\s*/);
      const court = cm ? cm[1] : null;
      if (cm) title = title.slice(cm[0].length).trim();
      if (!title) continue;
      out.push({ title, court, date, url: `${COPYRIGHT_BASE}/view.do?brdctsno=${id}&servicecode=06` });
      if (out.length >= limit) break;
    }
    return out;
  } catch {
    return [];
  }
}

export interface LawPrecedentRef {
  /** 법제처 판례일련번호 */
  externalId: string;
  caseNo: string | null;
  title: string;
  court: string | null;
  date: string | null;
}

/**
 * Search the official 법제처 국가법령정보 precedent API (directly or via the
 * Korea-hosted proxy) and return rich rows including case numbers. Returns []
 * when the API is not configured or fails — callers should fall back to
 * fetchPrecedentTitles.
 */
export async function fetchLawPrecedents(query: string, limit = 5): Promise<LawPrecedentRef[]> {
  const oc = process.env.LAW_API_OC;
  const proxyUrl = process.env.LAW_PROXY_URL;
  const proxyKey = process.env.LAW_PROXY_KEY;
  if (!query.trim() || (!oc && !proxyUrl)) return [];

  const url = proxyUrl
    ? `${proxyUrl.replace(/\/$/, "")}/prec/search?query=${encodeURIComponent(query)}&page=1`
    : `https://www.law.go.kr/DRF/lawSearch.do?OC=${encodeURIComponent(oc!)}&target=prec&type=JSON&search=2&display=${limit}&page=1&query=${encodeURIComponent(query)}`;

  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0", ...(proxyUrl && proxyKey ? { "x-proxy-key": proxyKey } : {}) },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(12000),
    });
    if (!res.ok) return [];
    const data = await res.json();
    const root = data?.PrecSearch ?? data?.precSearch;
    if (!root) return [];
    let precs = root.prec ?? root.Prec ?? [];
    if (!Array.isArray(precs)) precs = precs ? [precs] : [];

    const fmtDate = (s: string) => {
      const m = (s || "").match(/^(\d{4})(\d{2})(\d{2})$/);
      return m ? `${m[1]}-${m[2]}-${m[3]}` : (s || null);
    };

    return (precs as Record<string, unknown>[])
      .map((p): LawPrecedentRef => ({
        externalId: String(p["판례일련번호"] ?? "").trim(),
        caseNo: String(p["사건번호"] ?? "").trim() || null,
        title: String(p["사건명"] ?? "").trim(),
        court: String(p["법원명"] ?? "").trim() || null,
        date: fmtDate(String(p["선고일자"] ?? "").trim()),
      }))
      .filter((r) => r.externalId && r.title)
      .slice(0, limit);
  } catch {
    return [];
  }
}

/** Catalog field id → a good copyright-DB search keyword. */
export const FIELD_PRECEDENT_KEYWORD: Record<string, string> = {
  art: "미술",
  webtoon: "웹툰",
  performing: "공연",
  film: "영화",
  craft: "공예",
};
