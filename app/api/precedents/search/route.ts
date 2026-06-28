import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

/**
 * LIVE precedent search against the Korea Copyright Commission precedent DB
 * (copyright.or.kr). No API key required. Returns real case entries (title,
 * court, date) with a link to the official source — nothing AI-generated.
 *
 * ?q=<keyword>&page=<n>
 */
const BASE = "https://www.copyright.or.kr/information-materials/trend/precedents";

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

interface LiveResult {
  externalId: string;
  title: string;
  court: string | null;
  date: string | null;
  url: string;
}

export async function GET(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") || "").slice(0, 60).trim();
  const page = Math.max(1, Math.min(50, parseInt(sp.get("page") || "1", 10) || 1));
  if (!q) return NextResponse.json({ results: [], page, hasMore: false });

  const listUrl = `${BASE}/list.do?servicecode=06&searchTarget=ALL&searchText=${encodeURIComponent(q)}&pageIndex=${page}`;

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
    return NextResponse.json({ results: [], page, hasMore: false, error: "source_unavailable" });
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
      externalId: id,
      title,
      court,
      date,
      url: `${BASE}/view.do?brdctsno=${id}&servicecode=06`,
    });
  }

  return NextResponse.json({ results, page, hasMore: results.length >= 10 });
}
