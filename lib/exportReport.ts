/* ------------------------------------------------------------------ */
/*  RedlineAI – Report export helpers (PDF + DOCX)                    */
/* ------------------------------------------------------------------ */

export interface RiskClause {
  id: string;
  severity: "high" | "medium" | "low";
  title: string;
  original: string;
  problem: string;
  fix: string;
  /** Citation for the verbatim standard-contract quote in "fix", e.g. "OO Standard Contract, Article 4". */
  fixSource?: string;
}

export interface AnalysisResult {
  summary: string;
  high: RiskClause[];
  medium: RiskClause[];
  low: RiskClause[];
  scannedAt: string;
  extractionMethod?: string;
  /** AI-suggested keywords for finding related court precedents */
  precedentQueries?: string[];
  /** User's plan at scan time (kept for reference; precedent access is now pass/quota-gated) */
  plan?: "free" | "member" | "pro";
  /** DB id of the saved scan — ties 사인 전 패키지 purchases/PDF downloads to this contract. */
  scanId?: string | null;
  articleCount?: number;
  standardInfo?: { typeId: string; typeKo: string; categoryKo: string } | null;
}

const SEVERITY_LABEL: Record<string, string> = {
  high: "DIFFERS SIGNIFICANTLY",
  medium: "DIFFERS SOMEWHAT",
  low: "DIFFERS SLIGHTLY",
};

