import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const EXTRACTION_PROMPT = `You are a contract drafting assistant. Extract key business terms from the provided quote/proposal document.

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

async function extractQuoteData(quoteText: string): Promise<ExtractedQuote> {
  const truncated = quoteText.slice(0, 15000);
  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2048,
    system: EXTRACTION_PROMPT,
    messages: [{ role: "user", content: `Please extract key terms from this quote document:\n\n${truncated}` }],
  });
  const rawText = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Failed to extract quote data");
  return JSON.parse(jsonMatch[0]);
}

function generateContract(data: ExtractedQuote): string {
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

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ──
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to use this feature." }, { status: 401 });
    }

    // ── Extract text ──
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

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
    const extracted = await extractQuoteData(quoteText);

    // ── Generate contract draft ──
    const contractText = generateContract(extracted);

    return NextResponse.json({
      extracted,
      contract: contractText,
      filename: file.name,
      extractionMethod,
      generatedAt: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("Quote-to-contract error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed to generate contract" }, { status: 500 });
  }
}
