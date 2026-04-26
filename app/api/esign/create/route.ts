import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { PLAN_LIMITS, type Plan } from "@/lib/planLimits";
import crypto from "crypto";

function getResend() {
  if (!process.env.RESEND_API_KEY) return null;
  return new Resend(process.env.RESEND_API_KEY);
}

interface SignField {
  type: "signature" | "name" | "date";
  page: number;       // 1-based
  x: number;          // 0..1 (fraction of page width)
  y: number;          // 0..1 (fraction of page height, top-down)
  width: number;      // 0..1
  height: number;     // 0..1
}

export async function POST(req: NextRequest) {
  try {
    // ── Auth ──
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Please sign in." }, { status: 401 });

    // ── Plan check (Business only) ──
    const service = createServiceClient();
    const { data: profile } = await service
      .from("profiles")
      .select("plan, esign_used, scan_month")
      .eq("id", user.id)
      .single();

    const plan = (profile?.plan ?? "free") as Plan;
    const limit = PLAN_LIMITS[plan].esign;
    if (limit === 0) {
      return NextResponse.json({
        error: "E-Signature is a Business feature. Upgrade to Business ($99/mo) to unlock.",
        limitReached: true,
      }, { status: 403 });
    }

    const currentMonth = new Date().toISOString().slice(0, 7);
    const sameMonth = profile?.scan_month === currentMonth;
    const used = sameMonth ? (profile?.esign_used ?? 0) : 0;

    if (limit !== null && used >= limit) {
      return NextResponse.json({
        error: `You've used all ${limit} E-Signature requests this month.`,
        limitReached: true,
      }, { status: 403 });
    }

    // ── Parse multipart ──
    const form = await req.formData();
    const file = form.get("file") as File | null;
    const title = form.get("title") as string | null;
    const signerEmail = form.get("signerEmail") as string | null;
    const signerName = form.get("signerName") as string | null;
    const fieldsRaw = form.get("fields") as string | null;

    if (!file) return NextResponse.json({ error: "Missing PDF file." }, { status: 400 });
    if (!signerEmail) return NextResponse.json({ error: "Signer email is required." }, { status: 400 });
    if (!signerName) return NextResponse.json({ error: "Signer name is required." }, { status: 400 });
    if (!fieldsRaw) return NextResponse.json({ error: "Missing signature fields." }, { status: 400 });

    let fields: SignField[];
    try {
      fields = JSON.parse(fieldsRaw);
    } catch {
      return NextResponse.json({ error: "Invalid fields JSON." }, { status: 400 });
    }
    if (!Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json({ error: "Add at least one signature field." }, { status: 400 });
    }

    // PDF validation
    if (!file.name.toLowerCase().endsWith(".pdf") && file.type !== "application/pdf") {
      return NextResponse.json({ error: "Only PDF files are supported for e-signature." }, { status: 400 });
    }

    // ── Upload to Storage ──
    const requestId = crypto.randomUUID();
    const storagePath = `${user.id}/${requestId}/original.pdf`;
    const buffer = Buffer.from(await file.arrayBuffer());

    const { error: uploadError } = await service.storage
      .from("esign-documents")
      .upload(storagePath, buffer, { contentType: "application/pdf", upsert: false });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
      return NextResponse.json({ error: "Failed to store document." }, { status: 500 });
    }

    // ── Create DB record ──
    const token = crypto.randomBytes(32).toString("hex");
    const { error: insertError } = await service.from("signature_requests").insert({
      id: requestId,
      user_id: user.id,
      title: title || file.name,
      filename: file.name,
      storage_path: storagePath,
      status: "pending",
      signer_email: signerEmail.trim().toLowerCase(),
      signer_name: signerName.trim(),
      fields,
      token,
    });

    if (insertError) {
      console.error("Insert error:", insertError);
      // best-effort cleanup
      await service.storage.from("esign-documents").remove([storagePath]);
      return NextResponse.json({ error: "Failed to create signing request." }, { status: 500 });
    }

    // ── Update usage ──
    await service.from("profiles").update({
      esign_used: sameMonth ? used + 1 : 1,
      scan_month: currentMonth,
    }).eq("id", user.id);

    // ── Send email ──
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://getredlineai.com";
    const signUrl = `${siteUrl}/sign/${token}`;
    const senderName = user.email?.split("@")[0] || "RedlineAI user";

    const resend = getResend();
    if (resend) {
      try {
        await resend.emails.send({
          from: "RedlineAI <noreply@getredlineai.com>",
          to: signerEmail,
          subject: `${senderName} requests your signature on "${title || file.name}"`,
          html: `
            <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:32px 24px;background:#f7fafc;">
              <div style="background:#fff;border-radius:16px;padding:32px;border:1px solid #e2e8f0;">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:24px;">
                  <span style="font-size:20px;font-weight:700;color:#0f1a2e;">Redline<span style="color:#e53e3e;">AI</span></span>
                </div>
                <h1 style="font-size:22px;color:#0f172a;margin:0 0 8px;">Signature requested</h1>
                <p style="color:#475569;font-size:14px;line-height:1.6;margin:0 0 8px;">
                  <strong>${senderName}</strong> has requested your signature on a document.
                </p>
                <div style="background:#f1f5f9;border-radius:8px;padding:14px 16px;margin:20px 0;">
                  <p style="margin:0;color:#0f172a;font-size:14px;font-weight:600;">${title || file.name}</p>
                </div>
                <a href="${signUrl}" style="display:inline-block;background:#e53e3e;color:#fff;text-decoration:none;padding:13px 28px;border-radius:10px;font-weight:600;font-size:14px;">Review &amp; Sign Document →</a>
                <p style="color:#94a3b8;font-size:12px;margin-top:24px;line-height:1.5;">
                  This signing link is unique to you and expires after the document is signed.
                  If you weren&rsquo;t expecting this email, you can safely ignore it.
                </p>
              </div>
              <p style="text-align:center;color:#94a3b8;font-size:11px;margin-top:16px;">
                Powered by RedlineAI · getredlineai.com
              </p>
            </div>
          `,
        });
      } catch (emailErr) {
        console.warn("Email send failed:", emailErr);
        // continue — record exists, user can resend later
      }
    }

    return NextResponse.json({
      requestId,
      token,
      signUrl,
      esignUsed: used + 1,
      esignLimit: limit,
    });
  } catch (err: unknown) {
    console.error("Esign create error:", err);
    return NextResponse.json({ error: err instanceof Error ? err.message : "Failed" }, { status: 500 });
  }
}
