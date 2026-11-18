import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import { createHmac, randomBytes } from "crypto";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-change-me";
const RESET_TOKEN_EXPIRY = 60 * 60 * 1000; // 1 hour

async function getP() {
  const config = (await import("../../../../payload.config")).default;
  return getPayload({ config });
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, limit = 3, windowMs = 60 * 60 * 1000): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);
  if (!entry || now > entry.resetAt) {
    rateLimitMap.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }
  if (entry.count >= limit) return false;
  entry.count++;
  return true;
}

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  if (!checkRateLimit(`forgot:${ip}`, 3, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { email } = body;
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 });

    const p = await getP();
    const res = await p.find({ 
      collection: "customers", 
      where: { email: { equals: email } }, 
      limit: 1, 
      pagination: false 
    });
    const customer = res.docs[0];
    
    // Always return success to prevent email enumeration
    if (!customer) {
      return NextResponse.json({ ok: true });
    }

    const resetToken = randomBytes(32).toString("hex");
    const hashedToken = createHmac("sha256", JWT_SECRET).update(resetToken).digest("hex");
    const expiresAt = new Date(Date.now() + RESET_TOKEN_EXPIRY).toISOString();

    await p.update({
      collection: "customers",
      id: customer.id,
      data: {
        passwordResetToken: hashedToken,
        passwordResetExpires: expiresAt,
      },
    });

    const resetUrl = `${process.env.NEXT_PUBLIC_SERVER_URL || "http://localhost:3000"}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
    console.log(`[DEV] Password reset for ${email}: ${resetUrl}`);

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    console.error("forgot-password error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
