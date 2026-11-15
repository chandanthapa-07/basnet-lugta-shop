import { NextRequest } from "next/server";
import { headers } from "next/headers";
import { getPayload } from "payload";
import bcrypt from "bcryptjs";
import { createHmac } from "crypto";

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function signToken(payload: object) {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const encodedPayload = base64url(JSON.stringify(payload));
  const signature = createHmac("sha256", process.env.NEXTAUTH_SECRET || "dev-secret-change-me")
    .update(`${header}.${encodedPayload}`)
    .digest();
  return `${header}.${encodedPayload}.${base64url(signature)}`;
}

async function getP() {
  const config = (await import("../../../payload.config")).default;
  return getPayload({ config });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name } = body;
    if (!email || !password) return Response.json({ error: "Email and password required" }, { status: 400 });

    const p = await getP();

    if (name) {
      if (password.length < 8) return Response.json({ error: "Password must be at least 8 characters" }, { status: 400 });
      const existing = await p.find({ collection: "customers", where: { email: { equals: email } }, limit: 1, pagination: false });
      if (existing.docs.length > 0) return Response.json({ error: "Email already registered" }, { status: 400 });
      const hash = await bcrypt.hash(password, 10);
      const created = await p.create({ collection: "customers", data: { name, email, passwordHash: hash } });
      return Response.json({ ok: true, token: signToken({ sub: created.id, email, role: "customer", name }) });
    }

    const res = await p.find({ collection: "customers", where: { email: { equals: email } }, limit: 1, pagination: false });
    const customer = res.docs[0];
    if (!customer) return Response.json({ error: "Invalid credentials" }, { status: 401 });
    const ok = await bcrypt.compare(password, customer.passwordHash || "");
    if (!ok) return Response.json({ error: "Invalid credentials" }, { status: 401 });
    return Response.json({ ok: true, token: signToken({ sub: customer.id, email, role: "customer", name: customer.name }) });
  } catch (e: any) {
    console.error("auth error", e);
    return Response.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}