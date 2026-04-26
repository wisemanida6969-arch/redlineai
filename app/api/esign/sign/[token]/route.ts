import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { createServiceClient } from "@/lib/supabase/server";

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

interface SignField {
  type: "signature" | "name" | "date";
  page: number;
  x: number;
  y: number;
  width: number;
  height: number;
}

/* GET — Fetch document for signer (public, token-based) */
export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const service = createServiceClient();
  const { data: request } = await service
    .from("signature_requests")
    .select("id, title, filename, storage_path, status, signer_email, signer_name, fields, signed_at")
    .eq("token", params.token)
    .single();

  if (!request) return NextResponse.json({ error: "Invalid or expired link" }, { status: 404 });

  // Get a signed URL to the original PDF for the signer's browser to fetch
  const { data: signedUrl } = await service.storage
    .from("esign-documents")
    .createSignedUrl(request.storage_path, 60 * 30); // 30 min

  return NextResponse.json({
    id: request.id,
    title: request.title,
    filename: request.filename,
    pdfUrl: signedUrl?.signedUrl,
    status: request.status,
    signerEmail: request.signer_email,
    signerName: request.signer_name,
    fields: request.fields,
    signedAt: request.signed_at,
  });
}

/* POST — Submit signature */
export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const service = createServiceClient();
    const { data: request } = await service
      .from("signature_requests")
      .select("id, user_id, title, filename, storage_path, status, signer_email, signer_name, fields")
      .eq("token", params.token)
      .single();

    if (!request) return NextResponse.json({ error: "Invalid signing link" }, { status: 404 });
    if (request.status !== "pending") {
      return NextResponse.json({ error: "This document has already been signed." }, { status: 400 });
    }

    const body = await req.json();
    const signatureDataUrl = body.signature as string | undefined;
    if (!signatureDataUrl?.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
    }

    // ── Fetch original PDF ──
    const { data: originalBlob } = await service.storage
      .from("esign-documents")
      .download(request.storage_path);
    if (!originalBlob) return NextResponse.json({ error: "Document not found" }, { status: 404 });

    const originalBytes = await originalBlob.arrayBuffer();
    const pdfDoc = await PDFDocument.load(originalBytes);

    // ── Embed signature image ──
    const sigBase64 = signatureDataUrl.split(",")[1];
    const sigBytes = Buffer.from(sigBase64, "base64");
    const isPng = signatureDataUrl.startsWith("data:image/png");
    const sigImage = isPng
      ? await pdfDoc.embedPng(sigBytes)
      : await pdfDoc.embedJpg(sigBytes);

    const helvetica = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const pages = pdfDoc.getPages();
    const today = new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

    const fields = request.fields as SignField[];
    for (const field of fields) {
      const page = pages[field.page - 1];
      if (!page) continue;
      const { width: pw, height: ph } = page.getSize();

      // PDF coordinates: origin bottom-left. Our stored y is from top, so flip:
      const xAbs = field.x * pw;
      const wAbs = field.width * pw;
      const hAbs = field.height * ph;
      const yAbsTop = field.y * ph;
      const yAbs = ph - yAbsTop - hAbs;

      if (field.type === "signature") {
        page.drawImage(sigImage, {
          x: xAbs, y: yAbs, width: wAbs, height: hAbs,
        });
      } else if (field.type === "name") {
        page.drawText(request.signer_name, {
          x: xAbs, y: yAbs + hAbs / 3,
          size: Math.min(14, hAbs * 0.6),
          font: helvetica, color: rgb(0.1, 0.1, 0.15),
        });
      } else if (field.type === "date") {
        page.drawText(today, {
          x: xAbs, y: yAbs + hAbs / 3,
          size: Math.min(12, hAbs * 0.6),
          font: helvetica, color: rgb(0.1, 0.1, 0.15),
        });
      }
    }

    // ── Audit footer on last page ──
    const lastPage = pages[pages.length - 1];
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown";
    const auditText = `Signed by ${request.signer_name} (${request.signer_email}) · ${today} · IP ${ip}`;
    lastPage.drawText(auditText, {
      x: 36, y: 14, size: 7, font: helvetica, color: rgb(0.45, 0.5, 0.6),
    });

    // ── Save & upload completed PDF ──
    const completedBytes = await pdfDoc.save();
    const completedPath = request.storage_path.replace("/original.pdf", "/signed.pdf");
    const { error: uploadErr } = await service.storage
      .from("esign-documents")
      .upload(completedPath, Buffer.from(completedBytes), {
        contentType: "application/pdf",
        upsert: true,
      });
    if (uploadErr) {
      console.error("Signed upload error:", uploadErr);
      return NextResponse.json({ error: "Failed to save signed document." }, { status: 500 });
    }

    // ── Update DB ──
    await service.from("signature_requests").update({
      status: "signed",
      signed_at: new Date().toISOString(),
      signed_ip: ip,
      signature_image: signatureDataUrl,
      signed_storage_path: completedPath,
    }).eq("id", request.id);

    // ── Notify owner ──
    const resend = getResend();
    if (resend) {
      const { data: ownerProfile } = await service
        .from("profiles").select("id").eq("id", request.user_id).single();
      void ownerProfile;
      const { data: ownerUser } = await service.auth.admin.getUserById(request.user_id);
      const ownerEmail = ownerUser?.user?.email;

      if (ownerEmail) {
        try {
          await resend.emails.send({
            from: "RedlineAI <noreply@getredlineai.com>",
            to: ownerEmail,
            subject: `${request.signer_name} signed "${request.title}"`,
            html: `
              <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f7fafc;">
                <div style="background:#fff;border-radius:16px;padding:32px;border:1px solid #e2e8f0;">
                  <h1 style="font-size:22px;color:#0f172a;margin:0 0 8px;">✍️ Document signed!</h1>
                  <p style="color:#475569;font-size:14px;line-height:1.6;">
                    <strong>${request.signer_name}</strong> (${request.signer_email}) just signed
                    <strong>${request.title}</strong>.
                  </p>
                  <p style="color:#475569;font-size:13px;line-height:1.6;">
                    Sign in to your dashboard to download the completed PDF.
                  </p>
                  <a href="${process.env.NEXT_PUBLIC_SITE_URL || "https://getredlineai.com"}/dashboard" style="display:inline-block;background:#e53e3e;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:14px;">Open Dashboard →</a>
                </div>
              </div>
            `,
          });
        } catch (e) { console.warn("Owner notify failed:", e); }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    console.error("Sign error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
