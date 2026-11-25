import { createHmac } from "crypto";

const JWT_SECRET: string = (() => {
  const secret = process.env.NEXTAUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXTAUTH_SECRET is required in production");
  }
  return "dev-secret-do-not-use-in-production";
})();
const COOKIE_NAME = "basnet-auth-token";
const TOKEN_EXPIRY = 60 * 60 * 24 * 7; // 7 days

export { JWT_SECRET, COOKIE_NAME, TOKEN_EXPIRY };

export function base64url(input: Buffer | string): string {
  return Buffer.from(input).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function signToken(payload: object): string {
  const header = base64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const encodedPayload = base64url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1000) + TOKEN_EXPIRY }));
  const signature = createHmac("sha256", JWT_SECRET).update(`${header}.${encodedPayload}`).digest();
  return `${header}.${encodedPayload}.${base64url(signature)}`;
}

export interface JWTPayload {
  sub: string;
  email: string;
  role: string;
  name: string;
}

export function verifyToken(token: string): JWTPayload | null {
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

export function getTokenFromRequest(req: { cookies: { get: (name: string) => { value?: string } | undefined }; headers: { get: (name: string) => string | null } }): string | null {
  const auth = req.headers.get("authorization");
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (cookie) return cookie;
  return null;
}
