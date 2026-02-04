"use client";

import { perksData } from "@/app/api/data";
import { getImagePrefix } from "@/utils/utils";
import Image from "next/image";
import { motion } from "framer-motion";

const Perks = () => {
  // Shared premium styles for icon containers
  const iconBoxStyle = `
    group-hover:scale-110 transition-all duration-300 
    bg-gray-100 dark:bg-light_grey/30 backdrop-blur-sm 
    rounded-full flex items-center justify-center shrink-0
  `;

  const iconImageStyle = `
    filter invert dark:invert-0 transition-all duration-300
  `;

  return (
    <section className="pb-28 pt-12 relative bg-white dark:bg-darkmode transition-colors duration-300 overflow-hidden">
      <div className="container mx-auto lg:max-w-screen-xl px-4 relative z-10">
        <div className="text-center">
          {/* Section Header */}
          <motion.div
            whileInView={{ y: 0, opacity: 1 }}
            initial={{ y: 20, opacity: 0 }}
            viewport={{ once: true }}
          >
            <p className="text-gray-600 dark:text-gray-400 sm:text-28 text-18 mb-4 pb-6 relative inline-block after:content-[''] after:w-12 after:h-1 after:bg-primary after:absolute after:bottom-0 after:left-1/2 after:-translate-x-1/2 after:rounded-full">
              Invest today,{" "}
              <span className="text-primary font-bold">lead tomorrow</span>
            </p>
            <h2 className="text-black dark:text-white sm:text-40 text-30 font-bold mt-4">
              Let your money grow{" "}
              <span className="text-primary">effortlessly</span>!
            </h2>
          </motion.div>

          {/* Perks Grid Container */}
          <div
            className="mt-16 border border-gray-200 dark:border-white/10 grid lg:grid-cols-3 sm:grid-cols-2 py-16 gap-12 px-6 md:px-20 rounded-[2.5rem] 
            /* Light Mode: Steel Grey | Dark Mode: Deep Glass */
            bg-gradient-to-br from-gray-50 to-gray-100 dark:from-dark_grey/40 dark:to-darkmode/60
            backdrop-blur-md shadow-xl sm:bg-perk bg-no-repeat bg-bottom"
          >
            {perksData.map((item, index) => (
              <motion.div
                key={index}
                whileInView={{ opacity: 1, scale: 1 }}
                initial={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
                className="text-center flex items-center justify-end flex-col group cursor-default"
              >
                {/* Premium Icon Container */}
                <div className={`w-20 h-20 mb-6 ${iconBoxStyle}`}>
                  <Image
                    src={`${getImagePrefix()}${item.icon}`}
                    alt={item.title}
                    width={44}
                    height={44}
                    className={iconImageStyle}
                  />
                </div>

                <h4
                  className={`text-black dark:text-white text-28 font-bold mb-4 transition-colors group-hover:text-primary ${item.space}`}
                >
                  {item.title}
                </h4>

                <div
                  className="text-gray-600 dark:text-gray-400 text-16 leading-relaxed"
                  dangerouslySetInnerHTML={{ __html: item.text }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Background Decorative Glow (Tesla Gradient) */}
      <div className="bg-gradient-to-br from-primary/40 to-success/20 sm:w-[40rem] w-80 sm:h-[40rem] h-80 rounded-full blur-[120px] z-0 absolute -bottom-40 -left-40 opacity-40 pointer-events-none"></div>
    </section>
  );
};

export default Perks;
