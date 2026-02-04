"use client";

import Image from "next/image";
import Link from "next/link";

const Logo = () => {
  return (
    <Link href="/" className="block">
      {/* This logo shows ONLY in LIGHT mode (Logo for dark backgrounds) */}
      <Image
        src="/images/logo/logo-dark1.png"
        alt="logo"
        width={130}
        height={30}
        className="dark:hidden h-6 w-auto object-contain"
      />
      {/* This logo shows ONLY in DARK mode (White logo) */}
      <Image
        src="/images/logo/logo-white.svg"
        alt="logo"
        width={130}
        height={30}
        className="hidden dark:block h-6 w-auto object-contain"
      />
    </Link>
  );
};

export default Logo;
