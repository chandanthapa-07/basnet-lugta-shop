import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import bcrypt from "bcryptjs";
import { createHmac } from "crypto";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-change-me";

async function getP() {
  const config = (await import("../../../../payload.config")).default;
  return getPayload({ config });
}

const rateLimitMap = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(key: string, limit = 10, windowMs = 60 * 60 * 1000): boolean {
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
  if (!checkRateLimit(`reset:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { email, token, password, confirmPassword } = body;

    if (!email || !token || !password || !confirmPassword) {
      return NextResponse.json({ error: "All fields required" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
    }

    const p = await getP();
    const res = await p.find({ 
      collection: "customers", 
      where: { email: { equals: email } }, 
      limit: 1, 
      pagination: false 
    });
    const customer = res.docs[0];
    if (!customer) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    const hashedToken = createHmac("sha256", JWT_SECRET).update(token).digest("hex");
    
    if (customer.passwordResetToken !== hashedToken) {
      return NextResponse.json({ error: "Invalid or expired reset token" }, { status: 400 });
    }

    if (!customer.passwordResetExpires || new Date(customer.passwordResetExpires) < new Date()) {
      return NextResponse.json({ error: "Reset token has expired" }, { status: 400 });
    }

    const hash = await bcrypt.hash(password, 12);

    await p.update({
      collection: "customers",
      id: customer.id,
      data: {
        passwordHash: hash,
        passwordResetToken: null,
        passwordResetExpires: null,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("reset-password error", e);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
