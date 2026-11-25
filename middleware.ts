import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const COOKIE_NAME = "basnet-auth-token";
const JWT_SECRET: string = (() => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET is required in production");
  }
  return "dev-secret-do-not-use-in-production";
})();

function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function verifyToken(token: string): { sub: string; email: string; role: string; name: string } | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [header, payload, signature] = parts;
    const { createHmac } = require("crypto");
    const expectedSig = createHmac("sha256", JWT_SECRET).update(`${header}.${payload}`).digest();
    if (base64url(expectedSig) !== signature) return null;
    const decoded = JSON.parse(Buffer.from(payload, "base64").toString());
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) return null;
    return { sub: decoded.sub, email: decoded.email, role: decoded.role, name: decoded.name };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-pathname", pathname);

  // Protect /admin route - prevent customers from accessing admin
  if (pathname.startsWith("/admin")) {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (token) {
      const payload = verifyToken(token);
      if (payload && payload.role === "customer") {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
    // Let Payload CMS handle admin authentication
    return NextResponse.next({ request: { headers: requestHeaders } });
  }

  // Redirect authenticated users away from auth pages
  if (pathname === "/login" || pathname === "/register" || pathname === "/forgot-password") {
    const token = req.cookies.get(COOKIE_NAME)?.value;
    if (token) {
      const payload = verifyToken(token);
      if (payload && payload.role !== "customer") {
        return NextResponse.redirect(new URL("/admin", req.url));
      }
      if (payload) {
        return NextResponse.redirect(new URL("/", req.url));
      }
    }
  }

  return NextResponse.next({ request: { headers: requestHeaders } });
}

export const config = {
  matcher: ["/admin/:path*", "/login", "/register", "/forgot-password"],
};