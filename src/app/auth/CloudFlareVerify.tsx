"use client";

import { useState, useEffect } from "react";
import { Turnstile } from "@marsidev/react-turnstile";

interface Props {
    onVerify: (token: string) => void;
    onCancel: () => void;
}

const CloudflareVerify = ({ onVerify, onCancel }: Props) => {
    const [mounted, setMounted] = useState(false);

    // High-frequency mount check to ensure Turnstile initializes correctly
    useEffect(() => {
        setMounted(true);
    }, []);

    if (!mounted) return null;

    return (
        <div className="flex flex-col items-center justify-center space-y-8 py-12 animate-in fade-in zoom-in-95 duration-500">
            {/* HEADER SECTION */}
            <div className="text-center space-y-3">
                <div className="flex justify-center mb-6">
                    <div className="relative">
                        <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse" />
                        <div className="relative p-5 rounded-full bg-[#0D0D0D] border border-primary/30 shadow-[0_0_20px_rgba(20,184,166,0.2)]">
                            <svg
                                className="w-8 h-8 text-primary"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="1.5"
                                    d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                                />
                            </svg>
                        </div>
                    </div>
                </div>

                <h2 className="text-3xl font-black italic tracking-tighter text-white uppercase">
                    Neural <span className="text-primary">Handshake</span>
                </h2>
                <div className="flex items-center justify-center gap-2">
                    <span className="w-1 h-1 bg-primary rounded-full animate-ping" />
                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.4em]">
                        Identity Verification Required
                    </p>
                </div>
            </div>

            {/* WIDGET CONTAINER */}
            <div className="relative group p-[1px] rounded-[2rem] overflow-hidden">
                {/* Animated Border Gradient */}
                <div className="absolute inset-0 bg-gradient-to-r from-primary/50 via-blue-500/50 to-primary/50 animate-gradient-x" />

                <div className="relative bg-[#050505] p-6 rounded-[2rem] border border-white/5 shadow-2xl transition-all duration-500 group-hover:shadow-primary/10">
                    <Turnstile
                        siteKey={process.env.NEXT_PUBLIC_CLOUDFLARE_SITE_KEY!}
                        onSuccess={(token) => onVerify(token)}
                        options={{
                            theme: "dark",
                            size: "normal",
                            appearance: "always"
                        }}
                    />
                </div>
            </div>

            {/* ABORT ACTION */}
            <button
                onClick={onCancel}
                className="group flex items-center gap-3 text-[10px] font-black text-slate-600 hover:text-primary transition-all duration-300 tracking-[0.5em] uppercase"
            >
                <span className="opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                    ←
                </span>
                Abort Protocol
            </button>

            {/* SYSTEM FOOTER */}
            <div className="pt-4 border-t border-white/5 w-full max-w-[200px] text-center">
                <p className="text-[8px] font-mono text-slate-700 uppercase tracking-widest">
                    Secure Link: V4.2-Final
                </p>
            </div>
        </div>
    );
};

export default CloudflareVerify;