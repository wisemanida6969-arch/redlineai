import { NextRequest, NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const service = createServiceClient();
  const { data: request } = await service
    .from("signature_requests")
    .select("user_id, status, filename, signed_storage_path")
    .eq("id", params.id)
    .single();

  if (!request) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (request.user_id !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  if (request.status !== "signed" || !request.signed_storage_path) {
    return NextResponse.json({ error: "Not yet signed" }, { status: 400 });
  }

  const { data: blob } = await service.storage
    .from("esign-documents")
    .download(request.signed_storage_path);
  if (!blob) return NextResponse.json({ error: "File not found" }, { status: 404 });

  const buffer = Buffer.from(await blob.arrayBuffer());
  const safeName = request.filename.replace(/\.pdf$/i, "");

  // ?inline=1 → preview in browser tab (no download dialog)
  const inline = new URL(req.url).searchParams.get("inline") === "1";
  const disposition = inline ? "inline" : "attachment";

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="${safeName}-signed.pdf"`,
      "Content-Length": String(buffer.byteLength),
    },
  });
}
