import { NextResponse } from "next/server";
import { genOtp, hashOtp } from "@/lib/otp";
import { kvSet } from "@/lib/store";
import { enforceCooldown, incrementWithTtl } from "@/lib/rateLimit";
import { normalizeMsisdn, isValidMsisdn } from "@/lib/sanitize";
import { validateModelIdAsync, validateIssueIdAsync } from "@/lib/quote";
import { sendWhatsAppOTP } from "@/lib/wa";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const body = await req.json();
    const phone = normalizeMsisdn(body.phone || "");
    const modelId = String(body.modelId || "");
    const issueId = String(body.issueId || "");

    if (!isValidMsisdn(phone)) return NextResponse.json({ ok: false, error: "Invalid phone number" }, { status: 400 });
    const [validModel, validIssue] = await Promise.all([validateModelIdAsync(modelId), validateIssueIdAsync(issueId)]);
    if (!validModel || !validIssue) return NextResponse.json({ ok: false, error: "Invalid selection" }, { status: 400 });

    // IP rate limit: max 30 requests / hour
    const ipCount = await incrementWithTtl(`rl:ip:${ip}`, 60 * 60 * 1000);
    if (ipCount > 30) return NextResponse.json({ ok: false, error: "Too many requests" }, { status: 429 });

    // Phone cooldown: 60s between sends
    const cd = await enforceCooldown(`cd:phone:${phone}`, 60 * 1000);
    if (!cd.ok) return NextResponse.json({ ok: false, error: `Please wait ${Math.ceil(cd.waitMs / 1000)}s` }, { status: 429 });

    const code = genOtp();
    const hashed = hashOtp(code);

    // store OTP record (5 minutes)
    const now = Date.now();
    await kvSet(`otp:${phone}`, {
      hashedCode: hashed,
      phone,
      modelId,
      issueId,
      expiresAt: now + 5 * 60 * 1000,
      attempts: 0,
      lockedUntil: null,
      lastSentAt: now
    }, 5 * 60 * 1000);

    await sendWhatsAppOTP(phone, code);

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Server error";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
