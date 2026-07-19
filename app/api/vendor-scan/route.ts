import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { CLAUDE_MODEL } from "@/lib/anthropic";
import { checkFeatureAccess, recordFeatureUsage } from "@/lib/passGating";
import { logUsageEvent } from "@/lib/usageEvents";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT_KO = `당신은 사업체의 공개 정보를 조사하는 리서치 도구입니다. 웹 리서치로 확인된 공개 사실만 정리하며, 평가·등급·점수·판단·조언은 제공하지 않습니다.

리포트 작성 전 반드시 web_search 도구로 회사에 대한 최신 사실 정보를 찾으세요:
- 회사 기본 정보: 법인명, 소재지, 설립연도, 업종, 상장 여부, 규모
- 최근 보도된 뉴스·보도자료 (최근 12개월)
- 공개된 재무 정보: 투자 유치, 매출, 인력 변동, 회생·파산 절차 등 보도된 사실
- 공개된 법적 기록: 보도된 소송, 규제 조치 등

리서치 후 최종 응답은 반드시 유효한 JSON만 반환하세요. 다음 정확한 구조를 따르세요:

{
  "vendorName": "공식 회사명",
  "overview": "회사 개요 2-3문장 (사업 영역, 규모, 위치, 가능하면 설립연도) — 한국어",
  "publicInfo": ["법인명: …", "소재지: …", "설립연도: …", "업종: …", "상장 여부: …"],
  "newsRisk": {
    "summary": "보도된 뉴스 사실 요약 2-3문장 (한국어)",
    "items": ["가능하면 날짜와 함께 보도된 사실 1 (한국어)", "보도된 사실 2", "..."]
  },
  "financialRisk": {
    "summary": "공개된 재무 정보 요약 2-3문장 (한국어)",
    "items": ["공개된 사실 1 (한국어)", "공개된 사실 2", "..."]
  },
  "legalRisk": {
    "summary": "공개된 법적 기록 요약 2-3문장 (한국어)",
    "items": ["보도·공개된 기록 1 (한국어)", "기록 2", "..."]
  },
  "sources": ["URL 1", "URL 2", "URL 3"]
}

규칙:
- severity, 등급, 점수, 위험도, 별점 등 어떤 평가 필드도 절대 포함하지 마세요.
- "위험", "불리", "주의", "권장", "추천" 등 평가·조언 표현을 쓰지 마세요. 확인된 사실만 서술하세요.
- publicInfo에는 웹에서 확인된 항목만 넣고, 확인되지 않은 항목은 넣지 마세요.
- 특정 카테고리에 정보를 찾을 수 없으면 summary에 "공개된 정보가 확인되지 않았습니다"라고 적으세요. 세부사항을 지어내지 마세요.

중요한 포맷 규칙:
- JSON 문자열 필드 안에 <cite> 태그, 인용 마커, HTML/XML 태그 절대 사용 금지.
- [1], [2] 같은 각주 마커 절대 사용 금지.
- 출처 URL은 "sources" 배열에만 — 요약이나 항목에 인라인 사용 금지.
- 일반적인 가독성 있는 한국어 텍스트만 출력.`;

