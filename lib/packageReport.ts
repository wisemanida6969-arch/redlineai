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
  missingArticles?: { articleNo: number; title: string; text: string }[];
  standardInfo?: { typeId: string; typeKo: string; categoryKo: string } | null;
}

const SEVERITY_KO: Record<string, string> = {
  high: "표준과 큰 차이",
  medium: "표준과 다소 차이",
  low: "표준과 경미한 차이",
};

export const REPORT_DISCLAIMER =
  "본 리포트는 법률 자문이 아니며, 문화체육관광부 표준계약서와의 객관적 차이 및 공개된 판례 정보를 정리한 사실 정보 제공물입니다. 법적 판단이 필요한 사안은 변호사와 상담하시기 바랍니다.";

const DISCLAIMER = REPORT_DISCLAIMER;

/*
 * Clause-topic → canonical short search keywords for the 법제처 precedent API.
 * The API is keyword-matching: long natural-language queries return totalCnt 0
 * (measured), while these short terms return real case pools (측정치: 위약금
 * 1,320건 · 수익분배 1,599건 · 2차적저작물작성권 40건 · 연재계약 13건 등).
 * Because each keyword is a precise legal term, every hit necessarily concerns
 * that topic — precision comes from the query itself, not post-filtering
 * (case titles are often generic like "손해배상(기)", so title-token filters
 * wrongly discard relevant cases).
 */
const TOPIC_SEARCH_KEYWORDS: [RegExp, string[]][] = [
  // Order matters: more specific topics first (a 지체상금 clause often also
  // mentions 원고료, and must land on 위약금 — not the payment keyword).
  // Each topic lists queries in PRIORITY order: domain-scoped first, generic
  // fallback last — generic terms alone pull in tax/administrative cases
  // (교육세부과처분취소 등), which the case-type filter then also guards against.
  [/2\s*차적\s*저작물/, ["2차적저작물작성권"]],
  [/위약금|지체상금/, ["저작물 이용계약 위약금", "계약금 위약금", "위약금 감액"]],
  [/저작인격권|성명표시|동일성/, ["저작인격권"]],
  [/저작권.{0,6}(귀속|양도)|(귀속|양도).{0,6}저작권/, ["저작권 양도"]],
  [/이용허락|이용 범위/, ["저작물 이용허락", "이용허락"]],
  [/정산|수익|분배/, ["저작권 수익분배", "저작물 수익배분", "수익분배"]],
  [/손해배상/, ["저작권 손해배상", "손해배상 예정액"]],
  [/전속|경업/, ["전속계약"]],
  [/출연료|출연/, ["출연료"]],
  [/원고료|연재|휴재/, ["원고료", "연재계약"]],
];

/**
 * Domain gate for search hits. Generic keywords (수익분배, 위약금 …) also
 * match tax/administrative/enforcement cases — those are never relevant to a
 * creative-work contract comparison, whatever the keyword said.
 */
export function isContractDomainCase(ref: { title: string; caseType: string | null }): boolean {
  if (ref.caseType && /세무|행정|조세|헌법|가사|선거/.test(ref.caseType)) return false;
  if (/부과처분|과세|세금|교육세|재산세|양도소득|종합소득|부가가치세|배당이의|공탁|경매|추심|압류|강제집행|보전처분/.test(ref.title)) return false;
  return true;
}

export interface PrecedentTopicPlan {
  /** Queries in priority order — first one that yields domain-relevant hits wins. */
  queries: string[];
  /** Clause titles this topic came from, most severe first. */
  clauseTitles: string[];
}

