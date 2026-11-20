import { getProducts } from "@/app/lib/payload";
import { REST_POST } from "@payloadcms/next/routes";
import config from "../../../payload.config";

export async function GET() {
  const products = await getProducts();
  return Response.json(products);
}

const payloadPost = REST_POST(config);

export async function POST(request: Request) {
  return payloadPost(request, {
    params: Promise.resolve({ slug: ["products"] }),
  });
}