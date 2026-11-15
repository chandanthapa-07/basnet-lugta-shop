import type { Metadata } from "next";
import { DM_Sans, Manrope } from "next/font/google";
import "../globals.css";
import { StoreProvider } from "@/app/store/StoreProvider";
import { ToastProvider } from "@/app/components/Toast";
import Header from "@/app/components/Header";
import Footer from "@/app/components/Footer";
import AuthModal from "@/app/components/AuthModal";
import BagDrawer from "@/app/components/BagDrawer";
import BackToTop from "@/app/components/BackToTop";

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Basnet Lugta Shop",
  description: "Buddhist clothing from Kathmandu, Nepal",
};

export default function SiteLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${dmSans.variable} ${manrope.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-white text-[var(--foreground)]">
        <ToastProvider>
          <StoreProvider>
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
            <AuthModal />
            <BagDrawer />
            <BackToTop />
          </StoreProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
