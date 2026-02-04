"use client";

import Image from "next/image";
import { portfolioData } from "@/app/api/data";
import { motion } from "framer-motion";
import { getImagePrefix } from "@/utils/utils";

const Portfolio = () => {
  const iconBoxStyle = `
    group-hover:scale-110 transition-all duration-300 
    bg-gray-100 dark:bg-light_grey/30 backdrop-blur-sm 
    rounded-full flex items-center justify-center shrink-0
  `;

  return (
    <section
      id="portfolio"
      className="md:py-32 py-16 bg-white dark:bg-darkmode transition-colors duration-300 overflow-hidden relative"
    >
      <div className="container mx-auto lg:max-w-screen-xl px-4 sm:px-6 relative z-10">
        <div className="grid lg:grid-cols-2 items-center gap-12 lg:gap-24">
          {/* LEFT SIDE: THE PREMIUM SHOWCASE */}
          <motion.div
            whileInView={{ x: 0, opacity: 1, rotateY: 0 }}
            initial={{ x: -100, opacity: 0, rotateY: -20 }}
            viewport={{ once: true }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="lg:-ml-20 flex justify-center relative group perspective-1000"
          >
            {/* 1. Animated Radial Glow (The "Aura") */}
            <div className="absolute inset-0 bg-primary/25 blur-[120px] rounded-full group-hover:bg-primary/40 group-hover:scale-110 transition-all duration-1000 ease-in-out" />

            {/* 2. The Glass Bezel Container */}
            <div className="relative z-10 p-1.5 md:p-3 bg-gradient-to-br from-white/40 to-white/5 dark:from-white/20 dark:to-transparent backdrop-blur-2xl rounded-[3rem] border border-white/40 dark:border-white/10 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.3)] group-hover:shadow-primary/20 transition-all duration-700 overflow-hidden">
              {/* Internal Video Frame */}
              <div className="relative overflow-hidden rounded-[2.5rem] bg-black">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-auto scale-105 group-hover:scale-100 transition-transform duration-1000 ease-in-out"
                >
                  <source src="/images/videos/vid3.mp4" type="video/mp4" />
                </video>

                {/* 3. The "Light Sweep" Effect - makes it look like real glass */}
                <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
              </div>
            </div>

            {/* 4. Floating Decorative Element (Premium Detail) */}
            <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-primary/10 blur-3xl rounded-full" />
          </motion.div>

          {/* RIGHT SIDE: CONTENT */}
          <motion.div
            whileInView={{ x: 0, opacity: 1 }}
            initial={{ x: 100, opacity: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            <p className="sm:text-28 text-18 text-gray-800 dark:text-gray-200 font-medium mb-4 flex items-center gap-3">
              <span className="w-8 h-[2px] bg-primary rounded-full"></span>
              Cryptocurrency{" "}
              <span className="text-primary font-bold">Portfolio</span>
            </p>

            <h2 className="text-black dark:text-white sm:text-48 text-34 mb-6 font-black leading-[1.1] tracking-tight">
              Create your crypto portfolio <br />
              today with <span className="text-primary">Tesla, Inc</span>
            </h2>

            <p className="text-gray-600 dark:text-gray-400 text-18 mb-10 leading-relaxed max-w-md">
              Tesla, Inc is a Coinbase Stock trading platform with a variety of
              features that make it the best place to start trading.
            </p>

            {/* Premium Feature List */}
            <div className="space-y-4">
              {portfolioData.map((item, index) => (
                <motion.div
                  key={index}
                  whileHover={{ x: 10 }}
                  className="group flex items-center gap-6 p-4 rounded-3xl transition-all hover:bg-gray-50 dark:hover:bg-white/5 border border-transparent hover:border-gray-100 dark:hover:border-white/10 cursor-pointer"
                >
                  <div
                    className={`w-14 h-14 ${iconBoxStyle} shadow-sm group-hover:shadow-primary/20`}
                  >
                    <Image
                      src={`${getImagePrefix()}${item.image}`}
                      alt={item.title}
                      width={28}
                      height={28}
                      className="filter invert dark:invert-0 brightness-0 dark:brightness-100"
                    />
                  </div>
                  <h4 className="text-gray-900 dark:text-white text-22 font-bold group-hover:text-primary transition-colors">
                    {item.title}
                  </h4>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Portfolio;
