import { readFileSync } from "fs";
import path from "path";
import type { createServiceClient } from "@/lib/supabase/server";
import { fetchLawPrecedents, fetchPrecedentTitles, type LawPrecedentRef, type PrecedentRef } from "@/lib/precedentFetch";

/*
 * 사인 전 패키지 — PDF report assembly. Wording rule (legal): factual
 * comparison only — "표준계약서와 다름", "표준계약서에 존재하나 본 계약서에
 * 없음", "관련 판례", "참고 정보". No judgment/advice language.
 */

export interface ReportClause {
  severity: "high" | "medium" | "low";
  title: string;
  original: string;
  problem: string;
  fix: string;
  fixSource?: string;
}

export interface ScanResult {
  summary: string;
  high: ReportClause[];
  medium: ReportClause[];
  low: ReportClause[];
  precedentQueries?: string[];
  articleCount?: number;
  standardInfo?: { typeId: string; typeKo: string; categoryKo: string } | null;
}

const SEVERITY_KO: Record<string, string> = {
  high: "표준과 큰 차이",
  medium: "표준과 다소 차이",
  low: "표준과 경미한 차이",
};

const RISK_LEVEL_KO: Record<string, string> = { high: "높음", medium: "중간", low: "낮음" };

export const REPORT_DISCLAIMER =
  "본 리포트는 법률 자문이 아니며, 문화체육관광부 표준계약서와의 객관적 차이 및 공개된 판례 정보를 정리한 사실 정보 제공물입니다. 법적 판단이 필요한 사안은 변호사와 상담하시기 바랍니다.";

const DISCLAIMER = REPORT_DISCLAIMER;

/* ================================================================== */
/*  PDF assembly                                                       */
/* ================================================================== */

