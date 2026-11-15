import { getPayload } from "payload";

let initPromise: Promise<any> | null = null;

async function getP() {
  if (!initPromise) {
    initPromise = (async () => {
      const config = (await import("../../payload.config")).default;
      return getPayload({ config });
    })();
  }
  return initPromise;
}

export async function getProducts() {
  try {
    const p = await getP();
    const res = await p.find({
      collection: "products",
      where: { visible: { equals: true } },
      sort: "-featured",
      limit: 100,
      pagination: false,
    });
    return res.docs ?? [];
  } catch (e) {
    console.error("getProducts failed", e);
    return [];
  }
}

export async function searchProducts(query: string) {
  if (!query) return [];
  try {
    const p = await getP();
    const res = await p.find({
      collection: "products",
      where: {
        or: [
          { name: { contains: query } },
          { description: { contains: query } },
          { category: { contains: query } },
        ],
        visible: { equals: true },
      },
      limit: 50,
      pagination: false,
    });
    return res.docs ?? [];
  } catch (e) {
    console.error("searchProducts failed", e);
    return [];
  }
}

export async function getProductsByCategory(category: string) {
  if (!category || category === "All clothing") return getProducts();
  try {
    const p = await getP();
    const res = await p.find({
      collection: "products",
      where: { category: { equals: category }, visible: { equals: true } },
      sort: "-featured",
      limit: 100,
      pagination: false,
    });
    return res.docs ?? [];
  } catch (e) {
    console.error("getProductsByCategory failed", e);
    return [];
  }
}

export async function getProduct(id: string) {
  try {
    const p = await getP();
    return await p.findByID({ collection: "products", id });
  } catch {
    return null;
  }
}

export async function getRelatedProducts(id: string, category: string, limit = 4) {
  try {
    const p = await getP();
    const res = await p.find({
      collection: "products",
      where: {
        and: [
          { id: { not_equals: id } },
          { category: { equals: category } },
          { visible: { equals: true } },
        ],
      },
      sort: "-featured",
      limit,
      pagination: false,
    });
    return res.docs ?? [];
  } catch {
    return [];
  }
}

export async function getCustomerByEmail(email: string) {
  try {
    const p = await getP();
    const res = await p.find({
      collection: "customers",
      where: { email: { equals: email } },
      limit: 1,
      pagination: false,
    });
    return res.docs[0] ?? null;
  } catch {
    return null;
  }
}

export async function getCustomerOrders(customerId: string) {
  try {
    const p = await getP();
    const res = await p.find({
      collection: "orders",
      where: { customer: { equals: customerId } },
      sort: "-createdAt",
      limit: 50,
      pagination: false,
    });
    return res.docs ?? [];
  } catch {
    return [];
  }
}

export async function getOrderById(id: string) {
  try {
    const p = await getP();
    return await p.findByID({ collection: "orders", id });
  } catch {
    return null;
  }
}

export async function createOrder(data: {
  orderNumber: string;
  customer: string;
  items: Array<{
    product: string;
    name: string;
    price: number;
    quantity: number;
    image: string;
  }>;
  subtotal: number;
  shipping: {
    name: string;
    phone: string;
    district: string;
    email: string;
    address: string;
    landmark?: string;
    note?: string;
  };
}) {
  try {
    const p = await getP();
    return await p.create({
      collection: "orders",
      data: {
        orderNumber: data.orderNumber,
        customer: data.customer,
        items: data.items,
        subtotal: data.subtotal,
        status: "New",
        paymentStatus: "Unpaid",
        paymentMethod: "Cash on delivery",
        shipping: data.shipping,
      },
    });
  } catch (e) {
    console.error("createOrder failed", e);
    throw e;
  }
}

export function productImageUrl(product: any): string {
  const img = product?.image;
  if (!img) return "";
  if (typeof img === "string") return img;
  if (img.sizes?.card?.url) return img.sizes.card.url;
  if (img.sizes?.thumbnail?.url) return img.sizes.thumbnail.url;
  return img.url ?? "";
}

export function productAlt(product: any): string {
  const img = product?.image;
  if (!img) return product?.name ?? "";
  if (typeof img === "string") return product?.name ?? "";
  return img.alt || product?.name || "";
}

export function formatNPR(amount: number): string {
  return `रु ${amount.toLocaleString("en-NP")}`;
}