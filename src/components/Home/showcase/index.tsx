"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { getImagePrefix } from "@/utils/utils";

const TeslaShowcase = () => {
    const cars = [
        {
            name: "Model S Plaid",
            tagline: "The Benchmark",
            specs: ["1.99s 0-60", "200mph", "1,020hp"],
            img: "images/ecosystem/img11.jpg", // Ensure these paths match your public folder
        },
        {
            name: "CyberTruck",
            tagline: "Cyberbeast Elite",
            specs: ["2.6s 0-60", "130mph", "845hp"],
            img: "images/ecosystem/img10.jpeg",
        },
    ];

    return (
        <section className="relative min-h-screen w-full overflow-hidden bg-black flex items-center justify-center py-24">
            {/* 1. CINEMATIC VIDEO BACKGROUND */}
            <div className="absolute inset-0 z-0">
                <video
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover opacity-50"
                >
                    <source src="/images/ecosystem/vid1.webm" type="video/webm" />
                </video>
                <div className="absolute inset-0 bg-gradient-to-b from-black via-transparent to-black" />
            </div>

            <div className="container mx-auto lg:max-w-screen-xl px-4 relative z-10">
                {/* HEADER */}
                <div className="text-center mb-16">
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        className="text-primary font-black uppercase tracking-[0.4em] text-xs mb-4"
                    >
                        The Trader&apos;s Fleet
                    </motion.p>
                    <h2 className="text-white text-5xl md:text-7xl font-black tracking-tighter uppercase leading-none">
                        Claim Your <span className="text-primary italic">Position</span>
                    </h2>
                </div>

                {/* 2. THE TWO CAR CARDS */}
                <div className="grid md:grid-cols-2 gap-10 mb-16">
                    {cars.map((car, index) => (
                        <motion.div
                            key={index}
                            initial={{ opacity: 0, x: index === 0 ? -50 : 50 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            whileHover={{ y: -10 }}
                            className="group relative p-8 bg-white/5 backdrop-blur-xl border border-white/10 rounded-[3rem] overflow-hidden transition-all duration-500"
                        >
                            <div className="relative h-48 w-full mb-8">
                                <Image
                                    src={`${getImagePrefix()}${car.img}`}
                                    alt={car.name}
                                    fill
                                    className="object-contain group-hover:scale-110 transition-transform duration-700"
                                />
                            </div>
                            <div className="space-y-4">
                                <h4 className="text-white font-black text-3xl tracking-tighter">
                                    {car.name}
                                </h4>
                                <div className="flex flex-wrap gap-3">
                                    {car.specs.map((spec, i) => (
                                        <span
                                            key={i}
                                            className="px-4 py-1.5 bg-white/10 rounded-full text-[10px] font-bold text-gray-300 uppercase tracking-widest"
                                        >
                                            {spec}
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {/* 3. THE PREMIUM CTA BUTTON */}
                <div className="text-center">
                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="group relative px-16 py-6 bg-white rounded-full overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.2)]"
                    >
                        <div className="absolute inset-0 w-0 bg-primary transition-all duration-500 ease-out group-hover:w-full" />
                        <span className="relative z-10 text-black font-black uppercase tracking-[0.2em] text-sm group-hover:text-white transition-colors duration-300">
                            Explore the Fleet
                        </span>
                    </motion.button>
                </div>
            </div>
        </section>
    );
};

export default TeslaShowcase;
