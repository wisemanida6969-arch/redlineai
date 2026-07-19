import Anthropic from "@anthropic-ai/sdk";
import { CLAUDE_MODEL, extractText } from "@/lib/anthropic";
import { findStandardArticleText, listArticleTitles, getArticleText } from "@/lib/standardArticles";
import type { createServiceClient } from "@/lib/supabase/server";

/*
 * Core "compare against the MCST standard" analysis pipeline.
 * Lives outside the route file so it can be exercised directly by test
 * scripts (route files may only export HTTP methods). Behavior contract:
 * factual clause descriptions + verbatim DB-quoted standard text only —
 * no judgment/advice language, ever.
 */

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/**
 * PDF/HWP extraction often inserts spaces between characters of legal
 * references ("제 1 조", "제 2 항", "제 3 자"), which breaks article-number
 * matching and looks broken in quotes. Collapse those spaces.
 */
export function normalizeArticleSpacing(text: string): string {
  return text.replace(/제\s*(\d+)\s*(조|항|호|자)/g, "제$1$2");
}

/** Count distinct article numbers ("제N조") — distinct so inline
 *  cross-references ("제3조에 따라") don't inflate the count. Returns 0 when
 *  no article headings are recognizable. */
export function countArticles(text: string): number {
  const nums = new Set<number>();
  for (const m of Array.from(text.matchAll(/제\s*(\d+)\s*조/g))) nums.add(Number(m[1]));
  return nums.size;
}

/** Resolved standard-contract context for "compare against the standard" mode. */
export interface StandardCtx {
  categoryKo: string; categoryEn: string;
  typeKo: string;     typeEn: string;
  partiesKo: string;  partiesEn: string;
  /** Matches lib/standardContracts.ts ids — used to look up real standard_articles rows. */
  typeId: string;
}

/** Extra system-prompt guidance that turns analysis into a standard-comparison review. */
function standardNote(lang: "en" | "ko", s: StandardCtx, articles: { no: number; title: string }[]): string {
  const articleList = articles.map((a) => `제${a.no}조(${a.title})`).join(", ");
  const mappingNoteKo = articles.length > 0
    ? `
- 아래는 「${s.typeKo}」 표준계약서의 실제 조항 목록입니다: ${articleList}
- 표시하는 각 조항 객체에 "stdArticleNo" 필드(숫자)를 추가하세요: 위 목록에서 해당 조항과 주제가 대응하는 표준계약서 조항 번호입니다. 대응하는 조항이 목록에 없으면 null을 넣으세요. 목록에 없는 번호를 지어내지 마세요.`
    : "";
  const mappingNoteEn = articles.length > 0
    ? `
- The actual article list of the "${s.typeEn}" standard contract: ${articleList}
- Add a "stdArticleNo" field (number) to every flagged clause object: the article number from the list above whose subject corresponds to the clause. Use null when no listed article corresponds. Never invent numbers not in the list.`
    : "";
  return lang === "ko"
    ? `

[표준 대비 비교 모드]
이 계약서를 문화체육관광부 「${s.categoryKo} 분야 표준계약서」 중 「${s.typeKo}」(통상 당사자: ${s.partiesKo})를 기준으로 비교하세요.
- 표준계약서가 통상 두는 보호 조항이 이 계약서에 없거나 약화되어 있는지 적극적으로 찾아 분류하세요: 대금 및 지급 시기·방법, 저작권·2차적저작물작성권 등 권리 귀속, 저작인격권(성명표시·동일성유지), 수정·재작업 범위와 횟수, 납품·계약 기간, 비밀유지, 계약 해지, 손해배상, 분쟁 해결.
- 표준과 차이가 있는 조항을 우선적으로 표시하세요.
- summary는 표준과 다른 점을 항목별로 나열하되, 「${s.typeKo}」 표준 대비 총평(예: "위험합니다", "불리합니다")은 포함하지 마세요.
- 표준계약서 원문을 그대로 인용하지 말고, 일반적으로 알려진 표준계약서의 보호 취지를 기준으로 비교하세요. 결과는 참고용이며 사용자는 공식 표준양식과 대조해야 합니다.${mappingNoteKo}`
    : `

[Standard comparison mode]
Compare this contract against Korea MCST's "${s.categoryEn} standard contract — ${s.typeEn}" (typical parties: ${s.partiesEn}).
- Actively flag protections the standard usually guarantees that are missing or weakened in this contract: payment & timing, ownership of copyright / derivative-work rights, moral rights, revision scope & count, delivery/term, confidentiality, termination, damages, dispute resolution.
- Prioritise clauses that differ from the standard.
- List the differences from the standard in "summary" item by item — do not include an overall verdict (e.g. "this contract is risky" or "unfavorable").
- Do not quote the official form verbatim; compare by the standard's general protective intent. Results are for reference and must be checked against the official form.${mappingNoteEn}`;
}

