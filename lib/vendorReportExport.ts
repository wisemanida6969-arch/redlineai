/* ------------------------------------------------------------------ */
/*  RedlineAI – Vendor Risk Report PDF export                          */
/* ------------------------------------------------------------------ */

export interface VendorReport {
  vendorName: string;
  overview: string;
  newsRisk: { severity: "high" | "medium" | "low"; summary: string; items: string[] };
  financialRisk: { severity: "high" | "medium" | "low"; summary: string; items: string[] };
  legalRisk: { severity: "high" | "medium" | "low"; summary: string; items: string[] };
  overallScore: "high" | "medium" | "low";
  overallSummary: string;
  recommendations: string[];
  sources: string[];
}

const SEV_LABEL: Record<string, string> = { high: "HIGH RISK", medium: "MEDIUM RISK", low: "LOW RISK" };

export async function downloadVendorPDF(report: VendorReport, scannedAt: string, filename = "vendor-risk-report") {
  const { default: jsPDF } = await import("jspdf");

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PAGE_W = 210;
  const PAGE_H = 297;
  const MARGIN = 18;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const FOOTER_Y = PAGE_H - 12;
  let y = MARGIN;

  /* ── Color tokens ── */
  const navy   = [15, 26, 46]    as [number,number,number];
  const red    = [229, 62, 62]   as [number,number,number];
  const white  = [255,255,255]   as [number,number,number];
  const slate  = [100,116,139]   as [number,number,number];

  const sevBg: Record<string, [number,number,number]> = {
    high: [254,226,226], medium: [254,243,199], low: [219,234,254],
  };
  const sevText: Record<string, [number,number,number]> = {
    high: [185,28,28], medium: [180,83,9], low: [29,78,216],
  };
  const sevBorder: Record<string, [number,number,number]> = {
    high: [252,165,165], medium: [253,230,138], low: [147,197,253],
  };

  const checkPage = (need = 10) => {
    if (y + need > FOOTER_Y - 6) {
      doc.addPage();
      y = MARGIN;
    }
  };

  const wrap = (text: string, width: number, fontSize: number): string[] => {
    doc.setFontSize(fontSize);
    return doc.splitTextToSize(text, width) as string[];
  };

  /* ── Header bar ── */
  doc.setFillColor(...navy);
  doc.rect(0, 0, PAGE_W, 28, "F");

  doc.setFillColor(...red);
  doc.roundedRect(MARGIN, 7, 38, 13, 2, 2, "F");
  doc.setTextColor(...white);
  doc.setFontSize(11);
  doc.setFont("helvetica", "bold");
  doc.text("RedlineAI", MARGIN + 5, 15.5);

  doc.setFontSize(8);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(180, 195, 215);
  doc.text("Vendor Risk Report", MARGIN + 42, 15.5);

  const dateStr = new Date(scannedAt).toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
  doc.text(`Scanned: ${dateStr}`, PAGE_W - MARGIN, 15.5, { align: "right" });

  y = 38;

  /* ── Vendor name ── */
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(18);
  doc.setFont("helvetica", "bold");
  doc.text(report.vendorName, MARGIN, y);
  y += 8;

  /* ── Overall Risk Score badge ── */
  const score = report.overallScore;
  const scoreLabel = SEV_LABEL[score];
  doc.setFillColor(...sevText[score]);
  doc.roundedRect(MARGIN, y, 50, 9, 2, 2, "F");
  doc.setTextColor(...white);
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text(`OVERALL: ${scoreLabel}`, MARGIN + 25, y + 6, { align: "center" });
  y += 14;

  /* ── Overview ── */
  doc.setTextColor(60, 70, 90);
  doc.setFontSize(9.5);
  doc.setFont("helvetica", "italic");
  const overviewLines = wrap(report.overview, CONTENT_W, 9.5);
  overviewLines.forEach((l) => { checkPage(6); doc.text(l, MARGIN, y); y += 5; });
  y += 6;

  /* ── Executive Summary ── */
  checkPage(15);
  doc.setFillColor(22, 32, 53);
  doc.roundedRect(MARGIN, y, CONTENT_W, 6, 2, 2, "F");
  doc.setTextColor(...white);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("EXECUTIVE SUMMARY", MARGIN + 4, y + 4.2);
  y += 9;

  const summaryLines = wrap(report.overallSummary, CONTENT_W - 8, 9);
  const summaryH = summaryLines.length * 5 + 6;
  checkPage(summaryH + 4);
  doc.setFillColor(240, 244, 250);
  doc.roundedRect(MARGIN, y, CONTENT_W, summaryH, 2, 2, "F");
  doc.setTextColor(51, 65, 85);
  doc.setFont("helvetica", "normal");
  summaryLines.forEach((l, i) => doc.text(l, MARGIN + 4, y + 5 + i * 5));
  y += summaryH + 8;

  /* ── Risk sections ── */
  const sections = [
    { title: "News & Reputation Risk", data: report.newsRisk },
    { title: "Financial Risk",         data: report.financialRisk },
    { title: "Legal Risk",             data: report.legalRisk },
  ];

  for (const section of sections) {
    const sev = section.data.severity;
    const sumLines = wrap(section.data.summary, CONTENT_W - 12, 9);
    const itemLines = section.data.items.flatMap((it) => wrap(`• ${it}`, CONTENT_W - 16, 9));
    const cardH = 14 + sumLines.length * 5 + (itemLines.length > 0 ? itemLines.length * 5 + 4 : 0) + 6;

    checkPage(cardH + 4);

    // Card bg
    doc.setFillColor(...sevBg[sev]);
    doc.setDrawColor(...sevBorder[sev]);
    doc.setLineWidth(0.4);
    doc.roundedRect(MARGIN, y, CONTENT_W, cardH, 3, 3, "FD");

    // Severity badge
    doc.setFillColor(...sevText[sev]);
    doc.roundedRect(MARGIN + 4, y + 4, 26, 5.5, 1, 1, "F");
    doc.setTextColor(...white);
    doc.setFontSize(7);
    doc.setFont("helvetica", "bold");
    doc.text(SEV_LABEL[sev], MARGIN + 17, y + 7.8, { align: "center" });

    // Section title
    doc.setTextColor(15, 23, 42);
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(section.title, MARGIN + 33, y + 8);

    // Summary
    doc.setTextColor(40, 50, 65);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    let cy = y + 14;
    sumLines.forEach((l) => { doc.text(l, MARGIN + 4, cy); cy += 5; });

    // Items
    if (itemLines.length > 0) {
      cy += 2;
      doc.setTextColor(...sevText[sev]);
      doc.setFontSize(7.5);
      doc.setFont("helvetica", "bold");
      doc.text("KEY FINDINGS", MARGIN + 4, cy);
      cy += 4;
      doc.setTextColor(40, 50, 65);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9);
      itemLines.forEach((l) => { doc.text(l, MARGIN + 4, cy); cy += 5; });
    }

    y += cardH + 5;
  }

  /* ── Recommendations ── */
  checkPage(15 + report.recommendations.length * 6);
  doc.setFillColor(22, 32, 53);
  doc.roundedRect(MARGIN, y, CONTENT_W, 6, 2, 2, "F");
  doc.setTextColor(...white);
  doc.setFontSize(9);
  doc.setFont("helvetica", "bold");
  doc.text("RECOMMENDATIONS", MARGIN + 4, y + 4.2);
  y += 9;

  doc.setFillColor(220, 252, 231);
  doc.setDrawColor(167, 243, 208);
  const recLines = report.recommendations.flatMap((r, i) => wrap(`${i + 1}. ${r}`, CONTENT_W - 8, 9));
  const recH = recLines.length * 5 + 6;
  doc.roundedRect(MARGIN, y, CONTENT_W, recH, 2, 2, "FD");
  doc.setTextColor(20, 83, 45);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  recLines.forEach((l, i) => doc.text(l, MARGIN + 4, y + 5 + i * 5));
  y += recH + 8;

  /* ── Sources ── */
  if (report.sources && report.sources.length > 0) {
    checkPage(15 + report.sources.length * 4);
    doc.setTextColor(...slate);
    doc.setFontSize(8);
    doc.setFont("helvetica", "bold");
    doc.text("SOURCES", MARGIN, y);
    y += 4;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    report.sources.forEach((s) => {
      const lines = wrap(s, CONTENT_W, 7.5);
      lines.forEach((l) => { checkPage(4); doc.text(l, MARGIN, y); y += 3.5; });
    });
  }

  /* ── Footer ── */
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    doc.setDrawColor(200, 210, 225);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, FOOTER_Y - 4, PAGE_W - MARGIN, FOOTER_Y - 4);
    doc.setFontSize(7);
    doc.setTextColor(...slate);
    doc.setFont("helvetica", "normal");
    doc.text("Generated by RedlineAI · getredlineai.com", MARGIN, FOOTER_Y);
    doc.text(`Page ${p} of ${pageCount}`, PAGE_W - MARGIN, FOOTER_Y, { align: "right" });
  }

  doc.save(`${filename}.pdf`);
}


/* ================================================================== */
/*  DOCX export – server-side API route                                */
/* ================================================================== */
export async function downloadVendorDOCX(report: VendorReport, scannedAt: string, filename = "vendor-risk-report") {
  const res = await fetch("/api/vendor-export", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ report, scannedAt }),
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
