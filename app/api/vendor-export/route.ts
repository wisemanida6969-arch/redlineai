import { NextRequest, NextResponse } from "next/server";
import {
  Document, Paragraph, TextRun, Table,
  HeadingLevel, AlignmentType, BorderStyle, Packer, ExternalHyperlink,
} from "docx";

interface RiskSection {
  severity?: "high" | "medium" | "low";
  summary: string;
  items: string[];
}

interface VendorReport {
  vendorName: string;
  overview: string;
  publicInfo?: string[];
  newsRisk: RiskSection;
  financialRisk: RiskSection;
  legalRisk: RiskSection;
  /* Legacy fields - no longer generated, optional for old saved scans */
  overallScore?: "high" | "medium" | "low";
  overallSummary?: string;
  recommendations?: string[];
  sources: string[];
}

interface ExportPayload {
  report: VendorReport;
  scannedAt: string;
}

function riskSectionBlocks(title: string, section: RiskSection): (Paragraph | Table)[] {
  const blocks: (Paragraph | Table)[] = [];

  // Section title (no rating badges - facts only)
  blocks.push(
    new Paragraph({
      children: [
        new TextRun({ text: title, bold: true, size: 26, color: "0F172A" }),
      ],
      heading: HeadingLevel.HEADING_2,
      spacing: { before: 320, after: 80 },
      border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: "94A3B8", space: 1 } },
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
        children: [new TextRun({ text: "확인된 사항", bold: true, size: 18, color: "64748B" })],
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

    const doc = new Document({
      styles: {
        default: { document: { run: { font: "Calibri", size: 20, color: "1E293B" } } },
      },
      sections: [{
        children: [
          /* ── Title ── */
          new Paragraph({
            children: [
              new TextRun({ text: "레드라인AI ", bold: true, size: 44, color: "E53E3E" }),
              new TextRun({ text: "사업체 공개 정보 리포트", bold: true, size: 44, color: "0F172A" }),
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

          new Paragraph({ text: "", spacing: { after: 160 } }),

          /* ── Overview ── */
          new Paragraph({
            children: [new TextRun({ text: report.overview, italics: true, size: 19, color: "475569" })],
            spacing: { after: 280 },
          }),

          /* ── Public company facts ── */
          ...(report.publicInfo && report.publicInfo.length > 0 ? [
            new Paragraph({
              children: [new TextRun({ text: "사업체 공개 정보", bold: true, size: 24, color: "0F172A" })],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 160, after: 80 },
            }),
            ...report.publicInfo.map((f) =>
              new Paragraph({
                children: [new TextRun({ text: f, size: 19, color: "334155" })],
                bullet: { level: 0 },
                spacing: { after: 40 },
              })
            ),
            new Paragraph({ text: "", spacing: { after: 160 } }),
          ] : []),

          /* ── Executive Summary (legacy scans only) ── */
          ...(report.overallSummary ? [
            new Paragraph({
              children: [new TextRun({ text: "종합 요약", bold: true, size: 24, color: "0F172A" })],
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 160, after: 80 },
            }),
            new Paragraph({
              children: [new TextRun({ text: report.overallSummary, size: 19, color: "334155" })],
              spacing: { after: 240 },
            }),
          ] : []),

          /* ── Risk Sections ── */
          ...riskSectionBlocks("뉴스·보도 (공개 정보)", report.newsRisk),
          ...riskSectionBlocks("재무 관련 공개 정보", report.financialRisk),
          ...riskSectionBlocks("법적 기록 (공개 정보)", report.legalRisk),

          /* ── Recommendations (legacy scans only) ── */
          ...(report.recommendations && report.recommendations.length > 0 ? [
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
          ] : []),

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
              text: "공개 정보를 정리한 참고 자료입니다. 중요한 결정 전에는 원 출처에서 사실을 확인하세요.",
              italics: true, color: "94A3B8", size: 16,
            })],
            alignment: AlignmentType.CENTER,
            spacing: { after: 80 },
          }),
          new Paragraph({
            children: [new TextRun({ text: "Generated by 레드라인AI · getredlineai.com", color: "94A3B8", size: 16, italics: true })],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const uint8 = new Uint8Array(buffer);

    const safeName = report.vendorName.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
    const dateOnly = new Date(scannedAt).toISOString().slice(0, 10);
    const filename = `vendor-info-${safeName}-${dateOnly}.docx`;

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
