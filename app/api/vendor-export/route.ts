import { NextRequest, NextResponse } from "next/server";
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType, Packer, ExternalHyperlink,
} from "docx";

interface RiskSection {
  severity: "high" | "medium" | "low";
  summary: string;
  items: string[];
}

interface VendorReport {
  vendorName: string;
  overview: string;
  newsRisk: RiskSection;
  financialRisk: RiskSection;
  legalRisk: RiskSection;
  overallScore: "high" | "medium" | "low";
  overallSummary: string;
  recommendations: string[];
  sources: string[];
}

interface ExportPayload {
  report: VendorReport;
  scannedAt: string;
}

const SEV_COLOR  = { high: "C53030", medium: "B7791F", low: "1D4ED8" };
const SEV_LABEL  = { high: "HIGH RISK", medium: "MEDIUM RISK", low: "LOW RISK" };

function riskSectionBlocks(title: string, section: RiskSection): (Paragraph | Table)[] {
  const sev = section.severity;
  const blocks: (Paragraph | Table)[] = [];

  // Section title with severity badge
  blocks.push(
    new Paragraph({
      children: [
        new TextRun({ text: title, bold: true, size: 26, color: "0F172A" }),
        new TextRun({ text: "   " }),
        new TextRun({ text: SEV_LABEL[sev], bold: true, size: 18, color: SEV_COLOR[sev] }),
      ],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 320, after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: SEV_COLOR[sev], space: 1 } },
    })
  );

  // Summary
  blocks.push(
    new Paragraph({
      children: [new TextRun({ text: section.summary, size: 19, color: "334155" })],
      spacing: { after: 120 },
    })
  );

  // Key findings list
  if (section.items && section.items.length > 0) {
    blocks.push(
      new Paragraph({
        children: [new TextRun({ text: "Key Findings", bold: true, size: 18, color: SEV_COLOR[sev] })],
        spacing: { before: 60, after: 60 },
      })
    );

    section.items.forEach((item) => {
      blocks.push(
        new Paragraph({
          children: [new TextRun({ text: item, size: 18, color: "334155" })],
          bullet: { level: 0 },
          spacing: { after: 40 },
        })
      );
    });
  }

  return blocks;
}

export async function POST(req: NextRequest) {
  try {
    const { report, scannedAt }: ExportPayload = await req.json();
    const dateStr = new Date(scannedAt).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });

    const score = report.overallScore;

    const doc = new Document({
      styles: {
        default: { document: { run: { font: "Calibri", size: 20, color: "1E293B" } } },
      },
      sections: [{
        children: [
          /* ── Title ── */
          new Paragraph({
            children: [
              new TextRun({ text: "RedlineAI ", bold: true, size: 44, color: "E53E3E" }),
              new TextRun({ text: "Vendor Risk Report", bold: true, size: 44, color: "0F172A" }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Scanned: ${dateStr}`, color: "64748B", size: 18 })],
            spacing: { after: 240 },
          }),

          /* ── Vendor name ── */
          new Paragraph({
            children: [new TextRun({ text: report.vendorName, bold: true, size: 36, color: "0F172A" })],
            spacing: { after: 100 },
          }),

          /* ── Overall Risk Score ── */
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({
              children: [new TableCell({
                children: [new Paragraph({
                  children: [new TextRun({ text: `OVERALL: ${SEV_LABEL[score]}`, bold: true, color: "FFFFFF", size: 24 })],
                  alignment: AlignmentType.CENTER,
                })],
                shading: { type: ShadingType.SOLID, fill: SEV_COLOR[score] },
                margins: { top: 160, bottom: 160, left: 160, right: 160 },
              })],
            })],
          }),

          new Paragraph({ text: "", spacing: { after: 160 } }),

          /* ── Overview ── */
          new Paragraph({
            children: [new TextRun({ text: report.overview, italics: true, size: 19, color: "475569" })],
            spacing: { after: 280 },
          }),

          /* ── Executive Summary ── */
          new Paragraph({
            children: [new TextRun({ text: "Executive Summary", bold: true, size: 24, color: "0F172A" })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 160, after: 80 },
          }),
          new Paragraph({
            children: [new TextRun({ text: report.overallSummary, size: 19, color: "334155" })],
            spacing: { after: 240 },
          }),

          /* ── Risk Sections ── */
          ...riskSectionBlocks("News & Reputation Risk", report.newsRisk),
          ...riskSectionBlocks("Financial Risk", report.financialRisk),
          ...riskSectionBlocks("Legal Risk", report.legalRisk),

          /* ── Recommendations ── */
          new Paragraph({
            children: [new TextRun({ text: "Recommendations", bold: true, size: 24, color: "166534" })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 320, after: 100 },
            border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "166534", space: 1 } },
          }),
          ...report.recommendations.map((rec, i) =>
            new Paragraph({
              children: [
                new TextRun({ text: `${i + 1}. `, bold: true, size: 19, color: "166534" }),
                new TextRun({ text: rec, size: 19, color: "334155" }),
              ],
              spacing: { after: 80 },
            })
          ),

          /* ── Sources ── */
          ...(report.sources && report.sources.length > 0 ? [
            new Paragraph({
              children: [new TextRun({ text: "Sources", bold: true, size: 22, color: "0F172A" })],
              heading: HeadingLevel.HEADING_3,
              spacing: { before: 320, after: 100 },
            }),
            ...report.sources.map((url) =>
              new Paragraph({
                children: [
                  new ExternalHyperlink({
                    link: url,
                    children: [new TextRun({ text: url, size: 16, color: "1D4ED8", underline: {} })],
                  }),
                ],
                spacing: { after: 40 },
              })
            ),
          ] : []),

          /* ── Disclaimer ── */
          new Paragraph({ text: "", spacing: { before: 320 } }),
          new Paragraph({
            children: [new TextRun({
              text: "AI-generated due-diligence summary. Verify critical findings before making business decisions.",
              italics: true, color: "94A3B8", size: 16,
            })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Generated by RedlineAI · getredlineai.com", color: "94A3B8", size: 16, italics: true })],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const uint8 = new Uint8Array(buffer);

    const safeName = report.vendorName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
    const dateOnly = new Date(scannedAt).toISOString().slice(0, 10);
    const filename = `vendor-risk-${safeName}-${dateOnly}.docx`;

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(uint8.byteLength),
      },
    });
  } catch (err: unknown) {
    console.error("Vendor DOCX export error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Export failed" }, { status: 500 });
  }
}
