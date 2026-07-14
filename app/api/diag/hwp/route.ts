import { NextResponse } from "next/server";
import { spawn } from "child_process";

/**
 * Diagnostic: checks whether hwp5txt (pyhwp) actually installed and is on
 * PATH in the live container. Safe to remove after use.
 */
export const dynamic = "force-dynamic";

function run(cmd: string, args: string[], timeout = 10000): Promise<{ code: number | null; out: string; err: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { timeout });
    let out = "";
    let err = "";
    child.stdout?.on("data", (d) => { out += d.toString("utf-8"); });
    child.stderr?.on("data", (d) => { err += d.toString("utf-8"); });
    child.on("error", (e) => resolve({ code: -1, out, err: err + " " + e.message }));
    child.on("close", (code) => resolve({ code, out, err }));
  });
}

export async function GET() {
  const [which, version, pipShow, pythonVersion, pipVersion, pip3Version, whichPip, lsBin] = await Promise.all([
    run("which", ["hwp5txt"]),
    run("hwp5txt", ["--version"]),
    run("python3", ["-m", "pip", "show", "pyhwp"]),
    run("python3", ["--version"]),
    run("pip", ["--version"]),
    run("pip3", ["--version"]),
    run("sh", ["-c", "which pip; which pip3; which pip3.11"]),
    run("sh", ["-c", "ls /root/.nix-profile/bin | grep -i pip"]),
  ]);

  const venvHwp5txt = await run("/app/.venv-hwp/bin/hwp5txt", ["--version"]);
  const venvLs = await run("sh", ["-c", "ls -la /app/.venv-hwp/bin 2>&1 || echo NO_VENV"]);

  return NextResponse.json({
    which,
    version,
    pipShow,
    pythonVersion,
    pipVersion,
    pip3Version,
    whichPip,
    lsBin,
    venvHwp5txt,
    venvLs,
    PATH: process.env.PATH,
  }, { headers: { "Cache-Control": "no-store, no-cache, must-revalidate", "x-diag-marker": "v4" } });
}