const SYSTEM_PROMPT = `You are a research tool that compiles PUBLIC information about a company. You report only verified public facts from web research — no ratings, grades, scores, judgments, or advice.

You MUST use the web_search tool to find recent, factual information about the company before drafting the report. Search for:
- Company basics: legal name, headquarters location, founding year, industry, listing status, size
- Recent news and press releases (last 12 months)
- Publicly reported financial facts: funding, revenue, workforce changes, insolvency proceedings
- Publicly reported legal records: reported lawsuits, regulatory actions

After researching, return a final response that is VALID JSON only — no markdown, no explanation outside the JSON. Use this exact structure:

{
  "vendorName": "Official company name",
  "overview": "2-3 sentence factual overview: what the company does, size, location, founded year if known",
  "publicInfo": ["Legal name: …", "Headquarters: …", "Founded: …", "Industry: …", "Listed: …"],
  "newsRisk": {
    "summary": "2-3 sentence summary of reported news facts",
    "items": ["Reported fact 1 with date if possible", "Reported fact 2", "..."]
  },
  "financialRisk": {
    "summary": "2-3 sentence summary of publicly reported financial facts",
    "items": ["Reported fact 1", "Reported fact 2", "..."]
  },
  "legalRisk": {
    "summary": "2-3 sentence summary of publicly reported legal records",
    "items": ["Reported record 1", "Reported record 2", "..."]
  },
  "sources": ["URL 1", "URL 2", "URL 3"]
}

Rules:
- NEVER include any rating field — no severity, grade, score, or risk level of any kind.
- No evaluative or advisory wording ("risky", "unfavorable", "recommend", "watch out"). Verified facts only.
- Include only verified entries in publicInfo; omit anything unconfirmed.
- If you cannot find information for a category, say so honestly in the summary. Do not fabricate details.

CRITICAL FORMATTING RULES:
- Do NOT include any <cite> tags, citation markers, or HTML/XML tags inside the JSON string fields.
- Do NOT include footnote markers like [1], [2], etc.
- Source URLs go ONLY in the "sources" array — never inline in summaries or items.
- Output plain readable text only.`;

interface VendorSection { severity?: "high" | "medium" | "low"; summary: string; items: string[] }

interface VendorReport {
  vendorName: string;
  overview: string;
  /** Public company facts (법인명/소재지/설립연도/업종/상장 여부). */
  publicInfo?: string[];
  newsRisk: VendorSection;
  financialRisk: VendorSection;
  legalRisk: VendorSection;
  /** Legacy fields — no longer generated; kept optional so old saved scans still parse. */
  overallScore?: "high" | "medium" | "low";
  overallSummary?: string;
  recommendations?: string[];
  sources: string[];
}

/** Strip <cite index="..."> and </cite> tags from a string. */
function stripCiteTags(s: string): string {
  if (!s) return s;
  return s
    .replace(/<cite\s[^>]*>/gi, "")
    .replace(/<\/cite>/gi, "")
    .replace(/<cite>/gi, "")
    .trim();
}

/** Recursively strip cite tags from all string fields in the report. */
function cleanReport(r: VendorReport): VendorReport {
  const cleanArr = (arr: string[]) => arr.map(stripCiteTags).filter(Boolean);
  const cleanSection = (s: VendorSection | undefined) => ({
    summary: stripCiteTags(s?.summary ?? ""),
    items: cleanArr(s?.items || []),
  });
  return {
    vendorName: stripCiteTags(r.vendorName),
    overview: stripCiteTags(r.overview),
    publicInfo: cleanArr(r.publicInfo || []),
    newsRisk: cleanSection(r.newsRisk),
    financialRisk: cleanSection(r.financialRisk),
    legalRisk: cleanSection(r.legalRisk),
    sources: cleanArr(r.sources || []),
  };
}

interface ScanHints {
  country?: string;
  website?: string;
  industry?: string;
}

