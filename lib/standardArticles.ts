import type { createServiceClient } from "@/lib/supabase/server";
import { STANDARD_CONTRACTS } from "@/lib/standardContracts";

type ServiceClient = ReturnType<typeof createServiceClient>;

/** Keyword → topic tag, mirrors the tagging used when populating `standard_articles`. */
const TOPIC_KEYWORDS: Record<string, string[]> = {
  revision: ["수정", "재작업", "재제작"],
  moral_rights: ["저작인격권", "성명표시", "동일성"],
  penalty: ["지체상금", "위약금", "위약벌"],
  payment: ["대가", "대금", "정산"],
  termination: ["계약의 해지", "해지"],
  damages: ["손해배상"],
  confidentiality: ["비밀유지", "비밀"],
  dispute: ["분쟁해결", "관할법원", "분쟁"],
  ownership: ["소유권"],
};

// "저작권" alone over-matches "저작권자" (a party label, not a topic) — require
// it NOT be immediately followed by "자", or use the more specific "저작재산권".
function hasCopyrightMention(hay: string): boolean {
  if (hay.includes("저작재산권")) return true;
  return /저작권(?!자)/.test(hay);
}

function inferTopics(clauseTitle: string, clauseProblem: string): string[] {
  const hay = `${clauseTitle} ${clauseProblem}`;
  const tags: string[] = [];
  for (const [tag, keywords] of Object.entries(TOPIC_KEYWORDS)) {
    if (keywords.some((kw) => hay.includes(kw))) tags.push(tag);
  }
  if (hasCopyrightMention(hay)) tags.push("copyright");
  return tags;
}

export interface StandardArticleMatch {
  /** Verbatim article text from the standard_articles table — never altered. */
  text: string;
  articleNo: number;
}

/**
 * Looks up a verbatim standard-contract article matching the topic of a flagged
 * clause, for the specific standard type the user is comparing against. Returns
 * null (never invents text) when no topic can be inferred or no article matches —
 * the caller must leave "fix" empty in that case.
 */
export async function findStandardArticleText(
  service: ServiceClient,
  typeId: string,
  clauseTitle: string,
  clauseProblem: string,
): Promise<StandardArticleMatch | null> {
  const tags = inferTopics(clauseTitle, clauseProblem);
  if (tags.length === 0) return null;

  const { data } = await service
    .from("standard_articles")
    .select("article_text, article_no")
    .eq("type_id", typeId)
    .overlaps("topic_tags", tags)
    .order("article_no", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (!data) return null;
  return { text: data.article_text, articleNo: data.article_no };
}

/** All article numbers + titles for one standard-contract type (for AI article mapping). */
export async function listArticleTitles(
  service: ServiceClient,
  typeId: string,
): Promise<{ no: number; title: string }[]> {
  const { data } = await service
    .from("standard_articles")
    .select("article_no, article_title")
    .eq("type_id", typeId)
    .order("article_no", { ascending: true });
  return (data ?? []).map((r) => ({ no: r.article_no, title: r.article_title }));
}

/** Verbatim text of one specific article. Null when it doesn't exist — never invented. */
export async function getArticleText(
  service: ServiceClient,
  typeId: string,
  articleNo: number,
): Promise<string | null> {
  const { data } = await service
    .from("standard_articles")
    .select("article_text")
    .eq("type_id", typeId)
    .eq("article_no", articleNo)
    .maybeSingle();
  return data?.article_text ?? null;
}

export interface StandardArticleSearchResult {
  categoryTitle: string;
  typeTitle: string;
  articleNo: number;
  articleTitle: string;
  articleText: string;
}

function norm(s: string): string {
  return s.toLowerCase().trim();
}

function titleMatches(query: string, title: { ko: string; en: string }): boolean {
  const q = norm(query);
  if (!q) return false;
  const ko = norm(title.ko);
  const en = norm(title.en);
  return ko.includes(q) || q.includes(ko) || en.includes(q) || q.includes(en);
}

/**
 * Free-text search over the real standard-contract article database, for the
 * AI legal-assistant chat's search tool. Resolves `category`/`contractType`
 * against the STANDARD_CONTRACTS catalog by fuzzy name match (the model only
 * knows field/type names, not internal ids), infers a topic from `topic`
 * using the same keyword mapping used to populate the table, then returns up
 * to `limit` verbatim articles. Returns [] (never invents) when nothing
 * resolves — the caller should tell the user no match was found.
 */
export async function searchStandardArticles(
  service: ServiceClient,
  params: { category?: string; contractType?: string; topic: string },
  lang: "en" | "ko",
  limit = 5,
): Promise<StandardArticleSearchResult[]> {
  const categories = params.category
    ? STANDARD_CONTRACTS.filter((c) => titleMatches(params.category!, c.title))
    : STANDARD_CONTRACTS;
  const candidateCategories = categories.length > 0 ? categories : STANDARD_CONTRACTS;

  const typeIds: string[] = [];
  const typeById = new Map<string, { categoryTitle: string; typeTitle: string }>();
  for (const cat of candidateCategories) {
    const types = params.contractType
      ? cat.types.filter((t) => titleMatches(params.contractType!, t.title))
      : cat.types;
    for (const t of types) {
      typeIds.push(t.id);
      typeById.set(t.id, {
        categoryTitle: lang === "ko" ? cat.title.ko : cat.title.en,
        typeTitle: lang === "ko" ? t.title.ko : t.title.en,
      });
    }
  }
  if (typeIds.length === 0) return [];

  const tags = inferTopics(params.topic, "");
  if (tags.length === 0) return [];

  let query = service
    .from("standard_articles")
    .select("type_id, article_no, article_title, article_text")
    .overlaps("topic_tags", tags)
    .order("article_no", { ascending: true })
    .limit(limit);

  // Only constrain by type when the model resolved to a specific subset —
  // searching the full catalog (all 35 types) for a topic is still useful.
  if (typeIds.length < STANDARD_CONTRACTS.flatMap((c) => c.types).length) {
    query = query.in("type_id", typeIds);
  }

  const { data } = await query;
  if (!data) return [];

  return data.map((row) => {
    const meta = typeById.get(row.type_id);
    return {
      categoryTitle: meta?.categoryTitle ?? "",
      typeTitle: meta?.typeTitle ?? row.type_id,
      articleNo: row.article_no,
      articleTitle: row.article_title,
      articleText: row.article_text,
    };
  });
}