const SYSTEM_PROMPT_EN = `You are a standard-contract comparison tool. You compare a contract's clauses against Korean government (MCST) standard-contract norms and report factual differences — you do not render legal judgments or opinions.

Your response MUST be valid JSON only — no markdown, no explanation outside the JSON.

Return this exact structure:
{
  "summary": "2-3 sentence factual list of what differs from the standard — no overall verdict about the contract",
  "high": [
    {
      "id": "h1",
      "severity": "high",
      "title": "Short, neutral title naming the clause pattern",
      "original": "Exact quote from the contract (max 150 chars)",
      "problem": "Exactly ONE sentence: a factual, neutral statement of what THIS CONTRACT's clause itself provides (paraphrase its content — not a comparison). Never compare it to the standard, characterize it as differing/lacking/weaker, or summarize what the standard says — a verbatim standard quote is attached separately for that. Do not use comparison/hedging words like \"typically\", \"usually\", \"whereas\", \"however\", \"but\", \"in contrast\".",
      "fix": "Always return an empty string \"\". Do not invent or rewrite wording — this field is reserved for a verbatim quote from the official standard contract, which is not available yet."
    }
  ],
  "medium": [...same structure...],
  "low": [...same structure...],
  "precedentQueries": ["2 to 4 precedent-search keywords, each a SHORT Korean legal term of 1-2 words (never a long phrase — the search is keyword-matching and long queries return zero results), based on the contract's subject and main topics — e.g. \"저작권 양도\", \"2차적저작물\", \"용역 대금\", \"전속계약\""]
}

Severity guide (degree of textual difference from the standard, not a danger rating):
- HIGH: Differs substantially from the standard's usual terms. **If the contract excludes or reverses something the standard form explicitly guarantees or mandates (e.g. settlement-record access, hiatus guarantees, revision caps), ALWAYS classify it HIGH.**
- MEDIUM: Differs somewhat, or the wording is unclear compared to the standard
- LOW: Minor difference, or a standard protection is simply missing

[3 clause patterns to always actively check for, regardless of contract type, and flag as HIGH when found]
1. Unlimited-revision clause — language that lets the client (갑) demand revisions indefinitely with no cap ("revise until the client is satisfied", no stated round limit), where the standard caps revision rounds.
2. Full copyright-transfer clause — language transferring all rights (including copyright) to the client regardless of, or before, payment ("all rights to the plan and deliverables belong to the client"), where the standard ties the transfer to payment.
3. Uncapped late-delivery penalty clause — a daily penalty rate that is very high (e.g. 5%+ of the contract value per day) or has no overall cap, where the standard caps it.
When any of these three appear, name the pattern explicitly in the title (e.g. "Unlimited-revision clause", "Full copyright-transfer clause", "Uncapped late-delivery penalty clause") so it's easy to recognize. As with every other clause, leave "fix" as an empty string — do not describe or suggest replacement wording for these either.

Be thorough but practical. "problem" describes only the contract's own clause — never the standard's content, and never in comparative/evaluative language.`;

