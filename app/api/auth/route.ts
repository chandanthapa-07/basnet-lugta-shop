import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import bcrypt from "bcryptjs";
import { signToken, verifyToken, COOKIE_NAME, TOKEN_EXPIRY } from "@/app/lib/auth";

async function getP() {
  const config = (await import("../../../payload.config")).default;
  return getPayload({ config });
}

// Simple in-memory rate limiter (use Redis in production)
const rateLimitMap = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(key: string, limit = 10, windowMs = 60 * 1000): boolean {
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
  
  if (!checkRateLimit(`auth:${ip}`, 15, 60 * 1000)) {
    return NextResponse.json({ error: "Too many requests. Please try again later." }, { status: 429 });
  }

  try {
    const body = await req.json();
    const { email, password, name, confirmPassword } = body;

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const p = await getP();

    if (name) {
      // Registration
      if (password.length < 8) {
        return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
      }
      if (password !== confirmPassword) {
        return NextResponse.json({ error: "Passwords do not match" }, { status: 400 });
      }

      const existing = await p.find({ 
        collection: "customers", 
        where: { email: { equals: email } }, 
        limit: 1, 
        pagination: false 
      });
      if (existing.docs.length > 0) {
        return NextResponse.json({ error: "Email already registered" }, { status: 400 });
      }

      const hash = await bcrypt.hash(password, 12);
      const created = await p.create({ 
        collection: "customers", 
        data: { name, email, passwordHash: hash } 
      });

      const token = signToken({ sub: String(created.id), email, role: "customer", name });

      const res = NextResponse.json({ ok: true, user: { id: created.id, email, name, role: "customer" } });
      res.cookies.set(COOKIE_NAME, token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: TOKEN_EXPIRY,
        path: "/",
      });
      return res;
    }

    // Login
    const res = await p.find({ 
      collection: "customers", 
      where: { email: { equals: email } }, 
      limit: 1, 
      pagination: false 
    });
    const customer = res.docs[0];
    if (!customer) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }
    
    const ok = await bcrypt.compare(password, customer.passwordHash || "");
    if (!ok) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = signToken({ sub: String(customer.id), email, role: "customer", name: customer.name });

    const response = NextResponse.json({ ok: true, user: { id: customer.id, email, name: customer.name, role: "customer" } });
    response.cookies.set(COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: TOKEN_EXPIRY,
      path: "/",
    });
    return response;
  } catch (e) {
    console.error("auth error", e);
    return NextResponse.json({ error: e instanceof Error ? e.message : "Server error" }, { status: 500 });
  }
}
