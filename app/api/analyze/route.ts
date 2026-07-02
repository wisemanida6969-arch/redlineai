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

[표준 대비 검토 모드]
이 계약서를 문화체육관광부 「${s.categoryKo} 분야 표준계약서」 중 「${s.typeKo}」(통상 당사자: ${s.partiesKo})를 기준으로 검토하세요.
- 표준계약서가 통상 보장하는 보호 조항의 누락 또는 약화를 적극적으로 찾아 분류하세요: 대금 및 지급 시기·방법, 저작권·2차적저작물작성권 등 권리 귀속, 저작인격권(성명표시·동일성유지), 수정·재작업 범위와 횟수, 납품·계약 기간, 비밀유지, 계약 해지, 손해배상, 분쟁 해결.
- 표준 대비 창작자(을)에게 불리하게 작성된 조항을 우선적으로 지적하세요.
- summary 첫 문장에 「${s.typeKo}」 표준 대비 종합 평가를 포함하세요.
- 표준계약서 원문을 그대로 인용하지 말고, 일반적으로 알려진 표준계약서의 보호 취지를 기준으로 판단하세요. 결과는 참고용이며 사용자는 공식 표준양식과 대조해야 합니다.`
    : `

[Standard comparison mode]
Review this contract against Korea MCST's "${s.categoryEn} standard contract — ${s.typeEn}" (typical parties: ${s.partiesEn}).
- Actively flag protections the standard usually guarantees that are missing or weakened: payment & timing, ownership of copyright / derivative-work rights, moral rights, revision scope & count, delivery/term, confidentiality, termination, damages, dispute resolution.
- Prioritise clauses that are worse for the creator than the standard.
- Put the standard-vs-contract assessment in the first sentence of "summary".
- Do not quote the official form verbatim; judge by the standard's general protective intent. Results are for reference and must be checked against the official form.`;
}

const SYSTEM_PROMPT_EN = `You are a senior contract lawyer specializing in identifying risky, vague, or one-sided contract clauses. You analyze contracts and provide actionable risk assessments.

Your response MUST be valid JSON only — no markdown, no explanation outside the JSON.

Return this exact structure:
{
  "summary": "2-3 sentence overall assessment of the contract",
  "high": [
    {
      "id": "h1",
      "severity": "high",
      "title": "Short title of the issue",
      "original": "Exact quote from the contract (max 150 chars)",
      "problem": "Clear explanation of why this is dangerous",
      "fix": "Complete rewritten clause ready to copy-paste"
    }
  ],
  "medium": [...same structure...],
  "low": [...same structure...],
  "precedentQueries": ["2 to 4 short Korean keywords for finding related Korean court precedents, based on the contract's subject and main risks — e.g. \"저작권 양도\", \"2차적저작물\", \"용역 대금\", \"전속계약\""]
}

Severity guide:
- HIGH: Unfair, one-sided, dangerous — could cause serious legal or financial harm
- MEDIUM: Vague, ambiguous, or potentially problematic — needs clarification
- LOW: Minor issues, missing standard protections, could be improved

[Top 3 Korean freelance-contract red flags — ALWAYS actively check for these, regardless of contract type, and flag as HIGH when found]
1. Unlimited-revision clause — language that lets the client (갑) demand revisions indefinitely with no cap ("revise until the client is satisfied", no stated round limit). Fix: cap revisions at a fixed number of rounds (e.g. 3); any additional round is billed at an agreed rate.
2. Full copyright-grab clause — language transferring all rights (including copyright) to the client regardless of, or before, payment ("all rights to the plan and deliverables belong to the client"). Fix: copyright remains with the freelancer (을) until payment is made in full, transferring to the client only upon full payment.
3. Excessive late-delivery penalty clause — a daily penalty rate that is very high (e.g. 5%+ of the contract value per day) or has no overall cap. Fix: cap the daily rate at a small percentage (e.g. 0.1–0.5%/day) with a total cap (e.g. 10% of the contract value), and exclude delays caused by the client (e.g. late feedback/approval) from the penalty period.
When any of these three appear, name the pattern explicitly in the title (e.g. "Unlimited revision clause", "Full copyright grab", "Excessive late-delivery penalty") so it's easy to recognize.

Be thorough but practical. Focus on real risks, not nitpicking.`;

