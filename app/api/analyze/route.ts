import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { PLAN_LIMITS, type Plan } from "@/lib/planLimits";
import { getCategory, getContractType } from "@/lib/standardContracts";
import { extractTextFromHwpx, looksLikeZip } from "@/lib/hwpxExtract";
import { extractTextFromHwpBinary } from "@/lib/hwpBinaryExtract";
import { CLAUDE_MODEL, extractText } from "@/lib/anthropic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

/** Resolved standard-contract context for "compare against the standard" mode. */
interface StandardCtx {
  categoryKo: string; categoryEn: string;
  typeKo: string;     typeEn: string;
  partiesKo: string;  partiesEn: string;
}

/** Extra system-prompt guidance that turns analysis into a standard-comparison review. */
function standardNote(lang: "en" | "ko", s: StandardCtx): string {
  return lang === "ko"
    ? `

[표준 대비 비교 모드]
이 계약서를 문화체육관광부 「${s.categoryKo} 분야 표준계약서」 중 「${s.typeKo}」(통상 당사자: ${s.partiesKo})를 기준으로 비교하세요.
- 표준계약서가 통상 두는 보호 조항이 이 계약서에 없거나 약화되어 있는지 적극적으로 찾아 분류하세요: 대금 및 지급 시기·방법, 저작권·2차적저작물작성권 등 권리 귀속, 저작인격권(성명표시·동일성유지), 수정·재작업 범위와 횟수, 납품·계약 기간, 비밀유지, 계약 해지, 손해배상, 분쟁 해결.
- 표준과 차이가 있는 조항을 우선적으로 표시하세요.
- summary는 표준과 다른 점을 항목별로 나열하되, 「${s.typeKo}」 표준 대비 총평(예: "위험합니다", "불리합니다")은 포함하지 마세요.
- 표준계약서 원문을 그대로 인용하지 말고, 일반적으로 알려진 표준계약서의 보호 취지를 기준으로 비교하세요. 결과는 참고용이며 사용자는 공식 표준양식과 대조해야 합니다.`
    : `

[Standard comparison mode]
Compare this contract against Korea MCST's "${s.categoryEn} standard contract — ${s.typeEn}" (typical parties: ${s.partiesEn}).
- Actively flag protections the standard usually guarantees that are missing or weakened in this contract: payment & timing, ownership of copyright / derivative-work rights, moral rights, revision scope & count, delivery/term, confidentiality, termination, damages, dispute resolution.
- Prioritise clauses that differ from the standard.
- List the differences from the standard in "summary" item by item — do not include an overall verdict (e.g. "this contract is risky" or "unfavorable").
- Do not quote the official form verbatim; compare by the standard's general protective intent. Results are for reference and must be checked against the official form.`;
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
      "problem": "Factual statement of how this clause differs from what the standard contract provides — no danger/risk language",
      "fix": "Always return an empty string \"\". Do not invent or rewrite wording — this field is reserved for a verbatim quote from the official standard contract, which is not available yet."
    }
  ],
  "medium": [...same structure...],
  "low": [...same structure...],
  "precedentQueries": ["2 to 4 short Korean keywords for finding related Korean court precedents, based on the contract's subject and main topics — e.g. \"저작권 양도\", \"2차적저작물\", \"용역 대금\", \"전속계약\""]
}

Severity guide (degree of difference from the standard, not a danger rating):
- HIGH: Differs substantially from the standard's usual terms
- MEDIUM: Differs somewhat, or the wording is unclear compared to the standard
- LOW: Minor difference, or a standard protection is simply missing

[3 clause patterns to always actively check for, regardless of contract type, and flag as HIGH when found]
1. Unlimited-revision clause — language that lets the client (갑) demand revisions indefinitely with no cap ("revise until the client is satisfied", no stated round limit), where the standard caps revision rounds.
2. Full copyright-transfer clause — language transferring all rights (including copyright) to the client regardless of, or before, payment ("all rights to the plan and deliverables belong to the client"), where the standard ties the transfer to payment.
3. Uncapped late-delivery penalty clause — a daily penalty rate that is very high (e.g. 5%+ of the contract value per day) or has no overall cap, where the standard caps it.
When any of these three appear, name the pattern explicitly in the title (e.g. "Unlimited-revision clause", "Full copyright-transfer clause", "Uncapped late-delivery penalty clause") so it's easy to recognize. As with every other clause, leave "fix" as an empty string — do not describe or suggest replacement wording for these either.

