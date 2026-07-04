import type { createServiceClient } from "@/lib/supabase/server";

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
): Promise<string | null> {
  const tags = inferTopics(clauseTitle, clauseProblem);
  if (tags.length === 0) return null;

  const { data } = await service
    .from("standard_articles")
    .select("article_text")
    .eq("type_id", typeId)
    .overlaps("topic_tags", tags)
    .order("article_no", { ascending: true })
    .limit(1)
    .maybeSingle();

  return data?.article_text ?? null;
}