async function scanVendor(vendorName: string, lang: "en" | "ko" = "en", hints: ScanHints = {}): Promise<VendorReport> {
  /* Build a disambiguation hint block */
  const hintsListKo: string[] = [];
  const hintsListEn: string[] = [];
  if (hints.country?.trim())  { hintsListKo.push(`국가: ${hints.country.trim()}`);     hintsListEn.push(`Country: ${hints.country.trim()}`); }
  if (hints.website?.trim())  { hintsListKo.push(`웹사이트: ${hints.website.trim()}`); hintsListEn.push(`Website: ${hints.website.trim()}`); }
  if (hints.industry?.trim()) { hintsListKo.push(`업종: ${hints.industry.trim()}`);   hintsListEn.push(`Industry: ${hints.industry.trim()}`); }

  const hintBlockKo = hintsListKo.length
    ? `\n\n[정확한 회사 식별을 위한 추가 정보]\n${hintsListKo.join("\n")}\n위 정보와 일치하는 회사로 한정하여 분석하세요. 동명의 다른 회사는 제외하세요.`
    : "";
  const hintBlockEn = hintsListEn.length
    ? `\n\n[Additional details for disambiguation]\n${hintsListEn.join("\n")}\nFocus your analysis on the company matching the above. Exclude other companies with similar names.`
    : "";

  const userPrompt = lang === "ko"
    ? `다음 공급업체에 대한 리스크 평가를 수행하세요: "${vendorName}".${hintBlockKo}\n\n웹에서 최근 뉴스, 재무, 법적 기록, 평판 신호를 검색한 후, 명세된 JSON 리스크 리포트를 한국어로 생성하세요.`
    : `Conduct a risk assessment on the vendor: "${vendorName}".${hintBlockEn}\n\nSearch the web for recent news, financials, legal records, and reputation signals. Then produce the JSON risk report as specified.`;
  // Use Claude with web search tool, looping through tool_use turns until final response
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: userPrompt,
    },
  ];

  const sys = lang === "ko" ? SYSTEM_PROMPT_KO : SYSTEM_PROMPT;

  let finalText = "";
  for (let turn = 0; turn < 6; turn++) {
    const response = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 4096,
      thinking: { type: "disabled" },
      system: sys,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 5,
        } as unknown as Anthropic.Tool,
      ],
      messages,
    });

    // Collect any text the assistant emitted this turn
    for (const block of response.content) {
      if (block.type === "text") finalText = block.text;
    }

    if (response.stop_reason === "end_turn" || response.stop_reason === "stop_sequence") {
      break;
    }

    if (response.stop_reason === "tool_use") {
      // Append assistant turn + empty tool_result for server-tool web_search (Claude handles internally)
      messages.push({ role: "assistant", content: response.content });

      const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
      const toolResults = toolUseBlocks.map((b) => ({
        type: "tool_result" as const,
        tool_use_id: (b as Anthropic.ToolUseBlock).id,
        content: "",
      }));
      messages.push({ role: "user", content: toolResults as Anthropic.ToolResultBlockParam[] });
      continue;
    }

    break;
  }

  if (!finalText) throw new Error("Vendor scan returned no text");

  const jsonMatch = finalText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid AI response format");
  return JSON.parse(jsonMatch[0]);
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ──
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to use this feature." }, { status: 401 });
    }

    // ── Pass / membership quota check ──
    const service = createServiceClient();
    const access = await checkFeatureAccess(service, user.id, "vendor");

    if (!access.allowed) {
      return NextResponse.json({
        error: access.reason === "quota_exceeded"
          ? `You've used all ${access.limit} Vendor Risk Scans this month.`
          : "Vendor Risk Scan requires a 24-hour pass or membership.",
        limitReached: true,
        access,
      }, { status: 403 });
    }

    // ── Parse input ──
    const body = await req.json();
    const vendorName = (body.vendorName as string)?.trim();
    const lang: "en" | "ko" = body.lang === "ko" ? "ko" : "en";
    const hints: ScanHints = {
      country:  typeof body.country  === "string" ? body.country  : undefined,
      website:  typeof body.website  === "string" ? body.website  : undefined,
      industry: typeof body.industry === "string" ? body.industry : undefined,
    };
    if (!vendorName) {
      return NextResponse.json({ error: "Vendor name is required." }, { status: 400 });
    }
    if (vendorName.length > 200) {
      return NextResponse.json({ error: "Vendor name is too long." }, { status: 400 });
    }

    // ── Scan ──
    const rawReport = await scanVendor(vendorName, lang, hints);
    const report = cleanReport(rawReport);

    // ── Save scan to history ──
    const { data: saved, error: saveError } = await service.from("vendor_scans").insert({
      user_id: user.id,
      vendor_name: report.vendorName || vendorName,
      overall_score: null,
      overview: report.overview,
      result: report,
    }).select("id, created_at").single();

    if (saveError) {
      console.error("Failed to save vendor scan:", JSON.stringify(saveError, null, 2));
    }

    // ── Update usage (member-quota grants only; a pass doesn't count against quota) ──
    if (access.via === "member") {
      await recordFeatureUsage(service, user.id, "vendor");
    }

    logUsageEvent(service, user.id, user.email, "vendor_scan");

    return NextResponse.json({
      report,
      scannedAt: saved?.created_at || new Date().toISOString(),
      scanId: saved?.id,
      access,
    });
  } catch (err: unknown) {
    console.error("Vendor scan error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Vendor scan failed" }, { status: 500 });
  }
}
