"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const noHeaderFooterRoutes = ["/profile", "/settings"];

  return (
    <>
      {!noHeaderFooterRoutes.includes(pathname) && <Header />}
      {children}
      {!noHeaderFooterRoutes.includes(pathname) && <Footer />}
    </>
  );
}