const SYSTEM_PROMPT_KO = `당신은 계약서 조항을 문화체육관광부(MCST) 표준계약서 기준과 비교해 사실을 보여주는 표준계약서 비교 도구입니다. 법률적 판단이나 의견을 제시하지 않고, 표준과 다른 점을 사실 그대로 보여줍니다.

응답은 반드시 유효한 JSON만 반환해야 합니다 — 마크다운이나 JSON 외부의 설명은 금지입니다.

다음 정확한 구조로 반환하세요:
{
  "summary": "표준과 다른 점을 항목별로 나열한 2-3 문장 (한국어) — '이 계약서는 위험합니다' 같은 총평은 포함하지 말 것",
  "high": [
    {
      "id": "h1",
      "severity": "high",
      "title": "조항 패턴을 나타내는 짧고 중립적인 제목 (한국어)",
      "original": "계약서에서 발췌한 정확한 원문 (최대 150자, 원본 언어 유지)",
      "problem": "정확히 한 문장: 이 계약서 조항 자체가 무엇을 규정하는지 사실 그대로 서술 (조항 내용을 풀어 쓴 것 — 표준과의 비교가 아님). 표준과 다르다/부족하다/약하다는 식으로 비교하거나, 표준계약서 내용을 요약·설명하지 마세요 — 표준 원문은 별도로 그대로 첨부됩니다. '일반적으로', '통상', '반면', '그러나' 같은 비교·완화 표현을 쓰지 마세요. 어미는 반드시 '~라고 규정하고 있습니다', '~하도록 정하고 있습니다' 같은 정중한 서술형(합니다체)으로 끝맺으세요 — '~규정한다' 같은 반말체 금지.",
      "fix": "항상 빈 문자열(\"\")을 반환하세요. 새로운 문장을 짓거나 다시 쓰지 마세요 — 이 필드는 표준계약서 원문을 그대로 인용하기 위한 자리이며, 아직 인용할 원문 데이터가 준비되지 않았습니다."
    }
  ],
  "medium": [...같은 구조...],
  "low": [...같은 구조...],
  "precedentQueries": ["이 계약의 분야와 핵심 쟁점에 기반한 판례 검색 키워드 2~4개 — 각각 반드시 1~2단어의 짧은 법률 용어일 것 (긴 문장·구절 금지: 키워드 매칭 검색이라 긴 질의는 결과가 0건이 됩니다) — 예: \"저작권 양도\", \"2차적저작물\", \"용역 대금\", \"전속계약\""]
}

심각도 가이드 (표준과의 문언상 차이 정도를 나타내며, 위험도 판단이 아닙니다):
- HIGH(큰 차이): 표준계약서의 일반적인 조건과 크게 다름. **표준계약서가 명문으로 보장하거나 의무화한 사항(예: 정산 근거자료 열람, 휴재 보장, 수정 횟수 제한)을 이 계약서가 배제하거나 정반대로 규정한 경우 반드시 HIGH로 분류하세요.**
- MEDIUM(다소 차이): 표준과 다소 다르거나, 표준 대비 표현이 불명확함
- LOW(경미한 차이): 차이가 미미하거나, 표준에 있는 보호 조항이 단순히 빠져 있음

[계약서 종류와 무관하게 항상 최우선으로 확인할 3가지 조항 패턴 — 발견 시 반드시 HIGH로 분류]
1. **수정 횟수 제한 없는 조항** — "갑이 만족할 때까지 수정한다", "수정 횟수 제한 없음" 등 수정 범위·횟수를 명시하지 않은 조항. 표준계약서는 통상 수정 횟수를 제한합니다.
2. **저작권 전부 귀속 조항** — "기획 및 결과물에 관한 모든 권리(저작권 포함)는 갑에게 귀속된다" 등 대금 지급 여부와 무관하게 또는 대금 지급 전에 저작권을 전부 이전시키는 조항. 표준계약서는 통상 저작권 이전을 대금 지급과 연동합니다.
3. **지체상금 상한 없는 조항** — 하루 지연당 계약금의 높은 비율(예: 1일당 5% 이상)을 부과하거나, 총액 상한이 없는 지체상금 조항. 표준계약서는 통상 상한을 둡니다.
위 세 가지가 발견되면 title에 어떤 유형인지 정확히 명시하세요(예: "수정 횟수 제한 없는 조항", "저작권 전부 귀속 조항", "지체상금 상한 없는 조항") — 사용자가 한눈에 알아볼 수 있도록. 다른 조항과 마찬가지로 fix는 빈 문자열로 두고, 대체 문구를 짓거나 제안하지 마세요.

original 필드는 계약서 원문 그대로 발췌하세요(번역하지 말 것). 나머지(title, problem, summary)는 모두 한국어로 자연스럽게 작성하세요. problem은 오직 계약서 자체 조항 내용만 사실 서술하고, 표준계약서 내용은 언급·요약하지 마세요.`;


interface ClauseItem {
  id?: string;
  severity?: string;
  title: string;
  original?: string;
  problem: string;
  fix: string;
  fixSource?: string;
  stdArticleNo?: number | null;
}
export interface MissingArticle {
  articleNo: number;
  title: string;
  /** Verbatim standard-contract text, quoted from the DB — never AI-written. */
  text: string;
}

interface AnalysisData {
  summary?: string;
  high: ClauseItem[];
  medium: ClauseItem[];
  low: ClauseItem[];
  precedentQueries?: string[];
  missingArticles?: MissingArticle[];
  [key: string]: unknown;
}

