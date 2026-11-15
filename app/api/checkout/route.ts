import { NextRequest } from "next/server";
import { getPayload } from "payload";
import bcrypt from "bcryptjs";
import crypto from "crypto";

async function getP() {
  const config = (await import("../../../payload.config")).default;
  return getPayload({ config });
}

function getToken(req: NextRequest): string | null {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  return auth.slice(7);
}

async function verifyToken(token: string) {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], "base64").toString());
    return payload;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  try {
    const token = getToken(req);
    if (!token) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const payload = await verifyToken(token);
    if (!payload) {
      return Response.json({ error: "Invalid token" }, { status: 401 });
    }

    const body = await req.json();
    const {
      items,
      subtotal,
      shipping,
    } = body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: "Cart is empty" }, { status: 400 });
    }

    if (!subtotal || subtotal < 0) {
      return Response.json({ error: "Invalid subtotal" }, { status: 400 });
    }

    if (!shipping || !shipping.name || !shipping.phone || !shipping.address) {
      return Response.json({ error: "Shipping details are required" }, { status: 400 });
    }

    const p = await getP();

    // Find or create customer
    let customer = await p.find({
      collection: "customers",
      where: { email: { equals: payload.email } },
      limit: 1,
      pagination: false,
    });

    let customerId: string;
    if (customer.docs.length > 0) {
      customerId = String(customer.docs[0].id);
    } else {
      const created = await p.create({
        collection: "customers",
        data: {
          name: payload.name || payload.email,
          email: payload.email,
          passwordHash: "",
        },
      });
      customerId = String(created.id);
    }

    const orderNumber = "ORD-" + crypto.randomBytes(4).toString("hex").toUpperCase();

    const order = await p.create({
      collection: "orders",
      data: {
        orderNumber,
        customer: customerId,
        items: items.map((item: any) => ({
          product: item.product,
          name: item.name,
          price: item.price,
          quantity: item.quantity,
          image: item.image,
        })),
        subtotal,
        status: "New",
        paymentStatus: "Unpaid",
        paymentMethod: "Cash on delivery",
        shipping: {
          name: shipping.name,
          phone: shipping.phone,
          district: shipping.district || "",
          email: shipping.email || payload.email,
          address: shipping.address,
          landmark: shipping.landmark || "",
          note: shipping.note || "",
        },
      },
    });

    return Response.json({ ok: true, orderNumber, orderId: order.id });
  } catch (e: any) {
    console.error("checkout error", e);
    return Response.json({ error: e?.message || "Server error" }, { status: 500 });
  }
}