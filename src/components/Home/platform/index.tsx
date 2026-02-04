"use client";

import Image from "next/image";
import { portfolioData } from "@/app/api/data";
import { motion } from "framer-motion";
import { getImagePrefix } from "@/utils/utils";

const Platform = () => {
  // Premium shared styles for icon containers
  const iconBoxStyle = `
    group-hover:scale-110 transition-all duration-300 
    bg-gray-100 dark:bg-light_grey/30 backdrop-blur-sm 
    rounded-full flex items-center justify-center shrink-0
  `;

  return (
    <section
      id="platform"
      className="md:py-32 py-16 bg-white dark:bg-darkmode transition-colors duration-300 relative z-[10]"
    >
      <div className="container mx-auto lg:max-w-screen-xl px-4 sm:px-6">
        <div className="text-center mb-20">
          <motion.div
            whileInView={{ y: 0, opacity: 1 }}
            initial={{ y: 20, opacity: 0 }}
            viewport={{ once: true }}
          >
            <p className="sm:text-28 text-18 text-gray-800 dark:text-gray-200 font-medium mb-4">
              Advanced <span className="text-primary">Platform</span>
            </p>
            <h2 className="text-black dark:text-white sm:text-40 text-30 font-bold leading-tight lg:w-2/3 mx-auto">
              A Trading Experience Built for{" "}
              <span className="text-primary">Precision</span> and Speed.
            </h2>
          </motion.div>
        </div>

        <div className="grid lg:grid-cols-3 md:grid-cols-2 gap-8">
          {portfolioData.map((item, index) => (
            <motion.div
              key={index}
              whileInView={{ y: 0, opacity: 1 }}
              initial={{ y: 30, opacity: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1 }}
              className="group p-8 rounded-[2rem] bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 hover:border-primary/50 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/10"
            >
              <div className={`w-20 h-20 mb-8 ${iconBoxStyle}`}>
                <Image
                  src={`${getImagePrefix()}${item.image}`}
                  alt={item.title}
                  width={40}
                  height={40}
                  className="filter invert dark:invert-0 transition-all"
                />
              </div>

              <h4 className="text-gray-900 dark:text-white text-24 font-bold mb-4 transition-colors group-hover:text-primary">
                {item.title}
              </h4>

              <p className="text-gray-600 dark:text-gray-400 text-16 leading-relaxed">
                Experience institutional-grade tools designed for the modern
                investor. Reliability meets innovation.
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Platform;
