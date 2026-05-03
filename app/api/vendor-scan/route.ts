import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { PLAN_LIMITS, type Plan } from "@/lib/planLimits";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT = `You are a senior business risk analyst conducting due diligence on a vendor or supplier company. You produce structured, factual risk reports based on web research.

You MUST use the web_search tool to find recent, factual information about the company before drafting the report. Search for:
- Recent news, press releases, controversies (last 12 months)
- Financial health: funding, revenue, layoffs, bankruptcy filings
- Legal: lawsuits, regulatory actions, settlements
- Customer reviews, BBB ratings, employee reviews

After researching, return a final response that is VALID JSON only — no markdown, no explanation outside the JSON. Use this exact structure:

{
  "vendorName": "Official company name",
  "overview": "2-3 sentence factual overview: what the company does, size, location, founded year if known",
  "newsRisk": {
    "severity": "high" | "medium" | "low",
    "summary": "2-3 sentence summary of news/reputation findings",
    "items": ["Specific finding 1 with date if possible", "Specific finding 2", "..."]
  },
  "financialRisk": {
    "severity": "high" | "medium" | "low",
    "summary": "2-3 sentence summary of financial health",
    "items": ["Specific finding 1", "Specific finding 2", "..."]
  },
  "legalRisk": {
    "severity": "high" | "medium" | "low",
    "summary": "2-3 sentence summary of legal/regulatory findings",
    "items": ["Specific finding 1", "Specific finding 2", "..."]
  },
  "overallScore": "high" | "medium" | "low",
  "overallSummary": "3-4 sentence executive summary tying everything together",
  "recommendations": [
    "Action 1 — what to verify, request, or watch out for before signing",
    "Action 2",
    "Action 3"
  ],
  "sources": ["URL 1", "URL 2", "URL 3"]
}

Severity rubric:
- HIGH: Active lawsuits, recent scandals, layoffs, regulatory actions, financial distress
- MEDIUM: Mixed reputation, minor concerns, slow growth, some negative reviews
- LOW: Generally positive signals, stable, no significant red flags found

If you cannot find information for a category, say so honestly and rate it MEDIUM. Be factual — do not fabricate details. Always include source URLs.

CRITICAL FORMATTING RULES:
- Do NOT include any <cite> tags, citation markers, or HTML/XML tags inside the JSON string fields.
- Do NOT include footnote markers like [1], [2], etc.
- Source URLs go ONLY in the "sources" array — never inline in summaries or items.
- Output plain readable text only.`;

interface VendorReport {
  vendorName: string;
  overview: string;
  newsRisk: { severity: "high" | "medium" | "low"; summary: string; items: string[] };
  financialRisk: { severity: "high" | "medium" | "low"; summary: string; items: string[] };
  legalRisk: { severity: "high" | "medium" | "low"; summary: string; items: string[] };
  overallScore: "high" | "medium" | "low";
  overallSummary: string;
  recommendations: string[];
  sources: string[];
}

/** Strip <cite index="..."> and </cite> tags from a string. */
function stripCiteTags(s: string): string {
  if (!s) return s;
  return s
    .replace(/<cite\s[^>]*>/gi, "")
    .replace(/<\/cite>/gi, "")
    .replace(/<cite>/gi, "")
    .trim();
}

/** Recursively strip cite tags from all string fields in the report. */
function cleanReport(r: VendorReport): VendorReport {
  const cleanArr = (arr: string[]) => arr.map(stripCiteTags).filter(Boolean);
  const cleanSection = (s: { severity: "high" | "medium" | "low"; summary: string; items: string[] }) => ({
    severity: s.severity,
    summary: stripCiteTags(s.summary),
    items: cleanArr(s.items || []),
  });
  return {
    vendorName: stripCiteTags(r.vendorName),
    overview: stripCiteTags(r.overview),
    newsRisk: cleanSection(r.newsRisk),
    financialRisk: cleanSection(r.financialRisk),
    legalRisk: cleanSection(r.legalRisk),
    overallScore: r.overallScore,
    overallSummary: stripCiteTags(r.overallSummary),
    recommendations: cleanArr(r.recommendations || []),
    sources: cleanArr(r.sources || []),
  };
}

