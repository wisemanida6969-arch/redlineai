import Link from "next/link";
import { Shield } from "lucide-react";

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-[#0f1a2e] px-6 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-10">
          <Shield className="w-6 h-6 text-red-500" />
          <span className="text-xl font-bold text-white">Redline<span className="text-red-500">AI</span></span>
        </Link>

        <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-2">Privacy Policy</h1>
          <p className="text-slate-400 text-sm mb-8">Last updated: April 2026</p>

          <div className="space-y-6 text-slate-300 leading-relaxed">

            <div className="bg-[#1e3050] rounded-xl p-4 border border-[#2a4070]">
              <p className="text-white font-semibold">This service is operated by Trytimeback.</p>
              <p className="text-slate-300 mt-1 text-sm">We are committed to protecting your privacy. This policy explains what data we collect, how we use it, and your rights.</p>
            </div>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">1. Information We Collect</h2>
              <div className="space-y-3">
                <div>
                  <h3 className="text-white font-medium mb-1">Account Information</h3>
                  <p className="text-slate-400 text-sm">When you sign in with Google, we receive your name, email address, and profile picture from Google. We store your email to identify your account.</p>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Documents You Upload</h3>
                  <p className="text-slate-400 text-sm">Contracts and documents you upload are processed by our AI to generate risk reports. Document content is used solely for analysis and is not stored permanently after processing.</p>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Usage Data</h3>
                  <p className="text-slate-400 text-sm">We collect basic usage information such as the number of scans performed, scan dates, and risk report summaries to provide your scan history.</p>
                </div>
                <div>
                  <h3 className="text-white font-medium mb-1">Payment Information</h3>
                  <p className="text-slate-400 text-sm">Payment processing is handled entirely by Paddle. We do not store your credit card or payment details on our servers.</p>
                </div>
              </div>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">2. How We Use Your Information</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400 text-sm">
                <li>To provide, operate, and improve the RedlineAI service</li>
                <li>To authenticate your identity and maintain your account</li>
                <li>To process your uploaded documents and generate AI risk reports</li>
                <li>To track your subscription plan and usage limits</li>
                <li>To send important service-related communications</li>
                <li>To respond to support requests</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">3. Data Sharing</h2>
              <p className="text-slate-400 text-sm mb-3">We do not sell your personal data. We share data only with the following service providers:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-400 text-sm">
                <li><span className="text-white">Supabase</span> — Authentication and database storage</li>
                <li><span className="text-white">Anthropic (Claude AI)</span> — AI analysis of uploaded documents</li>
                <li><span className="text-white">Paddle</span> — Payment processing for paid subscriptions</li>
                <li><span className="text-white">Railway</span> — Cloud infrastructure and hosting</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">4. Document Privacy</h2>
              <p className="text-slate-400 text-sm">Your uploaded documents are processed in memory to generate analysis. Document text is sent to Anthropic&apos;s Claude AI API for analysis. We do not permanently store the full content of your uploaded documents. Only the risk report summary and clause metadata are stored in your scan history.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">5. Data Retention</h2>
              <p className="text-slate-400 text-sm">We retain your account information and scan history for as long as your account is active. You may request deletion of your data at any time by contacting us.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">6. Security</h2>
              <p className="text-slate-400 text-sm">We implement industry-standard security measures including encrypted connections (HTTPS), secure authentication via Supabase, and row-level security for your data. However, no method of transmission over the Internet is 100% secure.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">7. Your Rights</h2>
              <p className="text-slate-400 text-sm mb-2">You have the right to:</p>
              <ul className="list-disc list-inside space-y-2 text-slate-400 text-sm">
                <li>Access the personal data we hold about you</li>
                <li>Request correction of inaccurate data</li>
                <li>Request deletion of your account and associated data</li>
                <li>Withdraw consent at any time by deleting your account</li>
              </ul>
              <p className="text-slate-400 text-sm mt-2">To exercise these rights, contact us at <a href="mailto:admin@trytimeback.com" className="text-red-400 hover:text-red-300">admin@trytimeback.com</a>.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">8. Cookies</h2>
              <p className="text-slate-400 text-sm">We use essential cookies only for authentication purposes (to keep you logged in). We do not use tracking or advertising cookies.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">9. Children&apos;s Privacy</h2>
              <p className="text-slate-400 text-sm">RedlineAI is not intended for use by individuals under the age of 18. We do not knowingly collect personal information from children.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">10. Changes to This Policy</h2>
              <p className="text-slate-400 text-sm">We may update this Privacy Policy from time to time. We will notify you of significant changes by posting a notice on our website. Continued use of the Service after changes constitutes acceptance of the updated policy.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">11. Contact Us</h2>
              <p className="text-slate-400 text-sm">
                If you have any questions about this Privacy Policy, please contact us at:{" "}
                <a href="mailto:admin@trytimeback.com" className="text-red-400 hover:text-red-300">admin@trytimeback.com</a>
              </p>
            </section>

          </div>
        </div>

        <div className="flex gap-6 justify-center mt-8 text-sm text-slate-500">
          <Link href="/terms" className="hover:text-slate-300">Terms of Service</Link>
          <Link href="/refund" className="hover:text-slate-300">Refund Policy</Link>
          <Link href="/" className="hover:text-slate-300">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
