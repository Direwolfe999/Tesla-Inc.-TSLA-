"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { headerData } from "./Navigation/menuData";
import Logo from "./Logo";
import HeaderLink from "../Header/Navigation/HeaderLink";
import MobileHeaderLink from "../Header/Navigation/MobileHeaderLink";
import Signin from "@/app/auth/signin/page";
import SignUp from "@/app/auth/signup/page";
import { useTheme } from "next-themes";
import { Icon } from "@iconify/react";
import ThemeToggler from "./ThemeToggler";

const Header: React.FC = () => {
  const { theme } = useTheme();
  const pathname = usePathname();
  const [navbarOpen, setNavbarOpen] = useState(false);
  const [sticky, setSticky] = useState(false);
  const [isSignInOpen, setIsSignInOpen] = useState(false);
  const [isSignUpOpen, setIsSignUpOpen] = useState(false);

  const signInRef = useRef<HTMLDivElement>(null);
  const signUpRef = useRef<HTMLDivElement>(null);
  const mobileMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => setSticky(window.scrollY >= 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isSignInOpen &&
        signInRef.current &&
        !signInRef.current.contains(event.target as Node)
      )
        setIsSignInOpen(false);
      if (
        isSignUpOpen &&
        signUpRef.current &&
        !signUpRef.current.contains(event.target as Node)
      )
        setIsSignUpOpen(false);
      if (
        navbarOpen &&
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node)
      ) {
        const hamburger = document.getElementById("hamburger-toggle");
        if (hamburger && !hamburger.contains(event.target as Node)) {
          setNavbarOpen(false);
        }
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [navbarOpen, isSignInOpen, isSignUpOpen]);

  // Premium Green Gradient
  const gradientPrimary =
    "bg-[#1D6350] dark:bg-gradient-to-r dark:from-primary dark:to-success text-white dark:text-darkmode shadow-lg hover:shadow-primary/30 active:scale-95 transition-all";

  const gradientOutline =
    "border border-black/10 dark:border-white/20 text-black dark:text-white hover:border-primary hover:text-primary transition-all";

  return (
    <header
      className={`fixed top-0 z-40 w-full transition-all duration-300 ${
        sticky
          ? "shadow-xl bg-grey dark:bg-darkmode border-b border-gray-300 dark:border-white/5 py-2"
          : "bg-transparent py-4"
      }`}
    >
      <div className="container mx-auto lg:max-w-screen-xl px-4 md:px-8">
        <div className="flex items-center justify-between">
          <Logo />

          {/* Nav Links */}
          <nav className="hidden lg:flex items-center gap-8">
            {headerData.map((item, index) => (
              <HeaderLink key={index} item={item} />
            ))}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-4">
            <ThemeToggler />

            {pathname !== "/dashboard" && (
              <div className="hidden lg:flex items-center gap-4">
                <button
                  onClick={() => setIsSignInOpen(true)}
                  className={`px-6 py-2 text-sm font-bold rounded-full ${gradientOutline}`}
                >
                  SIGN IN
                </button>

                <button
                  onClick={() => setIsSignUpOpen(true)}
                  className={`px-6 py-2 text-sm font-bold rounded-full ${gradientPrimary}`}
                >
                  SIGN UP
                </button>
              </div>
            )}

            {/* Hamburger (Mobile Toggle) */}
            <button
              id="hamburger-toggle"
              onClick={() => setNavbarOpen(!navbarOpen)}
              className="lg:hidden flex flex-col gap-1.5 p-2 group relative z-[80]"
            >
              <span
                className={`block w-6 h-0.5 transition-all duration-300 ${
                  navbarOpen ? "rotate-45 translate-y-2" : ""
                } ${sticky || theme === "dark" ? "bg-success" : "bg-[#1E2229]"}`}
              ></span>
              <span
                className={`block w-6 h-0.5 transition-all duration-300 ${
                  navbarOpen ? "opacity-0" : "opacity-100"
                } ${sticky || theme === "dark" ? "bg-primary" : "bg-[#3cd278]"}`}
              ></span>
              <span
                className={`block w-6 h-0.5 transition-all duration-300 ${
                  navbarOpen ? "-rotate-45 -translate-y-2" : ""
                } ${sticky || theme === "dark" ? "bg-section" : "bg-[#1E2229]"}`}
              ></span>
            </button>
          </div>
        </div>
      </div>

      {/* Background Overlay for Mobile Menu Outside Click */}
      {navbarOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[65] lg:hidden"
          onClick={() => setNavbarOpen(false)}
        />
      )}

      {/* Mobile Menu */}
      <div
        ref={mobileMenuRef}
        className={`fixed top-0 right-0 h-full w-80 shadow-[-10px_0_30px_rgba(0,0,0,0.1)] transform transition-transform duration-500 z-[70] ${
          navbarOpen ? "translate-x-0" : "translate-x-full"
        } bg-gradient-to-br from-[#E2E8F0] via-[#CBD5E1] to-[#94A3B8] dark:bg-darkmode dark:from-transparent dark:to-transparent border-l border-white/20 overflow-y-auto`}
      >
        <div className="p-8 min-h-full flex flex-col">
          <div className="flex justify-between items-center mb-12">
            <Logo />
          </div>
          <nav className="flex flex-col gap-2">
            {headerData.map((item, index) => (
              <MobileHeaderLink key={index} item={item} />
            ))}
            <div className="mt-8 flex flex-col gap-4">
              <button
                onClick={() => {
                  setIsSignInOpen(true);
                  setNavbarOpen(false);
                }}
                className={`w-full py-3 rounded-xl font-bold ${gradientOutline}`}
              >
                SIGN IN
              </button>
              <button
                onClick={() => {
                  setIsSignUpOpen(true);
                  setNavbarOpen(false);
                }}
                className={`w-full py-3 rounded-xl font-bold ${gradientPrimary}`}
              >
                SIGN UP
              </button>
            </div>
          </nav>
        </div>
      </div>

      {/* Auth Modals - Updated for High-Fidelity SignUp Form */}
      {(isSignInOpen || isSignUpOpen) && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-xl z-[100] flex items-center justify-center p-4 md:p-10">
          <div
            ref={isSignInOpen ? signInRef : signUpRef}
            className={`relative w-full ${
              isSignUpOpen ? "max-w-[1250px]" : "max-w-md"
            } transition-all duration-500 transform`}
          >
            {/* Modal Close Button */}
            <button
              onClick={() => {
                setIsSignInOpen(false);
                setIsSignUpOpen(false);
              }}
              className="absolute -top-12 right-0 md:-top-4 md:-right-12 z-[110] text-white/50 hover:text-primary hover:scale-110 transition-all"
            >
              <Icon icon="solar:close-circle-bold-duotone" width="40" />
            </button>

            <div className="bg-transparent overflow-hidden rounded-[40px] md:rounded-[60px]">
              {isSignInOpen ? (
                <div className="bg-white dark:bg-darkmode p-10 rounded-[40px] border border-white/10 shadow-2xl">
                  <Signin />
                </div>
              ) : (
                /* The SignUp component already handles its own internal styling/layout */
                <SignUp />
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
