import { getProducts } from "@/app/lib/payload";

export async function GET() {
  const products = await getProducts();
  return Response.json(products);
}