/* ================================================================== */
/*  PDF export – jsPDF                                                  */
/* ================================================================== */
export async function downloadPDF(result: AnalysisResult, filename = "redlineai-report") {
  const { default: jsPDF } = await import("jspdf");
  await import("jspdf-autotable");
  const { loadKoreanFont } = await import("./pdfKoreanFont");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  await loadKoreanFont(doc);
  const PAGE_W = 210;
  const MARGIN = 18;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  let y = MARGIN;

  /* ── helpers ── */
  const navy   = [15, 26, 46]  as [number,number,number];
  const red    = [229, 62, 62] as [number,number,number];
  const white  = [255,255,255] as [number,number,number];
  const slate  = [100,116,139] as [number,number,number];
  const green  = [22,163,74]   as [number,number,number];
  // redBg reserved for future use
  const yelBg  = [254,243,199] as [number,number,number];
  const bluBg  = [219,234,254] as [number,number,number];

  const checkPage = (need = 20) => {
    if (y + need > 280) { doc.addPage(); y = MARGIN; }
  };

  const wrapText = (text: string, maxW: number, fontSize: number): string[] => {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text, maxW) as string[];
  };

  /* ── HEADER ── */
  doc.setFillColor(...navy);
  doc.rect(0, 0, PAGE_W, 28, "F");

  doc.setFillColor(...red);
  doc.roundedRect(MARGIN, 7, 38, 13, 2, 2, "F");
  doc.setTextColor(...white);
  doc.setFontSize(11);
  doc.setFont("NanumGothic", "bold");
  doc.text("레드라인AI", MARGIN + 5, 15.5);

  doc.setFontSize(8);
  doc.setFont("NanumGothic", "normal");
  doc.setTextColor(180, 195, 215);
  doc.text("Standard Comparison Report", MARGIN + 42, 15.5);

  const dateStr = new Date(result.scannedAt).toLocaleString("en-US", {
    dateStyle: "medium", timeStyle: "short",
  });
  doc.text(`Scanned: ${dateStr}`, PAGE_W - MARGIN, 15.5, { align: "right" });

  y = 38;

  /* ── SCORE CARDS ── */
  const cardW = (CONTENT_W - 8) / 3;
  const cards = [
    { label: "Differs Significantly", count: result.high.length,   bg: [254,202,202] as [number,number,number], text: [153,27,27]  as [number,number,number] },
    { label: "Differs Somewhat",      count: result.medium.length, bg: yelBg,                                   text: [146,64,14]  as [number,number,number] },
    { label: "Differs Slightly",      count: result.low.length,    bg: bluBg,                                   text: [30,64,175]  as [number,number,number] },
  ];
  cards.forEach((c, i) => {
    const x = MARGIN + i * (cardW + 4);
    doc.setFillColor(...c.bg);
    doc.roundedRect(x, y, cardW, 20, 3, 3, "F");
    doc.setTextColor(...c.text);
    doc.setFontSize(18);
    doc.setFont("NanumGothic", "bold");
    doc.text(String(c.count), x + cardW / 2, y + 11, { align: "center" });
    doc.setFontSize(7.5);
    doc.setFont("NanumGothic", "normal");
    doc.text(c.label, x + cardW / 2, y + 17, { align: "center" });
  });
  y += 28;

  /* ── SUMMARY ── */
  doc.setFillColor(22, 32, 53);
  doc.roundedRect(MARGIN, y, CONTENT_W, 6, 2, 2, "F");
  doc.setTextColor(...white);
  doc.setFontSize(9);
  doc.setFont("NanumGothic", "bold");
  doc.text("AI SUMMARY", MARGIN + 4, y + 4.2);
  y += 9;

  doc.setFillColor(240, 244, 250);
  const summaryLines = wrapText(result.summary, CONTENT_W - 8, 9);
  const summaryH = summaryLines.length * 5 + 6;
  doc.roundedRect(MARGIN, y, CONTENT_W, summaryH, 2, 2, "F");
  doc.setTextColor(51, 65, 85);
  doc.setFont("NanumGothic", "normal");
  summaryLines.forEach((line, i) => doc.text(line, MARGIN + 4, y + 5 + i * 5));
  y += summaryH + 8;

  /* ── CLAUSES ── */
  const sevBg: Record<string, [number,number,number]> = {
    high: [254,226,226], medium: [254,243,199], low: [219,234,254],
  };
  const sevText: Record<string, [number,number,number]> = {
    high: [185,28,28], medium: [180,83,9], low: [29,78,216],
  };
  const sevBorder: Record<string, [number,number,number]> = {
    high: [252,165,165], medium: [253,230,138], low: [147,197,253],
  };

  const allClauses = [
    ...result.high.map(c => ({ ...c, severity: "high" as const })),
    ...result.medium.map(c => ({ ...c, severity: "medium" as const })),
    ...result.low.map(c => ({ ...c, severity: "low" as const })),
  ];

  if (allClauses.length === 0) {
    doc.setTextColor(...slate);
    doc.setFontSize(10);
    doc.text("No issues found.", MARGIN, y + 6);
  }

  allClauses.forEach((clause) => {
    const sev = clause.severity;

    // estimate height
    const titleLines  = wrapText(clause.title,    CONTENT_W - 30, 9);
    const origLines   = clause.original ? wrapText(`"${clause.original}"`, CONTENT_W - 12, 8.5) : [];
    const probLines   = wrapText(clause.problem,  CONTENT_W - 12, 8.5);
    const hasFix      = Boolean(clause.fix && clause.fix.trim());
    const fixDisplay  = hasFix && clause.fixSource ? `${clause.fixSource}: ${clause.fix}` : clause.fix;
    const fixLines    = hasFix ? wrapText(fixDisplay, CONTENT_W - 12, 8.5) : [];
    const sourceLines = hasFix && clause.fixSource ? wrapText(`Source: MCST — ${clause.fixSource}`, CONTENT_W - 12, 7) : [];
    const cardH = 10
      + titleLines.length * 5
      + (origLines.length  > 0 ? origLines.length  * 4.8 + 10 : 0)
      + probLines.length * 4.8 + 10
      + (hasFix ? fixLines.length * 4.8 + 10 + sourceLines.length * 4 : 0)
      + 4;

    checkPage(cardH + 4);

    // card bg
    doc.setFillColor(...sevBg[sev]);
    doc.setDrawColor(...sevBorder[sev]);
    doc.setLineWidth(0.4);
    doc.roundedRect(MARGIN, y, CONTENT_W, cardH, 3, 3, "FD");

    let cy = y + 5;

    // severity badge
    doc.setFillColor(...sevText[sev]);
    doc.roundedRect(MARGIN + 3, cy - 3.2, 22, 5, 1, 1, "F");
    doc.setTextColor(...white);
    doc.setFontSize(6.5);
    doc.setFont("NanumGothic", "bold");
    doc.text(SEVERITY_LABEL[sev], MARGIN + 14, cy + 0.5, { align: "center" });

    // title
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(9);
    titleLines.forEach((line, i) => doc.text(line, MARGIN + 28, cy + i * 5));
    cy += Math.max(titleLines.length * 5, 5) + 3;

    // original
    if (origLines.length > 0) {
      doc.setFillColor(255,255,255);
      const oh = origLines.length * 4.8 + 6;
      doc.roundedRect(MARGIN + 4, cy, CONTENT_W - 8, oh, 2, 2, "F");
      doc.setTextColor(...slate);
      doc.setFontSize(7.5);
      doc.setFont("NanumGothic", "bolditalic");
      doc.text("Original clause", MARGIN + 7, cy + 4.5);
      doc.setFont("NanumGothic", "italic");
      origLines.forEach((line, i) => doc.text(line, MARGIN + 7, cy + 9 + i * 4.8));
      cy += oh + 4;
    }

    // problem
    {
      doc.setFillColor(255,255,255);
      const ph = probLines.length * 4.8 + 6;
      doc.roundedRect(MARGIN + 4, cy, CONTENT_W - 8, ph, 2, 2, "F");
      doc.setTextColor(...sevText[sev]);
      doc.setFontSize(7.5);
      doc.setFont("NanumGothic", "bold");
      doc.text("How it differs from the standard", MARGIN + 7, cy + 4.5);
      doc.setTextColor(51, 65, 85);
      doc.setFont("NanumGothic", "normal");
      probLines.forEach((line, i) => doc.text(line, MARGIN + 7, cy + 9 + i * 4.8));
      cy += ph + 4;
    }

    // fix (only shown when a real verbatim standard quote is present — text is never rewritten)
    if (hasFix) {
      doc.setFillColor(220, 252, 231);
      const fh = fixLines.length * 4.8 + 6 + sourceLines.length * 4;
      doc.roundedRect(MARGIN + 4, cy, CONTENT_W - 8, fh, 2, 2, "F");
      doc.setTextColor(...green);
      doc.setFontSize(7.5);
      doc.setFont("NanumGothic", "bold");
      doc.text("Official Standard Text", MARGIN + 7, cy + 4.5);
      doc.setTextColor(20, 83, 45);
      doc.setFont("NanumGothic", "normal");
      // fixDisplay only adds the citation prefix; clause.fix itself is never altered
      fixLines.forEach((line, i) => doc.text(line, MARGIN + 7, cy + 9 + i * 4.8));
      if (sourceLines.length > 0) {
        const sy = cy + 9 + fixLines.length * 4.8 + 3;
        doc.setFontSize(6.5);
        doc.setFont("NanumGothic", "italic");
        doc.setTextColor(...slate);
        sourceLines.forEach((line, i) => doc.text(line, MARGIN + 7, sy + i * 4));
      }
    }

    y += cardH + 5;
  });

  /* ── FOOTER on every page ── */
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(200, 210, 225);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, 288, PAGE_W - MARGIN, 288);
    doc.setFontSize(7);
    doc.setTextColor(...slate);
    doc.setFont("NanumGothic", "normal");
    doc.text("Generated by 레드라인AI · redlineai.com", MARGIN, 293);
    doc.text(`Page ${p} of ${pageCount}`, PAGE_W - MARGIN, 293, { align: "right" });
  }

  doc.save(`${filename}.pdf`);
}


/* ================================================================== */
/*  DOCX export – server-side API route                                */
/* ================================================================== */
export async function downloadDOCX(result: AnalysisResult, filename = "redlineai-report") {
  // Send data to server API → get back the .docx binary → trigger download
  const res = await fetch("/api/export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(result),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: "Export failed" }));
    throw new Error(err.error || "Export failed");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
