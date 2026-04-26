import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a senior contract lawyer specializing in identifying risky, vague, or one-sided contract clauses. You analyze contracts and provide actionable risk assessments.

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
  "low": [...same structure...]
}

Severity guide:
- HIGH: Unfair, one-sided, dangerous — could cause serious legal or financial harm
- MEDIUM: Vague, ambiguous, or potentially problematic — needs clarification
- LOW: Minor issues, missing standard protections, could be improved

Be thorough but practical. Focus on real risks, not nitpicking.`;

async function extractTextFromPdf(buffer: Buffer): Promise<string | null> {
  try {
    const pdfParse = (await import("pdf-parse")).default;
    const parsed = await pdfParse(buffer);
    const text = parsed.text?.trim();
    // If fewer than 100 chars, likely a scanned PDF with no embedded text
    return text && text.length > 100 ? text : null;
  } catch {
    return null;
  }
}

async function extractTextWithVision(buffer: Buffer, mimeType: string): Promise<string> {
  // Send image/PDF directly to Claude Vision for OCR
  const base64 = buffer.toString("base64");

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "document",
            source: {
              type: "base64",
              media_type: mimeType as "application/pdf",
              data: base64,
            },
          },
          {
            type: "text",
            text: "Please extract and return ALL text from this document exactly as it appears. Do not summarize or analyze — just transcribe the full text.",
          },
        ],
      },
    ],
  });

  return response.content[0].type === "text" ? response.content[0].text : "";
}

async function extractTextFromDocx(buffer: Buffer): Promise<string> {
  const mammoth = (await import("mammoth")).default;
  const result = await mammoth.extractRawText({ buffer });
  return result.value?.trim() || "";
}

async function analyzeContract(contractText: string): Promise<object> {
  const truncated = contractText.slice(0, 15000);

  const message = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4096,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `Please analyze this contract and return a JSON risk report:\n\n${truncated}`,
      },
    ],
  });

  const rawText = message.content[0].type === "text" ? message.content[0].text : "";
  const jsonMatch = rawText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid AI response format");
  return JSON.parse(jsonMatch[0]);
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const pastedText = formData.get("text") as string | null;

    let contractText = "";
    let extractionMethod = "text";

    if (pastedText?.trim()) {
      contractText = pastedText.trim();
      extractionMethod = "paste";
    } else if (file) {
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const fileName = file.name.toLowerCase();

      if (fileName.endsWith(".docx")) {
        // DOCX → mammoth
        contractText = await extractTextFromDocx(buffer);
        extractionMethod = "docx";
      } else if (fileName.endsWith(".pdf") || file.type === "application/pdf") {
        // PDF: try text extraction first, fallback to Vision
        const pdfText = await extractTextFromPdf(buffer);
        if (pdfText) {
          contractText = pdfText;
          extractionMethod = "pdf-text";
        } else {
          // Scanned PDF → Claude Vision OCR
          contractText = await extractTextWithVision(buffer, "application/pdf");
          extractionMethod = "pdf-vision";
        }
      } else {
        return NextResponse.json({ error: "Unsupported file type. Upload a PDF or DOCX." }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "No contract provided" }, { status: 400 });
    }

    if (!contractText.trim()) {
      return NextResponse.json({ error: "Could not extract text from the document" }, { status: 400 });
    }

    const analysisData = await analyzeContract(contractText);

    return NextResponse.json({
      ...analysisData,
      scannedAt: new Date().toISOString(),
      extractionMethod,
    });
  } catch (err: unknown) {
    console.error("Analysis error:", err);
    const message = err instanceof Error ? err.message : "Analysis failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
