"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Shield, ChevronDown, LogOut, LayoutDashboard, Menu, X, BookOpen } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import type { User } from "@supabase/supabase-js";

export default function Navbar() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => setUser(data.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    setMobileOpen(false);
    router.push("/");
    router.refresh();
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e3050] bg-[#0f1a2e]/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        {/* Logo — always visible */}
        <Link href="/" className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-red-500" />
          <span className="text-xl font-bold text-white">
            Redline<span className="text-red-500">AI</span>
          </span>
        </Link>

        {/* Desktop nav */}
        <div className="flex items-center gap-4">
          <Link href="/help" className="text-slate-400 hover:text-white text-sm transition-colors hidden sm:block">
            Help
          </Link>
          <Link href="/#pricing" className="text-slate-400 hover:text-white text-sm transition-colors hidden sm:block">
            Pricing
          </Link>

          {user ? (
            <div className="relative hidden sm:block" ref={menuRef}>
              <button
                onClick={() => setMenuOpen((v) => !v)}
                className="flex items-center gap-2 bg-[#162035] border border-[#1e3050] hover:border-slate-500 text-slate-300 px-3 py-2 rounded-xl text-sm transition-colors"
              >
                <div className="w-6 h-6 bg-red-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                  {user.email?.[0].toUpperCase()}
                </div>
                <span className="hidden sm:block max-w-[120px] truncate">{user.email}</span>
                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${menuOpen ? "rotate-180" : ""}`} />
              </button>

              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-[#162035] border border-[#1e3050] rounded-xl shadow-2xl overflow-hidden z-50">
                  <Link
                    href="/dashboard"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-[#1e3050] hover:text-white transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link
                    href="/help"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-2 px-4 py-3 text-sm text-slate-300 hover:bg-[#1e3050] hover:text-white transition-colors"
                  >
                    <BookOpen className="w-4 h-4" /> Help & Guide
                  </Link>
                  <div className="h-px bg-[#1e3050]" />
                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2 px-4 py-3 text-sm text-red-400 hover:bg-red-900/20 transition-colors"
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link href="/auth/login" className="text-slate-400 hover:text-white text-sm transition-colors px-3 py-2">
                Sign in
              </Link>
              <Link href="/auth/signup" className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
                Try Free
              </Link>
            </div>
          )}

          {/* Hamburger — mobile only */}
          <button
            className="sm:hidden flex items-center justify-center w-9 h-9 text-slate-400 hover:text-white transition-colors"
            onClick={() => setMobileOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile slide-down menu */}
      {mobileOpen && (
        <div className="sm:hidden border-t border-[#1e3050] bg-[#0f1a2e]/95 backdrop-blur-sm">
          <div className="px-6 py-4 space-y-1">
            <Link
              href="/help"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-[#162035] rounded-lg transition-colors"
            >
              <BookOpen className="w-4 h-4" /> Help & Guide
            </Link>
            <Link
              href="/#pricing"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-[#162035] rounded-lg transition-colors"
            >
              Pricing
            </Link>

            {user ? (
              <>
                <Link
                  href="/dashboard"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-[#162035] rounded-lg transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4" /> Dashboard
                </Link>
                <div className="h-px bg-[#1e3050] my-1" />
                <button
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2 px-3 py-2.5 text-sm text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                >
                  <LogOut className="w-4 h-4" /> Sign out
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center gap-2 px-3 py-2.5 text-sm text-slate-300 hover:text-white hover:bg-[#162035] rounded-lg transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/auth/signup"
                  onClick={() => setMobileOpen(false)}
                  className="flex items-center justify-center gap-2 px-3 py-2.5 text-sm font-medium bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors"
                >
                  Try Free
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
