"use client";

import Image from "next/image";
import { timelineData } from "@/app/api/data";
import { motion } from "framer-motion";
import { getImagePrefix } from "@/utils/utils";

const TimeLine = () => {
  // Premium shared styles for icon containers
  const iconBoxStyle = `
    group-hover:scale-110 transition-all duration-300 
    bg-gray-100 dark:bg-light_grey/30 backdrop-blur-sm 
    rounded-full flex items-center justify-center shrink-0
  `;

  const iconImageStyle = `
    filter invert dark:invert-0 transition-all duration-300
  `;

  return (
    <section
      id="development"
      className="md:pt-40 pt-16 bg-white dark:bg-darkmode transition-colors duration-300 overflow-hidden"
    >
      <div className="container mx-auto lg:max-w-screen-xl px-4 md:px-8">
        <div className="text-center">
          {/* Heading */}
          <motion.div
            whileInView={{ y: 0, opacity: 1 }}
            initial={{ y: -50, opacity: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <p className="text-gray-800 dark:text-gray-200 sm:text-28 text-18 font-medium mb-4">
              Development <span className="text-primary">timeline</span>
            </p>

            <h2 className="text-black dark:text-white sm:text-40 text-30 font-bold lg:w-[70%] mx-auto mb-20 leading-tight">
              Start investing now and watch your portfolio grow faster than ever
              before.
            </h2>
          </motion.div>

          {/* Timeline Graphic */}
          <motion.div
            whileInView={{ scale: 1, opacity: 1 }}
            initial={{ scale: 0.9, opacity: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
          >
            {/* Desktop View */}
            <div className="hidden md:block relative min-h-[700px]">
              <Image
                src={`${getImagePrefix()}images/timeline/img-timeline.png`}
                alt="Timeline Path"
                width={1000}
                height={800}
                className="mx-auto opacity-50 dark:opacity-20"
              />

              {/* Planning */}
              <div className="absolute lg:top-10 top-5 lg:left-0 left-5 w-80 flex items-center gap-6 group cursor-default text-right">
                <div className="flex flex-col items-end">
                  <h5 className="text-gray-900 dark:text-white text-24 font-bold mb-2">
                    Planning
                  </h5>
                  <p className="text-16 text-gray-600 dark:text-gray-400">
                    Join a community of forward-thinkers building wealth through
                    smart decisions.
                  </p>
                </div>
                <div className={`w-20 h-20 ${iconBoxStyle}`}>
                  <Image
                    src={`${getImagePrefix()}images/timeline/icon-planning.svg`}
                    alt="Planning"
                    width={40}
                    height={40}
                    className={iconImageStyle}
                  />
                </div>
              </div>

              {/* Refinement */}
              <div className="absolute lg:top-10 top-5 lg:right-0 right-5 w-80 flex items-center gap-6 group cursor-default text-left">
                <div className={`w-20 h-20 ${iconBoxStyle}`}>
                  <Image
                    src={`${getImagePrefix()}images/timeline/icon-refinement.svg`}
                    alt="Refinement"
                    width={40}
                    height={40}
                    className={iconImageStyle}
                  />
                </div>
                <div className="flex flex-col items-start">
                  <h5 className="text-gray-900 dark:text-white text-24 font-bold mb-2">
                    Refinement
                  </h5>
                  <p className="text-16 text-gray-600 dark:text-gray-400">
                    Make confident investment choices that align with your
                    long-term goals.
                  </p>
                </div>
              </div>

              {/* Prototype */}
              <div className="absolute lg:bottom-20 bottom-10 lg:left-0 left-5 w-80 flex items-center gap-6 group cursor-default text-right">
                <div className="flex flex-col items-end">
                  <h5 className="text-gray-900 dark:text-white text-24 font-bold mb-2">
                    Prototype
                  </h5>
                  <p className="text-16 text-gray-600 dark:text-gray-400">
                    Your next big opportunity is here — don’t let it pass you
                    by.
                  </p>
                </div>
                <div className={`w-20 h-20 ${iconBoxStyle}`}>
                  <Image
                    src={`${getImagePrefix()}images/timeline/icon-prototype.svg`}
                    alt="Prototype"
                    width={40}
                    height={40}
                    className={iconImageStyle}
                  />
                </div>
              </div>

              {/* Support */}
              <div className="absolute lg:bottom-20 bottom-10 lg:right-0 right-5 w-80 flex items-center gap-6 group cursor-default text-left">
                <div className={`w-20 h-20 ${iconBoxStyle}`}>
                  <Image
                    src={`${getImagePrefix()}images/timeline/icon-support.svg`}
                    alt="Support"
                    width={40}
                    height={40}
                    className={iconImageStyle}
                  />
                </div>
                <div className="flex flex-col items-start">
                  <h5 className="text-gray-900 dark:text-white text-24 font-bold mb-2">
                    Support
                  </h5>
                  <p className="text-16 text-gray-600 dark:text-gray-400">
                    Transform your financial goals into reality with built-in
                    guidance.
                  </p>
                </div>
              </div>
            </div>

            {/* Mobile View */}
            <div className="grid sm:grid-cols-2 gap-10 md:hidden pb-12">
              {timelineData.map((item, index) => (
                <div
                  key={index}
                  className="flex items-start gap-6 group text-left"
                >
                  <div className={`w-16 h-16 px-4 py-4 ${iconBoxStyle}`}>
                    <Image
                      src={`${getImagePrefix()}${item.icon}`}
                      alt={item.title}
                      width={32}
                      height={32}
                      className={iconImageStyle}
                    />
                  </div>
                  <div>
                    <h4 className="text-21 text-gray-900 dark:text-white font-bold mb-2">
                      {item.title}
                    </h4>
                    <p className="text-16 text-gray-600 dark:text-gray-400">
                      {item.text}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default TimeLine;
