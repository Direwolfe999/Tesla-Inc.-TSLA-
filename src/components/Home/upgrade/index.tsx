import { upgradeData } from "@/app/api/data";
import Image from "next/image";
import { Icon } from "@iconify/react";
import { getImagePrefix } from "@/utils/utils";

const Upgrade = () => {
  return (
    <section
      id="upgrade"
      className="md:py-40 py-20 bg-white dark:bg-darkmode transition-colors duration-300"
    >
      <div className="container mx-auto lg:max-w-screen-xl px-4">
        <div className="grid lg:grid-cols-2 sm:gap-0 gap-10 items-center">
          {/* Text Content */}
          <div>
            <p className="text-primary sm:text-28 text-18 mb-3">Upgrade</p>

            <h2 className="text-black dark:text-white sm:text-40 text-30 font-medium mb-5">
              Elevate your portfolio instantly.
            </h2>

            <p className="text-gray-600 dark:text-gray-400 text-18 mb-7">
              Take your investing journey further — access premium analytics,
              alerts, and insights that put you ahead of the market.
            </p>

            <div className="grid sm:grid-cols-2 lg:w-[70%] text-nowrap sm:gap-10 gap-5">
              {upgradeData.map((item, index) => (
                <div key={index} className="flex gap-5 items-start">
                  <Icon
                    icon="la:check-circle-solid"
                    width="24"
                    height="24"
                    className="text-gray-700 dark:text-white hover:text-primary transition-colors"
                  />
                  <h4 className="text-18 text-gray-700 dark:text-gray-400">
                    {item.title}
                  </h4>
                </div>
              ))}
            </div>
          </div>

          {/* Image */}
          <div className="flex justify-center lg:justify-end">
            <Image
              src={`${getImagePrefix()}images/upgrade/img-upgrade.png`}
              alt="Upgrade preview"
              width={625}
              height={580}
              className="-mr-5"
              priority
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default Upgrade;