Be thorough but practical, and stick to factual comparisons — not opinions about fairness or danger.`;

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
      "problem": "표준계약서와 어떻게 다른지 사실 위주로 설명 (위험하다/불리하다 등 판단 표현 금지)",
      "fix": "항상 빈 문자열(\"\")을 반환하세요. 새로운 문장을 짓거나 다시 쓰지 마세요 — 이 필드는 표준계약서 원문을 그대로 인용하기 위한 자리이며, 아직 인용할 원문 데이터가 준비되지 않았습니다."
    }
  ],
  "medium": [...같은 구조...],
  "low": [...같은 구조...],
  "precedentQueries": ["이 계약의 분야와 핵심 쟁점에 기반해 관련 한국 법원 판례를 찾을 검색어 2~4개 (한국어, 짧게) — 예: \"저작권 양도\", \"2차적저작물\", \"용역 대금\", \"전속계약\""]
}

심각도 가이드 (표준과의 차이 정도를 나타내며, 위험도 판단이 아닙니다):
- HIGH(큰 차이): 표준계약서의 일반적인 조건과 크게 다름
- MEDIUM(다소 차이): 표준과 다소 다르거나, 표준 대비 표현이 불명확함
- LOW(경미한 차이): 차이가 미미하거나, 표준에 있는 보호 조항이 단순히 빠져 있음

[계약서 종류와 무관하게 항상 최우선으로 확인할 3가지 조항 패턴 — 발견 시 반드시 HIGH로 분류]
1. **수정 횟수 제한 없는 조항** — "갑이 만족할 때까지 수정한다", "수정 횟수 제한 없음" 등 수정 범위·횟수를 명시하지 않은 조항. 표준계약서는 통상 수정 횟수를 제한합니다.
2. **저작권 전부 귀속 조항** — "기획 및 결과물에 관한 모든 권리(저작권 포함)는 갑에게 귀속된다" 등 대금 지급 여부와 무관하게 또는 대금 지급 전에 저작권을 전부 이전시키는 조항. 표준계약서는 통상 저작권 이전을 대금 지급과 연동합니다.
3. **지체상금 상한 없는 조항** — 하루 지연당 계약금의 높은 비율(예: 1일당 5% 이상)을 부과하거나, 총액 상한이 없는 지체상금 조항. 표준계약서는 통상 상한을 둡니다.
위 세 가지가 발견되면 title에 어떤 유형인지 정확히 명시하세요(예: "수정 횟수 제한 없는 조항", "저작권 전부 귀속 조항", "지체상금 상한 없는 조항") — 사용자가 한눈에 알아볼 수 있도록. 다른 조항과 마찬가지로 fix는 빈 문자열로 두고, 대체 문구를 짓거나 제안하지 마세요.

original 필드는 계약서 원문 그대로 발췌하세요(번역하지 말 것). 나머지(title, problem, summary)는 모두 한국어로 자연스럽게 작성하세요. 철저하되, 판단이나 의견이 아닌 사실 비교에 집중하세요.`;

async function extractTextFromPdf(buffer: Buffer): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const parsed = await pdfParse(buffer);
    const text = (parsed.text as string)?.trim();
    return text && text.length > 100 ? text : null;
  } catch {
    return null;
  }
}

async function extractTextWithVision(buffer: Buffer, mimeType: string): Promise<string> {
  const base64 = buffer.toString("base64");
  const response = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    thinking: { type: "disabled" },
    messages: [{
      role: "user",
      content: [
        { type: "document", source: { type: "base64", media_type: mimeType as "application/pdf", data: base64 } },
        { type: "text", text: "Please extract and return ALL text from this document exactly as it appears. Do not summarize or analyze — just transcribe the full text." },
      ],
    }],
  });
  return extractText(response);
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = (await import("mammoth")).default;
  const result = await mammoth.extractRawText({ buffer });
  return result.value?.trim() || "";
}

