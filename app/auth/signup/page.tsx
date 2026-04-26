"use client";
import { useState } from "react";
import Link from "next/link";
import { Shield, Loader2, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
    });
    if (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f1a2e] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Shield className="w-6 h-6 text-red-500" />
          <span className="text-2xl font-bold text-white">
            Redline<span className="text-red-500">AI</span>
          </span>
        </Link>

        <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-slate-400 text-sm mb-3">Get 3 free contract scans per month</p>

          <div className="flex items-center gap-4 text-xs text-slate-500 mb-8">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" /> No credit card
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" /> 3 free scans/month
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-green-400" /> Cancel anytime
            </span>
          </div>

          {error && (
            <div className="mb-4 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 bg-white hover:bg-gray-100 disabled:bg-gray-200 text-gray-800 font-semibold py-3 rounded-xl transition-colors"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin text-gray-600" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
            )}
            {loading ? "Signing up…" : "Sign up with Google"}
          </button>

          <p className="text-slate-500 text-sm text-center mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-red-400 hover:text-red-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>

        <div className="mt-6 text-center space-y-2">
          <p className="text-slate-600 text-xs">
            By signing up, you agree to our{" "}
            <Link href="/terms" className="text-slate-500 hover:text-slate-400 underline">Terms of Service</Link>
            {" "}and{" "}
            <Link href="/privacy" className="text-slate-500 hover:text-slate-400 underline">Privacy Policy</Link>
          </p>
          <div className="flex items-center justify-center gap-4 text-xs text-slate-600">
            <Link href="/terms" className="hover:text-slate-400">Terms of Service</Link>
            <span>·</span>
            <Link href="/privacy" className="hover:text-slate-400">Privacy Policy</Link>
            <span>·</span>
            <Link href="/refund" className="hover:text-slate-400">Refund Policy</Link>
          </div>
          <p className="text-slate-700 text-xs">Operated by Trytimeback</p>
        </div>
      </div>
    </div>
  );
}