/** Thrown when the model's JSON could not be parsed even after a retry — the
 *  route maps this to a friendly "please try again" message (never the raw
 *  parse error). */
export class AiResponseParseError extends Error {
  constructor() { super("AI_RESPONSE_PARSE_FAILED"); }
}

/** One model call → parsed AnalysisData. Retries once on truncated/invalid
 *  JSON; logs stop_reason + token usage so truncation is visible in logs. */
async function callAnalysisModel(sys: string, userPrompt: string): Promise<AnalysisData> {
  let lastRaw = "";
  for (let attempt = 1; attempt <= 2; attempt++) {
    const message = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 16384,
      thinking: { type: "disabled" },
      system: sys,
      messages: [{ role: "user", content: userPrompt }],
    });
    const rawText = extractText(message);
    lastRaw = rawText;
    try {
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) throw new Error("no JSON object in response");
      const data = JSON.parse(jsonMatch[0]) as AnalysisData;
      data.high = Array.isArray(data.high) ? data.high : [];
      data.medium = Array.isArray(data.medium) ? data.medium : [];
      data.low = Array.isArray(data.low) ? data.low : [];
      return data;
    } catch (parseErr) {
      // stop_reason "max_tokens" here = response was truncated mid-JSON
      console.error(
        `Analysis JSON parse failed (attempt ${attempt}/2):`, parseErr,
        "| stop_reason:", message.stop_reason,
        "| output_tokens:", message.usage?.output_tokens,
        "| raw tail:", rawText.slice(-300),
      );
    }
  }
  console.error("Analysis raw response (both attempts failed):", lastRaw);
  throw new AiResponseParseError();
}

/**
 * One dedicated pass over the WHOLE contract (independent of chunking):
 * which standard articles have no corresponding content in this contract?
 * The model only picks NUMBERS from the real article list — the quoted text
 * always comes verbatim from the DB. Returns [] on any failure (the report
 * then simply omits the missing-articles section).
 */
async function detectMissingArticles(
  contractText: string,
  articles: { no: number; title: string }[],
): Promise<number[]> {
  const list = articles.map((a) => `제${a.no}조(${a.title})`).join(", ");
  const sys = `당신은 계약서에 특정 주제의 조항이 존재하는지 확인하는 도구입니다.
아래는 기준이 되는 표준계약서의 조항 목록입니다:
${list}

사용자가 제공하는 계약서 전문을 읽고, 위 목록의 각 조항이 다루는 주제에 해당하는 내용이 계약서에 존재하는지 확인하세요. 조항 번호가 달라도 같은 주제를 다루면 존재하는 것입니다.

규칙:
- 반드시 JSON만 반환: {"missing":[번호, 번호, ...]}
- "missing"에는 해당 주제의 내용이 계약서 어디에도 없는 표준 조항 번호만 넣으세요.
- 어떤 형태로든 다뤄진 주제는 넣지 마세요. 확실하지 않으면 넣지 마세요.
- 계약의 명칭·당사자 표시·서명란 같은 형식 요소에 해당하는 조항은 제외하세요.
- 위 목록에 없는 번호를 지어내지 마세요.`;
  try {
    const msg = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 500,
      thinking: { type: "disabled" },
      system: sys,
      messages: [{ role: "user", content: `계약서 전문:\n\n${contractText.slice(0, 30000)}` }],
    });
    const m = extractText(msg).match(/\{[\s\S]*\}/);
    if (!m) return [];
    const parsed = JSON.parse(m[0]) as { missing?: unknown };
    if (!Array.isArray(parsed.missing)) return [];
    const valid = new Set(articles.map((a) => a.no));
    return parsed.missing.filter((n): n is number => typeof n === "number" && valid.has(n));
  } catch (err) {
    console.error("Missing-article detection failed:", err);
    return [];
  }
}

/** Split a long contract into chunks of ~CHUNK_ARTICLES articles each, so no
 *  single model response has to carry the whole report. Contracts without
 *  enough recognizable "제N조" headings stay as one chunk. Every chunk gets
 *  the contract preamble (party names, recitals) for context. */
