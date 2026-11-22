import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import AuthModal from "@/app/components/AuthModal";
import BagDrawer from "@/app/components/BagDrawer";
import BackToTop from "@/app/components/BackToTop";

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <AuthModal />
      <BagDrawer />
      <BackToTop />
    </>
  );
}
