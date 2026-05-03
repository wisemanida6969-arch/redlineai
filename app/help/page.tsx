"use client";
import { useState } from "react";
import Link from "next/link";
import Navbar from "@/components/Navbar";
import AppFooter from "@/components/AppFooter";
import {
  FileText, Receipt, Building2, PenTool, ChevronDown, ChevronRight,
  Mail, CheckCircle, Sparkles, Eye, Calendar, Type, Send, Download,
  Search, BookOpen
} from "lucide-react";

type FeatureKey = "analysis" | "quote" | "vendor" | "esign";

export default function HelpPage() {
  const [open, setOpen] = useState<FeatureKey | null>("analysis");

  const features: { id: FeatureKey; label: string; icon: typeof FileText; tagline: string }[] = [
    { id: "analysis", label: "Contract Analysis", icon: FileText, tagline: "Spot risky clauses with AI" },
    { id: "quote",    label: "Quote to Contract", icon: Receipt, tagline: "Turn quotes into contracts instantly" },
    { id: "vendor",   label: "Vendor Risk Scan",  icon: Building2, tagline: "Due-diligence on any company" },
    { id: "esign",    label: "E-Signature",       icon: PenTool, tagline: "Send documents for digital signing" },
  ];

  return (
    <div className="min-h-screen bg-[#0f1a2e]">
      <Navbar />
      <div className="pt-28 pb-20 px-6 max-w-4xl mx-auto">

        {/* Header */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-red-900/30 border border-red-800/50 text-red-400 text-xs px-3 py-1 rounded-full mb-4">
            <BookOpen className="w-3.5 h-3.5" />
            User Guide
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2">How RedlineAI works</h1>
          <p className="text-slate-400">Step-by-step guide for every feature.</p>
        </div>

        {/* Quick links */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {features.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setOpen(id)}
              className={`p-4 rounded-xl border transition-colors text-left ${
                open === id
                  ? "bg-red-900/20 border-red-700/50"
                  : "bg-[#162035] border-[#1e3050] hover:border-slate-500"
              }`}
            >
              <Icon className={`w-5 h-5 mb-2 ${open === id ? "text-red-400" : "text-slate-400"}`} />
              <p className={`text-xs font-medium ${open === id ? "text-white" : "text-slate-300"}`}>{label}</p>
            </button>
          ))}
        </div>

        {/* ── Contract Analysis ── */}
        <Section
          isOpen={open === "analysis"}
          onToggle={() => setOpen(open === "analysis" ? null : "analysis")}
          icon={FileText}
          title="Contract Analysis"
          tagline="Upload a contract → AI flags risky clauses → Export PDF report"
        >
          <Step n={1} title="Open Contract Analysis tab">
            On the Dashboard, click the <strong className="text-white">Contract Analysis</strong> tab.
          </Step>
          <Step n={2} title="Upload your contract or paste text">
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm mt-1">
              <li>📄 <strong className="text-slate-300">Upload File</strong>: drag PDF/DOCX or click to browse (max 20MB)</li>
              <li>📝 <strong className="text-slate-300">Paste Text</strong>: copy and paste raw contract text</li>
              <li>📷 <strong className="text-slate-300">Scanned PDFs</strong>: Claude Vision automatically reads them — no setup needed</li>
            </ul>
          </Step>
          <Step n={3} title="Click 'Analyze Contract'">
            Claude AI analyzes every clause and categorizes issues by severity:
            <div className="grid grid-cols-3 gap-2 mt-2">
              <Badge color="red" label="HIGH" desc="Dangerous, one-sided" />
              <Badge color="yellow" label="MEDIUM" desc="Vague, unclear" />
              <Badge color="blue" label="LOW" desc="Minor improvements" />
            </div>
          </Step>
          <Step n={4} title="Review the report">
            Each flagged clause includes:
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm mt-1">
              <li><strong className="text-slate-300">Original quote</strong> from the contract</li>
              <li><strong className="text-slate-300">Why it&apos;s risky</strong> in plain language</li>
              <li><strong className="text-slate-300">Suggested fix</strong> — copy-paste ready</li>
            </ul>
          </Step>
          <Step n={5} title="Export the report" icon={Download}>
            Click <strong className="text-white">Download Report</strong> → choose <strong>PDF</strong> or <strong>Word</strong>. Share with your team or lawyer.
          </Step>
          <Step n={6} title="Re-open past scans" icon={Eye}>
            All your past scans appear in <strong className="text-white">Recent Scans</strong> at the bottom. Click any item to re-open the full report.
          </Step>
        </Section>

        {/* ── Quote to Contract ── */}
        <Section
          isOpen={open === "quote"}
          onToggle={() => setOpen(open === "quote" ? null : "quote")}
          icon={Receipt}
          title="Quote to Contract"
          tagline="Upload a quote → AI extracts terms → Auto-generates service agreement"
        >
          <Step n={1} title="Open Quote to Contract tab">
            Click the <strong className="text-white">Quote to Contract</strong> tab.
            <p className="text-yellow-400 text-xs mt-1">⚠️ Pro plan and above (locked on Free plan)</p>
          </Step>
          <Step n={2} title="Upload a quote or proposal">
            Drag a PDF or DOCX with quote details — parties, services, pricing, schedule.
          </Step>
          <Step n={3} title="Click 'Generate Contract'">
            AI extracts these fields automatically:
            <div className="bg-[#0f1a2e] rounded-lg p-3 mt-2 text-xs text-slate-400 space-y-1">
              <p>• Provider & Client info (name, contact, address)</p>
              <p>• Service description / scope of work</p>
              <p>• Total amount + payment terms</p>
              <p>• Delivery date / contract duration</p>
              <p>• Additional terms</p>
            </div>
          </Step>
          <Step n={4} title="Review & edit extracted terms">
            All fields are editable. Fix any extraction errors before generating.
          </Step>
          <Step n={5} title="Preview the contract">
            Click <strong className="text-white">Preview Contract</strong> → 11-section service agreement with:
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm mt-1">
              <li>Scope of Work, Payment Terms, Delivery Timeline</li>
              <li>Confidentiality, IP, Termination</li>
              <li>Limitation of Liability, Independent Contractor</li>
              <li>Signature blocks (ready for printing)</li>
            </ul>
          </Step>
          <Step n={6} title="Download as PDF" icon={Download}>
            Click <strong className="text-white">Download PDF</strong> for a styled, ready-to-sign contract.
          </Step>
        </Section>

        {/* ── Vendor Risk Scan ── */}
        <Section
          isOpen={open === "vendor"}
          onToggle={() => setOpen(open === "vendor" ? null : "vendor")}
          icon={Building2}
          title="Vendor Risk Scan"
          tagline="Type a company name → AI searches the web → Generates due-diligence report"
        >
          <Step n={1} title="Open Vendor Risk Scan tab">
            Click the <strong className="text-white">Vendor Risk Scan</strong> tab.
            <p className="text-yellow-400 text-xs mt-1">⚠️ Pro: 10/month · Business: 30/month (locked on Free)</p>
          </Step>
          <Step n={2} title="Enter the vendor name">
            Type any company (e.g., <code className="bg-[#0f1a2e] px-2 py-0.5 rounded text-red-300">Stripe</code>, <code className="bg-[#0f1a2e] px-2 py-0.5 rounded text-red-300">Acme Corp</code>, <code className="bg-[#0f1a2e] px-2 py-0.5 rounded text-red-300">Google</code>).
          </Step>
          <Step n={3} title="Click 'Run Risk Scan'">
            Claude AI uses live web search to investigate (~30–60 seconds):
            <div className="grid grid-cols-2 gap-2 mt-2">
              <InfoCard icon={Search} label="News & Reputation" />
              <InfoCard icon={Search} label="Financial Health" />
              <InfoCard icon={Search} label="Legal Records" />
              <InfoCard icon={Search} label="Reviews & Ratings" />
            </div>
          </Step>
          <Step n={4} title="Read the report">
            You get a complete due-diligence report with:
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm mt-1">
              <li><strong className="text-slate-300">Overall Risk</strong> — High / Medium / Low</li>
              <li><strong className="text-slate-300">3 risk sections</strong> — News, Financial, Legal</li>
              <li><strong className="text-slate-300">Recommendations</strong> — what to verify before signing</li>
              <li><strong className="text-slate-300">Sources</strong> — clickable URLs for verification</li>
            </ul>
          </Step>
          <Step n={5} title="Export & save" icon={Download}>
            Download as PDF or Word. Past scans appear in <strong className="text-white">Recent Vendor Scans</strong> at the bottom — click any to re-open.
          </Step>
          <Step n={6} title="Best vendor types">
            Works best for:
            <div className="bg-[#0f1a2e] rounded-lg p-3 mt-2 text-xs text-slate-400">
              <p>⭐ <strong className="text-slate-300">Excellent:</strong> US, UK, Canada, Australia, India</p>
              <p>👍 <strong className="text-slate-300">Good:</strong> Singapore, Germany, France, EU companies</p>
              <p>⚠️ <strong className="text-slate-300">Limited:</strong> small local businesses with no English presence</p>
            </div>
          </Step>
        </Section>

        {/* ── E-Signature ── */}
        <Section
          isOpen={open === "esign"}
          onToggle={() => setOpen(open === "esign" ? null : "esign")}
          icon={PenTool}
          title="E-Signature"
          tagline="Send PDFs for digital signing → Get signed PDF back automatically"
        >
          <Step n={1} title="Open E-Signature tab">
            Click the <strong className="text-white">E-Signature</strong> tab.
            <p className="text-yellow-400 text-xs mt-1">⚠️ Business plan only (locked on Free / Pro)</p>
          </Step>
          <Step n={2} title="Click 'Create New Signing Request'" icon={Send}>
            Then upload the PDF you want signed (max 20MB).
          </Step>
          <Step n={3} title="Place signature fields on the document">
            <p className="text-slate-400 text-sm mt-1">
              Choose a field type, then <strong className="text-white">click anywhere on the PDF</strong> to drop it:
            </p>
            <div className="grid grid-cols-3 gap-2 mt-2">
              <FieldType color="red" label="Signature" desc="The signature image" />
              <FieldType color="blue" label="Name" desc="Auto-filled with signer name" />
              <FieldType color="purple" label="Date" desc="Auto-filled with today" />
            </div>
            <p className="text-slate-500 text-xs mt-2">Hover over any placed field → ❌ to remove. You can place multiple fields per page.</p>
          </Step>
          <Step n={4} title="Add the signer's name and email">
            Type the recipient&apos;s full name and email address. They&apos;ll receive a unique signing link.
          </Step>
          <Step n={5} title="Click 'Send Signing Request'" icon={Mail}>
            We email a branded link to the signer:
            <div className="bg-[#0f1a2e] rounded-lg p-3 mt-2 text-xs text-slate-400">
              <p><strong className="text-white">From:</strong> RedlineAI &lt;noreply@getredlineai.com&gt;</p>
              <p><strong className="text-white">Subject:</strong> {`{Your name} requests your signature on...`}</p>
              <p><strong className="text-white">Button:</strong> Review &amp; Sign Document →</p>
            </div>
          </Step>
          <Step n={6} title="What the signer sees" icon={Eye}>
            <p className="text-slate-400 text-sm mt-1">When they click the link, they get a guided 3-step page:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm mt-2">
              <li><strong className="text-slate-300">Review</strong> the document (PDF preview with yellow blinking fields)</li>
              <li><strong className="text-slate-300">Draw</strong> their signature (mouse on PC, finger on mobile)</li>
              <li><strong className="text-slate-300">Click</strong> &ldquo;Sign Document&rdquo; — done!</li>
            </ul>
            <p className="text-slate-500 text-xs mt-2">
              💡 The same signature drawing is automatically embedded at <strong className="text-slate-300">all signature fields</strong> you placed (just like DocuSign).
            </p>
          </Step>
          <Step n={7} title="Get notified when signed" icon={CheckCircle}>
            You receive an email the moment the document is signed. The completed PDF is saved to your dashboard.
          </Step>
          <Step n={8} title="Download the signed contract" icon={Download}>
            Go to <strong className="text-white">Recent Requests</strong> → click the signed item:
            <ul className="list-disc list-inside space-y-1 text-slate-400 text-sm mt-1">
              <li><strong className="text-slate-300">Click the row</strong> → preview signed PDF in browser</li>
              <li><strong className="text-slate-300">Download</strong> button → PDF or Word format</li>
              <li>Word version is editable; PDF is the legal copy</li>
            </ul>
          </Step>
          <Step n={9} title="Audit trail">
            Every signed document includes proof of consent at the bottom:
            <div className="bg-[#0f1a2e] rounded-lg p-3 mt-2 text-xs text-slate-400 italic">
              Signed by John Doe (john@company.com) · April 26, 2026 · IP 1.2.3.4
            </div>
            <p className="text-slate-500 text-xs mt-2">
              Legally binding under U.S. ESIGN Act and EU eIDAS regulations.
            </p>
          </Step>
        </Section>

        {/* Footer CTA */}
        <div className="bg-gradient-to-br from-red-900/20 to-[#162035] border border-[#1e3050] rounded-2xl p-6 mt-10 text-center">
          <Sparkles className="w-6 h-6 text-red-400 mx-auto mb-3" />
          <h3 className="text-white font-bold text-lg mb-1">Still have questions?</h3>
          <p className="text-slate-400 text-sm mb-4">Email us anytime — we usually reply within 24 hours.</p>
          <a
            href="mailto:admin@pactbug.com"
            className="inline-flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
          >
            <Mail className="w-4 h-4" /> admin@pactbug.com
          </a>
        </div>

        <div className="text-center mt-8">
          <Link href="/dashboard" className="text-red-400 hover:text-red-300 text-sm font-medium">
            Back to Dashboard →
          </Link>
        </div>
      </div>
      <AppFooter />
    </div>
  );
}

