/* ------------------------------------------------------------------ */
/*  Embeds a Korean-capable font (Nanum Gothic, SIL OFL) into a jsPDF   */
/*  document. jsPDF's built-in fonts (helvetica/times/courier) only     */
/*  support Latin/WinAnsi glyphs — without this, any Korean text comes  */
/*  out as mis-encoded garbage. Only one weight is bundled, so bold/    */
/*  italic requests reuse the same regular-weight outlines rather than  */
/*  falling back to a font that can't render Hangul at all.             */
/* ------------------------------------------------------------------ */

let cachedBase64: string | null = null;

async function loadFontBase64(): Promise<string> {
  if (cachedBase64) return cachedBase64;
  const res = await fetch("/fonts/NanumGothic-Regular.ttf");
  const buffer = await res.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode.apply(null, Array.from(bytes.subarray(i, i + chunkSize)));
  }
  cachedBase64 = btoa(binary);
  return cachedBase64;
}

/** Call once per jsPDF document, right after construction, before any doc.text() calls. */
export async function loadKoreanFont(doc: {
  addFileToVFS: (path: string, data: string) => void;
  addFont: (path: string, name: string, style: string) => void;
}): Promise<void> {
  const base64 = await loadFontBase64();
  doc.addFileToVFS("NanumGothic-Regular.ttf", base64);
  for (const style of ["normal", "bold", "italic", "bolditalic"]) {
    doc.addFont("NanumGothic-Regular.ttf", "NanumGothic", style);
  }
}
