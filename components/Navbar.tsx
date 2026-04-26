"use client";
import Link from "next/link";
import { Shield } from "lucide-react";

export default function Navbar() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 border-b border-[#1e3050] bg-[#0f1a2e]/90 backdrop-blur-sm">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2">
          <Shield className="w-6 h-6 text-red-500" />
          <span className="text-xl font-bold text-white">
            Redline<span className="text-red-500">AI</span>
          </span>
        </Link>
        <div className="flex items-center gap-6">
          <Link href="#pricing" className="text-slate-400 hover:text-white text-sm transition-colors">
            Pricing
          </Link>
          <Link href="/dashboard" className="bg-red-600 hover:bg-red-700 text-white text-sm font-medium px-4 py-2 rounded-lg transition-colors">
            Try Free
          </Link>
        </div>
      </div>
    </nav>
  );
}