export function splitContractIntoChunks(text: string, chunkArticles = 6): string[] {
  const headerRe = /(?:^|\n)\s*제\s*\d+\s*조/g;
  const starts: number[] = [];
  for (const m of Array.from(text.matchAll(headerRe))) starts.push((m.index ?? 0) + (m[0].startsWith("\n") ? 1 : 0));
  if (starts.length < 10) return [text.slice(0, 15000)];

  const preamble = text.slice(0, starts[0]).slice(0, 1200);
  const chunks: string[] = [];
  for (let i = 0; i < starts.length; i += chunkArticles) {
    const from = starts[i];
    const to = i + chunkArticles < starts.length ? starts[i + chunkArticles] : text.length;
    chunks.push((preamble + "\n\n" + text.slice(from, to)).slice(0, 15000));
  }
  return chunks;
}

export async function analyzeContract(
  contractText: string,
  lang: "en" | "ko" = "en",
  standard: StandardCtx | undefined,
  service: ReturnType<typeof createServiceClient>,
): Promise<object> {
  const baseSys = lang === "ko" ? SYSTEM_PROMPT_KO : SYSTEM_PROMPT_EN;
  // Real article list of the chosen standard: the AI maps each flagged clause
  // to an article NUMBER only — the text itself is always quoted from the DB.
  const articles = standard ? await listArticleTitles(service, standard.typeId) : [];
  const validArticleNos = new Set(articles.map((a) => a.no));
  const sys = standard ? baseSys + standardNote(lang, standard, articles) : baseSys;
  const stdLine = standard
    ? (lang === "ko" ? `(기준 표준: 문체부 「${standard.typeKo}」)\n\n` : `(Benchmark standard: MCST "${standard.typeEn}")\n\n`)
    : "";

  const chunks = splitContractIntoChunks(contractText);
  const buildPrompt = (chunk: string, i: number) => {
    const partNote = chunks.length > 1
      ? (lang === "ko"
          ? `(전체 계약서 중 일부 조항입니다 — ${i + 1}/${chunks.length} 부분. 이 부분에 포함된 조항만 다루세요.)\n`
          : `(This is part ${i + 1}/${chunks.length} of the contract — only cover the articles included here.)\n`)
      : "";
    return lang === "ko"
      ? `이 계약서를 분석해 JSON 리스크 리포트를 한국어로 반환해주세요:\n\n${partNote}${stdLine}${chunk}`
      : `Please analyze this contract and return a JSON risk report:\n\n${partNote}${stdLine}${chunk}`;
  };

  // Missing-article detection runs over the WHOLE contract in one pass,
  // in parallel with the chunked clause analysis (independent of chunking).
  const missingPromise = standard && articles.length > 0
    ? detectMissingArticles(contractText, articles)
    : Promise.resolve<number[]>([]);

  // All chunks in parallel; a chunk that fails (after its internal parse
  // retry) gets ONE more full retry. Chunks that still fail are dropped so
  // the successful articles' results are kept — unless everything failed.
  const settled = await Promise.allSettled(chunks.map((c, i) => callAnalysisModel(sys, buildPrompt(c, i))));
  const results: AnalysisData[] = [];
  for (let i = 0; i < settled.length; i++) {
    const s = settled[i];
    if (s.status === "fulfilled") { results.push(s.value); continue; }
    console.error(`Analysis chunk ${i + 1}/${chunks.length} failed, retrying once:`, s.reason);
    try {
      results.push(await callAnalysisModel(sys, buildPrompt(chunks[i], i)));
    } catch (retryErr) {
      console.error(`Analysis chunk ${i + 1}/${chunks.length} failed after retry, dropping:`, retryErr);
    }
  }
  if (results.length === 0) throw new AiResponseParseError();

  // Merge chunk results into one report (ids reassigned to stay unique).
  // Per-chunk AI summaries are intentionally DISCARDED: joining them leaked
  // chunk artifacts ("본 부분에는 …") and evaluative phrasing into the
  // report. The final summary is assembled deterministically below from
  // counts and titles only.
  const data: AnalysisData = {
    summary: "",
    high: results.flatMap((r) => r.high),
    medium: results.flatMap((r) => r.medium),
    low: results.flatMap((r) => r.low),
    precedentQueries: Array.from(new Set(results.flatMap((r) => r.precedentQueries ?? []))).slice(0, 4),
  };
  (["high", "medium", "low"] as const).forEach((sev) => {
    data[sev].forEach((clause, i) => { clause.id = `${sev[0]}${i + 1}`; clause.severity = sev; });
  });

  // Smooth doubled endings the model sometimes produces in Korean
  // ("…배제하고 있다고 규정하고 있습니다" → "…배제하고 있습니다").
  if (lang === "ko") {
    for (const clause of [...data.high, ...data.medium, ...data.low]) {
      clause.problem = (clause.problem ?? "").replace(/([하되]고 있)다고 (규정|명시|정)하고 있습니다/g, "$1습니다");
    }
  }

  // Fill "fix" with a real verbatim standard-contract quote where one exists —
  // the AI never writes this text itself (see system prompt). Primary path: the
  // AI picked an article NUMBER from the real article list; we validate it and
  // quote that article verbatim from the DB. Fallback: keyword-topic matching.
  // "fixSource" is app-added citation metadata around the quote, never part of the quote itself.
  if (standard) {
    const typeName = lang === "ko" ? standard.typeKo : standard.typeEn;
    const cite = (articleNo: number) => lang === "ko"
      ? `${typeName} 표준계약서 제${articleNo}조`
      : `${typeName} Standard Contract, Article ${articleNo}`;

    // Standard articles matched to a clause the contract actually CONTAINS —
    // those can't be "missing" whatever the detection pass says.
    const presentNos = new Set<number>();

    for (const clause of [...data.high, ...data.medium, ...data.low]) {
      const pickedNo = typeof clause.stdArticleNo === "number" && validArticleNos.has(clause.stdArticleNo)
        ? clause.stdArticleNo
        : null;
      let resolvedNo: number | null = null;
      if (pickedNo !== null) {
        const text = await getArticleText(service, standard.typeId, pickedNo);
        if (text) {
          clause.fix = text;
          clause.fixSource = cite(pickedNo);
          resolvedNo = pickedNo;
        }
      }
      if (resolvedNo === null) {
        // Search uses the AI's factual clause description — not yet touched by
        // the connector sentence appended below, so keyword matching stays clean.
        const match = await findStandardArticleText(service, standard.typeId, clause.title, clause.problem);
        if (match) {
          clause.fix = match.text;
          clause.fixSource = cite(match.articleNo);
          resolvedNo = match.articleNo;
        }
      }
      // The only sentence connecting the contract's clause to the standard is
      // this fixed, non-evaluative template — never AI-generated, and only
      // added when a real verbatim quote is actually attached below it.
      if (resolvedNo !== null) {
        if (clause.original && clause.original.trim()) presentNos.add(resolvedNo);
        clause.problem = `${clause.problem.trim()} ${
          lang === "ko"
            ? `표준계약서 제${resolvedNo}조는 아래 원문과 같이 규정하고 있습니다.`
            : `MCST Standard Contract Article ${resolvedNo} provides as follows in the original text quoted below.`
        }`;
      }
    }

    // Attach the missing-articles list with verbatim DB text.
    const missingNos = (await missingPromise).filter((no) => !presentNos.has(no));
    const missingArticles: MissingArticle[] = [];
    for (const no of missingNos) {
      const art = articles.find((a) => a.no === no);
      const text = await getArticleText(service, standard.typeId, no);
      if (art && text) missingArticles.push({ articleNo: no, title: art.title, text });
    }
    data.missingArticles = missingArticles;
  }

  // Deterministic factual summary — counts and titles only, assembled in
  // code. No AI-generated sentence reaches the summary, so evaluative
  // phrasing ("일방적으로 유리" 등) and chunk artifacts ("본 부분에는…")
  // are structurally impossible here.
  const total = data.high.length + data.medium.length + data.low.length;
  const highTitles = data.high.map((c) => c.title).slice(0, 5);
  const missingN = data.missingArticles?.length ?? 0;
  if (lang === "ko") {
    const parts = [
      `표준계약서와 다른 것으로 표시된 조항이 ${total}건 확인되었습니다 (큰 차이 ${data.high.length}건 · 다소 차이 ${data.medium.length}건 · 경미한 차이 ${data.low.length}건).`,
    ];
    if (highTitles.length > 0) parts.push(`큰 차이로 표시된 항목: ${highTitles.join(", ")}.`);
    if (missingN > 0) parts.push(`표준계약서에 있으나 본 계약서에서 해당 내용이 확인되지 않은 조항은 ${missingN}건입니다.`);
    data.summary = parts.join(" ");
  } else {
    const parts = [
      `${total} clause(s) were marked as differing from the standard contract (${data.high.length} major · ${data.medium.length} moderate · ${data.low.length} minor).`,
    ];
    if (highTitles.length > 0) parts.push(`Marked as major differences: ${highTitles.join(", ")}.`);
    if (missingN > 0) parts.push(`${missingN} standard article(s) had no corresponding content in this contract.`);
    data.summary = parts.join(" ");
  }

  return data;
}

