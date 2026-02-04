"use client";

import React, { FC } from "react";
import Link from "next/link";
import { headerData } from "../Header/Navigation/menuData";
import { footerlabels } from "@/app/api/data";
import { Icon } from "@iconify/react";
import Logo from "../Header/Logo";

const Footer: FC = () => {
  return (
    <footer className="bg-gray-50 dark:bg-darkmode border-t border-gray-200 dark:border-dark_border text-black dark:text-white transition-colors duration-300">
      <div className="container mx-auto lg:max-w-screen-xl md:max-w-screen-md px-4 py-16">
        <div className="grid grid-cols-1 sm:grid-cols-12 lg:gap-20 md:gap-12 sm:gap-12 gap-8">
          {/* Logo & Socials */}
          <div className="lg:col-span-4 md:col-span-6 col-span-12 flex flex-col">
            <Logo />
            <div className="flex gap-4 items-center mt-6">
              <Link href="#" className="group">
                <Icon
                  icon="fa6-brands:facebook-f"
                  width="24"
                  height="24"
                  className="text-gray-600 dark:text-white group-hover:text-primary transition-colors"
                />
              </Link>
              <Link href="#" className="group">
                <Icon
                  icon="fa6-brands:instagram"
                  width="24"
                  height="24"
                  className="text-gray-600 dark:text-white group-hover:text-primary transition-colors"
                />
              </Link>
              <Link href="#" className="group">
                <Icon
                  icon="fa6-brands:x-twitter"
                  width="24"
                  height="24"
                  className="text-gray-600 dark:text-white group-hover:text-primary transition-colors"
                />
              </Link>
            </div>
            <div className="mt-8 text-sm space-y-2 text-gray-600 dark:text-gray-400">
              <p>© 2026 Tesla, Inc (TSLA). All rights reserved.</p>
              <p>
                Distributed by{" "}
                <a
                  href="#"
                  target="_blank"
                  className="text-primary hover:underline"
                >
                  Tesla, Inc (TSLA)
                </a>
              </p>
            </div>
          </div>

          {/* Quick Links */}
          <div className="lg:col-span-2 md:col-span-3 col-span-6">
            <h4 className="mb-4 font-semibold text-lg text-black dark:text-white">
              Links
            </h4>
            <ul className="space-y-3">
              {headerData.map((item, index) => (
                <li key={index}>
                  <Link
                    href={item.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Information */}
          <div className="lg:col-span-2 md:col-span-3 col-span-6">
            <h4 className="mb-4 font-semibold text-lg text-black dark:text-white">
              Information
            </h4>
            <ul className="space-y-3">
              {footerlabels.map((item, index) => (
                <li key={index}>
                  <Link
                    href={item.href}
                    className="text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors text-sm"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Subscribe */}
          <div className="lg:col-span-4 md:col-span-4 col-span-12 mt-6 md:mt-0">
            <h4 className="font-semibold text-lg text-black dark:text-white">
              Subscribe
            </h4>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-2">
              Subscribe to get the latest news from us
            </p>
            <div className="relative mt-4 w-full md:w-80">
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                className="bg-white dark:bg-transparent border border-gray-300 dark:border-dark_border py-3 text-black dark:text-white rounded-lg w-full px-4 focus:outline-none focus:border-primary transition-all shadow-sm dark:shadow-none"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 dark:text-white hover:text-primary transition-colors">
                <Icon icon="tabler:send" width="24" height="24" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer Bottom */}
        <div className="border-t border-gray-200 dark:border-dark_border mt-12 pt-6 text-center text-gray-500 text-sm">
          Designed & Built by Tesla Team
        </div>
      </div>
    </footer>
  );
};

export default Footer;