async function scanVendor(vendorName: string): Promise<VendorReport> {
  // Use Claude with web search tool, looping through tool_use turns until final response
  const messages: Anthropic.MessageParam[] = [
    {
      role: "user",
      content: `Conduct a risk assessment on the vendor: "${vendorName}". Search the web for recent news, financials, legal records, and reputation signals. Then produce the JSON risk report as specified.`,
    },
  ];

  let finalText = "";
  for (let turn = 0; turn < 6; turn++) {
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 4096,
      temperature: 0,
      system: SYSTEM_PROMPT,
      tools: [
        {
          type: "web_search_20250305",
          name: "web_search",
          max_uses: 5,
        } as unknown as Anthropic.Tool,
      ],
      messages,
    });

    // Collect any text the assistant emitted this turn
    for (const block of response.content) {
      if (block.type === "text") finalText = block.text;
    }

    if (response.stop_reason === "end_turn" || response.stop_reason === "stop_sequence") {
      break;
    }

    if (response.stop_reason === "tool_use") {
      // Append assistant turn + empty tool_result for server-tool web_search (Claude handles internally)
      messages.push({ role: "assistant", content: response.content });

      const toolUseBlocks = response.content.filter((b) => b.type === "tool_use");
      const toolResults = toolUseBlocks.map((b) => ({
        type: "tool_result" as const,
        tool_use_id: (b as Anthropic.ToolUseBlock).id,
        content: "",
      }));
      messages.push({ role: "user", content: toolResults as Anthropic.ToolResultBlockParam[] });
      continue;
    }

    break;
  }

  if (!finalText) throw new Error("Vendor scan returned no text");

  const jsonMatch = finalText.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error("Invalid AI response format");
  return JSON.parse(jsonMatch[0]);
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth check ──
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Please sign in to use this feature." }, { status: 401 });
    }

    // ── Plan / limit check ──
    const service = createServiceClient();
    const { data: profile } = await service
      .from("profiles")
      .select("plan, vendor_used, scan_month")
      .eq("id", user.id)
      .single();

    const currentMonth = new Date().toISOString().slice(0, 7);
    const sameMonth = profile?.scan_month === currentMonth;
    const vendorUsed = sameMonth ? (profile?.vendor_used ?? 0) : 0;
    const plan = (profile?.plan ?? "free") as Plan;
    const limit = PLAN_LIMITS[plan].vendor;

    if (limit === 0) {
      return NextResponse.json({
        error: "Vendor Risk Scan is a Pro feature. Upgrade to Pro ($49/mo) for 10 scans or Business ($99/mo) for 30 scans.",
        limitReached: true,
      }, { status: 403 });
    }

    if (limit !== null && vendorUsed >= limit) {
      const upgradeMsg = plan === "pro"
        ? "Upgrade to Business for 30 scans/month."
        : "Limit reached.";
      return NextResponse.json({
        error: `You've used all ${limit} Vendor Risk Scans this month. ${upgradeMsg}`,
        limitReached: true,
      }, { status: 403 });
    }

    // ── Parse input ──
    const body = await req.json();
    const vendorName = (body.vendorName as string)?.trim();
    if (!vendorName) {
      return NextResponse.json({ error: "Vendor name is required." }, { status: 400 });
    }
    if (vendorName.length > 200) {
      return NextResponse.json({ error: "Vendor name is too long." }, { status: 400 });
    }

    // ── Scan ──
    const rawReport = await scanVendor(vendorName);
    const report = cleanReport(rawReport);

    // ── Save scan to history ──
    const { data: saved, error: saveError } = await service.from("vendor_scans").insert({
      user_id: user.id,
      vendor_name: report.vendorName || vendorName,
      overall_score: report.overallScore,
      overview: report.overview,
      result: report,
    }).select("id, created_at").single();

    if (saveError) {
      console.error("Failed to save vendor scan:", JSON.stringify(saveError, null, 2));
    }

    // ── Update usage ──
    await service.from("profiles").update({
      vendor_used: sameMonth ? vendorUsed + 1 : 1,
      scan_month: currentMonth,
    }).eq("id", user.id);

    return NextResponse.json({
      report,
      scannedAt: saved?.created_at || new Date().toISOString(),
      scanId: saved?.id,
      vendorUsed: vendorUsed + 1,
      vendorLimit: limit,
    });
  } catch (err: unknown) {
    console.error("Vendor scan error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Vendor scan failed" }, { status: 500 });
  }
}