const SYSTEM_PROMPT_KO = `당신은 위험하거나 모호하거나 일방적인 계약 조항을 찾아내는 일을 전문으로 하는 시니어 계약 변호사입니다. 계약서를 분석하고 실행 가능한 리스크 평가를 제공합니다.

응답은 반드시 유효한 JSON만 반환해야 합니다 — 마크다운이나 JSON 외부의 설명은 금지입니다.

다음 정확한 구조로 반환하세요:
{
  "summary": "계약서 전반에 대한 2-3 문장 요약 (한국어)",
  "high": [
    {
      "id": "h1",
      "severity": "high",
      "title": "이슈의 짧은 제목 (한국어)",
      "original": "계약서에서 발췌한 정확한 원문 (최대 150자, 원본 언어 유지)",
      "problem": "왜 위험한지에 대한 명확한 한국어 설명",
      "fix": "복사해서 바로 사용할 수 있는 한국어로 다시 쓴 수정 조항"
    }
  ],
  "medium": [...같은 구조...],
  "low": [...같은 구조...],
  "precedentQueries": ["이 계약의 분야와 핵심 쟁점에 기반해 관련 한국 법원 판례를 찾을 검색어 2~4개 (한국어, 짧게) — 예: \"저작권 양도\", \"2차적저작물\", \"용역 대금\", \"전속계약\""]
}

심각도 가이드:
- HIGH(높음): 불공정하거나 일방적이며 위험함 — 심각한 법적/재정적 피해 가능
- MEDIUM(중간): 모호하거나 잠재적으로 문제가 될 수 있음 — 명확화 필요
- LOW(낮음): 사소한 이슈, 표준 보호 조항 누락, 개선 가능

[한국 프리랜서/외주 계약서 3대 갑질 독소조항 — 계약서 종류와 무관하게 항상 최우선으로 적극 탐지하고, 발견 시 반드시 HIGH로 분류]
1. **무한 수정 조항** — "갑이 만족할 때까지 수정한다", "수정 횟수 제한 없음", 완성도·만족도를 갑의 임의 판단에 맡기고 수정 범위·횟수를 명시하지 않은 조항.
   → fix 예시: "수정은 총 [3]회로 제한하며, 이를 초과하는 수정 요청은 별도 협의된 요율에 따라 추가 비용을 지급한다."
2. **저작권 통째로 먹기 조항** — "기획 및 결과물에 관한 모든 권리(저작권 포함)는 갑에게 귀속된다", "을은 결과물에 대해 어떠한 권리도 주장할 수 없다" 등 대금 지급 여부와 무관하게 또는 대금 지급 전에 저작권을 전부 이전시키는 조항.
   → fix 예시: "결과물에 대한 저작권은 대금이 전액 지급되기 전까지 을(프리랜서)에게 귀속되며, 대금 완납과 동시에 갑에게 이전한다."
3. **지체상금 폭탄 조항** — 하루 지연당 계약금의 과도한 비율(예: 1일당 5% 이상)을 위약벌로 부과하거나, 총액 상한이 없는 지체상금 조항.
   → fix 예시: "지체상금은 1일당 계약금의 [0.1~0.5]%로 하되, 총 지체상금은 계약금의 [10]%를 초과할 수 없다. 을의 귀책사유가 아닌 지연(갑의 피드백·승인 지연 등)은 지체일수에서 제외한다."
위 세 가지가 발견되면 title에 어떤 유형인지 정확히 명시하세요(예: "무한 수정 조항", "저작권 전부 귀속 조항", "지체상금 폭탄 조항") — 사용자가 한눈에 알아볼 수 있도록.

original 필드는 계약서 원문 그대로 발췌하세요(번역하지 말 것). 나머지(title, problem, fix, summary)는 모두 한국어로 자연스럽게 작성하세요. 철저하지만 실용적으로, 진짜 위험에 집중하세요.`;

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
      const upgradeMsg = plan === "free"
        ? "Upgrade to Pro for 30 scans/month or Business for unlimited."
        : plan === "pro"
          ? "Upgrade to Business for unlimited scans."
          : "Limit reached.";
      return NextResponse.json({
        error: `You've used all ${limit} Contract Analysis scans this month. ${upgradeMsg}`,
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
