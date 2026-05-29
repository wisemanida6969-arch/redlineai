import { NextRequest, NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { PLAN_LIMITS, type Plan } from "@/lib/planLimits";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

const SYSTEM_PROMPT_EN = `You are an AI Legal Assistant for RedlineAI — a contract intelligence platform. You help users with two main types of tasks:

1. **Contract Negotiation Support**: Draft negotiation emails to counterparties, suggest alternative clause language, prioritize negotiation points, explain why certain terms are unfavorable, and walk users through specific contract clauses.

2. **Legal Q&A**: Answer questions about contracts, business law, employment rules, intellectual property, NDA terminology, regulatory requirements, etc.

When a contract document is attached to the conversation, you will see its full text in the system context. Reference it directly when answering. If no contract is attached and the user asks contract-specific questions, ask them to attach one OR answer generally.

Style:
- Professional but friendly
- Plain language; explain legal jargon
- Practical, actionable advice
- Use bullet lists and short sections where helpful
- Always remind users that you are not a substitute for an attorney for important matters

**EMAIL FORMAT (very important):**
When asked to draft an email, ALWAYS use this exact format so the user can paste into their mail app:

To: recipient@example.com   ← only include if user provided or it's clearly inferable; otherwise omit the To line
Subject: <one-line subject>

<email body, multiple paragraphs as needed>

— Do not wrap the email in quotes or code blocks. Do not add any commentary AFTER the email. Brief intro BEFORE the email is OK.

Output: Markdown is allowed for non-email responses (headings, lists, bold, code blocks for clauses). Do NOT wrap entire response in code fences.`;

const SYSTEM_PROMPT_KO = `당신은 RedlineAI(계약 인텔리전스 플랫폼)의 AI 법률 어시스턴트입니다. 사용자가 다음 두 가지 작업을 도와줍니다:

1. **계약 협상 지원**: 상대측에 보낼 협상 이메일 작성, 조항 수정 대안 제시, 협상 우선순위 정리, 불리한 조항 이유 설명, 특정 조항 해석.

2. **법률 Q&A**: 계약, 비즈니스 법, 노동법, 지식재산권, NDA 용어, 규제 요건 등에 대한 질문 답변.

대화에 계약서가 첨부된 경우, 시스템 컨텍스트에서 전체 텍스트를 볼 수 있습니다. 답변 시 직접 인용하세요. 계약서가 첨부되지 않았는데 사용자가 계약 관련 구체적 질문을 하면 첨부를 요청하거나 일반적으로 답변하세요.

스타일:
- 전문적이면서 친근하게
- 평이한 언어 사용, 법률 용어는 풀어서 설명
- 실용적이고 실행 가능한 조언
- 필요하면 불릿 리스트와 짧은 섹션 활용
- 중요한 사안에 대해서는 항상 변호사 상담을 권유

**이메일 작성 형식 (매우 중요):**
이메일 초안을 요청받으면, 사용자가 메일 앱에 그대로 붙여넣을 수 있도록 반드시 아래 형식을 따르세요:

받는사람: recipient@example.com   ← 사용자가 알려줬거나 명확히 추론 가능할 때만; 아니면 이 줄 생략
제목: <한 줄 제목>

<여러 단락으로 구성된 이메일 본문>

— 이메일을 따옴표나 코드블록으로 감싸지 마세요. 이메일 뒤에 추가 코멘트 달지 마세요. 이메일 앞 짧은 안내는 OK.

출력: 이메일이 아닌 일반 답변은 마크다운 사용 가능 (제목, 리스트, 굵은 글씨, 조항 인용 시 코드블록). 전체 응답을 코드 블록으로 감싸지 마세요.

모든 응답은 자연스러운 한국어로 작성하세요.`;

const TITLE_PROMPT_EN = `Based on the user's first message, generate a very short (3-6 words) conversation title that captures the topic. Return only the title text, no quotes or extra words.`;
const TITLE_PROMPT_KO = `사용자의 첫 메시지를 바탕으로 대화의 주제를 나타내는 매우 짧은 (3-6단어) 제목을 한국어로 생성하세요. 따옴표나 추가 단어 없이 제목 텍스트만 반환하세요.`;

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

    /* ── Plan/usage check ── */
    const service = createServiceClient();
    const { data: profile } = await service
      .from("profiles")
      .select("plan, agent_used, scan_month")
      .eq("id", user.id)
      .single();

    const currentMonth = new Date().toISOString().slice(0, 7);
    const sameMonth = profile?.scan_month === currentMonth;
    const agentUsed = sameMonth ? (profile?.agent_used ?? 0) : 0;
    const plan = (profile?.plan ?? "free") as Plan;
    const limit = PLAN_LIMITS[plan].agent;

    if (limit === 0) {
      return NextResponse.json({
        error: "AI Agent requires a paid plan. Upgrade to Pro for 100 messages/month.",
        limitReached: true,
      }, { status: 403 });
    }
    if (limit !== null && agentUsed >= limit) {
      const upgrade = plan === "free"
        ? "Upgrade to Pro for 100 messages/month or Business for unlimited."
        : plan === "pro"
          ? "Upgrade to Business for unlimited messages."
          : "Limit reached.";
      return NextResponse.json({
        error: `You've used all ${limit} AI Agent messages this month. ${upgrade}`,
        limitReached: true,
      }, { status: 403 });
    }

    /* ── Load conversation ── */
    const { data: conv } = await service
      .from("agent_conversations")
      .select("id, user_id, title, contract_text, contract_filename")
      .eq("id", params.id)
      .single();
    if (!conv) return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    if (conv.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    /* ── Parse request ── */
    const body = await req.json();
    const userMessage = (body.message as string)?.trim();
    const lang: "en" | "ko" = body.lang === "ko" ? "ko" : "en";
    if (!userMessage) return NextResponse.json({ error: "Message required" }, { status: 400 });
    if (userMessage.length > 10000) return NextResponse.json({ error: "Message too long" }, { status: 400 });

    /* ── Save user message ── */
    await service.from("agent_messages").insert({
      conversation_id: conv.id,
      role: "user",
      content: userMessage,
    });

    /* ── Load full message history (after the new user message) ── */
    const { data: history } = await service
      .from("agent_messages")
      .select("role, content")
      .eq("conversation_id", conv.id)
      .order("created_at", { ascending: true });

    const messages: Anthropic.MessageParam[] = (history ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    }));

    /* ── System prompt with optional contract context ── */
    let systemPrompt = lang === "ko" ? SYSTEM_PROMPT_KO : SYSTEM_PROMPT_EN;
    if (conv.contract_text) {
      const heading = lang === "ko"
        ? `\n\n[참조 계약서: ${conv.contract_filename || "첨부 문서"}]\n`
        : `\n\n[Reference contract: ${conv.contract_filename || "Attached document"}]\n`;
      systemPrompt += heading + conv.contract_text.slice(0, 25000);
    }

    /* ── Call Claude ── */
    const response = await client.messages.create({
      model: "claude-sonnet-4-20250514",
      max_tokens: 2048,
      temperature: 0.3,
      system: systemPrompt,
      messages,
    });

    const assistantText = response.content
      .filter((b) => b.type === "text")
      .map((b) => (b.type === "text" ? b.text : ""))
      .join("\n")
      .trim();

    /* ── Save assistant message ── */
    await service.from("agent_messages").insert({
      conversation_id: conv.id,
      role: "assistant",
      content: assistantText,
    });

    /* ── Auto-generate title if this is the first user message ── */
    let newTitle: string | undefined = undefined;
    if (history && history.length <= 1) {
      // history includes the user's first message we just inserted
      try {
        const titleResp = await client.messages.create({
          model: "claude-sonnet-4-20250514",
          max_tokens: 50,
          temperature: 0.3,
          system: lang === "ko" ? TITLE_PROMPT_KO : TITLE_PROMPT_EN,
          messages: [{ role: "user", content: userMessage.slice(0, 500) }],
        });
        const generated = titleResp.content
          .filter((b) => b.type === "text")
          .map((b) => (b.type === "text" ? b.text : ""))
          .join("")
          .trim()
          .replace(/^["'`]|["'`]$/g, "")
          .slice(0, 60);
        if (generated) {
          newTitle = generated;
          await service
            .from("agent_conversations")
            .update({ title: newTitle, updated_at: new Date().toISOString() })
            .eq("id", conv.id);
        }
      } catch { /* ignore title gen errors */ }
    } else {
      await service
        .from("agent_conversations")
        .update({ updated_at: new Date().toISOString() })
        .eq("id", conv.id);
    }

    /* ── Update usage ── */
    await service.from("profiles").update({
      agent_used: sameMonth ? agentUsed + 1 : 1,
      scan_month: currentMonth,
    }).eq("id", user.id);

    return NextResponse.json({
      assistant: assistantText,
      agentUsed: agentUsed + 1,
      agentLimit: limit,
      newTitle,
    });
  } catch (err: unknown) {
    console.error("Agent message error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
