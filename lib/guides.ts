import fs from "fs";
import path from "path";

/*
 * SEO 콘텐츠 가이드 로더 — content/guides/*.md 를 읽는다.
 * 글 추가는 md 파일 하나 추가로 끝. 외부 마크다운 라이브러리 없이
 * 이 사이트가 쓰는 최소 문법(## 제목 / > 인용 / 일반 문단 / **굵게**)만 파싱한다.
 * 서버 전용(fs) — 클라이언트 컴포넌트에서 import 금지.
 */

const GUIDES_DIR = path.join(process.cwd(), "content", "guides");

export interface GuideMeta {
  slug: string;
  title: string;
  description: string;
  date: string;        // YYYY-MM-DD
  standardName: string;
}

export type GuideBlock =
  | { type: "h2"; text: string }
  | { type: "p"; text: string }
  | { type: "quote"; lines: string[] };

export interface Guide extends GuideMeta {
  blocks: GuideBlock[];
}

function parseFrontmatter(raw: string): { meta: Record<string, string>; body: string } {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!m) return { meta: {}, body: raw };
  const meta: Record<string, string> = {};
  for (const line of m[1].split(/\r?\n/)) {
    const idx = line.indexOf(":");
    if (idx > 0) meta[line.slice(0, idx).trim()] = line.slice(idx + 1).trim();
  }
  return { meta, body: m[2] };
}

function parseBody(body: string): GuideBlock[] {
  const blocks: GuideBlock[] = [];
  const lines = body.split(/\r?\n/);
  let quote: string[] | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) { blocks.push({ type: "p", text: para.join(" ") }); para = []; }
  };
  const flushQuote = () => {
    if (quote) { blocks.push({ type: "quote", lines: quote }); quote = null; }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith("> ") || trimmed === ">") {
      flushPara();
      if (!quote) quote = [];
      quote.push(trimmed.replace(/^>\s?/, ""));
    } else if (trimmed.startsWith("## ")) {
      flushPara(); flushQuote();
      blocks.push({ type: "h2", text: trimmed.slice(3) });
    } else if (trimmed === "") {
      flushPara(); flushQuote();
    } else {
      flushQuote();
      para.push(trimmed);
    }
  }
  flushPara(); flushQuote();
  return blocks;
}

export function getAllGuides(): GuideMeta[] {
  if (!fs.existsSync(GUIDES_DIR)) return [];
  return fs.readdirSync(GUIDES_DIR)
    .filter((f) => f.endsWith(".md"))
    .map((f) => {
      const raw = fs.readFileSync(path.join(GUIDES_DIR, f), "utf-8");
      const { meta } = parseFrontmatter(raw);
      return {
        slug: f.replace(/\.md$/, ""),
        title: meta.title ?? f,
        description: meta.description ?? "",
        date: meta.date ?? "",
        standardName: meta.standardName ?? "",
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getGuide(slug: string): Guide | null {
  // slug comes from the URL — never let it escape the guides directory
  if (!/^[a-z0-9-]+$/.test(slug)) return null;
  const file = path.join(GUIDES_DIR, `${slug}.md`);
  if (!fs.existsSync(file)) return null;
  const raw = fs.readFileSync(file, "utf-8");
  const { meta, body } = parseFrontmatter(raw);
  return {
    slug,
    title: meta.title ?? slug,
    description: meta.description ?? "",
    date: meta.date ?? "",
    standardName: meta.standardName ?? "",
    blocks: parseBody(body),
  };
}
