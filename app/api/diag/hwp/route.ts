import { NextResponse } from "next/server";
import { spawn } from "child_process";

/**
 * Diagnostic: checks whether hwp5txt (pyhwp) actually installed and is on
 * PATH in the live container. Safe to remove after use.
 */
export const dynamic = "force-dynamic";

function run(cmd: string, args: string[]): Promise<{ code: number | null; out: string; err: string }> {
  return new Promise((resolve) => {
    const child = spawn(cmd, args, { timeout: 10000 });
    let out = "";
    let err = "";
    child.stdout?.on("data", (d) => { out += d.toString("utf-8"); });
    child.stderr?.on("data", (d) => { err += d.toString("utf-8"); });
    child.on("error", (e) => resolve({ code: -1, out, err: err + " " + e.message }));
    child.on("close", (code) => resolve({ code, out, err }));
  });
}

export async function GET() {
  const [which, version, pipShow, pythonVersion] = await Promise.all([
    run("which", ["hwp5txt"]),
    run("hwp5txt", ["--version"]),
    run("python3", ["-m", "pip", "show", "pyhwp"]),
    run("python3", ["--version"]),
  ]);

  return NextResponse.json({
    which,
    version,
    pipShow,
    pythonVersion,
    PATH: process.env.PATH,
  });
}
