import { NextRequest, NextResponse } from "next/server";
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  ImageRun, HeadingLevel, AlignmentType, WidthType, ShadingType, Packer, BorderStyle,
} from "docx";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  try {
    // ── Auth ──
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // ── Fetch request ──
    const service = createServiceClient();
    const { data: request } = await service
      .from("signature_requests")
      .select("user_id, status, title, filename, storage_path, signer_email, signer_name, signed_at, signed_ip, signature_image")
      .eq("id", params.id)
      .single();

    if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
    if (request.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    if (request.status !== "signed") {
      return NextResponse.json({ error: "Document not yet signed." }, { status: 400 });
    }

    // ── Download original PDF ──
    const { data: pdfBlob } = await service.storage
      .from("esign-documents")
      .download(request.storage_path);
    if (!pdfBlob) return NextResponse.json({ error: "Document file not found." }, { status: 404 });
    const pdfBuffer = Buffer.from(await pdfBlob.arrayBuffer());

    // ── Extract contract text from PDF ──
    let contractText = "";
    try {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      const pdfParse = require("pdf-parse");
      const parsed = await pdfParse(pdfBuffer);
      contractText = (parsed.text as string)?.trim() || "";
    } catch (e) {
      console.warn("pdf-parse failed, falling back to placeholder:", e);
    }
    if (!contractText) {
      contractText = "[Original contract was a scanned/image PDF. Please refer to the signed PDF version for the full document content.]";
    }

    // ── Decode signature image ──
    const sigDataUrl = request.signature_image as string | null;
    let sigBytes: Buffer | null = null;
    let sigMime: "png" | "jpg" = "png";
    if (sigDataUrl?.startsWith("data:image/")) {
      sigMime = sigDataUrl.startsWith("data:image/png") ? "png" : "jpg";
      const base64 = sigDataUrl.split(",")[1];
      sigBytes = Buffer.from(base64, "base64");
    }

    // ── Build paragraphs from contract text ──
    const contractParagraphs: Paragraph[] = contractText
      .split(/\n+/)
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => {
        // Detect section heading (e.g. "1. SCOPE OF WORK")
        const isHeading = /^\d+\.\s+[A-Z][A-Z\s]+$/.test(line);
        if (isHeading) {
          return new Paragraph({
            children: [new TextRun({ text: line, bold: true, size: 24, color: "0F172A" })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 80 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "E53E3E", space: 1 } },
          });
        }
        return new Paragraph({
          children: [new TextRun({ text: line, size: 19, color: "334155" })],
          spacing: { after: 80 },
        });
      });

    // ── Format dates / IP ──
    const signedDate = request.signed_at
      ? new Date(request.signed_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
      : "—";
    const signedTime = request.signed_at
      ? new Date(request.signed_at).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" })
      : "—";

    // ── Build DOCX ──
    const doc = new Document({
      styles: {
        default: { document: { run: { font: "Calibri", size: 20, color: "1E293B" } } },
      },
      sections: [{
        children: [
          /* Header */
          new Paragraph({
            children: [
              new TextRun({ text: "RedlineAI ", bold: true, size: 36, color: "E53E3E" }),
              new TextRun({ text: "Signed Contract", bold: true, size: 36, color: "0F172A" }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Document: ${request.title}`, color: "475569", size: 20 })],
            spacing: { after: 40 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Signed: ${signedTime}`, color: "64748B", size: 18 })],
            spacing: { after: 240 },
          }),

          /* Status banner */
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({
              children: [new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({
                    text: `✓ SIGNED BY ${request.signer_name.toUpperCase()}`,
                    bold: true, color: "FFFFFF", size: 22,
                  })],
                  alignment: AlignmentType.CENTER,
                })],
                shading: { type: ShadingType.SOLID, fill: "16A34A" },
                margins: { top: 140, bottom: 140, left: 160, right: 160 },
              })],
            })],
          }),

          new Paragraph({ text: "", spacing: { after: 280 } }),

          /* Contract content heading */
          new Paragraph({
            children: [new TextRun({ text: "Contract Content", bold: true, size: 26, color: "0F172A" })],
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 80, after: 160 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "E53E3E", space: 4 } },
          }),

          /* Contract body */
          ...contractParagraphs,

          /* Signature section */
          new Paragraph({ text: "", spacing: { before: 480 } }),
          new Paragraph({
            children: [new TextRun({ text: "Signature", bold: true, size: 26, color: "0F172A" })],
            heading: HeadingLevel.HEADING_1,
            spacing: { after: 120 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 8, color: "E53E3E", space: 4 } },
          }),

          /* Signature image (if present) */
          ...(sigBytes
            ? [
                new Paragraph({
                  children: [new ImageRun({
                    data: sigBytes,
                    transformation: { width: 220, height: 90 },
                    type: sigMime,
                  })],
                  spacing: { after: 80 },
                }),
              ]
            : [
                new Paragraph({
                  children: [new TextRun({ text: "[Signature image unavailable]", italics: true, color: "94A3B8", size: 18 })],
                  spacing: { after: 80 },
                }),
              ]
          ),

          /* Signer details */
          new Paragraph({
            children: [
              new TextRun({ text: "Signed by: ", bold: true, size: 19, color: "0F172A" }),
              new TextRun({ text: request.signer_name, size: 19, color: "334155" }),
            ],
            spacing: { after: 40 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Email: ", bold: true, size: 18, color: "0F172A" }),
              new TextRun({ text: request.signer_email, size: 18, color: "334155" }),
            ],
            spacing: { after: 40 },
          }),
          new Paragraph({
            children: [
              new TextRun({ text: "Date: ", bold: true, size: 18, color: "0F172A" }),
              new TextRun({ text: signedDate, size: 18, color: "334155" }),
            ],
            spacing: { after: 280 },
          }),

          /* Audit trail */
          new Paragraph({
            children: [new TextRun({ text: "Audit Trail", bold: true, size: 22, color: "475569" })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 80 },
          }),
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [
              auditRow("Document Title", request.title),
              auditRow("Original Filename", request.filename),
              auditRow("Signer Name", request.signer_name),
              auditRow("Signer Email", request.signer_email),
              auditRow("Signed At", signedTime),
              auditRow("IP Address", (request.signed_ip as string) || "—"),
              auditRow("Status", "Signed"),
            ],
          }),

          /* Footer */
          new Paragraph({ text: "", spacing: { before: 320 } }),
          new Paragraph({
            children: [new TextRun({
              text: "This electronic signature was captured using RedlineAI. The signer agreed that this constitutes a legally binding electronic signature.",
              italics: true, color: "94A3B8", size: 16,
            })],
            alignment: AlignmentType.CENTER,
          }),
          new Paragraph({
            children: [new TextRun({ text: "Generated by RedlineAI · getredlineai.com", color: "94A3B8", size: 16, italics: true })],
            alignment: AlignmentType.CENTER,
            spacing: { before: 60 },
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const uint8 = new Uint8Array(buffer);
    const safeName = request.filename.replace(/\.pdf$/i, "");
    const filename = `${safeName}-signed.docx`;

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(uint8.byteLength),
      },
    });
  } catch (err: unknown) {
    console.error("Signed DOCX export error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Export failed" }, { status: 500 });
  }
}

/* ── Helper for audit table rows ── */
function auditRow(label: string, value: string): TableRow {
  return new TableRow({
    children: [
      new TableCell({
        width: { size: 30, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.SOLID, fill: "F1F5F9" },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
          children: [new TextRun({ text: label, bold: true, size: 17, color: "475569" })],
        })],
      }),
      new TableCell({
        width: { size: 70, type: WidthType.PERCENTAGE },
        margins: { top: 80, bottom: 80, left: 120, right: 120 },
        children: [new Paragraph({
          children: [new TextRun({ text: value, size: 17, color: "0F172A" })],
        })],
      }),
    ],
  });
}