export async function buildReportPdf(
  service: ReturnType<typeof createServiceClient>,
  userId: string,
  scan: { id: string; filename: string; summary: string; result: ScanResult; created_at: string },
): Promise<Buffer> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

  // Korean font (bundled Nanum Gothic) — jsPDF built-ins cannot render Hangul.
  const fontB64 = readFileSync(path.join(process.cwd(), "public", "fonts", "NanumGothic-Regular.ttf")).toString("base64");
  doc.addFileToVFS("NanumGothic-Regular.ttf", fontB64);
  for (const style of ["normal", "bold", "italic", "bolditalic"]) {
    doc.addFont("NanumGothic-Regular.ttf", "NanumGothic", style);
  }
  doc.setFont("NanumGothic", "normal");

  const PAGE_W = 210, PAGE_H = 297, MARGIN = 18;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const FOOTER_Y = PAGE_H - 12;
  let y = MARGIN;

  const navy: [number, number, number] = [15, 26, 46];
  const red: [number, number, number] = [229, 62, 62];
  const white: [number, number, number] = [255, 255, 255];
  const slate: [number, number, number] = [100, 116, 139];
  const dark: [number, number, number] = [15, 23, 42];
  const body: [number, number, number] = [40, 50, 65];
  const green: [number, number, number] = [20, 83, 45];

  const checkPage = (need = 12) => {
    if (y + need > FOOTER_Y - 6) { doc.addPage(); y = MARGIN; }
  };
  const wrap = (text: string, width: number, size: number): string[] => {
    doc.setFontSize(size);
    return doc.splitTextToSize(text, width) as string[];
  };
  const sectionHeader = (title: string) => {
    checkPage(16);
    doc.setFillColor(22, 32, 53);
    doc.roundedRect(MARGIN, y, CONTENT_W, 7, 2, 2, "F");
    doc.setTextColor(...white);
    doc.setFontSize(10);
    doc.setFont("NanumGothic", "bold");
    doc.text(title, MARGIN + 4, y + 5);
    y += 11;
  };
  const paragraph = (text: string, size = 9, color: [number, number, number] = body) => {
    const lines = wrap(text, CONTENT_W, size);
    doc.setTextColor(...color);
    doc.setFont("NanumGothic", "normal");
    doc.setFontSize(size);
    for (const line of lines) { checkPage(6); doc.text(line, MARGIN, y); y += size * 0.55; }
  };

  const result = scan.result;
  const clauses: ReportClause[] = [
    ...(result.high ?? []).map((c) => ({ ...c, severity: "high" as const })),
    ...(result.medium ?? []).map((c) => ({ ...c, severity: "medium" as const })),
    ...(result.low ?? []).map((c) => ({ ...c, severity: "low" as const })),
  ];
  const missingCount = clauses.filter((c) => !c.original || !c.original.trim()).length;
  const dateStr = String(scan.created_at).slice(0, 10);
  const fieldLabel = result.standardInfo
    ? `${result.standardInfo.categoryKo} · ${result.standardInfo.typeKo}`
    : "일반 (표준계약서 미지정)";

  /* ── 1. Cover ── */
  doc.setFillColor(...navy);
  doc.rect(0, 0, PAGE_W, PAGE_H, "F");
  doc.setFillColor(...red);
  doc.roundedRect(MARGIN, 60, 44, 14, 2, 2, "F");
  doc.setTextColor(...white);
  doc.setFont("NanumGothic", "bold");
  doc.setFontSize(13);
  doc.text("레드라인AI", MARGIN + 6, 69);
  doc.setFontSize(24);
  doc.text("표준계약서 비교 리포트", MARGIN, 95);
  doc.setFontSize(11);
  doc.setFont("NanumGothic", "normal");
  doc.setTextColor(180, 195, 215);
  doc.text("문화체육관광부 표준계약서 원문 대조 · 관련 판례 · 참고 정보", MARGIN, 104);

  doc.setDrawColor(60, 75, 100);
  doc.line(MARGIN, 120, PAGE_W - MARGIN, 120);
  doc.setFontSize(10);
  const coverRows: [string, string][] = [
    ["계약서", scan.filename || "붙여넣은 텍스트"],
    ["비교 기준 분야", fieldLabel],
    ["리포트 생성일", dateStr],
  ];
  let cy = 130;
  for (const [k, v] of coverRows) {
    doc.setTextColor(140, 155, 180);
    doc.text(k, MARGIN, cy);
    doc.setTextColor(...white);
    doc.text(wrap(v, CONTENT_W - 45, 10), MARGIN + 42, cy);
    cy += 9;
  }
  doc.setFontSize(8);
  doc.setTextColor(120, 135, 160);
  doc.text(wrap(DISCLAIMER, CONTENT_W, 8), MARGIN, 262);

  /* ── 2. Summary ── */
  doc.addPage();
  y = MARGIN;
  sectionHeader("요약");
  const summaryRows: [string, string][] = [
    ["계약서 내 조항 수", result.articleCount ? `${result.articleCount}개` : "확인 불가 (조항 번호 형식 미검출)"],
    ["표준계약서와 다른 것으로 표시된 조항", `${clauses.length}개 (큰 차이 ${result.high?.length ?? 0} · 다소 차이 ${result.medium?.length ?? 0} · 경미한 차이 ${result.low?.length ?? 0})`],
    ["표준계약서에 존재하나 본 계약서에 없음", `${missingCount}개`],
  ];
  for (const [k, v] of summaryRows) {
    checkPage(10);
    doc.setFont("NanumGothic", "bold");
    doc.setFontSize(9);
    doc.setTextColor(...dark);
    doc.text(k, MARGIN, y);
    y += 5;
    doc.setFont("NanumGothic", "normal");
    doc.setTextColor(...body);
    for (const line of wrap(v, CONTENT_W, 9)) { checkPage(6); doc.text(line, MARGIN, y); y += 5; }
    y += 2;
  }
  y += 2;
  paragraph(scan.summary || result.summary || "", 9);
  y += 4;

  /* ── 3. Clause-by-clause comparison ── */
  sectionHeader("조항별 대조 — 내 계약서 ↔ 문체부 표준계약서 원문");
  if (clauses.length === 0) {
    paragraph("표준계약서와 다른 것으로 표시된 조항이 없습니다.");
  }
  clauses.forEach((clause, i) => {
    const origText = clause.original?.trim()
      ? `“${clause.original.trim()}”`
      : "표준계약서에 존재하나 본 계약서에서 해당 문구가 확인되지 않았습니다.";
    const stdText = clause.fix?.trim()
      ? clause.fix.trim()
      : "대응하는 표준계약서 원문이 데이터에 없습니다.";

    const titleLines = wrap(`${i + 1}. ${clause.title}  [${SEVERITY_KO[clause.severity]}]`, CONTENT_W, 10);
    const origLines = wrap(origText, CONTENT_W - 8, 8.5);
    const probLines = wrap(clause.problem ?? "", CONTENT_W - 8, 8.5);
    const stdLines = wrap(stdText, CONTENT_W - 8, 8.5);
    const srcLines = clause.fixSource ? wrap(`출처: 문화체육관광부 ${clause.fixSource}`, CONTENT_W - 8, 7.5) : [];

    checkPage(titleLines.length * 5 + 14);
    doc.setFont("NanumGothic", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...dark);
    for (const line of titleLines) { doc.text(line, MARGIN, y); y += 5.5; }
    y += 1;

    const block = (label: string, lines: string[], color: [number, number, number]) => {
      if (lines.length === 0) return;
      checkPage(lines.length * 4.7 + 8);
      doc.setFont("NanumGothic", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...slate);
      doc.text(label, MARGIN, y);
      y += 4.5;
      doc.setFont("NanumGothic", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...color);
      for (const line of lines) { checkPage(6); doc.text(line, MARGIN + 4, y); y += 4.7; }
      y += 2;
    };

    block("[내 계약서]", origLines, body);
    block("[표준계약서와 다른 점]", probLines, body);
    block("[표준계약서 원문]", stdLines, green);
    if (srcLines.length > 0) {
      doc.setFont("NanumGothic", "italic");
      doc.setFontSize(7.5);
      doc.setTextColor(...slate);
      for (const line of srcLines) { checkPage(5); doc.text(line, MARGIN + 4, y); y += 4.2; }
    }
    y += 5;
  });

  /* ── 4. Related precedents ── */
  sectionHeader("관련 판례 (참고 정보)");
  const queries = (result.precedentQueries ?? []).filter(Boolean).slice(0, 2);
  let lawRefs: LawPrecedentRef[] = [];
  let fallbackRefs: PrecedentRef[] = [];
  for (const q of queries) {
    if (lawRefs.length >= 5) break;
    const found = await fetchLawPrecedents(q, 5 - lawRefs.length);
    lawRefs = lawRefs.concat(found.filter((f) => !lawRefs.some((e) => e.externalId === f.externalId)));
  }
  if (lawRefs.length === 0 && queries.length > 0) {
    fallbackRefs = await fetchPrecedentTitles(queries[0], 5);
  }

  if (lawRefs.length > 0) {
    paragraph(`검색 기준: ${queries.join(", ")} · 출처: 법제처 국가법령정보센터`, 8, slate);
    y += 2;
    for (const r of lawRefs) {
      const head = [r.court, r.caseNo, r.date ? `선고 ${r.date}` : null].filter(Boolean).join(" · ");
      const titleLines = wrap(r.title, CONTENT_W - 4, 9);
      checkPage(titleLines.length * 5 + 14);
      doc.setFont("NanumGothic", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...dark);
      for (const line of titleLines) { doc.text(line, MARGIN, y); y += 5; }
      doc.setFont("NanumGothic", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...slate);
      if (head) { doc.text(head, MARGIN, y); y += 4.5; }
      doc.setTextColor(29, 78, 216);
      // ?scan= ties the link to this purchased report: the package owner can
      // open it even after the 24h precedent pass expires (see precedents/view).
      doc.text(`원문 보기: https://getredlineai.com/api/precedents/view?id=${r.externalId}&scan=${scan.id}`, MARGIN, y);
      y += 8;
    }
  } else if (fallbackRefs.length > 0) {
    paragraph(`검색 기준: ${queries.join(", ")} · 출처: 한국저작권위원회 판례 DB`, 8, slate);
    y += 2;
    for (const r of fallbackRefs) {
      const titleLines = wrap(`${r.court ? `[${r.court}] ` : ""}${r.title}`, CONTENT_W - 4, 9);
      checkPage(titleLines.length * 5 + 10);
      doc.setFont("NanumGothic", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...dark);
      for (const line of titleLines) { doc.text(line, MARGIN, y); y += 5; }
      doc.setFont("NanumGothic", "normal");
      doc.setFontSize(8);
      doc.setTextColor(29, 78, 216);
      doc.text(`원문 보기: ${r.url}`, MARGIN, y);
      y += 8;
    }
  } else {
    paragraph("검색 조건에 해당하는 판례 정보를 가져오지 못했습니다. 리포트 화면의 판례 검색에서 다시 확인할 수 있습니다.");
  }
  y += 4;

  /* ── 5. Vendor risk scan result ── */
  sectionHeader("사업체 리스크 검색 결과 (참고 정보)");
  // Only a vendor search run AFTER this contract was uploaded is included —
  // an older search for an unrelated company must not leak into this report.
  const { data: vendorScan } = await service
    .from("vendor_scans")
    .select("vendor_name, overall_score, overview, created_at")
    .eq("user_id", userId)
    .gte("created_at", scan.created_at)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (vendorScan) {
    const rows: [string, string][] = [
      ["검색 대상", vendorScan.vendor_name],
      ["리스크 등급", RISK_LEVEL_KO[vendorScan.overall_score] ?? vendorScan.overall_score],
      ["검색일", String(vendorScan.created_at).slice(0, 10)],
    ];
    for (const [k, v] of rows) {
      checkPage(8);
      doc.setFont("NanumGothic", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...dark);
      doc.text(k, MARGIN, y);
      doc.setFont("NanumGothic", "normal");
      doc.setTextColor(...body);
      doc.text(wrap(v, CONTENT_W - 40, 9), MARGIN + 36, y);
      y += 6;
    }
    y += 2;
    paragraph(vendorScan.overview ?? "", 8.5);
  } else {
    paragraph("이 계정에서 실행한 사업체 리스크 검색 기록이 없습니다. 대시보드의 '공급업체 리스크 스캔'에서 상대 업체명을 검색하면 결과가 이 리포트에 포함됩니다.");
  }

  /* ── 6. Disclaimer (fixed, last page) ── */
  doc.addPage();
  y = MARGIN;
  sectionHeader("고지");
  paragraph(DISCLAIMER, 10);

  /* ── Footer on every page ── */
  const pageCount = doc.getNumberOfPages();
  for (let p = 1; p <= pageCount; p++) {
    doc.setPage(p);
    if (p === 1) continue; // cover has its own layout
    doc.setDrawColor(200, 210, 225);
    doc.setLineWidth(0.3);
    doc.line(MARGIN, FOOTER_Y - 4, PAGE_W - MARGIN, FOOTER_Y - 4);
    doc.setFont("NanumGothic", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...slate);
    doc.text("레드라인AI · getredlineai.com — 사실 정보 제공물이며 법률 자문이 아닙니다", MARGIN, FOOTER_Y);
    doc.text(`${p} / ${pageCount}`, PAGE_W - MARGIN, FOOTER_Y, { align: "right" });
  }

  return Buffer.from(doc.output("arraybuffer"));
}
