import { NextRequest, NextResponse } from "next/server";
import { getCustomerByEmail, getCustomerOrders } from "@/app/lib/payload";
import { createHmac } from "crypto";

const JWT_SECRET = process.env.NEXTAUTH_SECRET || "dev-secret-change-me";
const COOKIE_NAME = "basnet-auth-token";

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
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

export async function GET(req: NextRequest) {
  const cookieToken = req.cookies.get(COOKIE_NAME)?.value;
  const authHeader = req.headers.get("authorization");
  const headerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  
  const token = cookieToken || headerToken;
  
  if (!token) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const customer = await getCustomerByEmail(payload.email);
    if (!customer) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }
    const orders = await getCustomerOrders(String(customer.id));
    return NextResponse.json({ customer, orders });
  } catch {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
}
