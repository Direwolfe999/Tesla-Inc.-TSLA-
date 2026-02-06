"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import CardSlider from "./slider";
import { getImagePrefix } from "@/utils/utils";

const Hero: React.FC = () => {
  const router = useRouter();

  const handleInvest = async () => {
    try {
      const { data } = await supabase.auth.getSession();
      if (data.session) router.push("/dashboard");
      else router.push("/auth/SignUp");
    } catch (err) {
      router.push("/auth/SignUp");
    }
  };
  

  return (
    <section
      className="relative md:pt-40 md:pb-28 py-20 overflow-hidden bg-white dark:bg-darkmode transition-colors duration-300 min-h-screen flex flex-col justify-center"
      id="main-banner"
    >
      {/* --- THE FIX: FOLDER PATH UPDATED TO /videos/ --- */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <video
          autoPlay
          loop
          muted
          playsInline
          key="hero-video"
          className="absolute min-w-full min-h-full object-cover"
          style={{ opacity: 0.3 }}
        >
          {/* Path updated to /videos/ per your folder structure */}
          <source src="/images/videos/vid1.mp4" type="video/mp4" />
          Your browser does not support the video tag.
        </video>

        {/* PREMIUM GRADIENT MASK */}
        <div className="absolute inset-0 bg-gradient-to-r from-white via-white/20 to-white dark:from-darkmode dark:via-transparent dark:to-darkmode" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-transparent to-white dark:from-darkmode dark:via-transparent dark:to-darkmode" />
      </div>

      <div className="container mx-auto lg:max-w-screen-xl px-4 relative z-10 bg-transparent">
        <div className="grid grid-cols-12 items-center">
          <motion.div
            initial={{ x: -50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="lg:col-span-5 col-span-12"
          >
            <div className="flex gap-6 items-center lg:justify-start justify-center mb-6">
              <div className="p-3 bg-primary/20 backdrop-blur-xl rounded-2xl border border-primary/30">
                <Image
                  src={`${getImagePrefix()}images/icons/icon-bag.svg`}
                  alt="icon"
                  width={35}
                  height={35}
                  className="dark:invert-0 invert"
                />
              </div>
              <p className="text-black dark:text-white sm:text-24 text-18 font-semibold tracking-tight">
                Tesla, Inc.{" "}
                <span className="text-primary font-black uppercase text-sm ml-2 px-2 py-1 bg-primary/10 rounded">
                  Live Stock
                </span>
              </p>
            </div>

            <h1 className="font-black lg:text-72 md:text-60 text-40 lg:text-start text-center text-black dark:text-white mb-8 leading-[1.1] tracking-tighter">
              Buy and Sell <span className="text-primary">Crypto</span> Coins{" "}
              <span className="text-primary">with Us</span>!
            </h1>

            <div className="flex items-center md:justify-start justify-center">
              <button
                className="px-12 py-5 rounded-2xl font-black text-sm uppercase tracking-widest bg-[#1D6350] dark:bg-gradient-to-r dark:from-primary dark:to-success text-white dark:text-darkmode shadow-[0_20px_50px_rgba(29,99,80,0.5)] hover:shadow-primary/70 hover:-translate-y-1 active:scale-95 transition-all duration-500"
                onClick={handleInvest}
              >
                INVEST NOW
              </button>
            </div>

            <div className="flex items-center md:justify-start justify-center gap-6 mt-16">
              <Link
                href="#"
                className="hover:-translate-y-1 transition-transform duration-300"
              >
                <Image
                  src={`${getImagePrefix()}images/hero/playstore.png`}
                  alt="Play Store"
                  width={160}
                  height={48}
                />
              </Link>
              <Link
                href="#"
                className="hover:-translate-y-1 transition-transform duration-300"
              >
                <Image
                  src={`${getImagePrefix()}images/hero/applestore.png`}
                  alt="App Store"
                  width={160}
                  height={48}
                />
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ x: 50, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ duration: 0.8 }}
            className="col-span-7 lg:block hidden"
          >
            <div className="ml-20 relative">
              <div className="absolute inset-0 bg-primary/20 blur-[120px] rounded-full" />
              <Image
                src={`${getImagePrefix()}images/hero/banner-image.png`}
                alt="Banner"
                width={1000}
                height={1000}
                className="drop-shadow-[0_35px_35px_rgba(0,0,0,0.3)] relative z-10"
                priority
              />
            </div>
          </motion.div>
        </div>

        <div className="mt-20 relative z-20">
          <CardSlider />
        </div>
      </div>
    </section>
  );
};

export default Hero;
