import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const host = request.headers.get("host") || "localhost:8080";
      const isLocal = host.includes("localhost");
      const protocol = isLocal ? "http" : "https";
      const baseUrl = `${protocol}://${host}`;
      return NextResponse.redirect(`${baseUrl}${next}`);
    }
  }

  const host = request.headers.get("host") || "localhost:8080";
  const isLocal = host.includes("localhost");
  const protocol = isLocal ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;
  return NextResponse.redirect(`${baseUrl}/auth/login?error=auth_failed`);
}
