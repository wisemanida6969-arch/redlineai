import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { PLAN_LIMITS, type Plan } from "@/lib/planLimits";
import { STANDARD_CONTRACTS, getCategory, getContractType } from "@/lib/standardContracts";
import { extractTextFromHwpx, looksLikeZip } from "@/lib/hwpxExtract";
import { extractTextFromHwpBinary } from "@/lib/hwpBinaryExtract";
import { CLAUDE_MODEL, extractText } from "@/lib/anthropic";
import { logUsageEvent } from "@/lib/usageEvents";
import { analyzeContract, normalizeArticleSpacing, countArticles, type StandardCtx } from "@/lib/analyzeCore";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

/**
 * Auto-detect which MCST standard contract the uploaded contract corresponds
 * to (same catalog-classification pattern as quote-to-contract). Returns null
 * for deals unrelated to the creative fields — the review then runs in the
 * generic mode without standard-text quoting.
 */
async function detectStandardFromContract(contractText: string): Promise<{ categoryId: string; typeId: string } | null> {
  const catalog = STANDARD_CONTRACTS.flatMap((c) =>
    c.types.map((tp) => ({ categoryId: c.id, typeId: tp.id, label: `${c.title.ko} / ${tp.title.ko} — ${tp.desc.ko}` })),
  );
  const list = catalog.map((x) => `[${x.categoryId}/${x.typeId}] ${x.label}`).join("\n");

  const sys = `당신은 한국 창작 분야 계약 분류 전문가입니다. 아래 문화체육관광부 표준계약서 목록 중에서 주어진 계약서에 가장 적합한 표준계약서 하나를 고릅니다.

목록:
${list}

규칙:
- 반드시 JSON만 반환: {"categoryId":"<값>","typeId":"<값>"}
- categoryId/typeId 는 위 목록의 대괄호 안 값과 정확히 일치해야 합니다.
- 창작 분야(미술/웹툰/공연/영화/공예)와 명백히 무관한 일반 거래(예: 순수 소프트웨어 개발, 단순 물품 구매, 마케팅 대행 등)면 {"categoryId":null,"typeId":null} 을 반환하세요.
- 설명 금지, JSON만.`;

  try {
    const msg = await client.messages.create({
      model: CLAUDE_MODEL,
      max_tokens: 200,
      thinking: { type: "disabled" },
      system: sys,
      messages: [{ role: "user", content: `계약서 내용:\n${contractText.slice(0, 3000)}` }],
    });
    const raw = extractText(msg);
    const m = raw.match(/\{[\s\S]*\}/);
    if (!m) return null;
    const parsed = JSON.parse(m[0]) as { categoryId?: string | null; typeId?: string | null };
    if (!parsed.categoryId || !parsed.typeId) return null;
    if (!getContractType(parsed.categoryId, parsed.typeId)) return null; // validate against catalog
    return { categoryId: parsed.categoryId, typeId: parsed.typeId };
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  let lang: "en" | "ko" = "ko";
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
    lang = langField === "ko" ? "ko" : "en";

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
          typeId: type.id,
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

    // PDF/HWP extraction inserts spaces inside legal references ("제 1 조") —
    // normalize before anything downstream (article counting, AI excerpts).
    contractText = normalizeArticleSpacing(contractText);

    // ── No standard chosen → auto-detect the matching MCST form from the text ──
    let autoMatched = false;
    if (!standard) {
      const detected = await detectStandardFromContract(contractText);
      if (detected) {
        const cat = getCategory(detected.categoryId);
        const type = getContractType(detected.categoryId, detected.typeId);
        if (cat && type) {
          standard = {
            categoryKo: cat.title.ko, categoryEn: cat.title.en,
            typeKo: type.title.ko,    typeEn: type.title.en,
            partiesKo: type.parties.ko, partiesEn: type.parties.en,
            typeId: type.id,
          };
          autoMatched = true;
        }
      }
    }

    // ── AI Analysis ──
    const analysisData = await analyzeContract(contractText, lang, standard, serviceClient) as {
      summary: string;
      high: unknown[];
      medium: unknown[];
      low: unknown[];
    };

    // Distinct "제N조" numbers in the uploaded contract (for the report summary).
    const articleCount = countArticles(contractText);
    const resultToSave = {
      ...analysisData,
      articleCount,
      standardInfo: standard
        ? { typeId: standard.typeId, typeKo: standard.typeKo, categoryKo: standard.categoryKo, autoMatched }
        : null,
    };

    // ── Save scan to DB ──
    const { data: savedScan } = await serviceClient.from("scans").insert({
      user_id: user.id,
      filename,
      high_count: analysisData.high?.length ?? 0,
      medium_count: analysisData.medium?.length ?? 0,
      low_count: analysisData.low?.length ?? 0,
      summary: analysisData.summary,
      result: resultToSave,
    }).select("id").single();

    // ── Update scan count ──
    await serviceClient.from("profiles").update({
      scans_used: profile?.scan_month === currentMonth ? scansUsed + 1 : 1,
      scan_month: currentMonth,
    }).eq("id", user.id);

    logUsageEvent(serviceClient, user.id, user.email, "analysis", {
      method: extractionMethod,
      standard: standard ? standard.typeId : null,
    });

    return NextResponse.json({
      ...resultToSave,
      scanId: savedScan?.id ?? null,
      plan,
      scannedAt: new Date().toISOString(),
      extractionMethod,
      scansUsed: scansUsed + 1,
      scanLimit: limit,
    });
  } catch (err: unknown) {
    // Full error goes to the server log only — the client never sees raw
    // internals (e.g. JSON parse positions from a truncated AI response).
    console.error("Analysis error:", err);
    const friendly = lang === "ko"
      ? "비교 결과를 생성하지 못했습니다. 다시 시도해 주세요."
      : "Could not generate the comparison result. Please try again.";
    return NextResponse.json({ error: friendly }, { status: 500 });
  }
}