/** Per-clause topic plan: one entry per matched topic (not per query). */
export function buildPrecedentSearchPlan(
  clauses: { title: string; problem: string }[],
): PrecedentTopicPlan[] {
  const byTopic = new Map<number, string[]>();
  for (const clause of clauses) {
    const hay = `${clause.title} ${clause.problem}`;
    for (let i = 0; i < TOPIC_SEARCH_KEYWORDS.length; i++) {
      if (!TOPIC_SEARCH_KEYWORDS[i][0].test(hay)) continue;
      const arr = byTopic.get(i) ?? [];
      if (!arr.includes(clause.title)) arr.push(clause.title);
      byTopic.set(i, arr);
      break; // first matching topic per clause
    }
  }
  return Array.from(byTopic.entries()).map(([i, titles]) => ({
    queries: TOPIC_SEARCH_KEYWORDS[i][1],
    clauseTitles: titles,
  }));
}

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
  // Missing articles come from the dedicated whole-contract detection pass;
  // legacy scans (no missingArticles field) fall back to the old byproduct count.
  const missingArticles = result.missingArticles ?? null;
  const missingCount = missingArticles
    ? missingArticles.length
    : clauses.filter((c) => !c.original || !c.original.trim()).length;
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
    // When no article numbering was detected, the row is simply omitted —
    // the flagged-item count below already says what was found.
    ...(result.articleCount ? [["계약서 내 조항 수", `${result.articleCount}개`] as [string, string]] : []),
    ["표준계약서와 다른 것으로 표시된 조항", `${clauses.length}개 (큰 차이 ${result.high?.length ?? 0} · 다소 차이 ${result.medium?.length ?? 0} · 경미한 차이 ${result.low?.length ?? 0})`],
    ["표준계약서에 존재하나 본 계약서에서 확인되지 않은 조항", `${missingCount}개`],
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
  y += 3;
  paragraph("* '큰 차이/다소 차이/경미한 차이'는 문화체육관광부 표준계약서와의 문언상 차이 정도를 나타내는 표시이며, 법적 평가나 위험도 판단이 아닙니다.", 7.5, slate);
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

  /* ── 3b. Standard articles with no corresponding content ── */
  if (missingArticles && missingArticles.length > 0) {
    sectionHeader("표준계약서에 있으나 본 계약서에서 확인되지 않은 조항");
    for (const ma of missingArticles) {
      const head = `표준계약서 제${ma.articleNo}조(${ma.title})에 해당하는 내용이 본 계약서에서 확인되지 않았습니다.`;
      const headLines = wrap(head, CONTENT_W, 9);
      checkPage(headLines.length * 5 + 10);
      doc.setFont("NanumGothic", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...dark);
      for (const line of headLines) { doc.text(line, MARGIN, y); y += 5; }
      y += 1;
      doc.setFont("NanumGothic", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...green);
      for (const line of wrap(ma.text, CONTENT_W - 8, 8.5)) { checkPage(6); doc.text(line, MARGIN + 4, y); y += 4.7; }
      if (result.standardInfo) {
        doc.setFont("NanumGothic", "italic");
        doc.setFontSize(7.5);
        doc.setTextColor(...slate);
        checkPage(5);
        doc.text(`출처: 문화체육관광부 ${result.standardInfo.typeKo} 표준계약서 제${ma.articleNo}조`, MARGIN + 4, y);
        y += 4.2;
      }
      y += 4;
    }
    y += 2;
  }

  /* ── 4. Related precedents ── */
  sectionHeader("관련 판례 (참고 정보)");
  // Per-clause topic plan (see TOPIC_SEARCH_KEYWORDS). AI-generated queries
  // are only a fallback, and only short ones — long natural-language queries
  // return zero results from the keyword-matching API.
  const topics = buildPrecedentSearchPlan(clauses).slice(0, 4);
  if (topics.length === 0) {
    for (const q of (result.precedentQueries ?? []).filter(Boolean)) {
      if (q.split(/\s+/).length <= 2) topics.push({ queries: [q], clauseTitles: [] });
      if (topics.length >= 3) break;
    }
  }

  const lawRefs: (LawPrecedentRef & { matchedQuery: string; relatedClauses: string[] })[] = [];
  let fallbackRefs: (PrecedentRef & { matchedQuery: string; relatedClauses: string[] })[] = [];
  const usedKeywords: string[] = [];
  // Per topic: try queries in priority order (domain-scoped first), keep the
  // first one that yields domain-relevant cases. Up to 3 cases per topic,
  // 8 total — so one prolific topic can't crowd out the rest. Each case shows
  // at most the 2 most severe related clauses.
  for (const topic of topics) {
    if (lawRefs.length >= 8) break;
    for (const q of topic.queries) {
      const found = (await fetchLawPrecedents(q, 10))
        .filter(isContractDomainCase)
        .filter((f) => !lawRefs.some((e) => e.externalId === f.externalId));
      if (found.length === 0) continue;
      usedKeywords.push(q);
      for (const f of found.slice(0, 3)) {
        if (lawRefs.length >= 8) break;
        lawRefs.push({ ...f, matchedQuery: q, relatedClauses: topic.clauseTitles.slice(0, 2) });
      }
      break; // first productive query for this topic
    }
  }
  if (lawRefs.length === 0 && topics.length > 0) {
    const fbQuery = topics[0].queries[topics[0].queries.length - 1];
    const fb = await fetchPrecedentTitles(fbQuery, 5);
    fallbackRefs = fb
      .filter((f) => isContractDomainCase({ title: f.title, caseType: null }))
      .map((f) => ({ ...f, matchedQuery: fbQuery, relatedClauses: topics[0].clauseTitles.slice(0, 2) }));
    if (fallbackRefs.length > 0) usedKeywords.push(fbQuery);
  }
  const keywords = usedKeywords;

  const relatedLine = (r: { matchedQuery: string; relatedClauses: string[] }) =>
    r.relatedClauses.length > 0
      ? `관련 조항: ${r.relatedClauses.join(", ")} · 검색어: ${r.matchedQuery}`
      : `검색어: ${r.matchedQuery}`;

  if (lawRefs.length > 0) {
    paragraph(`검색 키워드: ${keywords.join(", ")} · 출처: 법제처 국가법령정보센터`, 8, slate);
    y += 2;
    for (const r of lawRefs) {
      const head = [r.court, r.caseNo, r.date ? `선고 ${r.date}` : null].filter(Boolean).join(" · ");
      const titleLines = wrap(r.title, CONTENT_W - 4, 9);
      const relLines = wrap(relatedLine(r), CONTENT_W - 4, 8);
      checkPage(titleLines.length * 5 + relLines.length * 4.5 + 14);
      doc.setFont("NanumGothic", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...dark);
      for (const line of titleLines) { doc.text(line, MARGIN, y); y += 5; }
      doc.setFont("NanumGothic", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...slate);
      if (head) { doc.text(head, MARGIN, y); y += 4.5; }
      for (const line of relLines) { doc.text(line, MARGIN, y); y += 4.5; }
      doc.setTextColor(29, 78, 216);
      // ?scan= ties the link to this purchased report: the package owner can
      // open it even after the 24h precedent pass expires (see precedents/view).
      doc.text(`원문 보기: https://getredlineai.com/api/precedents/view?id=${r.externalId}&scan=${scan.id}`, MARGIN, y);
      y += 8;
    }
  } else if (fallbackRefs.length > 0) {
    paragraph(`검색 키워드: ${keywords.join(", ")} · 출처: 한국저작권위원회 판례 DB`, 8, slate);
    y += 2;
    for (const r of fallbackRefs) {
      const titleLines = wrap(`${r.court ? `[${r.court}] ` : ""}${r.title}`, CONTENT_W - 4, 9);
      const relLines = wrap(relatedLine(r), CONTENT_W - 4, 8);
      checkPage(titleLines.length * 5 + relLines.length * 4.5 + 10);
      doc.setFont("NanumGothic", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...dark);
      for (const line of titleLines) { doc.text(line, MARGIN, y); y += 5; }
      doc.setFont("NanumGothic", "normal");
      doc.setFontSize(8);
      doc.setTextColor(...slate);
      for (const line of relLines) { doc.text(line, MARGIN, y); y += 4.5; }
      doc.setTextColor(29, 78, 216);
      doc.text(`원문 보기: ${r.url}`, MARGIN, y);
      y += 8;
    }
  } else {
    paragraph("관련 판례가 검색되지 않았습니다.");
  }
  y += 4;

  /* ── 5. Vendor public info ── */
  sectionHeader("사업체 공개 정보 (참고 정보)");
  // Only a vendor search run AFTER this contract was uploaded is included —
  // an older search for an unrelated company must not leak into this report.
  const { data: vendorScan } = await service
    .from("vendor_scans")
    .select("vendor_name, overview, result, created_at")
    .eq("user_id", userId)
    .gte("created_at", scan.created_at)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (vendorScan) {
    const rows: [string, string][] = [
      ["검색 대상", vendorScan.vendor_name],
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
    const publicInfo = (vendorScan.result as { publicInfo?: string[] } | null)?.publicInfo ?? [];
    for (const fact of publicInfo) {
      for (const line of wrap(`• ${fact}`, CONTENT_W - 4, 8.5)) { checkPage(6); doc.setFont("NanumGothic", "normal"); doc.setFontSize(8.5); doc.setTextColor(...body); doc.text(line, MARGIN, y); y += 4.7; }
    }
    if (publicInfo.length > 0) y += 2;
    paragraph(vendorScan.overview ?? "", 8.5);
  } else {
    paragraph("이 계정에서 실행한 사업체 공개 정보 검색 기록이 없습니다. 대시보드의 '공급업체 리스크 스캔'에서 상대 업체명을 검색하면 결과가 이 리포트에 포함됩니다.");
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
