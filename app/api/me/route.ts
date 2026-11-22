import { NextResponse } from "next/server";
import { getCustomerByEmail, getCustomerOrders } from "@/app/lib/payload";
import { verifyToken, getTokenFromRequest, COOKIE_NAME } from "@/app/lib/auth";

export async function GET(req: Request) {
  const token = getTokenFromRequest(req as any);
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
