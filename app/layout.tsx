import type { Metadata } from "next";
import "./globals.css";
import DisclaimerBanner from "@/components/DisclaimerBanner";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";

export const metadata: Metadata = {
  metadataBase: new URL("https://getredlineai.com"),
  title: {
    default: "레드라인AI – 창작자를 위한 표준계약서 AI",
    template: "%s | 레드라인AI",
  },
  description: "미술·웹툰·공연·영화·공예 — 문화체육관광부 표준계약서로 계약서를 작성하고, 받은 계약서를 표준과 비교 검토하세요. 관련 법원 판례까지 한 곳에서. Claude AI 기반.",
  keywords: [
    "표준계약서", "문체부 표준계약서", "창작자 계약서", "웹툰 계약서", "프리랜서 계약서",
    "계약서 작성", "계약서 검토 AI", "저작권 판례", "예술인 표준계약서", "Claude AI",
  ],
  authors: [{ name: "Pactbug" }],
  creator: "Pactbug",
  publisher: "레드라인AI",
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
    title: "레드라인AI – 창작자를 위한 표준계약서 AI",
    description: "문화체육관광부 표준계약서로 작성·검토하고, 관련 판례까지. 미술·웹툰·공연·영화·공예 창작자를 위한 AI.",
    siteName: "레드라인AI",
    locale: "ko_KR",
  },
  twitter: {
    card: "summary_large_image",
    title: "레드라인AI – 창작자를 위한 표준계약서 AI",
    description: "문체부 표준계약서로 작성·검토하고 관련 판례까지. Claude AI 기반.",
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
    <html lang="ko">
      <head>
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-V4RD4V1GTP"></script>
        <script
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-V4RD4V1GTP');`,
          }}
        />
      </head>
      <body className="antialiased min-h-screen bg-[#0f1a2e] text-slate-200">
        <LanguageProvider>
          <DisclaimerBanner />
          {children}
        </LanguageProvider>
      </body>
    </html>
  );
}
