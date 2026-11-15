import { getProducts } from "@/app/lib/payload";
import Hero from "@/app/components/Hero";
import Benefits from "@/app/components/Benefits";
import ShopSection from "@/app/components/ShopSection";
import Collections from "@/app/components/Collections";
import OurStory from "@/app/components/OurStory";

export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const products = q ? [] : await getProducts();

  return (
    <>
      <Hero />
      <Benefits />
      <ShopSection products={products} />
      <Collections />
      <OurStory />
    </>
  );
}
