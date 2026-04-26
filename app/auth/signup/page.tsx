"use client";
import { useState } from "react";
import Link from "next/link";
import { Shield, Mail, Lock, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return setError("Password must be at least 6 characters.");
    setLoading(true);
    setError("");

    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    } else {
      setDone(true);
    }
  };

  if (done) {
    return (
      <div className="min-h-screen bg-[#0f1a2e] flex items-center justify-center px-4">
        <div className="w-full max-w-md text-center">
          <div className="w-16 h-16 bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-8 h-8 text-green-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-slate-400 text-sm mb-6">
            We sent a confirmation link to <span className="text-white font-medium">{email}</span>.
            <br />Click it to activate your account.
          </p>
          <Link href="/auth/login" className="text-red-400 hover:text-red-300 text-sm font-medium">
            Back to sign in →
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0f1a2e] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="flex items-center justify-center gap-2 mb-8">
          <Shield className="w-6 h-6 text-red-500" />
          <span className="text-2xl font-bold text-white">
            Redline<span className="text-red-500">AI</span>
          </span>
        </Link>

        <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-8">
          <h1 className="text-2xl font-bold text-white mb-1">Create your account</h1>
          <p className="text-slate-400 text-sm mb-2">Get 3 free contract scans per month</p>
          <div className="flex items-center gap-4 text-xs text-slate-500 mb-6">
            <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-400" /> No credit card</span>
            <span className="flex items-center gap-1"><CheckCircle className="w-3.5 h-3.5 text-green-400" /> 3 free scans/month</span>
          </div>

          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-slate-300 text-sm font-medium block mb-1.5">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className="w-full bg-[#0f1a2e] border border-[#1e3050] rounded-xl pl-10 pr-4 py-3 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-red-700/50 focus:ring-1 focus:ring-red-900/30"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-300 text-sm font-medium block mb-1.5">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Min. 6 characters"
                  required
                  className="w-full bg-[#0f1a2e] border border-[#1e3050] rounded-xl pl-10 pr-4 py-3 text-slate-200 placeholder-slate-500 text-sm focus:outline-none focus:border-red-700/50 focus:ring-1 focus:ring-red-900/30"
                />
              </div>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-red-400 text-sm bg-red-900/20 border border-red-800/50 rounded-xl px-4 py-3">
                <AlertCircle className="w-4 h-4 shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-900/50 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2"
            >
              {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating account…</> : "Create free account"}
            </button>
          </form>

          <p className="text-slate-500 text-sm text-center mt-6">
            Already have an account?{" "}
            <Link href="/auth/login" className="text-red-400 hover:text-red-300 font-medium">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
