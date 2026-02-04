"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { getImagePrefix } from "@/utils/utils";

const Ecosystem = () => {
    const products = [
        {
            name: "SpaceX",
            desc: "Interplanetary Exploration",
            img: "images/ecosystem/img5.jpg",
            size: "large",
        },
        {
            name: "Tesla",
            desc: "Sustainable Energy",
            img: "images/ecosystem/img6.png",
            size: "small",
        },
        {
            name: "SolarCity",
            desc: "Infinite Power",
            img: "images/ecosystem/img4.jpg",
            size: "small",
        },
        {
            name: "Neuralink",
            desc: "Brain-Machine Interface",
            img: "images/ecosystem/img9.webp",
            size: "small",
        },
        {
            name: "OpenAI",
            desc: "Intelligence Evolved",
            img: "images/ecosystem/img3.webp",
            size: "small",
        },
        {
            name: "Hyperloop",
            desc: "Vacuum Transport",
            img: "images/ecosystem/img1.jpg",
            size: "large",
        },
        {
            name: "The Boring Co",
            desc: "Urban Tunneling",
            img: "images/ecosystem/img7.png",
            size: "small",
        },
        {
            name: "Starlink",
            desc: "Global Connectivity",
            img: "images/ecosystem/img8.jpeg",
            size: "small",
        },
    ];

    return (
        <section className="py-24 bg-white dark:bg-darkmode transition-colors duration-300 relative overflow-hidden">
            {/* Background Decorative Flare */}
            <div className="absolute top-1/4 -left-20 w-96 h-96 bg-primary/10 blur-[150px] -z-0" />

            <div className="container mx-auto lg:max-w-screen-xl px-4 relative z-10">
                {/* Header Section */}
                <div className="text-center mb-20">
                    <motion.p
                        initial={{ opacity: 0, y: 10 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-primary font-black uppercase tracking-[0.5em] text-[10px] mb-4"
                    >
                        In Corporation With
                    </motion.p>
                    <motion.h2
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="text-black dark:text-white text-4xl md:text-6xl font-black tracking-tighter"
                    >
                        The <span className="text-primary italic">Tesla</span> Ecosystem
                    </motion.h2>
                </div>

                <div className="grid lg:grid-cols-12 gap-12 lg:gap-16 items-start">
                    {/* LEFT: THE BENTO GRID (8 Items) */}
                    <div className="lg:col-span-8 grid grid-cols-2 md:grid-cols-3 gap-6 md:gap-8 lg:gap-10">
                        {products.map((item, index) => (
                            <motion.div
                                key={index}
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                whileHover={{ scale: 1.02, y: -5 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.05, duration: 0.5 }}
                                className={`flex flex-col p-8 md:p-10 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-[3rem] group transition-all duration-500 shadow-sm hover:shadow-2xl hover:border-primary/30 
                                ${item.size === "large" ? "md:col-span-2" : "col-span-1"}`}
                            >
                                {/* Adjusted Image Container: Fixed Height & Proper Padding */}
                                <div className="relative w-full h-32 md:h-40 mb-8 overflow-hidden rounded-2xl">
                                    <Image
                                        src={`${getImagePrefix()}${item.img}`}
                                        alt={item.name}
                                        fill
                                        sizes="(max-width: 768px) 50vw, 33vw"
                                        className="object-contain p-2 filter grayscale group-hover:grayscale-0 group-hover:scale-110 transition-all duration-700"
                                    />
                                </div>

                                {/* Text section with tightened spacing */}
                                <div className="mt-auto space-y-1 text-center md:text-left">
                                    <h4 className="text-black dark:text-white font-black text-xl tracking-tight leading-none">
                                        {item.name}
                                    </h4>
                                    <p className="text-gray-400 dark:text-gray-500 text-[9px] font-bold uppercase tracking-[0.2em]">
                                        {item.desc}
                                    </p>
                                </div>
                            </motion.div>
                        ))}
                    </div>

                    {/* RIGHT: THE STICKY SHOWCASE VIDEO */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        className="lg:col-span-4 lg:sticky lg:top-32"
                    >
                        <div className="relative group">
                            <div className="absolute inset-0 bg-primary/20 blur-[100px] rounded-full group-hover:bg-primary/40 transition-all duration-1000" />

                            <div className="relative z-10 border border-white/30 dark:border-white/10 rounded-[3rem] overflow-hidden shadow-2xl bg-black aspect-[9/16]">
                                <video
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className="w-full h-full object-cover opacity-70 group-hover:opacity-100 transition-opacity duration-700"
                                >
                                    <source src="/images/ecosystem/vid2.webm" type="video/webm" />
                                </video>

                                <div className="absolute bottom-6 left-6 right-6 p-6 backdrop-blur-xl bg-white/5 border border-white/10 rounded-[2rem]">
                                    <p className="text-white font-black text-xl italic mb-1 tracking-tighter">
                                        GLOBAL IMPACT
                                    </p>
                                    <p className="text-white/50 text-[10px] leading-relaxed font-bold uppercase tracking-widest">
                                        Transitioning the world to sustainable energy.
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

export default Ecosystem;