async function analyzeContract(contractText: string, lang: "en" | "ko" = "en", standard?: StandardCtx): Promise<object> {
  const truncated = contractText.slice(0, 15000);
  const baseSys = lang === "ko" ? SYSTEM_PROMPT_KO : SYSTEM_PROMPT_EN;
  const sys = standard ? baseSys + standardNote(lang, standard) : baseSys;
  const stdLine = standard
    ? (lang === "ko" ? `(기준 표준: 문체부 「${standard.typeKo}」)\n\n` : `(Benchmark standard: MCST "${standard.typeEn}")\n\n`)
    : "";
  const userPrompt = lang === "ko"
    ? `이 계약서를 분석해 JSON 리스크 리포트를 한국어로 반환해주세요:\n\n${stdLine}${truncated}`
    : `Please analyze this contract and return a JSON risk report:\n\n${stdLine}${truncated}`;
  const message = await client.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 4096,
    thinking: { type: "disabled" },
    system: sys,
    messages: [{ role: "user", content: userPrompt }],
  });
  const rawText = extractText(message);
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid AI response format");
  return JSON.parse(jsonMatch[0]);
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ──
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to scan contracts." }, { status: 401 });
    }

    // ── Scan limit check ──
    const serviceClient = createServiceClient();
    const { data: profile } = await serviceClient
      .from("profiles")
      .select("plan, scans_used, scan_month")
      .eq("id", user.id)
      .single();

    const currentMonth = new Date().toISOString().slice(0, 7); // e.g. "2026-04"
    const scansUsed = profile?.scan_month === currentMonth ? (profile?.scans_used ?? 0) : 0;
    const plan = (profile?.plan ?? "free") as Plan;
    const limit = PLAN_LIMITS[plan].analysis;

    if (limit !== null && scansUsed >= limit) {
      return NextResponse.json({
        error: `You've used all ${limit} Contract Analysis scans this month.`,
        limitReached: true,
      }, { status: 403 });
    }

    // ── Extract text ──
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const pastedText = formData.get("text") as string | null;
    const langField = formData.get("lang");
    const lang: "en" | "ko" = langField === "ko" ? "ko" : "en";

    // ── Optional: compare against a chosen MCST standard contract ──
    const stdCatId = formData.get("standardCategory") as string | null;
    const stdTypeId = formData.get("standardType") as string | null;
    let standard: StandardCtx | undefined;
    if (stdCatId && stdTypeId) {
      const cat = getCategory(stdCatId);
      const type = getContractType(stdCatId, stdTypeId);
      if (cat && type) {
        standard = {
          categoryKo: cat.title.ko, categoryEn: cat.title.en,
          typeKo: type.title.ko,    typeEn: type.title.en,
          partiesKo: type.parties.ko, partiesEn: type.parties.en,
        };
      }
    }

    let contractText = "";
    let extractionMethod = "paste";
    let filename = "Pasted text";

    if (pastedText?.trim()) {
      contractText = pastedText.trim();
    } else if (file) {
      filename = file.name;
      const buffer = Buffer.from(await file.arrayBuffer());
      const name = file.name.toLowerCase();

      if (name.endsWith(".docx")) {
        contractText = await extractTextFromDocx(buffer);
        extractionMethod = "docx";
      } else if (name.endsWith(".pdf") || file.type === "application/pdf") {
        const pdfText = await extractTextFromPdf(buffer);
        if (pdfText) {
          contractText = pdfText;
          extractionMethod = "pdf-text";
        } else {
          contractText = await extractTextWithVision(buffer, "application/pdf");
          extractionMethod = "pdf-vision";
        }
      } else if (name.endsWith(".hwpx") || (name.endsWith(".hwp") && looksLikeZip(buffer))) {
        contractText = await extractTextFromHwpx(buffer);
        extractionMethod = "hwpx";
        if (!contractText.trim()) {
          return NextResponse.json({
            error: lang === "ko"
              ? "HWPX 파일에서 내용을 읽지 못했습니다. 한글 프로그램에서 '다른 이름으로 저장 → PDF'로 변환 후 다시 업로드해 주세요."
              : "Could not read this HWPX file. Please save it as PDF from your word processor and try again.",
          }, { status: 400 });
        }
      } else if (name.endsWith(".hwp")) {
        contractText = await extractTextFromHwpBinary(buffer);
        extractionMethod = "hwp-binary";
        if (!contractText.trim()) {
          return NextResponse.json({
            error: lang === "ko"
              ? "이 HWP 파일에서 내용을 읽지 못했습니다. 한글(또는 한글뷰어)에서 열어 전체 내용을 복사한 뒤, 위 '텍스트 붙여넣기' 탭에 붙여넣어 주세요."
              : "Could not read this HWP file. Please open it in 한글 (Hangul word processor), copy all the text, and paste it into the 'Paste Text' tab above.",
          }, { status: 400 });
        }
      } else {
        return NextResponse.json({ error: lang === "ko" ? "지원하지 않는 파일 형식입니다. PDF, DOCX, HWPX 파일을 업로드하세요." : "Unsupported file type. Upload a PDF, DOCX, or HWPX file." }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "No contract provided" }, { status: 400 });
    }

    if (!contractText.trim()) {
      return NextResponse.json({ error: "Could not extract text from the document" }, { status: 400 });
    }

    // ── AI Analysis ──
    const analysisData = await analyzeContract(contractText, lang, standard) as {
      summary: string;
      high: unknown[];
      medium: unknown[];
      low: unknown[];
    };

    // ── Save scan to DB ──
    await serviceClient.from("scans").insert({
      user_id: user.id,
      filename,
      high_count: analysisData.high?.length ?? 0,
      medium_count: analysisData.medium?.length ?? 0,
      low_count: analysisData.low?.length ?? 0,
      summary: analysisData.summary,
      result: analysisData,
    });

    // ── Update scan count ──
    await serviceClient.from("profiles").update({
      scans_used: profile?.scan_month === currentMonth ? scansUsed + 1 : 1,
      scan_month: currentMonth,
    }).eq("id", user.id);

    return NextResponse.json({
      ...analysisData,
      plan,
      scannedAt: new Date().toISOString(),
      extractionMethod,
      scansUsed: scansUsed + 1,
      scanLimit: limit,
    });
  } catch (err: unknown) {
    console.error("Analysis error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Analysis failed" }, { status: 500 });
  }
}
