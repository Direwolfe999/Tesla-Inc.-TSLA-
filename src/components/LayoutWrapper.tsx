"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import ScrollToTop from "@/components/ScrollToTop"; // Import it here instead

export default function LayoutWrapper({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isDashboard = pathname.startsWith("/dashboard");
  const isProfile = pathname.startsWith("/profile");
  const isSettings = pathname.startsWith("/settings");

  const hideLayout = isDashboard || isProfile || isSettings;

  return (
    <>
      {!hideLayout && <Header />}

      {children}

      {!hideLayout && <Footer />}

      {/* Now it only shows on regular pages, and hides on Dashboard */}
      {!hideLayout && <ScrollToTop />}
    </>
  );
}
