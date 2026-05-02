import Link from "next/link";
import Navbar from "@/components/Navbar";
import PaddleCheckout from "@/components/PaddleCheckout";
import { Shield, Zap, FileText, Download, CheckCircle, AlertTriangle, AlertCircle, Lock } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0f1a2e]">
      <Navbar />

      {/* Hero */}
      <section className="pt-32 pb-20 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-red-900/30 border border-red-800/50 text-red-400 text-sm px-4 py-1.5 rounded-full mb-6">
            <Zap className="w-3.5 h-3.5" />
            AI-Powered Contract Analysis
          </div>
          <h1 className="text-5xl md:text-6xl font-bold text-white leading-tight mb-6">
            Spot risky contract clauses{" "}
            <span className="text-red-500">before you sign</span>
          </h1>
          <p className="text-xl text-slate-400 mb-10 max-w-2xl mx-auto">
            RedlineAI scans your contracts in seconds, flags dangerous clauses, and gives you
            copy-paste ready rewrites. Powered by Claude AI.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/dashboard"
              className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
            >
              Scan a Contract Free →
            </Link>
            <a
              href="#how-it-works"
              className="border border-[#1e3050] hover:border-slate-500 text-slate-300 font-medium px-8 py-4 rounded-xl text-lg transition-colors"
            >
              See how it works
            </a>
          </div>
          <p className="text-slate-500 text-sm mt-4">No credit card required · 3 free scans/month</p>
        </div>
      </section>

      {/* Risk preview */}
      <section className="pb-20 px-6">
        <div className="max-w-3xl mx-auto bg-[#162035] border border-[#1e3050] rounded-2xl p-6 shadow-2xl">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-3 h-3 rounded-full bg-red-500" />
            <div className="w-3 h-3 rounded-full bg-yellow-500" />
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <span className="text-slate-500 text-sm ml-2">sample_nda.pdf — Analysis complete</span>
          </div>
          <div className="space-y-3">
            <RiskItem
              level="high"
              title="Unlimited liability clause"
              text="&quot;Employee shall be liable for any and all damages, losses, or expenses of any kind...&quot;"
              fix="Liability shall be limited to direct damages not exceeding three (3) months of compensation."
            />
            <RiskItem
              level="medium"
              title="Vague non-compete scope"
              text="&quot;Employee agrees not to engage in any similar business activities for a reasonable period...&quot;"
              fix="Non-compete is restricted to 12 months within [City/Region] for direct competitors in [Industry]."
            />
            <RiskItem
              level="low"
              title="Missing governing law"
              text="&quot;This agreement shall be governed by applicable laws...&quot;"
              fix='This agreement shall be governed by the laws of the State of [State], without regard to conflicts of law.'
            />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-20 px-6 border-t border-[#1e3050]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">How it works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { icon: FileText, step: "1", title: "Upload your contract", desc: "Drag & drop a PDF or paste your contract text directly." },
              { icon: Zap, step: "2", title: "AI scans every clause", desc: "Claude AI analyzes the entire document for risks, ambiguities, and one-sided terms." },
              { icon: Shield, step: "3", title: "Get your risk report", desc: "Receive a full report with severity ratings and copy-paste ready fix suggestions." },
            ].map(({ icon: Icon, step, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 bg-red-900/30 border border-red-800/50 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-6 h-6 text-red-400" />
                </div>
                <div className="text-red-500 text-sm font-bold mb-2">Step {step}</div>
                <h3 className="text-white font-semibold text-lg mb-2">{title}</h3>
                <p className="text-slate-400 text-sm">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 px-6 border-t border-[#1e3050]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-12">Everything you need to review contracts safely</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { icon: AlertTriangle, title: "Risk categorization", desc: "Every issue categorized as High, Medium, or Low severity so you know what to prioritize." },
              { icon: FileText, title: "Fix suggestions", desc: "Each flagged clause comes with a professionally rewritten version you can copy instantly." },
              { icon: Download, title: "PDF export", desc: "Download a clean, branded risk report to share with your team or lawyer." },
              { icon: CheckCircle, title: "PDF & text upload", desc: "Upload a PDF or paste raw contract text — we handle both formats seamlessly." },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="flex gap-4 bg-[#162035] border border-[#1e3050] rounded-xl p-5">
                <div className="w-10 h-10 bg-red-900/30 rounded-lg flex items-center justify-center shrink-0">
                  <Icon className="w-5 h-5 text-red-400" />
                </div>
                <div>
                  <h3 className="text-white font-semibold mb-1">{title}</h3>
                  <p className="text-slate-400 text-sm">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-20 px-6 border-t border-[#1e3050]">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-white text-center mb-4">Simple, transparent pricing</h2>
          <p className="text-slate-400 text-center mb-12">Start free. Upgrade when you need more.</p>
          <div className="grid md:grid-cols-3 gap-6">
            <PricingCard
              name="Free"
              price="$0"
              period=""
              desc="For individuals trying RedlineAI"
              features={[
                "Contract Analysis: 3/month",
                "Quote to Contract: locked",
                "Vendor Risk Scan: locked",
                "E-Signature: locked",
              ]}
              cta="Get started free"
              href="/dashboard"
              highlighted={false}
            />
            <PricingCard
              name="Pro"
              price="$49"
              period="/month"
              desc="For freelancers and small teams"
              features={[
                "Contract Analysis: 30/month",
                "Quote to Contract: 30/month",
                "Vendor Risk Scan: 10/month",
                "E-Signature: locked",
                "Email support",
              ]}
              cta="Start Pro"
              href="/dashboard"
              highlighted={true}
              paddlePriceId={process.env.NEXT_PUBLIC_PADDLE_PRO_PRICE_ID}
            />
            <PricingCard
              name="Business"
              price="$99"
              period="/month"
              desc="For teams reviewing contracts at scale"
              features={[
                "Contract Analysis: Unlimited",
                "Quote to Contract: Unlimited",
                "Vendor Risk Scan: 30/month",
                "E-Signature: Unlimited",
                "Priority support",
              ]}
              cta="Start Business"
              href="/dashboard"
              highlighted={false}
              paddlePriceId={process.env.NEXT_PUBLIC_PADDLE_BUSINESS_PRICE_ID}
            />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-6 border-t border-[#1e3050]">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready to protect yourself?</h2>
          <p className="text-slate-400 mb-8">Scan your first contract in under 60 seconds — free.</p>
          <Link
            href="/dashboard"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors inline-block"
          >
            Scan a Contract Free →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-[#1e3050] py-10 px-6">
        <div className="max-w-6xl mx-auto flex flex-col items-center gap-4 text-center">
          <div className="flex items-center gap-2">
            <Shield className="w-5 h-5 text-red-500" />
            <span className="text-white font-bold">RedlineAI</span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-500">
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="/refund" className="hover:text-slate-300 transition-colors">Refund Policy</Link>
          </div>
          <p className="text-slate-600 text-xs">© 2026 RedlineAI. Operated by Pactbug. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}

function RiskItem({ level, title, text, fix }: { level: "high" | "medium" | "low"; title: string; text: string; fix: string }) {
  const colors = {
    high: { bg: "bg-red-900/20", border: "border-red-800/50", badge: "bg-red-900/50 text-red-400", icon: AlertTriangle },
    medium: { bg: "bg-yellow-900/20", border: "border-yellow-800/50", badge: "bg-yellow-900/50 text-yellow-400", icon: AlertCircle },
    low: { bg: "bg-blue-900/20", border: "border-blue-800/50", badge: "bg-blue-900/50 text-blue-400", icon: CheckCircle },
  };
  const c = colors[level];
  const Icon = c.icon;
  return (
    <div className={`${c.bg} border ${c.border} rounded-xl p-4`}>
      <div className="flex items-start gap-3">
        <Icon className="w-4 h-4 mt-0.5 shrink-0 text-current opacity-70" />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${c.badge}`}>{level}</span>
            <span className="text-white text-sm font-medium">{title}</span>
          </div>
          <p className="text-slate-400 text-xs mb-2 italic">{text}</p>
          <div className="bg-green-900/20 border border-green-800/30 rounded-lg p-2">
            <span className="text-green-400 text-xs font-semibold">Suggested fix: </span>
            <span className="text-green-300 text-xs">{fix}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function PricingCard({
  name, price, period, desc, features, cta, href, highlighted, paddlePriceId,
}: {
  name: string; price: string; period: string; desc: string; features: string[];
  cta: string; href: string; highlighted: boolean; paddlePriceId?: string;
}) {
  const buttonClass = `w-full text-center py-3 rounded-xl font-semibold text-sm transition-colors ${
    highlighted ? "bg-red-600 hover:bg-red-700 text-white" : "border border-[#1e3050] hover:border-slate-500 text-slate-300"
  }`;

  return (
    <div className={`rounded-2xl p-6 border flex flex-col ${highlighted ? "bg-red-900/20 border-red-700/50 ring-1 ring-red-600/30" : "bg-[#162035] border-[#1e3050]"}`}>
      {highlighted && (
        <div className="text-xs font-bold text-red-400 uppercase tracking-wider mb-3">Most Popular</div>
      )}
      <div className="mb-4">
        <h3 className="text-white font-bold text-xl mb-1">{name}</h3>
        <div className="flex items-baseline gap-1">
          <span className="text-3xl font-bold text-white">{price}</span>
          <span className="text-slate-400 text-sm">{period}</span>
        </div>
        <p className="text-slate-400 text-sm mt-2">{desc}</p>
      </div>
      <ul className="space-y-2 mb-6 flex-1">
        {features.map((f) => {
          const isLocked = f.toLowerCase().includes("locked");
          return (
            <li key={f} className={`flex items-center gap-2 text-sm ${isLocked ? "text-slate-500" : "text-slate-300"}`}>
              {isLocked ? (
                <Lock className="w-4 h-4 text-slate-600 shrink-0" />
              ) : (
                <CheckCircle className="w-4 h-4 text-green-400 shrink-0" />
              )}
              {f}
            </li>
          );
        })}
      </ul>
      {paddlePriceId ? (
        <PaddleCheckout priceId={paddlePriceId} className={buttonClass}>
          {cta}
        </PaddleCheckout>
      ) : (
        <Link href={href} className={buttonClass}>
          {cta}
        </Link>
      )}
    </div>
  );
}
