import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { PLAN_LIMITS, type Plan } from "@/lib/planLimits";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXTRACTION_PROMPT_EN = `You are a contract drafting assistant. Extract key business terms from the provided quote/proposal document.

Your response MUST be valid JSON only — no markdown, no explanation outside the JSON.

Return this exact structure:
{
  "providerName": "The company providing the service/product (the seller/vendor)",
  "providerContact": "Contact person at provider (if mentioned, else empty string)",
  "providerAddress": "Provider address (if mentioned, else empty string)",
  "clientName": "The company receiving the service/product (the buyer/client)",
  "clientContact": "Contact person at client (if mentioned, else empty string)",
  "clientAddress": "Client address (if mentioned, else empty string)",
  "serviceDescription": "Detailed description of services/products being provided. Be thorough — list all deliverables, scope items, and what's included.",
  "totalAmount": "Total payment amount with currency (e.g., '$10,000 USD' or '5,000 EUR')",
  "paymentTerms": "Payment schedule and terms (e.g., '50% upfront, 50% on delivery' or 'Net 30 days')",
  "deliveryDate": "Delivery date or contract duration (e.g., '60 days from signing' or 'By Dec 31, 2026')",
  "additionalTerms": "Any other important terms mentioned (warranties, special conditions, etc., or empty string)"
}

If a field is not mentioned in the document, use a sensible placeholder like "[To be specified]" — do NOT fabricate information.`;

const EXTRACTION_PROMPT_KO = `당신은 계약서 작성 도우미입니다. 제공된 견적서/제안서에서 핵심 비즈니스 조건을 추출합니다.

응답은 반드시 유효한 JSON만 반환해야 합니다 — 마크다운이나 JSON 외부 설명은 금지입니다.

다음 정확한 구조로 반환하세요. 모든 필드를 한국어로 작성하되, 회사명/주소/이름은 원본 언어를 유지하세요:
{
  "providerName": "서비스/제품 제공 회사명 (판매자/공급자) - 원문 그대로",
  "providerContact": "제공자측 담당자명 (있으면, 없으면 빈 문자열)",
  "providerAddress": "제공자 주소 (있으면, 없으면 빈 문자열)",
  "clientName": "서비스/제품 수령 회사명 (구매자/고객) - 원문 그대로",
  "clientContact": "고객측 담당자명",
  "clientAddress": "고객 주소",
  "serviceDescription": "제공되는 서비스/제품의 상세 설명 (한국어). 모든 산출물, 범위, 포함 항목을 빠짐없이 나열하세요.",
  "totalAmount": "총 결제 금액 (통화 포함, 예: '10,000,000원' 또는 '$10,000 USD')",
  "paymentTerms": "결제 일정 및 조건 한국어로 (예: '계약 시 50%, 납품 시 50%' 또는 '월말 결제 30일')",
  "deliveryDate": "납기일 또는 계약 기간 한국어로 (예: '서명일로부터 60일' 또는 '2026년 12월 31일까지')",
  "additionalTerms": "기타 중요 조건 (보증, 특별 조건 등, 없으면 빈 문자열)"
}

문서에 명시되지 않은 필드는 "[지정 필요]" 같은 한국어 placeholder를 사용하세요 — 정보를 지어내지 마세요.`;

const CONTRACT_LANG_NOTE_KO = `이 견적서를 기반으로 한국어 정식 서비스 계약서를 작성할 예정입니다. 추출된 정보가 한국어로 자연스럽게 표시되어야 합니다.`;

async function extractTextFromPdf(buffer: Buffer): Promise<string | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const pdfParse = require("pdf-parse");
    const parsed = await pdfParse(buffer);
    const text = (parsed.text as string)?.trim();
    return text && text.length > 50 ? text : null;
  } catch {
    return null;
  }
}

async function extractTextWithVision(buffer: Buffer, mimeType: string): Promise<string> {
  const base64 = buffer.toString("base64");
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    temperature: 0,
    messages: [{
      role: "user",
      content: [
        { type: "document", source: { type: "base64", media_type: mimeType as "application/pdf", data: base64 } },
        { type: "text", text: "Please extract and return ALL text from this document exactly as it appears. Do not summarize — just transcribe the full text." },
      ],
    }],
  });
  return response.content[0].type === "text" ? response.content[0].text : "";
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = (await import("mammoth")).default;
  const result = await mammoth.extractRawText({ buffer });
  return result.value?.trim() || "";
}

