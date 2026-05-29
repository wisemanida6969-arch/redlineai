import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/** GET — fetch single conversation with messages */
export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { data: conv } = await service
    .from("agent_conversations")
    .select("id, user_id, title, contract_text, contract_filename, created_at, updated_at")
    .eq("id", params.id)
    .single();

  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (conv.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: messages } = await service
    .from("agent_messages")
    .select("id, role, content, created_at")
    .eq("conversation_id", conv.id)
    .order("created_at", { ascending: true });

  return NextResponse.json({
    conversation: {
      id: conv.id,
      title: conv.title,
      contractFilename: conv.contract_filename,
      hasContract: !!conv.contract_text,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
    },
    messages: messages ?? [],
  });
}

/** DELETE — delete conversation */
export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { data: conv } = await service
    .from("agent_conversations")
    .select("user_id")
    .eq("id", params.id)
    .single();

  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (conv.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await service.from("agent_conversations").delete().eq("id", params.id);
  return NextResponse.json({ success: true });
}

/** PATCH — update conversation title */
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim().slice(0, 80) : null;
  if (!title) return NextResponse.json({ error: "Title required" }, { status: 400 });

  const service = createServiceClient();
  const { data: conv } = await service
    .from("agent_conversations")
    .select("user_id")
    .eq("id", params.id)
    .single();

  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (conv.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  await service
    .from("agent_conversations")
    .update({ title, updated_at: new Date().toISOString() })
    .eq("id", params.id);

  return NextResponse.json({ success: true });
}
