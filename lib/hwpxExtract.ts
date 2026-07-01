/* ------------------------------------------------------------------ */
/*  HWPX (신형 한글 XML 포맷) 텍스트 추출                                 */
/*                                                                     */
/*  HWPX(2020~)는 DOCX처럼 ZIP 컨테이너 안에 XML로 내용을 담는다.        */
/*  Contents/section*.xml 안의 텍스트 노드만 뽑아낸다.                   */
/*  구형 바이너리 .hwp(97~2018)는 압축 레코드 구조가 달라 이 방식으로는  */
/*  못 읽는다 — 그건 별도로 명확한 안내 메시지 처리한다.                  */
/* ------------------------------------------------------------------ */

/** True if the buffer looks like a ZIP container (PK\x03\x04 signature) — i.e. HWPX, not old binary HWP. */
export function looksLikeZip(buffer: Buffer): boolean {
  return buffer.length > 4 && buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;
}

function stripTags(xml: string): string {
  return xml
    .replace(/<[^>]+>/g, "\n")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"').replace(/&apos;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/** Extract plain text from an HWPX (.hwpx) file buffer. Returns "" if it doesn't parse as HWPX. */
export async function extractTextFromHwpx(buffer: Buffer): Promise<string> {
  if (!looksLikeZip(buffer)) return "";
  try {
    const JSZip = (await import("jszip")).default;
    const zip = await JSZip.loadAsync(buffer);
    const sectionFiles = Object.keys(zip.files)
      .filter((name) => /^Contents\/section\d+\.xml$/i.test(name))
      .sort();
    if (sectionFiles.length === 0) return "";
    const parts: string[] = [];
    for (const name of sectionFiles) {
      const xml = await zip.files[name].async("string");
      parts.push(stripTags(xml));
    }
    return parts.join("\n\n").trim();
  } catch {
    return "";
  }
}