interface ExtractedQuote {
  providerName: string;
  providerContact: string;
  providerAddress: string;
  clientName: string;
  clientContact: string;
  clientAddress: string;
  serviceDescription: string;
  totalAmount: string;
  paymentTerms: string;
  deliveryDate: string;
  additionalTerms: string;
}

async function extractQuoteData(quoteText: string, lang: "en" | "ko" = "en"): Promise<ExtractedQuote> {
  const truncated = quoteText.slice(0, 15000);
  const sys = lang === "ko" ? EXTRACTION_PROMPT_KO : EXTRACTION_PROMPT_EN;
  const userPrompt = lang === "ko"
    ? `${CONTRACT_LANG_NOTE_KO}\n\n다음 견적서에서 핵심 조건을 추출해 한국어 JSON으로 반환해주세요:\n\n${truncated}`
    : `Please extract key terms from this quote document:\n\n${truncated}`;
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    temperature: 0,
    system: sys,
    messages: [{ role: "user", content: userPrompt }],
  });
  const rawText = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to extract quote data");
  return JSON.parse(jsonMatch[0]);
}

function generateContractKO(data: ExtractedQuote): string {
  const today = new Date().toLocaleDateString("ko-KR", { year: "numeric", month: "long", day: "numeric" });
  return `용역 계약서

본 용역 계약서("계약")는 ${today}("효력 발생일")에 다음 양 당사자 간에 체결됩니다:

공급자: ${data.providerName || "[공급자명]"}
${data.providerAddress ? `주소: ${data.providerAddress}` : ""}
${data.providerContact ? `담당자: ${data.providerContact}` : ""}

고객: ${data.clientName || "[고객명]"}
${data.clientAddress ? `주소: ${data.clientAddress}` : ""}
${data.clientContact ? `담당자: ${data.clientContact}` : ""}

(이하 각각 "당사자", 통칭하여 "당사자들"이라 한다.)

1. 업무 범위

공급자는 다음의 서비스 및/또는 제품을 고객에게 제공한다:

${data.serviceDescription || "[서비스 내용 기재 필요]"}

공급자는 업계 표준에 부합하는 전문가적이고 숙련된 방식으로 서비스를 수행한다. 업무 범위의 변경은 양 당사자의 서면 합의를 요한다.

2. 결제 조건

총 대금: ${data.totalAmount || "[금액 기재 필요]"}

결제 일정: ${data.paymentTerms || "[결제 조건 기재 필요]"}

모든 청구서는 합의된 기한 내에 결제한다. 연체 시 월 1.5% 또는 법령이 허용하는 최고 한도 중 낮은 금액의 연체료가 부과될 수 있다. 별도 명시가 없는 한 모든 금액은 부가가치세 등 세금을 제외한 것이다.

3. 납기

납품일 / 계약 기간: ${data.deliveryDate || "[납기 기재 필요]"}

공급자는 상기 일정 준수를 위해 상업적으로 합리적인 노력을 한다. 고객의 사유(피드백 지연, 승인 지연 등)로 인한 지연은 그만큼 일정이 연장된다.

4. 비밀유지

각 당사자는 본 계약과 관련하여 상대방으로부터 공개받은 모든 비공개 정보(사업 계획, 기술 자료, 고객 정보, 가격 정보 포함)를 비밀로 유지한다. 본 의무는 계약 종료 후 3년간 존속한다.

다음은 비밀 정보에 포함되지 않는다: (가) 수령 당사자의 귀책 없이 공개된 정보, (나) 공개 전부터 알고 있던 정보, (다) 비밀 정보 사용 없이 독자적으로 개발한 정보, (라) 법령에 따라 공개가 요구되는 정보.

5. 지식재산권

대금이 전액 지급되면 본 계약에 따라 고객을 위해 특별히 제작된 모든 산출물의 권리는 고객에게 귀속된다. 단, 공급자가 보유한 기존 도구, 방법론, 일반적 노하우의 소유권은 공급자에게 유보된다.

6. 계약 해지

각 당사자는 다음의 경우 본 계약을 해지할 수 있다:
(가) 편의에 의한 해지 — 30일 전 서면 통지
(나) 중대한 위반의 경우 — 서면 통지 후 15일 내 시정되지 않으면 즉시 해지
(다) 상대방이 지급불능 상태에 빠지거나 파산을 신청한 경우 — 즉시 해지

해지 시 고객은 해지일까지 수행된 업무에 대한 대금을 지급한다. 비밀유지 의무는 해지 후에도 존속한다.

7. 책임 제한

어떠한 경우에도 양 당사자는 청구 원인에 관계없이 간접적, 부수적, 특별, 결과적 또는 징벌적 손해에 대해 책임지지 아니한다. 본 계약상 각 당사자의 총 책임은 본 계약에 따라 지급되었거나 지급될 총액을 초과하지 아니한다.

8. 독립 사업자

공급자는 독립 사업자이다. 본 계약의 어떠한 내용도 당사자 간에 고용, 동업, 합작 관계를 형성하지 아니한다.

${data.additionalTerms && data.additionalTerms.trim() ? `9. 추가 조항\n\n${data.additionalTerms}\n\n` : ""}10. 일반 조항

본 계약은 본 건과 관련된 양 당사자 간의 모든 합의를 구성하며, 사전의 모든 협상, 진술 또는 합의에 우선한다. 모든 변경은 서면으로 양 당사자가 서명해야 효력이 있다.

본 계약은 적용 법령에 따라 해석되며, 분쟁은 우선 신의성실에 입각한 협의로 해결하고, 협의가 결렬될 경우 구속력 있는 중재로 해결한다.

본 계약의 어느 조항이 무효이거나 집행 불가능한 경우에도 나머지 조항은 계속 유효하다.

11. 서명

아래에 서명함으로써 각 당사자는 본 계약 조건에 구속될 것에 동의한다.

공급자:                                    고객:

${(data.providerName || "[공급자명]").padEnd(40, " ")}   ${data.clientName || "[고객명]"}

서명: ____________________________         서명: ____________________________

이름: ____________________________         이름: ____________________________

직책: ____________________________         직책: ____________________________

날짜: ____________________________         날짜: ____________________________
`;
}

