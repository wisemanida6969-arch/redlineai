/* ------------------------------------------------------------------ */
/*  구형 바이너리 HWP(v5, 97~2018) 텍스트 추출                          */
/*                                                                     */
/*  hwp5txt(pyhwp) 콘솔 스크립트를 서브프로세스로 호출한다. 한글과컴퓨터가  */
/*  공개한 HWP Binary Specification 1.1 기반의 파서라 신뢰도가 높다.      */
/*  Railway 빌드(nixpacks.toml)에서 python3 + pyhwp를 설치해 둔다.        */
/*                                                                     */
/*  실패(미설치·타임아웃·파싱 실패)해도 절대 throw하지 않고 ""를 반환한다  */
/*  — 호출부는 빈 문자열을 받으면 기존 "붙여넣기 안내" 메시지로 폴백한다.  */
/* ------------------------------------------------------------------ */

import { spawn } from "child_process";
import { writeFile, unlink } from "fs/promises";
import { tmpdir } from "os";
import path from "path";

function runHwp5txt(filePath: string): Promise<string> {
  return new Promise((resolve) => {
    const child = spawn("hwp5txt", [filePath], { timeout: 15000 });
    let out = "";
    let settled = false;
    const finish = (result: string) => { if (!settled) { settled = true; resolve(result); } };

    child.stdout.on("data", (d) => { out += d.toString("utf-8"); });
    child.on("error", () => finish(""));           // binary not found / spawn failure
    child.on("close", (code) => finish(code === 0 ? out : ""));
  });
}

/** Extract plain text from an old-format binary .hwp buffer. Returns "" on any failure. */
export async function extractTextFromHwpBinary(buffer: Buffer): Promise<string> {
  const tmpPath = path.join(tmpdir(), `redlineai-hwp-${Date.now()}-${Math.floor(Math.random() * 1e6)}.hwp`);
  try {
    await writeFile(tmpPath, buffer);
    const text = await runHwp5txt(tmpPath);
    return text.trim();
  } catch {
    return "";
  } finally {
    unlink(tmpPath).catch(() => {});
  }
}
