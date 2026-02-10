"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";

interface Props {
    logs: string[];
}

const NeuralTerminal = ({ logs = [] }: Props) => {
    const logEndRef = useRef<HTMLDivElement>(null);
    const [systemNoise, setSystemNoise] = useState("0x0000");

    useEffect(() => {
        logEndRef.current?.scrollIntoView({ behavior: "smooth" });
        const interval = setInterval(() => {
            setSystemNoise(Math.random().toString(16).slice(2, 6).toUpperCase());
        }, 1000);
        return () => clearInterval(interval);
    }, [logs]);

    return (
        <div className="w-full flex flex-col items-center justify-center py-10 space-y-10 relative overflow-hidden">

            {/* BACKGROUND AMBIENCE - AMBIENT DATA PARTICLES */}
            <div className="absolute inset-0 pointer-events-none opacity-20">
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        initial={{ y: -20, opacity: 0 }}
                        animate={{ y: 600, opacity: [0, 1, 0] }}
                        transition={{ duration: Math.random() * 5 + 3, repeat: Infinity, delay: i * 0.5 }}
                        className="absolute text-[8px] font-mono text-primary whitespace-nowrap"
                        style={{ left: `${i * 7}%` }}
                    >
                        {Math.random().toString(2).slice(2, 10)}
                    </motion.div>
                ))}
            </div>

            {/* CENTRAL CORE VISUAL */}
            <div className="relative w-56 h-56 flex items-center justify-center">
                {/* Triple Orbitals */}
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 15, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-0 border-[1px] border-dashed border-primary/10 rounded-full"
                />
                <motion.div
                    animate={{ rotate: -360 }}
                    transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                    className="absolute inset-4 border-[1px] border-dotted border-primary/20 rounded-full"
                />

                {/* Glow Core */}
                <motion.div
                    animate={{ scale: [1, 1.15, 1], opacity: [0.1, 0.25, 0.1] }}
                    transition={{ duration: 3, repeat: Infinity }}
                    className="absolute w-44 h-44 bg-primary/20 rounded-full blur-[80px]"
                />

                {/* Laser Scanner Line (Horizontal) */}
                <motion.div
                    animate={{ top: ["15%", "85%", "15%"] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute left-6 right-6 h-[1px] bg-primary shadow-[0_0_20px_#14b8a6] z-30 opacity-60"
                />

                {/* The Chip - Glassmorphism style */}
                <div className="relative z-20 p-8 rounded-[2.5rem] bg-black/80 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_rgba(20,184,166,0.15)] overflow-hidden group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent opacity-50" />
                    <Icon icon="solar:chip-bold-duotone" className="text-7xl text-primary relative z-10" />
                </div>

                {/* Reactive Waveform Underneath */}
                <div className="absolute -bottom-4 flex gap-1 h-4 items-center">
                    {[...Array(12)].map((_, i) => (
                        <motion.div
                            key={i}
                            animate={{ height: [2, Math.random() * 16 + 4, 2] }}
                            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.05 }}
                            className="w-[2px] bg-primary/40 rounded-full"
                        />
                    ))}
                </div>
            </div>

            <div className="text-center space-y-3 relative z-10">
                <h3 className="text-4xl font-black italic uppercase tracking-tighter text-white">
                    Neural <span className="text-primary animate-pulse">Mapping</span>
                </h3>
                <div className="flex items-center justify-center gap-3">
                    <span className="w-8 h-[1px] bg-white/10" />
                    <p className="text-[10px] font-black text-slate-500 tracking-[0.5em] uppercase">
                        System Entropy: {systemNoise}
                    </p>
                    <span className="w-8 h-[1px] bg-white/10" />
                </div>
            </div>

            {/* THE PREMIUM TERMINAL */}
            <div className="w-full max-w-xl relative group px-4">
                {/* Liquid Border Animation */}
                <div className="absolute -inset-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent rounded-2xl opacity-50 group-hover:opacity-100 transition duration-1000 animate-pulse" />

                <div className="relative bg-[#050505]/90 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                    {/* Enhanced CRT Scanline Overlay */}
                    <div className="absolute inset-0 pointer-events-none z-40 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.15)_50%),linear-gradient(90deg,rgba(255,0,0,0.04),rgba(0,255,0,0.01),rgba(0,0,255,0.04))] bg-[length:100%_4px,4px_100%] opacity-40" />

                    {/* Header Bar */}
                    <div className="flex items-center justify-between px-5 py-4 border-b border-white/5 bg-white/[0.02]">
                        <div className="flex gap-2.5">
                            <div className="w-2 h-2 rounded-full bg-[#FF5F56] shadow-[0_0_8px_#FF5F56]/40" />
                            <div className="w-2 h-2 rounded-full bg-[#FFBD2E] shadow-[0_0_8px_#FFBD2E]/40" />
                            <div className="w-2 h-2 rounded-full bg-[#27C93F] shadow-[0_0_8px_#27C93F]/40" />
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[9px] font-mono text-primary font-bold animate-pulse uppercase tracking-widest">Live Uplink</span>
                            <span className="text-[9px] font-mono text-slate-500 uppercase">v4.0.8-tesla</span>
                        </div>
                    </div>

                    {/* Log Window */}
                    <div className="h-56 overflow-y-auto p-6 font-mono text-[11px] space-y-2 scrollbar-hide">
                        <AnimatePresence mode="popLayout">
                            {logs && logs.map((log, idx) => (
                                <motion.p
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    className={`${log?.toString().includes("SUCCESS") || log?.toString().includes("COMPLETE") || log?.toString().includes("ENCLAVE")
                                            ? "text-primary font-bold drop-shadow-[0_0_5px_rgba(20,184,166,0.5)]"
                                            : "text-slate-400"
                                        } leading-relaxed flex gap-3`}
                                >
                                    <span className="text-white/20 select-none">
                                        {String(idx + 1).padStart(3, '0')}
                                    </span>
                                    <span className="flex-1 whitespace-pre-wrap break-all">
                                        {log}
                                    </span>
                                </motion.p>
                            ))}
                        </AnimatePresence>
                        <div ref={logEndRef} />

                        <motion.span
                            animate={{ opacity: [1, 0] }}
                            transition={{ repeat: Infinity, duration: 0.8 }}
                            className="inline-block w-2 h-4 bg-primary/80 ml-10 shadow-[0_0_10px_#14b8a6]"
                        />
                    </div>
                </div>
            </div>

            {/* FOOTER STATS */}
            <div className="w-full max-w-[400px] flex flex-col items-center gap-4">
                <div className="w-full flex justify-between text-[8px] font-mono text-slate-600 uppercase tracking-widest">
                    <span>Buffer: 1024KB</span>
                    <span>Security: AES-256</span>
                    <span>Latency: 12ms</span>
                </div>
                <div className="w-full h-[2px] bg-white/5 rounded-full overflow-hidden">
                    <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "100%" }}
                        transition={{ duration: 5, ease: "linear" }}
                        className="h-full bg-gradient-to-r from-primary/20 via-primary to-primary/20 shadow-[0_0_15px_#14b8a6]"
                    />
                </div>
            </div>
        </div>
    );
};

export default NeuralTerminal;