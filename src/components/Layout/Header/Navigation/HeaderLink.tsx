"use client";
import { useState } from "react";
import Link from "next/link";
import { HeaderItem } from "../../../../types/menu";
import { usePathname } from "next/navigation";
import { Icon } from "@iconify/react";

const HeaderLink: React.FC<{ item: HeaderItem }> = ({ item }) => {
  const [submenuOpen, setSubmenuOpen] = useState(false);
  const path = usePathname();

  const handleMouseEnter = () => item.submenu && setSubmenuOpen(true);
  const handleMouseLeave = () => setSubmenuOpen(false);

  return (
    <div
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <Link
        href={item.href}
        className={`text-[16px] flex items-center font-medium transition-colors capitalized hover:text-primary ${
          path === item.href ? "text-primary" : "text-black dark:text-white"
        }`}
      >
        {item.label}
        {item.submenu && <Icon icon="tabler:chevron-down" className="ml-1" />}
      </Link>

      {submenuOpen && (
        <div
          className="absolute py-2 left-0 mt-0.5 w-60 bg-white dark:bg-darkmode shadow-xl rounded-lg border border-gray-100 dark:border-gray-800"
          data-aos="fade-up"
          data-aos-duration="300"
        >
          {item.submenu?.map((subItem, index) => (
            <Link
              key={index}
              href={subItem.href}
              className={`block px-4 py-2 transition-colors ${
                path === subItem.href
                  ? "bg-primary text-white"
                  : "text-black dark:text-white hover:bg-primary hover:text-white"
              }`}
            >
              {subItem.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default HeaderLink;