function generateContractEN(data: ExtractedQuote): string {
  const today = new Date().toLocaleDateString("en-US", {
    year: "numeric", month: "long", day: "numeric"
  });

  return `SERVICE AGREEMENT

This Service Agreement ("Agreement") is entered into as of ${today} (the "Effective Date") by and between:

PROVIDER: ${data.providerName || "[Provider Name]"}
${data.providerAddress ? `Address: ${data.providerAddress}` : ""}
${data.providerContact ? `Contact: ${data.providerContact}` : ""}

CLIENT: ${data.clientName || "[Client Name]"}
${data.clientAddress ? `Address: ${data.clientAddress}` : ""}
${data.clientContact ? `Contact: ${data.clientContact}` : ""}

(each a "Party" and collectively the "Parties").

1. SCOPE OF WORK

Provider agrees to deliver the following services and/or products to Client:

${data.serviceDescription || "[Service description to be specified]"}

Provider shall perform the services in a professional and workmanlike manner consistent with industry standards. Any changes to the scope must be agreed upon in writing by both Parties.

2. PAYMENT TERMS

Total Compensation: ${data.totalAmount || "[Amount to be specified]"}

Payment Schedule: ${data.paymentTerms || "[Payment terms to be specified]"}

All invoices shall be paid within the agreed timeframe. Late payments may incur a service charge of 1.5% per month or the maximum rate permitted by law, whichever is lower. All amounts are exclusive of applicable taxes unless otherwise stated.

3. DELIVERY TIMELINE

Delivery / Term: ${data.deliveryDate || "[Delivery date to be specified]"}

Provider shall use commercially reasonable efforts to meet the delivery timeline above. Any delays caused by Client (including delayed feedback or approvals) shall extend the timeline accordingly.

4. CONFIDENTIALITY

Each Party agrees to keep confidential all non-public information disclosed by the other Party in connection with this Agreement, including business plans, technical data, customer information, and pricing. This obligation survives termination of this Agreement for a period of three (3) years.

Confidential Information shall not include information that: (a) is or becomes public through no fault of the receiving Party, (b) was known prior to disclosure, (c) is independently developed without use of confidential information, or (d) is required to be disclosed by law.

5. INTELLECTUAL PROPERTY

Upon full payment, all deliverables created specifically for Client under this Agreement shall become the property of Client. Provider retains ownership of any pre-existing tools, methodologies, or general know-how used in performing the services.

6. TERMINATION

Either Party may terminate this Agreement:
(a) For convenience, with thirty (30) days written notice;
(b) Immediately, for material breach not cured within fifteen (15) days of written notice;
(c) Immediately, if the other Party becomes insolvent or files for bankruptcy.

Upon termination, Client shall pay for all work performed up to the termination date. All confidentiality obligations survive termination.

7. LIMITATION OF LIABILITY

In no event shall either Party be liable for indirect, incidental, special, consequential, or punitive damages, regardless of the cause of action. Each Party's total liability under this Agreement shall not exceed the total amounts paid or payable hereunder.

8. INDEPENDENT CONTRACTOR

Provider is an independent contractor. Nothing in this Agreement creates an employer-employee, partnership, or joint venture relationship between the Parties.

${data.additionalTerms && data.additionalTerms.trim() ? `9. ADDITIONAL TERMS\n\n${data.additionalTerms}\n\n` : ""}10. GENERAL PROVISIONS

This Agreement constitutes the entire agreement between the Parties and supersedes all prior negotiations, representations, or agreements relating to the subject matter herein. Any modifications must be in writing and signed by both Parties.

This Agreement shall be governed by and construed in accordance with applicable law. Any disputes shall be resolved through good-faith negotiation, and failing that, through binding arbitration.

If any provision of this Agreement is held invalid or unenforceable, the remaining provisions shall continue in full force and effect.

11. SIGNATURES

By signing below, each Party agrees to be bound by the terms of this Agreement.

PROVIDER:                                  CLIENT:

${(data.providerName || "[Provider Name]").padEnd(40, " ")}   ${data.clientName || "[Client Name]"}

By: ____________________________           By: ____________________________

Name: __________________________           Name: __________________________

Title: _________________________           Title: _________________________

Date: __________________________           Date: __________________________
`;
}

