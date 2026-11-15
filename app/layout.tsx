import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Basnet Lugta Shop",
  description: "Buddhist clothing from Kathmandu, Nepal",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
