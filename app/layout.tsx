import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "RedlineAI – AI Contract Risk Scanner",
  description: "Instantly detect risky, vague, or one-sided contract clauses with AI. Get fix suggestions in seconds.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased min-h-screen bg-[#0f1a2e] text-slate-200">
        {children}
      </body>
    </html>
  );
}
