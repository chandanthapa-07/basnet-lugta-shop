
import { NextRequest } from "next/server";
import { getCustomerByEmail, getCustomerOrders } from "@/app/lib/payload";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
  const token = auth.slice(7);
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString());
    const email = payload?.email;
    if (!email) return Response.json({ error: "Unauthorized" }, { status: 401 });
    const customer = await getCustomerByEmail(email);
    if (!customer) return Response.json({ error: "Not found" }, { status: 404 });
    const orders = await getCustomerOrders(String(customer.id));
    return Response.json({ customer, orders });
  } catch {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }
}
