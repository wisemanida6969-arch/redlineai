import Link from "next/link";
import { Shield } from "lucide-react";

export default function RefundPage() {
  return (
    <div className="min-h-screen bg-[#0f1a2e] px-6 py-12">
      <div className="max-w-3xl mx-auto">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 mb-10">
          <Shield className="w-6 h-6 text-red-500" />
          <span className="text-xl font-bold text-white">Redline<span className="text-red-500">AI</span></span>
        </Link>

        <div className="bg-[#162035] border border-[#1e3050] rounded-2xl p-8">
          <h1 className="text-3xl font-bold text-white mb-2">Refund Policy</h1>
          <p className="text-slate-400 text-sm mb-8">Last updated: April 2026</p>

          <div className="space-y-6 text-slate-300 leading-relaxed">

            <div className="bg-[#1e3050] rounded-xl p-4 border border-[#2a4070]">
              <p className="text-white font-semibold">We offer a 14-day refund policy in accordance with Paddle&apos;s terms of service.</p>
              <p className="text-slate-300 mt-2">Customers may request a full refund within 14 days of purchase by contacting us at{" "}
                <a href="mailto:admin@pactbug.com" className="text-red-400 hover:text-red-300">admin@pactbug.com</a>.
              </p>
              <p className="text-slate-300 mt-2">Refund requests after 14 days will be reviewed on a case-by-case basis.</p>
              <p className="text-slate-400 text-sm mt-3">
                Note: RedlineAI is operated by Pactbug. Payments are processed by Paddle as our
                Merchant of Record under the trade name &ldquo;Trytimeback&rdquo;. Your card
                statement may show &ldquo;Trytimeback&rdquo; or &ldquo;Paddle.net&rdquo; for
                RedlineAI charges.
              </p>
            </div>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">How to Request a Refund</h2>
              <ol className="list-decimal list-inside space-y-2 text-slate-400">
                <li>Email us at <a href="mailto:admin@pactbug.com" className="text-red-400 hover:text-red-300">admin@pactbug.com</a></li>
                <li>Include the email address associated with your account</li>
                <li>Briefly describe your reason for requesting a refund</li>
                <li>We will process your request within 3–5 business days</li>
              </ol>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Eligibility</h2>
              <ul className="list-disc list-inside space-y-2 text-slate-400">
                <li>Refunds are available within <span className="text-white font-medium">14 days</span> of the initial purchase date</li>
                <li>Only the most recent payment is eligible for a refund</li>
                <li>Refunds are not available for partial months of service</li>
                <li>Accounts that have violated our Terms of Service are not eligible for refunds</li>
              </ul>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Processing</h2>
              <p className="text-slate-400">Approved refunds will be processed through Paddle, our payment provider. Refunds typically appear on your statement within 5–10 business days, depending on your bank or card issuer.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Cancellations</h2>
              <p className="text-slate-400">You may cancel your subscription at any time from your account settings. Cancellation stops future billing but does not automatically trigger a refund. To request a refund along with cancellation, please contact us.</p>
            </section>

            <section>
              <h2 className="text-lg font-semibold text-white mb-3">Contact Us</h2>
              <p className="text-slate-400">
                If you have any questions about our refund policy, please contact us at{" "}
                <a href="mailto:admin@pactbug.com" className="text-red-400 hover:text-red-300">admin@pactbug.com</a>.
              </p>
            </section>
          </div>
        </div>

        <div className="flex gap-6 justify-center mt-8 text-sm text-slate-500">
          <Link href="/terms" className="hover:text-slate-300">Terms of Service</Link>
          <Link href="/privacy" className="hover:text-slate-300">Privacy Policy</Link>
          <Link href="/" className="hover:text-slate-300">Back to Home</Link>
        </div>
      </div>
    </div>
  );
}
