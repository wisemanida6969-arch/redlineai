import Link from "next/link";
import { Mail, Shield } from "lucide-react";

export default function AppFooter() {
  return (
    <footer className="border-t border-[#1e3050] mt-16 py-8 px-6">
      <div className="max-w-6xl mx-auto flex flex-col items-center gap-3 text-center">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-red-500" />
          <span className="text-white font-bold text-sm">RedlineAI</span>
        </div>

        <a
          href="mailto:admin@trytimeback.com"
          className="flex items-center gap-1.5 text-slate-400 hover:text-white text-sm transition-colors"
        >
          <Mail className="w-3.5 h-3.5" />
          문의: <span className="text-red-400">admin@trytimeback.com</span>
        </a>

        <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 text-xs text-slate-500">
          <Link href="/terms"   className="hover:text-slate-300 transition-colors">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
          <Link href="/refund"  className="hover:text-slate-300 transition-colors">Refund Policy</Link>
        </div>

        <p className="text-slate-600 text-xs">© 2026 RedlineAI. Operated by Trytimeback.</p>
      </div>
    </footer>
  );
}
