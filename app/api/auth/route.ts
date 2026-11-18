import { NextRequest, NextResponse } from "next/server";
import { getPayload } from "payload";
import bcrypt from "bcryptjs";
import { createHmac } from "crypto";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-change-me";
const COOKIE_NAME = "basnet-auth-token";
const TOKEN_EXPIRY = 60 * 60 * 24 * 7; // 7 days

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function signToken(payload: object): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const encodedPayload = base64url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY }));
  const signature = createHmac("sha256", JWT_SECRET).update(`${header}.${encodedPayload}`).digest();
  return `${header}.${encodedPayload}.${base64url(signature)}`;
}

function verifyToken(token: string): { sub: string; email: string; role: string; name: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const expectedSig = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest();
    if (base64url(expectedSig) !== signature) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString());
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return { sub: decoded.sub, email: decoded.email, role: decoded.role, name: decoded.name };
  } catch {
    return null;
  }
}

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
  } catch (e: any) {
    console.error("auth error", e);
    return NextResponse.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}
