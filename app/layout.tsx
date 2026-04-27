import type { Metadata } from "next";
import "./globals.css";
import DisclaimerBanner from "@/components/DisclaimerBanner";

export const metadata: Metadata = {
  metadataBase: new URL("https://getredlineai.com"),
  title: {
    default: "RedlineAI – AI Contract Risk Scanner",
    template: "%s | RedlineAI",
  },
  description: "Instantly detect risky, vague, or one-sided contract clauses with AI. Quote-to-contract automation, vendor risk scans, and e-signature — all in one place.",
  keywords: [
    "AI contract review", "contract risk analysis", "AI legal tools",
    "contract scanner", "vendor risk assessment", "e-signature",
    "Claude AI contracts", "contract automation", "legal AI",
  ],
  authors: [{ name: "Trytimeback" }],
  creator: "Trytimeback",
  publisher: "RedlineAI",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "https://getredlineai.com",
    title: "RedlineAI – AI Contract Risk Scanner",
    description: "Spot risky contract clauses in seconds. AI-powered analysis, quote-to-contract automation, vendor risk scans, and e-signature.",
    siteName: "RedlineAI",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "RedlineAI – AI Contract Risk Scanner",
    description: "Spot risky contract clauses in seconds with Claude AI.",
  },
  alternates: {
    canonical: "https://getredlineai.com",
  },
  verification: {
    // Add your Google Search Console verification code here.
    // Get it at: https://search.google.com/search-console → Add Property → HTML tag
    // It looks like: "abc123def456..."
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#0f1a2e] text-slate-200">
        <DisclaimerBanner />
        {children}
      </body>
    </html>
  );
}
