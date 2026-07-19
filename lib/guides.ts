import fs from "fs";
import path from "path";

/*
 * SEO 콘텐츠 가이드 로더 — content/guides/*.md 를 읽는다.
 * 글 추가는 md 파일 하나 추가로 끝. 외부 마크다운 라이브러리 없이
 * 이 사이트가 쓰는 최소 문법(# 제목(무시) / ## 소제목 / > 인용 / - 목록 /
 * --- 구분선 / 일반 문단 / **굵게** / [링크](url))만 파싱한다.
 * 서버 전용(fs) — 클라이언트 컴포넌트에서 import 금지.
 */

const GUIDES_DIR = path.join(process.cwd(), "content", "guides");

export interface GuideMeta {
  slug: string;
  title: string;
  description: string;
  date: string;        // YYYY-MM-DD
  standardName: string;
  keywords: string[];
}

export type GuideBlock =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "quote"; lines: string[] }
  | { type: "ul"; items: string[] };

export interface Guide extends GuideMeta {
  blocks: GuideBlock[];
}

/** Strip a single layer of matching "..." or '...' quotes, if present. */
function unquote(s: string): string {
  const t = s.trim();
  if (t.length >= 2 && ((t[0] === '"' && t[t.length - 1] === '"') || (t[0] === "'" && t[t.length - 1] === "'"))) {
    return t.slice(1, -1);
  }
  return t;
}

/** Parse a `["a", "b"]` or bare `a, b` frontmatter list value into string[]. */
function parseListValue(raw: string): string[] {
  const t = raw.trim();
  if (t.startsWith("[")) {
    try {
      const parsed = JSON.parse(t);
      if (Array.isArray(parsed)) return parsed.map((x) => String(x));
    } catch { /* fall through to comma-split */ }
  }
  return t.split(",").map((x) => unquote(x)).filter(Boolean);
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
  let list: string[] | null = null;
  let para: string[] = [];

  const flushPara = () => {
    if (para.length) { blocks.push({ type: "p", text: para.join(" ") }); para = []; }
  };
  const flushQuote = () => {
    if (quote) { blocks.push({ type: "quote", lines: quote }); quote = null; }
  };
  const flushList = () => {
    if (list) { blocks.push({ type: "ul", items: list }); list = null; }
  };
  const flushAll = () => { flushPara(); flushQuote(); flushList(); };

  for (const line of lines) {
    const trimmed = line.trim();
    if (/^#\s+/.test(trimmed)) {
      // A single leading "# Title" duplicates the page's own <h1> (already
      // rendered from frontmatter title) — skip it, don't render twice.
      flushAll();
    } else if (trimmed.startsWith("> ") || trimmed === ">") {
      flushPara(); flushList();
      if (!quote) quote = [];
      quote.push(trimmed.replace(/^>\s?/, ""));
    } else if (trimmed.startsWith("### ")) {
      flushAll();
      blocks.push({ type: "h3", text: trimmed.slice(4) });
    } else if (trimmed.startsWith("## ")) {
      flushAll();
      blocks.push({ type: "h2", text: trimmed.slice(3) });
    } else if (/^[-*]\s+/.test(trimmed)) {
      flushPara(); flushQuote();
      if (!list) list = [];
      list.push(trimmed.replace(/^[-*]\s+/, ""));
    } else if (/^-{3,}$/.test(trimmed)) {
      // Horizontal rule — a section break, not renderable content.
      flushAll();
    } else if (trimmed === "") {
      flushAll();
    } else {
      flushQuote(); flushList();
      para.push(trimmed);
    }
  }
  flushAll();
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
        slug: (meta.slug ? unquote(meta.slug) : "") || f.replace(/\.md$/, ""),
        title: unquote(meta.title ?? f),
        description: unquote(meta.description ?? ""),
        date: unquote(meta.date ?? ""),
        standardName: unquote(meta.standardName ?? ""),
        keywords: meta.keywords ? parseListValue(meta.keywords) : [],
      };
    })
    .sort((a, b) => b.date.localeCompare(a.date));
}

export function getGuide(slug: string): Guide | null {
  // slug comes from the URL — never let it escape the guides directory
  if (!/^[a-z0-9-]+$/.test(slug)) return null;

  // The URL slug is matched against EITHER the filename OR an explicit
  // `slug:` frontmatter field, so authored filenames don't have to match
  // the intended public URL.
  if (!fs.existsSync(GUIDES_DIR)) return null;
  const files = fs.readdirSync(GUIDES_DIR).filter((f) => f.endsWith(".md"));
  let file = files.includes(`${slug}.md`) ? `${slug}.md` : null;
  if (!file) {
    for (const f of files) {
      const raw = fs.readFileSync(path.join(GUIDES_DIR, f), "utf-8");
      const { meta } = parseFrontmatter(raw);
      if (meta.slug && unquote(meta.slug) === slug) { file = f; break; }
    }
  }
  if (!file) return null;

  const raw = fs.readFileSync(path.join(GUIDES_DIR, file), "utf-8");
  const { meta, body } = parseFrontmatter(raw);
  return {
    slug,
    title: unquote(meta.title ?? slug),
    description: unquote(meta.description ?? ""),
    date: unquote(meta.date ?? ""),
    standardName: unquote(meta.standardName ?? ""),
    keywords: meta.keywords ? parseListValue(meta.keywords) : [],
    blocks: parseBody(body),
  };
}
