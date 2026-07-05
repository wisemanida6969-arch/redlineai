import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/dashboard";

  if (code) {
    const supabase = createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      const host = request.headers.get("host") || "localhost:8080";
      const isLocal = host.includes("localhost");
      const protocol = isLocal ? "http" : "https";
      const baseUrl = `${protocol}://${host}`;

      // A brand-new account's first session is created at (essentially) the same
      // instant as the account itself — existing users logging in again will have
      // a created_at far earlier than this sign-in. Used to fire GA4 "sign_up"
      // exactly once, only for real signups, from the client (see dashboard page).
      const user = data.user;
      const isNewSignup = !!(
        user?.created_at &&
        user?.last_sign_in_at &&
        Math.abs(new Date(user.last_sign_in_at).getTime() - new Date(user.created_at).getTime()) < 10000
      );

      const redirectUrl = new URL(`${baseUrl}${next}`);
      if (isNewSignup) redirectUrl.searchParams.set("new_signup", "1");
      return NextResponse.redirect(redirectUrl);
    }
  }

  const host = request.headers.get("host") || "localhost:8080";
  const isLocal = host.includes("localhost");
  const protocol = isLocal ? "http" : "https";
  const baseUrl = `${protocol}://${host}`;
  return NextResponse.redirect(`${baseUrl}/auth/login?error=auth_failed`);
}
