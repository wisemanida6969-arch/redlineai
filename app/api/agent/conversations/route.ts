import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

/** GET — list conversations */
export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { data: conversations } = await service
    .from("agent_conversations")
    .select("id, title, contract_filename, created_at, updated_at")
    .eq("user_id", user.id)
    .order("updated_at", { ascending: false })
    .limit(50);

  return NextResponse.json({ conversations: conversations ?? [] });
}

/** POST — create new conversation */
export async function POST(req: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const title = typeof body.title === "string" && body.title.trim() ? body.title.trim() : "New conversation";
  const contractText = typeof body.contractText === "string" ? body.contractText.slice(0, 30000) : null;
  const contractFilename = typeof body.contractFilename === "string" ? body.contractFilename : null;

  const service = createServiceClient();
  const { data: conv, error } = await service
    .from("agent_conversations")
    .insert({
      user_id: user.id,
      title,
      contract_text: contractText,
      contract_filename: contractFilename,
    })
    .select("id, title, contract_filename, created_at, updated_at")
    .single();

  if (error) {
    console.error("Create conversation error:", error);
    return NextResponse.json({ error: "Failed to create conversation" }, { status: 500 });
  }

  return NextResponse.json({ conversation: conv });
}