function generateContract(data: ExtractedQuote, lang: "en" | "ko" = "en"): string {
  return lang === "ko" ? generateContractKO(data) : generateContractEN(data);
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ──
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to use this feature." }, { status: 401 });
    }

    // ── Plan / limit check ──
    const service = createServiceClient();
    const { data: profile } = await service
      .from("profiles")
      .select("plan, quote_used, scan_month")
      .eq("id", user.id)
      .single();

    const currentMonth = new Date().toISOString().slice(0, 7);
    const sameMonth = profile?.scan_month === currentMonth;
    const quoteUsed = sameMonth ? (profile?.quote_used ?? 0) : 0;
    const plan = (profile?.plan ?? "free") as Plan;
    const limit = PLAN_LIMITS[plan].quote;

    if (limit === 0) {
      return NextResponse.json({
        error: "Quote to Contract is a Pro feature. Upgrade to Pro ($49/mo) or Business ($99/mo) to unlock.",
        limitReached: true,
      }, { status: 403 });
    }

    if (limit !== null && quoteUsed >= limit) {
      const upgradeMsg = plan === "pro"
        ? "Upgrade to Business for unlimited contracts."
        : "Limit reached.";
      return NextResponse.json({
        error: `You've used all ${limit} Quote to Contract generations this month. ${upgradeMsg}`,
        limitReached: true,
      }, { status: 403 });
    }

    // ── Extract text ──
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const langField = formData.get("lang");
    const lang: "en" | "ko" = langField === "ko" ? "ko" : "en";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();
    let quoteText = "";
    let extractionMethod = "";

    if (name.endsWith(".docx")) {
      quoteText = await extractTextFromDocx(buffer);
      extractionMethod = "docx";
    } else if (name.endsWith(".pdf") || file.type === "application/pdf") {
      const pdfText = await extractTextFromPdf(buffer);
      if (pdfText) {
        quoteText = pdfText;
        extractionMethod = "pdf-text";
      } else {
        quoteText = await extractTextWithVision(buffer, "application/pdf");
        extractionMethod = "pdf-vision";
      }
    } else {
      return NextResponse.json({ error: "Unsupported file type. Upload a PDF or DOCX." }, { status: 400 });
    }

    if (!quoteText.trim()) {
      return NextResponse.json({ error: "Could not extract text from the document" }, { status: 400 });
    }

    // ── Extract structured data ──
    const extracted = await extractQuoteData(quoteText, lang);

    // ── Generate contract draft ──
    const contractText = generateContract(extracted, lang);

    // ── Update usage ──
    await service.from("profiles").update({
      quote_used: sameMonth ? quoteUsed + 1 : 1,
      scan_month: currentMonth,
    }).eq("id", user.id);

    return NextResponse.json({
      extracted,
      contract: contractText,
      filename: file.name,
      extractionMethod,
      generatedAt: new Date().toISOString(),
      quoteUsed: quoteUsed + 1,
      quoteLimit: limit,
      lang,
    });
  } catch (err: unknown) {
    console.error("Quote-to-contract error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to generate contract" }, { status: 500 });
  }
}
