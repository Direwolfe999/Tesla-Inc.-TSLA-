"use client";

import { useState } from "react";
import Link from "next/link";
import { HeaderItem } from "../../../../types/menu";

const MobileHeaderLink: React.FC<{ item: HeaderItem }> = ({ item }) => {
  const [submenuOpen, setSubmenuOpen] = useState(false);

  const handleToggle = () => {
    setSubmenuOpen(!submenuOpen);
  };

  return (
    <div className="relative w-full border-b border-black/5 dark:border-white/5">
      <Link
        href={item.href}
        onClick={item.submenu ? handleToggle : undefined}
        className="
          flex items-center justify-between w-full py-4 
          /* Premium Tesla Typography */
          text-sm font-bold uppercase tracking-widest
          /* Light Mode: Midnight Slate for the Steel BG */
          text-[#0F172A] hover:text-emerald-800
          /* Dark Mode: Clean White */
          dark:text-white/90 dark:hover:text-primary
          transition-all duration-300 focus:outline-none
        "
      >
        {item.label}
        {item.submenu && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="1.5em"
            height="1.5em"
            viewBox="0 0 24 24"
            className={`transition-transform duration-300 ${submenuOpen ? "rotate-180" : ""}`}
          >
            <path
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m7 10l5 5l5-5"
            />
          </svg>
        )}
      </Link>

      {/* Submenu Logic */}
      {submenuOpen && item.submenu && (
        <div className="bg-black/5 dark:bg-white/5 rounded-lg mb-4 px-4 overflow-hidden">
          {item.submenu.map((subItem, index) => (
            <Link
              key={index}
              href={subItem.href}
              className="
                block py-3 text-xs font-bold uppercase tracking-wider
                text-gray-600 dark:text-gray-400 
                hover:text-emerald-800 dark:hover:text-primary
                transition-colors
              "
            >
              {subItem.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default MobileHeaderLink;
