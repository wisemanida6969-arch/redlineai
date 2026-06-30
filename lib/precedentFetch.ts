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

/** Catalog field id → a good copyright-DB search keyword. */
export const FIELD_PRECEDENT_KEYWORD: Record<string, string> = {
  art: "미술",
  webtoon: "웹툰",
  performing: "공연",
  film: "영화",
  craft: "공예",
};
