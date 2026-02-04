"use client";

import Image from "next/image";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import { getImagePrefix } from "@/utils/utils";

const Apex: React.FC = () => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  // Responsive animations: Slide only on desktop to prevent mobile layout shifts
  const leftAnimation = {
    initial: {
      x: typeof window !== "undefined" && window.innerWidth > 1024 ? -50 : 0,
      opacity: 0,
      y: 20,
    },
    animate: inView ? { x: 0, opacity: 1, y: 0 } : {},
    transition: { duration: 0.8, ease: "easeOut" },
  };

  const rightAnimation = {
    initial: {
      x: typeof window !== "undefined" && window.innerWidth > 1024 ? 50 : 0,
      opacity: 0,
      y: 20,
    },
    animate: inView ? { x: 0, opacity: 1, y: 0 } : {},
    transition: { duration: 0.8, ease: "easeOut", delay: 0.2 },
  };

  const services = [
    { icon: "images/icons/icon-consulting.svg", text: "Top-tier, premium" },
    { icon: "images/icons/icon-Services.svg", text: "Conveys Exclusivity" },
    { icon: "images/icons/icon-blockchain.svg", text: "Professional growth" },
    { icon: "images/icons/icon-Services.svg", text: "Reliable, safe" },
  ];

  return (
    <section
      id="work"
      className="md:py-32 py-20 bg-white dark:bg-darkmode transition-colors duration-300 overflow-hidden relative"
    >
      <div className="container mx-auto lg:max-w-screen-xl px-4 relative z-10">
        {/* Changed grid behavior for mobile-first stacking */}
        <div
          ref={ref}
          className="flex flex-col-reverse lg:grid lg:grid-cols-12 items-center gap-12 lg:gap-16"
        >
          {/* CONTENT: Stacks on bottom for mobile, Left side for Desktop */}
          <motion.div
            initial={leftAnimation.initial}
            animate={leftAnimation.animate}
            transition={leftAnimation.transition}
            className="lg:col-span-7 w-full"
          >
            <div className="text-center lg:text-left">
              <p className="sm:text-28 text-18 text-black dark:text-white font-bold mb-2">
                Work with{" "}
                <span className="text-primary uppercase tracking-wider">
                  Us
                </span>
              </p>

              <h2 className="sm:text-54 text-32 text-black dark:text-white font-black leading-[1.1] tracking-tighter mt-2">
                Get <span className="text-primary">30% Discount</span>{" "}
                <br className="hidden sm:block" /> on every transaction.
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 gap-6 mt-12">
              {services.map((service, index) => (
                <div
                  key={index}
                  className="flex items-center gap-5 group p-4 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-all"
                >
                  <div className="w-14 h-14 flex-shrink-0 flex items-center justify-center bg-gray-100 dark:bg-white/5 rounded-xl transition-all duration-500 group-hover:bg-primary">
                    <Image
                      src={`${getImagePrefix()}${service.icon}`}
                      alt={service.text}
                      width={28}
                      height={28}
                      className="filter invert dark:invert-0 group-hover:invert-0 group-hover:brightness-200"
                    />
                  </div>
                  <p className="text-lg md:text-xl text-gray-700 dark:text-gray-300 font-bold">
                    {service.text}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>

          {/* VIDEO: Stacks on top for mobile, Right side for Desktop */}
          <motion.div
            initial={rightAnimation.initial}
            animate={rightAnimation.animate}
            transition={rightAnimation.transition}
            className="lg:col-span-5 w-full"
          >
            <div className="relative group max-w-[500px] mx-auto lg:max-w-none">
              {/* Responsive Glow */}
              <div className="absolute inset-0 bg-primary/20 blur-[80px] rounded-full opacity-40 group-hover:opacity-70 transition-opacity" />

              {/* Adaptive aspect ratio: Video-style on mobile, Portrait-style on Desktop */}
              <div className="relative z-10 aspect-video lg:aspect-[4/5] w-full rounded-[2.5rem] lg:rounded-[3.5rem] overflow-hidden border border-gray-200 dark:border-white/10 shadow-2xl">
                <video
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="absolute inset-0 w-full h-full object-cover"
                >
                  <source src="/images/videos/vid4.mp4" type="video/mp4" />
                </video>

                <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-70" />

                {/* Scaled-down badge for mobile readability */}
                <div className="absolute bottom-4 left-4 right-4 lg:bottom-8 lg:left-8 lg:right-8 p-4 lg:p-6 backdrop-blur-xl bg-white/10 border border-white/20 rounded-2xl lg:rounded-3xl">
                  <h4 className="text-white font-black text-sm lg:text-xl mb-1 italic">
                    EXCLUSIVE ACCESS
                  </h4>
                  <p className="text-white/70 text-[10px] lg:text-sm font-medium">
                    Unlock premium tier benefits on your first trade.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default Apex;
