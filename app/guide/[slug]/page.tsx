import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Navbar from "@/components/Navbar";
import AppFooter from "@/components/AppFooter";
import { getAllGuides, getGuide, type GuideBlock } from "@/lib/guides";

const BASE = "https://getredlineai.com";

export function generateStaticParams() {
  return getAllGuides().map((g) => ({ slug: g.slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const guide = getGuide(params.slug);
  if (!guide) return {};
  const url = `${BASE}/guide/${guide.slug}`;
  return {
    title: guide.title,
    description: guide.description,
    keywords: guide.keywords.length > 0 ? guide.keywords : undefined,
    alternates: { canonical: url },
    openGraph: {
      type: "article",
      url,
      title: guide.title,
      description: guide.description,
      siteName: "레드라인AI",
      locale: "ko_KR",
    },
    twitter: { card: "summary_large_image", title: guide.title, description: guide.description },
  };
}

/** Render **bold** and [link](url) spans without a markdown library. */
function withInline(text: string) {
  const parts = text.split(/(\*\*.+?\*\*|\[.+?\]\(.+?\))/g);
  return parts.map((part, i) => {
    const bold = part.match(/^\*\*(.+)\*\*$/);
    if (bold) return <strong key={i} className="text-white font-semibold">{bold[1]}</strong>;
    const link = part.match(/^\[(.+)\]\((.+)\)$/);
    if (link) {
      return (
        <a key={i} href={link[2]} className="text-red-400 hover:text-red-300 underline underline-offset-2">
          {link[1]}
        </a>
      );
    }
    return part;
  });
}

function Block({ block }: { block: GuideBlock }) {
  if (block.type === "h2") {
    return <h2 className="text-2xl font-bold text-white mt-10 mb-4 break-keep">{block.text}</h2>;
  }
  if (block.type === "h3") {
    return <h3 className="text-lg font-bold text-white mt-8 mb-3 break-keep">{block.text}</h3>;
  }
  if (block.type === "quote") {
    return (
      <blockquote className="bg-[#162035] border-l-4 border-red-600 border border-[#2a3d5f] rounded-xl px-5 py-4 my-4">
        {block.lines.map((line, i) => (
          <p key={i} className="text-slate-300 text-sm leading-relaxed break-keep">{line ? withInline(line) : " "}</p>
        ))}
      </blockquote>
    );
  }
  if (block.type === "ul") {
    return (
      <ul className="list-disc list-inside space-y-1.5 my-4 text-slate-300">
        {block.items.map((item, i) => (
          <li key={i} className="leading-relaxed break-keep">{withInline(item)}</li>
        ))}
      </ul>
    );
  }
  return <p className="text-slate-300 leading-relaxed my-4 break-keep">{withInline(block.text)}</p>;
}

export default function GuidePage({ params }: { params: { slug: string } }) {
  const guide = getGuide(params.slug);
  if (!guide) notFound();

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: guide.title,
    description: guide.description,
    datePublished: guide.date,
    inLanguage: "ko",
    author: { "@type": "Organization", name: "레드라인AI" },
    publisher: { "@type": "Organization", name: "레드라인AI", url: BASE },
    mainEntityOfPage: `${BASE}/guide/${guide.slug}`,
  };

  return (
    <div className="min-h-screen bg-[#0f1a2e]">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <Navbar />
      <article className="pt-28 pb-16 px-6 max-w-3xl mx-auto">
        <p className="text-red-400 text-sm font-semibold mb-3">{guide.standardName}</p>
        <h1 className="text-3xl sm:text-4xl font-bold text-white leading-snug mb-4 break-keep">{guide.title}</h1>
        <p className="text-slate-500 text-sm mb-2">{guide.date}</p>

        {guide.blocks.map((block, i) => <Block key={i} block={block} />)}

        {/* CTA → upload */}
        <div className="mt-12 bg-[#162035] border border-[#2a3d5f] rounded-2xl p-6 text-center">
          <p className="text-white font-bold text-lg mb-4 break-keep">내 계약서는 표준계약서와 어디가 다를까요?</p>
          <Link
            href="/dashboard"
            className="inline-block bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-4 rounded-xl text-lg transition-colors"
          >
            내 계약서와 표준계약서 비교해보기 →
          </Link>
        </div>

        {/* Disclaimer — same fixed wording as the site footer */}
        <p className="mt-10 text-slate-500 text-xs leading-relaxed border-t border-[#1e3050] pt-6 break-keep">
          레드라인AI 안내: 본 서비스는 프리랜서 권익 보호를 위해 계약서 내 조항을 문화체육관광부 표준계약서와 비교해
          다른 점을 보여주는 가이드 툴입니다. 변호사의 법률 자문이나 대리를 대체하지 않으며, 최종 계약 체결에 대한
          법적 책임은 사용자 본인에게 있습니다. 본 페이지의 내용은 참고 정보이며, 표준계약서 원문은 반드시
          문화체육관광부·한국예술인복지재단의 공식 양식과 대조하세요.
        </p>

        <div className="mt-6 text-center">
          <Link href="/guide" className="text-red-400 hover:text-red-300 text-sm font-medium transition-colors">
            다른 사안별 규정 보기 →
          </Link>
        </div>
      </article>
      <AppFooter />
    </div>
  );
}
