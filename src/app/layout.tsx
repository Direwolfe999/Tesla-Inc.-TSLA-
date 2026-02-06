"use client";

import { DM_Sans } from "next/font/google";
import "./globals.css";
import Header from "@/components/Layout/Header";
import Footer from "@/components/Layout/Footer";
import { ThemeProvider } from "next-themes";
import ScrollToTop from "@/components/ScrollToTop";
import Aoscompo from "@/utils/aos";
import ToasterContext from "@/app/api/contex/ToasetContex";
import "swiper/css";
import { usePathname } from "next/navigation"; // Import this

import LayoutWrapper from "@/components/LayoutWrapper";

const font = DM_Sans({ subsets: ["latin"] });

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${font.className} bg-white dark:bg-[#050505]`}>
        <ThemeProvider
          attribute="class"
          enableSystem={true}
          defaultTheme="dark"
        >
          <Aoscompo>
            {/* The Wrapper below now handles the logic you pasted! */}
            <LayoutWrapper>{children}</LayoutWrapper>
          </Aoscompo>
          <ToasterContext />
          {/* <ScrollToTop /> */}
        </ThemeProvider>
      </body>
    </html>
  );
}