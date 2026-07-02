import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient } from "@/lib/supabase/server";
import { CLAUDE_MODEL, extractText } from "@/lib/anthropic";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

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

export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;
    if (!file) return NextResponse.json({ error: "No file uploaded" }, { status: 400 });

    const buffer = Buffer.from(await file.arrayBuffer());
    const name = file.name.toLowerCase();

    let text = "";
    if (name.endsWith(".txt")) {
      text = buffer.toString("utf-8").trim();
    } else if (name.endsWith(".docx")) {
      text = await extractTextFromDocx(buffer);
    } else if (name.endsWith(".pdf") || file.type === "application/pdf") {
      const pdfText = await extractTextFromPdf(buffer);
      if (pdfText) {
        text = pdfText;
      } else {
        text = await extractTextWithVision(buffer, "application/pdf");
      }
    } else {
      return NextResponse.json({ error: "Unsupported file type. Upload a PDF, DOCX, or TXT file." }, { status: 400 });
    }

    if (!text.trim()) {
      return NextResponse.json({ error: "Could not extract text from this document." }, { status: 400 });
    }

    return NextResponse.json({
      text: text.slice(0, 30000),
      filename: file.name,
    });
  } catch (err: unknown) {
    console.error("Extract error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Extract failed" }, { status: 500 });
  }
}
