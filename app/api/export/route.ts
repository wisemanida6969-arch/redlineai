import { NextRequest, NextResponse } from "next/server";
import {
  Document, Paragraph, TextRun, Table, TableRow, TableCell,
  HeadingLevel, AlignmentType, BorderStyle, WidthType, ShadingType, Packer,
} from "docx";

interface RiskClause {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  original: string;
  problem: string;
  fix: string;
}

interface AnalysisResult {
  summary: string;
  high: RiskClause[];
  medium: RiskClause[];
  low: RiskClause[];
  scannedAt: string;
}

const SEV_COLOR  = { high: "C53030", medium: "B7791F", low: "1D4ED8" };
const SEV_BG     = { high: "FEE2E2", medium: "FEF9C3", low: "DBEAFE" };
const SEV_LABEL  = { high: "HIGH RISK", medium: "MEDIUM RISK", low: "LOW RISK" };
const FIX_BG     = "DCFCE7";
const FIX_COLOR  = "166534";
const FIX_TEXT   = "14532D";

function clauseSection(
  clauses: RiskClause[],
  sev: "high" | "medium" | "low",
  deps: { Paragraph: typeof Paragraph; TextRun: typeof TextRun; Table: typeof Table; TableRow: typeof TableRow; TableCell: typeof TableCell }
): (Paragraph | Table)[] {
  if (clauses.length === 0) return [];
  const { Paragraph: P, TextRun: TR, Table: T, TableRow: TRow, TableCell: TCell } = deps;

  const header = new P({
    children: [new TR({ text: SEV_LABEL[sev], bold: true, color: SEV_COLOR[sev], size: 22 })],
    spacing: { before: 320, after: 80 },
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color: SEV_COLOR[sev], space: 1 } },
  });

  const items: (Paragraph | Table)[] = clauses.flatMap((c) => {
    const out: (Paragraph | Table)[] = [
      new P({
        children: [new TR({ text: c.title, bold: true, size: 21, color: "0F172A" })],
        spacing: { before: 200, after: 60 },
      }),
    ];

    if (c.original?.trim()) {
      out.push(new P({
        children: [new TR({ text: `"${c.original}"`, italics: true, color: "64748B", size: 18 })],
        spacing: { after: 60 },
      }));
    }

    out.push(new P({
      children: [
        new TR({ text: "Problem:  ", bold: true, color: SEV_COLOR[sev], size: 19 }),
        new TR({ text: c.problem, size: 19, color: "334155" }),
      ],
      spacing: { after: 60 },
    }));

    out.push(new T({
      width: { size: 100, type: WidthType.PERCENTAGE },
      rows: [new TRow({
        children: [new TCell({
          children: [
            new P({ children: [new TR({ text: "Suggested Fix", bold: true, color: FIX_COLOR, size: 19 })] }),
            new P({ children: [new TR({ text: c.fix, size: 18, color: FIX_TEXT })], spacing: { before: 40 } }),
          ],
          shading: { type: ShadingType.SOLID, fill: FIX_BG },
          margins: { top: 100, bottom: 100, left: 150, right: 150 },
        })],
      })],
    }));

    out.push(new P({ text: "", spacing: { after: 100 } }));
    return out;
  });

  return [header, ...items];
}

export async function POST(req: NextRequest) {
  try {
    const result: AnalysisResult = await req.json();
    const dateStr = new Date(result.scannedAt).toLocaleString("en-US", { dateStyle: "long", timeStyle: "short" });

    const deps = { Paragraph, TextRun, Table, TableRow, TableCell };

    const doc = new Document({
      styles: {
        default: { document: { run: { font: "Calibri", size: 20, color: "1E293B" } } },
      },
      sections: [{
        children: [
          /* Title */
          new Paragraph({
            children: [
              new TextRun({ text: "RedlineAI ", bold: true, size: 44, color: "E53E3E" }),
              new TextRun({ text: "Contract Risk Report", bold: true, size: 44, color: "0F172A" }),
            ],
            spacing: { after: 60 },
          }),
          new Paragraph({
            children: [new TextRun({ text: `Scanned: ${dateStr}`, color: "64748B", size: 18 })],
            spacing: { after: 300 },
          }),

          /* Score row */
          new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            rows: [new TableRow({
              children: (
                [
                  { text: `${result.high.length}  High Risk Issues`,    bg: SEV_BG.high,   color: SEV_COLOR.high   },
                  { text: `${result.medium.length}  Medium Risk Issues`, bg: SEV_BG.medium, color: SEV_COLOR.medium },
                  { text: `${result.low.length}  Low Risk Issues`,      bg: SEV_BG.low,    color: SEV_COLOR.low    },
                ] as { text: string; bg: string; color: string }[]
              ).map(({ text, bg, color }) =>
                new TableCell({
                  children: [new Paragraph({
                    children: [new TextRun({ text, bold: true, color, size: 20 })],
                    alignment: AlignmentType.CENTER,
                  })],
                  shading: { type: ShadingType.SOLID, fill: bg },
                  margins: { top: 140, bottom: 140, left: 120, right: 120 },
                })
              ),
            })],
          }),

          new Paragraph({ text: "", spacing: { after: 160 } }),

          /* AI Summary */
          new Paragraph({
            children: [new TextRun({ text: "AI Summary", bold: true, size: 24, color: "0F172A" })],
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 160, after: 80 },
          }),
          new Paragraph({
            children: [new TextRun({ text: result.summary, size: 19, color: "334155" })],
            spacing: { after: 280 },
          }),

          /* Clauses */
          ...clauseSection(result.high,   "high",   deps),
          ...clauseSection(result.medium, "medium", deps),
          ...clauseSection(result.low,    "low",    deps),

          /* Footer */
          new Paragraph({ text: "", spacing: { before: 400 } }),
          new Paragraph({
            children: [new TextRun({ text: "Generated by RedlineAI · redlineai.com", color: "94A3B8", size: 16, italics: true })],
            alignment: AlignmentType.CENTER,
          }),
        ],
      }],
    });

    const buffer = await Packer.toBuffer(doc);
    const uint8 = new Uint8Array(buffer);

    const filename = `redlineai-report-${new Date(result.scannedAt).toISOString().slice(0, 10)}.docx`;

    return new NextResponse(uint8, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Content-Length": String(uint8.byteLength),
      },
    });
  } catch (err: unknown) {
    console.error("DOCX export error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Export failed" }, { status: 500 });
  }
}