/* ──────────────── Sub-components ──────────────── */

function Section({
  isOpen, onToggle, icon: Icon, title, tagline, children,
}: {
  isOpen: boolean;
  onToggle: () => void;
  icon: typeof FileText;
  title: string;
  tagline: string;
  children: React.ReactNode;
}) {
  return (
    <div className={`bg-[#162035] border rounded-2xl mb-4 transition-colors ${isOpen ? "border-red-700/50" : "border-[#1e3050]"}`}>
      <button
        onClick={onToggle}
        className="w-full p-5 flex items-center gap-4 text-left"
      >
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${isOpen ? "bg-red-900/40" : "bg-red-900/20"}`}>
          <Icon className="w-5 h-5 text-red-400" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-white font-bold text-lg">{title}</h2>
          <p className="text-slate-400 text-sm">{tagline}</p>
        </div>
        {isOpen ? (
          <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />
        ) : (
          <ChevronRight className="w-5 h-5 text-slate-400 shrink-0" />
        )}
      </button>
      {isOpen && (
        <div className="px-5 pb-6 space-y-4 border-t border-[#1e3050] pt-5">
          {children}
        </div>
      )}
    </div>
  );
}

function Step({
  n, title, icon: Icon, children,
}: {
  n: number;
  title: string;
  icon?: typeof FileText;
  children: React.ReactNode;
}) {
  return (
    <div className="flex gap-4">
      <div className="shrink-0 w-8 h-8 bg-red-900/30 border border-red-800/50 rounded-full flex items-center justify-center text-red-400 font-bold text-sm">
        {n}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white font-semibold text-sm flex items-center gap-2">
          {Icon && <Icon className="w-4 h-4 text-red-400" />}
          {title}
        </p>
        <div className="text-slate-400 text-sm mt-1 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}

function Badge({ color, label, desc }: { color: "red" | "yellow" | "blue"; label: string; desc: string }) {
  const colors = {
    red:    { bg: "bg-red-900/20",    border: "border-red-800/50",    text: "text-red-300" },
    yellow: { bg: "bg-yellow-900/20", border: "border-yellow-800/50", text: "text-yellow-300" },
    blue:   { bg: "bg-blue-900/20",   border: "border-blue-800/50",   text: "text-blue-300" },
  };
  const c = colors[color];
  return (
    <div className={`${c.bg} ${c.border} border rounded-lg p-2 text-center`}>
      <p className={`${c.text} text-xs font-bold`}>{label}</p>
      <p className="text-slate-500 text-[10px] mt-0.5">{desc}</p>
    </div>
  );
}

function InfoCard({ icon: Icon, label }: { icon: typeof FileText; label: string }) {
  return (
    <div className="bg-[#0f1a2e] border border-[#1e3050] rounded-lg p-2 flex items-center gap-2">
      <Icon className="w-3.5 h-3.5 text-red-400 shrink-0" />
      <span className="text-slate-300 text-xs">{label}</span>
    </div>
  );
}

function FieldType({ color, label, desc }: { color: "red" | "blue" | "purple"; label: string; desc: string }) {
  const colors = {
    red:    "bg-red-500/20 border-red-500/50",
    blue:   "bg-blue-500/20 border-blue-500/50",
    purple: "bg-purple-500/20 border-purple-500/50",
  };
  const icons = { red: PenTool, blue: Type, purple: Calendar };
  const Icon = icons[color];
  return (
    <div className={`${colors[color]} border-2 border-dashed rounded-lg p-2 text-center`}>
      <Icon className="w-3.5 h-3.5 text-white mx-auto mb-1 opacity-80" />
      <p className="text-white text-xs font-bold">{label}</p>
      <p className="text-slate-300 text-[9px] mt-0.5 opacity-80">{desc}</p>
    </div>
  );
}
