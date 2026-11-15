import { getProducts } from "@/app/lib/payload";
import { Suspense } from "react";
import Header from "@/app/components/Header";
import Hero from "@/app/components/Hero";
import Benefits from "@/app/components/Benefits";
import ShopSection from "@/app/components/ShopSection";
import Collections from "@/app/components/Collections";
import OurStory from "@/app/components/OurStory";
import Footer from "@/app/components/Footer";
import AuthModal from "@/app/components/AuthModal";
import BagDrawer from "@/app/components/BagDrawer";
import MobileDock from "@/app/components/MobileDock";
import BackToTop from "@/app/components/BackToTop";
export default async function Home({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const products = q ? [] : await getProducts();

  return (
    <main>
      <Header />
      <Hero />
      <Benefits />
      <ShopSection products={products} />
      <Collections />
      <OurStory />
      <Footer />
      <AuthModal />
      <BagDrawer />
      <MobileDock />
      <BackToTop />
    </main>
  );
}